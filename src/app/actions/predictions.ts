'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculatePoints } from '@/lib/scoring'
import type { Match, Prediction, ClanSettings } from '@/lib/types'
import { DEFAULT_CLAN_SETTINGS } from '@/lib/types'

export type ClanPredictionEntry = {
  user_id: string
  username: string
  home_score: number
  away_score: number
  points: number
}

/**
 * Returns all clan members' predictions for a given match.
 * Other players' numeric picks are hidden until the match ends, so fair-play
 * is preserved regardless of what the UI chooses to render.
 */
export async function getClanPredictionsForMatch(
  clanId: string,
  matchId: string
): Promise<ClanPredictionEntry[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('predictions')
    .select('user_id, home_score, away_score, points, profiles(username)')
    .eq('clan_id', clanId)
    .eq('match_id', matchId)

  if (!data) return []

  type Row = {
    user_id: string
    home_score: number
    away_score: number
    points: number
    profiles: { username: string } | null
  }
  const rows = data as unknown as Row[]

  return rows
    .map((r) => ({
      user_id: r.user_id,
      username: r.profiles?.username ?? r.user_id,
      home_score: r.home_score,
      away_score: r.away_score,
      points: r.points ?? 0,
    }))
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username))
}

export async function getUserPredictionsForClan(clanId: string): Promise<Record<string, Prediction>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('clan_id', clanId)
    .eq('user_id', user.id)

  if (!data) return {}
  return Object.fromEntries((data as Prediction[]).map((p) => [p.match_id, p]))
}

async function getTournamentIdsForClan(supabase: Awaited<ReturnType<typeof createClient>>, clanId: string): Promise<string[] | null> {
  const { data } = await supabase
    .from('clan_tournaments')
    .select('tournament_id')
    .eq('clan_id', clanId)
  if (!data || data.length === 0) return null
  return (data as { tournament_id: string }[]).map(r => r.tournament_id)
}

export async function getAllMatches(clanId?: string) {
  const supabase = await createClient()
  let query = supabase.from('matches').select('*').order('match_date')

  if (clanId) {
    const tournamentIds = await getTournamentIdsForClan(supabase, clanId)
    if (tournamentIds) {
      query = query.in('tournament_id', tournamentIds)
    }
  }

  const { data } = await query
  return (data ?? []) as Match[]
}

export async function getMatchesWithPredictions(clanId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: matchData }, { data: predData }, tournamentIds] = await Promise.all([
    supabase.from('matches').select('*').order('match_date'),
    supabase.from('predictions').select('*').eq('clan_id', clanId).eq('user_id', user.id),
    getTournamentIdsForClan(supabase, clanId),
  ])

  let matches = (matchData ?? []) as Match[]
  if (tournamentIds) {
    const idSet = new Set(tournamentIds)
    matches = matches.filter(m => m.tournament_id != null && idSet.has(m.tournament_id))
  }

  const predictions = (predData ?? []) as Prediction[]
  return matches.map((match) => ({
    ...match,
    prediction: predictions.find((p) => p.match_id === match.id) ?? null,
  }))
}

export async function savePredictions(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const clanId = formData.get('clan_id') as string
  const matchIds = formData.getAll('match_id') as string[]

  const [{ data: matchData }, { data: clanData }] = await Promise.all([
    supabase.from('matches').select('*'),
    supabase.from('clans').select('settings').eq('id', clanId).single(),
  ])

  const matches = (matchData ?? []) as Match[]
  const settings = ((clanData as { settings?: ClanSettings } | null)?.settings ?? DEFAULT_CLAN_SETTINGS)

  const upserts = matchIds.flatMap((matchId) => {
    const homeRaw = formData.get(`home_${matchId}`) as string
    const awayRaw = formData.get(`away_${matchId}`) as string
    const homeScore = parseInt(homeRaw, 10)
    const awayScore = parseInt(awayRaw, 10)

    // Skip if either field is blank
    if (homeRaw.trim() === '' || awayRaw.trim() === '' || isNaN(homeScore) || isNaN(awayScore)) {
      return []
    }

    const match = matches.find((m) => m.id === matchId)
    let points = 0
    if (
      match?.status === 'finished' &&
      match.home_score != null &&
      match.away_score != null
    ) {
      points = calculatePoints(homeScore, awayScore, match.home_score, match.away_score, settings)
    }

    return [{
      user_id: user.id,
      match_id: matchId,
      clan_id: clanId,
      home_score: homeScore,
      away_score: awayScore,
      points,
      updated_at: new Date().toISOString(),
    }]
  })

  if (upserts.length === 0) return { success: true }

  const { error } = await supabase
    .from('predictions')
    .upsert(upserts, { onConflict: 'user_id,match_id,clan_id' })

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/predictions`)

  return { success: true }
}
