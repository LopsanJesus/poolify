'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDict } from '@/lib/i18n/server'
import type { Clan, ClanSettings, FinalPredictionsCustomField } from '@/lib/types'
import { DEFAULT_CLAN_SETTINGS } from '@/lib/types'

export async function createClan(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const name = (formData.get('name') as string)?.trim()
  if (!name || name.length < 2) return { error: dict.create_clan.error_short }

  const { data: clanData, error } = await supabase
    .from('clans')
    .insert({ name, owner_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  const clan = clanData as Clan
  await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id })

  redirect(`/clan/${clan.id}`)
}

export async function joinClan(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const code = (formData.get('code') as string)?.trim().toUpperCase()

  const { data: clanData, error: clanError } = await supabase
    .from('clans')
    .select('id, name')
    .eq('invite_code', code)
    .single()

  if (clanError || !clanData) return { error: dict.join_clan.error_invalid }

  const clan = clanData as Pick<Clan, 'id' | 'name'>

  const { error: joinError } = await supabase
    .from('clan_members')
    .insert({ clan_id: clan.id, user_id: user.id })

  if (joinError) {
    if (joinError.code === '23505') return { error: dict.join_clan.error_duplicate }
    return { error: joinError.message }
  }

  redirect(`/clan/${clan.id}`)
}

export async function getUserClans(): Promise<Pick<Clan, 'id' | 'name' | 'invite_code' | 'owner_id'>[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('clan_members')
    .select('clan_id, clans(id, name, invite_code, owner_id)')
    .eq('user_id', user.id)

  type ClanRow = { id: string; name: string; invite_code: string; owner_id: string }
  return (data ?? [])
    .map((row) => row.clans as unknown as ClanRow | null)
    .filter((c): c is ClanRow => c !== null)
}

export async function getClanRanking(clanId: string, settings?: ClanSettings) {
  const supabase = await createClient()

  const [{ data: memberData }, { data: predData }, { data: clanRow }] = await Promise.all([
    supabase.from('clan_members').select('user_id, joined_at, profiles(username)').eq('clan_id', clanId),
    supabase.from('predictions').select('user_id, points').eq('clan_id', clanId),
    settings ? Promise.resolve({ data: null }) : supabase.from('clans').select('settings').eq('id', clanId).single(),
  ])

  const exactPts = settings?.points_exact ?? (clanRow?.settings as ClanSettings | null)?.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact

  type MemberRow = { user_id: string; joined_at: string | null; profiles: { username: string } | null }
  type PredRow   = { user_id: string; points: number | null }

  const members = (memberData ?? []) as unknown as MemberRow[]
  const preds   = (predData   ?? []) as unknown as PredRow[]

  const map = new Map<string, { username: string; total: number; exact: number; winner: number; joined_at: string | null }>()
  for (const m of members) {
    map.set(m.user_id, { username: m.profiles?.username ?? m.user_id, total: 0, exact: 0, winner: 0, joined_at: m.joined_at ?? null })
  }
  for (const row of preds) {
    const entry = map.get(row.user_id)
    if (!entry) continue
    const pts = row.points ?? 0
    entry.total += pts
    if (pts >= exactPts) entry.exact += 1
    else if (pts > 0) entry.winner += 1
  }

  return [...map.entries()]
    .map(([user_id, v]) => ({ user_id, ...v }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      if (b.exact !== a.exact) return b.exact - a.exact
      return (a.joined_at ?? '').localeCompare(b.joined_at ?? '')
    })
}

export async function getClanMembers(clanId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clan_members')
    .select('user_id, profiles(username)')
    .eq('clan_id', clanId)

  type Row = { user_id: string; profiles: { username: string } | null }
  const rows = (data ?? []) as unknown as Row[]
  return rows.map((r) => ({ user_id: r.user_id, username: r.profiles?.username ?? r.user_id }))
}

