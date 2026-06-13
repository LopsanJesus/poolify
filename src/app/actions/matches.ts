'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculatePoints } from '@/lib/scoring'
import type { ClanSettings } from '@/lib/types'
import { DEFAULT_CLAN_SETTINGS } from '@/lib/types'

async function canEditLiveMatch(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, clanId: string) {
  const { data: clan } = await supabase
    .from('clans')
    .select('owner_id, settings')
    .eq('id', clanId)
    .single()

  if (!clan) return false

  const isOwner = clan.owner_id === userId
  const settings = clan.settings as ClanSettings | null
  // Default: all members can edit unless explicitly disabled
  const allMembersAllowed = settings?.live_results_all_members !== false

  if (!isOwner && !allMembersAllowed) return false

  // Verify user is a member of this clan
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('clan_members')
      .select('id')
      .eq('clan_id', clanId)
      .eq('user_id', userId)
      .single()
    if (!membership) return false
  }

  return true
}

export async function startMatch(matchId: string, clanId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  if (!await canEditLiveMatch(supabase, user.id, clanId)) return { error: 'Sin permisos' }

  const { data: match } = await supabase
    .from('matches')
    .select('status, match_date')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Partido no encontrado' }
  if (match.status !== 'upcoming') return { error: 'El partido no está en estado "próximo"' }
  if (new Date() < new Date(match.match_date)) return { error: 'Todavía no es la hora del partido' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ status: 'live', home_score: 0, away_score: 0 })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/predictions`)
  return {}
}

export async function updateLiveScore(
  matchId: string,
  clanId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  if (!await canEditLiveMatch(supabase, user.id, clanId)) return { error: 'Sin permisos' }

  if (homeScore < 0 || awayScore < 0) return { error: 'Marcador inválido' }

  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'live') return { error: 'El partido no está en vivo' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/predictions`)
  return {}
}

// Recalculates points for every prediction made for this match, across all clans.
// Shared by the live "finish match" flow and the admin panel's result correction.
export async function recalcPredictionPoints(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, clan_id, home_score, away_score')
    .eq('match_id', matchId)

  if (!predictions || predictions.length === 0) return

  const clanIds = [...new Set(predictions.map((p) => p.clan_id))]
  const { data: clansData } = await supabase
    .from('clans')
    .select('id, settings')
    .in('id', clanIds)

  const settingsMap = new Map<string, ClanSettings>()
  for (const c of clansData ?? []) {
    settingsMap.set(c.id, (c.settings as ClanSettings) ?? DEFAULT_CLAN_SETTINGS)
  }

  for (const pred of predictions) {
    const points = calculatePoints(
      pred.home_score,
      pred.away_score,
      homeScore,
      awayScore,
      settingsMap.get(pred.clan_id),
    )
    await supabase
      .from('predictions')
      .update({ points, updated_at: new Date().toISOString() })
      .eq('id', pred.id)
  }
}

export async function finishMatch(matchId: string, clanId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  if (!await canEditLiveMatch(supabase, user.id, clanId)) return { error: 'Sin permisos' }

  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'live') return { error: 'El partido no está en vivo' }
  if (match.home_score == null || match.away_score == null) return { error: 'Marcador no definido' }

  const admin = createAdminClient()
  const { error: matchError } = await admin
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', matchId)

  if (matchError) return { error: matchError.message }

  await recalcPredictionPoints(admin, matchId, match.home_score, match.away_score)

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/predictions`)
  revalidatePath(`/clan/${clanId}/ranking`)
  return {}
}
