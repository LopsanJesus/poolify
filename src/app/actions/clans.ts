'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import type { Clan, ClanSettings } from '@/lib/types'
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

  const [{ data: memberData }, { data: predData }] = await Promise.all([
    supabase.from('clan_members').select('user_id, joined_at, profiles(username)').eq('clan_id', clanId),
    supabase.from('predictions').select('user_id, points').eq('clan_id', clanId),
  ])

  const exactPts = settings?.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact

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
    if (pts === exactPts) entry.exact += 1
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
  const canMembersInvite = formData.get('can_members_invite') === 'on'

  if (isNaN(pointsExact) || pointsExact < 0) return { error: dict.common.error }
  if (isNaN(pointsSign) || pointsSign < 0) return { error: dict.common.error }

  const settings: ClanSettings = {
    points_exact: pointsExact,
    points_sign: pointsSign,
    can_members_invite: canMembersInvite,
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
