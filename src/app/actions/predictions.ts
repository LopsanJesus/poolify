'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUserId } from '@/lib/admin'
import { calculatePoints, calculateAdvancePoints, deriveQualifierFromScore, resolveScoringConfig } from '@/lib/scoring'
import { matchRound, getRoundDeadlines, isKnockoutRound } from '@/lib/rounds'
import type { Match, Prediction, ClanSettings, PredScore, RoundConfig } from '@/lib/types'
import { DEFAULT_CLAN_SETTINGS } from '@/lib/types'

export type ClanPredictionEntry = {
  user_id: string
  username: string
  home_score: PredScore
  away_score: PredScore
  points: number
  qualifier: 'home' | 'away' | null
  total_points: number
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

  const [{ data }, { data: allPreds }] = await Promise.all([
    supabase
      .from('predictions')
      .select('user_id, home_score, away_score, points, qualifier, profiles(username)')
      .eq('clan_id', clanId)
      .eq('match_id', matchId),
    supabase
      .from('predictions')
      .select('user_id, points')
      .eq('clan_id', clanId),
  ])

  if (!data) return []

  // Sum all prediction points per user across the clan
  const totalByUser = new Map<string, number>()
  for (const p of allPreds ?? []) {
    totalByUser.set(p.user_id, (totalByUser.get(p.user_id) ?? 0) + (p.points ?? 0))
  }

  type Row = {
    user_id: string
    home_score: PredScore
    away_score: PredScore
    points: number
    qualifier: 'home' | 'away' | null
    profiles: { username: string } | null
  }
  const rows = data as unknown as Row[]

  // Return unsorted — sorting happens client-side with live points
  return rows.map((r) => ({
    user_id: r.user_id,
    username: r.profiles?.username ?? r.user_id,
    home_score: r.home_score,
    away_score: r.away_score,
    points: r.points ?? 0,
    qualifier: r.qualifier ?? null,
    total_points: totalByUser.get(r.user_id) ?? 0,
  }))
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

export type MatchWithPrediction = Match & {
  prediction: Prediction | null
  matchDeadlinePassed: boolean
}

export type RoundDeadlineInfo = {
  round: string
  deadline: Date
}

export async function getMatchesWithPredictions(clanId: string): Promise<{
  matches: MatchWithPrediction[]
  roundDeadlines: RoundDeadlineInfo[]
  isAdmin: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { matches: [], roundDeadlines: [], isAdmin: false }

  const [{ data: matchData }, { data: predData }, tournamentIds, { data: profile }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date'),
    supabase.from('predictions').select('*').eq('clan_id', clanId).eq('user_id', user.id),
    getTournamentIdsForClan(supabase, clanId),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ])

  const isAdmin = !!profile?.is_admin

  let matches = (matchData ?? []) as Match[]
  if (tournamentIds) {
    const idSet = new Set(tournamentIds)
    matches = matches.filter(m => m.tournament_id != null && idSet.has(m.tournament_id))
  }

  const predictions = (predData ?? []) as Prediction[]
  const now = new Date()
  const deadlinesMap = getRoundDeadlines(matches)

  const matchesWithPreds: MatchWithPrediction[] = matches.map((match) => {
    const deadline = deadlinesMap.get(matchRound(match.stage))
    return {
      ...match,
      prediction: predictions.find((p) => p.match_id === match.id) ?? null,
      matchDeadlinePassed: deadline ? now >= deadline : false,
    }
  })

  const roundDeadlines: RoundDeadlineInfo[] = Array.from(deadlinesMap.entries()).map(([round, deadline]) => ({
    round,
    deadline,
  }))

  return { matches: matchesWithPreds, roundDeadlines, isAdmin }
}

export async function savePredictions(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const clanId = formData.get('clan_id') as string
  const matchIds = formData.getAll('match_id') as string[]
  const isAdmin = !!(await getAdminUserId())

  const [{ data: matchData }, { data: clanData }, { data: existingPredsData }] = await Promise.all([
    supabase.from('matches').select('*'),
    supabase.from('clans').select('settings').eq('id', clanId).single(),
    supabase
      .from('predictions')
      .select('match_id')
      .eq('clan_id', clanId)
      .eq('user_id', user.id)
      .in('match_id', matchIds),
  ])

  const existingMatchIds = new Set((existingPredsData ?? []).map((p) => p.match_id as string))

  const matches = (matchData ?? []) as Match[]
  const clanSettings: ClanSettings = ((clanData as { settings?: ClanSettings } | null)?.settings ?? DEFAULT_CLAN_SETTINGS)

  // Fetch all round configs for knockout scoring overrides
  const knockoutMatchIds = new Set(
    matches.filter(m => isKnockoutRound(m.stage) && m.tournament_id).map(m => m.tournament_id!)
  )
  let roundConfigMap = new Map<string, RoundConfig>()
  if (knockoutMatchIds.size > 0) {
    const admin = createAdminClient()
    const { data: rcData } = await (admin as any)
      .from('round_configs')
      .select('*')
      .in('tournament_id', [...knockoutMatchIds])
    for (const rc of (rcData ?? []) as RoundConfig[]) {
      roundConfigMap.set(`${rc.tournament_id}:${rc.stage}`, rc)
    }
  }

  const VALID: PredScore[] = ['0', '1', '2', '+']
  const now = new Date()
  const roundDeadlines = getRoundDeadlines(matches)

  const upserts = matchIds.flatMap((matchId) => {
    const homeRaw = (formData.get(`home_${matchId}`) as string)?.trim()
    const awayRaw = (formData.get(`away_${matchId}`) as string)?.trim()

    if (!VALID.includes(homeRaw as PredScore) || !VALID.includes(awayRaw as PredScore)) {
      return []
    }

    const homeScore = homeRaw as PredScore
    const awayScore = awayRaw as PredScore

    const match = matches.find((m) => m.id === matchId)

    // Server-side round deadline check.
    // Admins may fill in a prediction that was never made even after the deadline,
    // but once it exists it can no longer be modified past the deadline (same as everyone else).
    if (match) {
      const deadline = roundDeadlines.get(matchRound(match.stage))
      const deadlinePassed = !!deadline && now >= deadline
      if (deadlinePassed && (!isAdmin || existingMatchIds.has(matchId))) return []
    }

    // Derive qualifier for knockout matches
    let qualifier: 'home' | 'away' | null = null
    if (match && isKnockoutRound(match.stage)) {
      const forcedQualifier = deriveQualifierFromScore(homeScore, awayScore)
      if (forcedQualifier) {
        qualifier = forcedQualifier
      } else {
        const rawQualifier = (formData.get(`qualifier_${matchId}`) as string)?.trim()
        if (rawQualifier === 'home' || rawQualifier === 'away') {
          qualifier = rawQualifier
        }
      }
    }

    let points = 0
    if (match?.status === 'finished' && match.home_score != null && match.away_score != null) {
      const roundConfig = match.tournament_id
        ? (roundConfigMap.get(`${match.tournament_id}:${match.stage}`) ?? null)
        : null
      const scoring = resolveScoringConfig(clanSettings, roundConfig)
      const scorePts = calculatePoints(homeScore, awayScore, match.home_score, match.away_score, scoring)
      const advancePts = isKnockoutRound(match.stage)
        ? calculateAdvancePoints(qualifier, match.home_score, match.away_score, match.home_advances, scoring)
        : 0
      points = scorePts + advancePts
    }

    return [{
      user_id: user.id,
      match_id: matchId,
      clan_id: clanId,
      home_score: homeScore,
      away_score: awayScore,
      qualifier,
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