export async function getClanData(clanId: string): Promise<Pick<Clan, 'id' | 'name' | 'invite_code' | 'owner_id' | 'settings'> | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('clans')
    .select('id, name, invite_code, owner_id, settings')
    .eq('id', clanId)
    .single()

  return data as Pick<Clan, 'id' | 'name' | 'invite_code' | 'owner_id' | 'settings'> | null
}

export async function updateClanSettings(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const clanId = formData.get('clan_id') as string
  const pointsExact = parseInt(formData.get('points_exact') as string, 10)
  const pointsSign = parseInt(formData.get('points_sign') as string, 10)
  const pointsAdvance = parseInt(formData.get('points_advance') as string, 10)
  const canMembersInvite = formData.get('can_members_invite') === 'on'
  const liveResultsAllMembers = formData.get('live_results_all_members') === 'on'

  if (isNaN(pointsExact) || pointsExact < 0) return { error: dict.common.error }
  if (isNaN(pointsSign) || pointsSign < 0) return { error: dict.common.error }
  if (isNaN(pointsAdvance) || pointsAdvance < 0) return { error: dict.common.error }

  // Preserve existing final_predictions when saving scoring/access
  const { data: existing } = await supabase
    .from('clans')
    .select('settings')
    .eq('id', clanId)
    .single()
  const existingSettings = existing?.settings as ClanSettings | null

  const settings: ClanSettings = {
    points_exact: pointsExact,
    points_sign: pointsSign,
    points_advance: pointsAdvance,
    can_members_invite: canMembersInvite,
    live_results_all_members: liveResultsAllMembers,
    ...(existingSettings?.final_predictions ? { final_predictions: existingSettings.final_predictions } : {}),
  }

  const { error } = await supabase
    .from('clans')
    .update({ settings })
    .eq('id', clanId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/settings`)

  return { success: 'settings_saved' as const }
}

export async function updateFinalPredictionsConfig(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const clanId = formData.get('clan_id') as string
  const winnerPts    = parseInt(formData.get('final_winner_pts')     as string, 10)
  const runnerUpPts  = parseInt(formData.get('final_runner_up_pts')  as string, 10)
  const semi1Pts     = parseInt(formData.get('final_semi1_pts')      as string, 10)
  const semi2Pts     = parseInt(formData.get('final_semi2_pts')      as string, 10)
  const topScorerPts = parseInt(formData.get('final_top_scorer_pts') as string, 10)

  if (isNaN(winnerPts) || isNaN(runnerUpPts)) return { error: dict.common.error }

  const { data: existing } = await supabase
    .from('clans')
    .select('settings')
    .eq('id', clanId)
    .single()
  const existingSettings = existing?.settings as ClanSettings | null

  const settings: ClanSettings = {
    ...(existingSettings ?? { points_exact: 4, points_sign: 1, points_advance: 2, can_members_invite: true }),
    final_predictions: {
      winner_pts: winnerPts,
      runner_up_pts: runnerUpPts,
      semi1_pts: isNaN(semi1Pts) ? 5 : semi1Pts,
      semi2_pts: isNaN(semi2Pts) ? 5 : semi2Pts,
      top_scorer_pts: isNaN(topScorerPts) ? 5 : topScorerPts,
      custom_fields: existingSettings?.final_predictions?.custom_fields ?? [],
    },
  }

  const { error } = await supabase
    .from('clans')
    .update({ settings })
    .eq('id', clanId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/settings`)

  return { success: 'settings_saved' as const }
}

export async function refreshClanPage(clanId: string) {
  revalidatePath(`/clan/${clanId}`)
}

export async function removeClanMember(clanId: string, targetUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const clan = await getClanData(clanId)
  if (!clan || clan.owner_id !== user.id) return { error: dict.common.error }
  if (targetUserId === user.id) return { error: dict.clan_settings.member_remove_self }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clan_members')
    .delete()
    .eq('clan_id', clanId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}/settings`)
  return {}
}

export async function transferClanOwnership(clanId: string, newOwnerId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const clan = await getClanData(clanId)
  if (!clan || clan.owner_id !== user.id) return { error: dict.common.error }
  if (newOwnerId === user.id) return { error: dict.clan_settings.transfer_same_user }

  // Verify new owner is a member of the clan
  const { data: membership } = await supabase
    .from('clan_members')
    .select('user_id')
    .eq('clan_id', clanId)
    .eq('user_id', newOwnerId)
    .single()
  if (!membership) return { error: dict.clan_settings.transfer_not_member }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clans')
    .update({ owner_id: newOwnerId })
    .eq('id', clanId)

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}/settings`)
  revalidatePath(`/clan/${clanId}`)
  return {}
}

export async function joinClanByCode(code: string): Promise<{ error?: string; clanId?: string }> {
  const supabase = await createClient()
  const { dict } = await getDict()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.common.error }

  const { data: clanData, error: clanError } = await supabase
    .from('clans')
    .select('id, name')
    .eq('invite_code', code.toUpperCase())
    .single()

  if (clanError || !clanData) return { error: dict.invite.invalid_code }

  const { error: joinError } = await supabase
    .from('clan_members')
    .insert({ clan_id: clanData.id, user_id: user.id })

  if (joinError) {
    if (joinError.code === '23505') return { clanId: clanData.id }
    return { error: joinError.message }
  }

  revalidatePath(`/clan/${clanData.id}`)
  return { clanId: clanData.id }
}

export async function getTournamentDeadline(): Promise<Date | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('matches')
    .select('match_date')
    .order('match_date', { ascending: true })
    .limit(1)
    .single()

  if (!data) return null
  const d = new Date(data.match_date)
  d.setHours(d.getHours() - 2)
  return d
}

export type MatchRankingEntry = {
  user_id: string
  username: string
  prediction: { home_score: string; away_score: string; points: number } | null
  total: number
  joined_at: string | null
}

export async function getRankingUpToMatch(clanId: string, matchId: string): Promise<MatchRankingEntry[]> {
  const supabase = await createClient()

  const { data: matchData } = await supabase
    .from('matches')
    .select('match_date, status')
    .eq('id', matchId)
    .single()

  if (!matchData || (matchData.status !== 'finished' && matchData.status !== 'live')) return []

  const matchDate = matchData.match_date

  const [{ data: memberData }, { data: finishedMatchData }] = await Promise.all([
    supabase.from('clan_members').select('user_id, joined_at, profiles(username)').eq('clan_id', clanId),
    supabase.from('matches').select('id').lte('match_date', matchDate).eq('status', 'finished'),
  ])

  const ids = (finishedMatchData ?? []).map((m) => m.id)
  if (ids.length === 0) return []

  const { data: predData } = await supabase
    .from('predictions')
    .select('user_id, match_id, home_score, away_score, points')
    .eq('clan_id', clanId)
    .in('match_id', ids)

  type MemberRow = { user_id: string; joined_at: string | null; profiles: { username: string } | null }
  type PredRow = { user_id: string; match_id: string; home_score: string; away_score: string; points: number | null }

  const members = (memberData ?? []) as unknown as MemberRow[]
  const preds = (predData ?? []) as unknown as PredRow[]

  const map = new Map<string, MatchRankingEntry>()
  for (const m of members) {
    map.set(m.user_id, {
      user_id: m.user_id,
      username: m.profiles?.username ?? m.user_id,
      prediction: null,
      total: 0,
      joined_at: m.joined_at ?? null,
    })
  }

  for (const row of preds) {
    const entry = map.get(row.user_id)
    if (!entry) continue
    const pts = row.points ?? 0
    entry.total += pts
    if (row.match_id === matchId) {
      entry.prediction = { home_score: row.home_score, away_score: row.away_score, points: pts }
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return (a.joined_at ?? '').localeCompare(b.joined_at ?? '')
  })
}
