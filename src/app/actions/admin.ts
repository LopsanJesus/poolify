'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'
import { recalcPredictionPoints } from './matches'
import type { Match, Team } from '@/lib/types'

export type AdminProfile = { id: string; username: string; is_admin: boolean }

export async function getTeamsForAdmin(): Promise<Team[]> {
  if (!await getAdminUserId()) return []

  const admin = createAdminClient()
  const { data: tournament } = await admin
    .from('tournaments')
    .select('id')
    .ilike('name', '%2026%')
    .single() as { data: { id: string } | null; error: unknown }

  if (!tournament) return []

  const { data: teams } = await (admin as any)
    .from('teams')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('name')

  return (teams ?? []) as Team[]
}

export async function getAllProfiles(): Promise<AdminProfile[]> {
  if (!await getAdminUserId()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, is_admin')
    .order('username')

  return (data ?? []) as AdminProfile[]
}

export async function updateUsername(_: unknown, formData: FormData): Promise<{ error?: string; success?: true }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const userId = formData.get('user_id') as string
  const username = (formData.get('username') as string)?.trim()
  if (!username || username.length < 2) return { error: dict.auth.invalid_username }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ username })
    .eq('id', userId)

  if (error) {
    if (error.code === '23505') return { error: dict.admin.username_taken }
    return { error: error.message }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

// ── Match ratification ──────────────────────────────────────────

export async function getRatifiableMatches(): Promise<Match[]> {
  if (!await getAdminUserId()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['live', 'finished'])
    .order('match_date', { ascending: false })

  return (data ?? []) as Match[]
}

export async function adminUpdateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }
  if (homeScore < 0 || awayScore < 0) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, ratified, stage, home_advances, tournament_id')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'live' && match.status !== 'finished') return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)

  if (error) return { error: error.message }

  if (match.status === 'finished') {
    await recalcPredictionPoints(admin, matchId, homeScore, awayScore, match.stage, match.home_advances, match.tournament_id)
  }

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/ranking')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export async function adminFinishMatch(matchId: string): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score, ratified, stage, home_advances, tournament_id')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'live') return { error: dict.common.error }
  if (match.home_score == null || match.away_score == null) return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', matchId)

  if (error) return { error: error.message }

  await recalcPredictionPoints(admin, matchId, match.home_score, match.away_score, match.stage, match.home_advances, match.tournament_id)

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/ranking')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export async function adminSetHomeAdvances(
  matchId: string,
  homeAdvances: boolean,
): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score, ratified, stage, tournament_id')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ home_advances: homeAdvances })
    .eq('id', matchId)

  if (error) return { error: error.message }

  // Recalc if finished so advance points update immediately
  if (match.status === 'finished' && match.home_score != null && match.away_score != null) {
    await recalcPredictionPoints(admin, matchId, match.home_score, match.away_score, match.stage, homeAdvances, match.tournament_id)
  }

  revalidatePath('/admin/matches')
  revalidatePath('/ranking')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

// Re-runs recalcPredictionPoints for every finished match, across all clans.
// Needed after a scoring-formula bug fix (e.g. calculatePoints) so already-finished
// matches get their persisted `points` updated to match the corrected formula —
// recalcPredictionPoints only ever runs automatically when a match transitions to
// finished or its result is corrected, so older matches stay stale otherwise.
export async function recalcAllFinishedMatchPoints(): Promise<{ error?: string; updated?: number }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const admin = createAdminClient()
  const { data: matches, error } = await admin
    .from('matches')
    .select('id, home_score, away_score, stage, home_advances, tournament_id')
    .eq('status', 'finished')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null) as {
      data: { id: string; home_score: number; away_score: number; stage: string; home_advances: boolean | null; tournament_id: string | null }[] | null
      error: { message: string } | null
    }

  if (error) return { error: error.message }

  for (const m of matches ?? []) {
    await recalcPredictionPoints(admin, m.id, m.home_score, m.away_score, m.stage, m.home_advances, m.tournament_id)
  }

  revalidatePath('/admin/auditar')
  revalidatePath('/ranking')
  revalidatePath('/clan/[id]', 'layout')

  return { updated: matches?.length ?? 0 }
}

export async function seedRoundOf32(): Promise<{ error?: string; inserted?: number }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const admin = createAdminClient()

  // Find WC2026 tournament
  const { data: tournament } = await admin
    .from('tournaments')
    .select('id')
    .ilike('name', '%2026%')
    .single() as { data: { id: string } | null; error: unknown }

  if (!tournament) return { error: 'Tournament "2026" not found' }

  // Round of 32 matches — times in UTC (converted from local US timezones)
  const matches = [
    { home_team: '2A',         away_team: '2B',           match_date: '2026-06-28T19:00:00Z' }, // 21:00 Madrid
    { home_team: '1E',         away_team: '3A/B/C/D/F',   match_date: '2026-06-29T20:30:00Z' }, // 22:30 Madrid
    { home_team: '1C',         away_team: '2F',           match_date: '2026-06-29T17:00:00Z' }, // 19:00 Madrid
    { home_team: '1F',         away_team: '2C',           match_date: '2026-06-30T01:00:00Z' }, // 03:00 Madrid Jun 30
    { home_team: '2E',         away_team: '2I',           match_date: '2026-06-30T17:00:00Z' }, // 19:00 Madrid
    { home_team: '1I',         away_team: '3C/D/F/G/H',   match_date: '2026-06-30T21:00:00Z' }, // 23:00 Madrid
    { home_team: '1A',         away_team: '3C/E/F/H/I',   match_date: '2026-07-01T01:00:00Z' }, // 03:00 Madrid Jul 1
    { home_team: '1L',         away_team: '3E/H/I/J/K',   match_date: '2026-07-01T16:00:00Z' }, // 18:00 Madrid
    { home_team: '1G',         away_team: '3A/E/H/I/J',   match_date: '2026-07-01T20:00:00Z' }, // 22:00 Madrid
    { home_team: '1D',         away_team: '3B/E/F/I/J',   match_date: '2026-07-02T00:00:00Z' }, // 02:00 Madrid Jul 2
    { home_team: '1H',         away_team: '2J',           match_date: '2026-07-02T19:00:00Z' }, // 21:00 Madrid
    { home_team: '2K',         away_team: '2L',           match_date: '2026-07-02T23:00:00Z' }, // 01:00 Madrid Jul 3
    { home_team: '1B',         away_team: '3E/F/G/I/J',   match_date: '2026-07-03T03:00:00Z' }, // 05:00 Madrid Jul 3
    { home_team: '2D',         away_team: '2G',           match_date: '2026-07-03T18:00:00Z' }, // 20:00 Madrid
    { home_team: '1J',         away_team: '2H',           match_date: '2026-07-03T22:00:00Z' }, // 00:00 Madrid Jul 4
    { home_team: '1K',         away_team: '3D/E/I/J/L',   match_date: '2026-07-04T01:30:00Z' }, // 03:30 Madrid Jul 4
  ]

  const rows = matches.map((m) => ({
    home_team: m.home_team,
    away_team: m.away_team,
    match_date: m.match_date,
    stage: 'round_of_32',
    status: 'upcoming' as const,
    tournament_id: tournament.id,
    ratified: false,
  }))

  const { error, data } = await admin
    .from('matches')
    .insert(rows)
    .select('id')

  if (error) return { error: error.message }

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/clan/[id]', 'layout')

  return { inserted: data?.length ?? rows.length }
}

export async function adminUpdateMatchTeams(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('ratified')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ home_team: homeTeam, away_team: awayTeam })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export type NewMatchInput = {
  home_team: string
  away_team: string
  match_date: string // ISO UTC string
}

export async function createRoundWithMatches(
  stage: string,
  pointsSign: number,
  pointsExact: number,
  pointsAdvance: number,
  newMatches: NewMatchInput[],
): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }
  if (!newMatches.length) return { error: 'No matches provided' }

  const admin = createAdminClient()

  // Find WC2026 tournament
  const { data: tournament } = await admin
    .from('tournaments')
    .select('id')
    .ilike('name', '%2026%')
    .single() as { data: { id: string } | null; error: unknown }

  if (!tournament) return { error: 'Tournament not found' }

  // Upsert round config (global per-round scoring)
  const { error: rcError } = await (admin as any)
    .from('round_configs')
    .upsert({
      tournament_id: tournament.id,
      stage,
      points_sign: pointsSign,
      points_exact: pointsExact,
      points_advance: pointsAdvance,
    }, { onConflict: 'tournament_id,stage' })

  if (rcError) return { error: rcError.message }

  // Insert matches
  const rows = newMatches.map((m) => ({
    home_team: m.home_team || null,
    away_team: m.away_team || null,
    match_date: m.match_date,
    stage,
    status: 'upcoming' as const,
    tournament_id: tournament.id,
    ratified: false,
  }))

  const { error: matchError } = await admin
    .from('matches')
    .insert(rows)

  if (matchError) return { error: matchError.message }

  revalidatePath('/admin/matches')
  revalidatePath('/admin')
  revalidatePath('/matches')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export async function adminReopenMatch(matchId: string): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, ratified')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'finished') return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ status: 'live' })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export async function ratifyMatch(matchId: string): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score, ratified')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'finished') return { error: dict.admin.match_not_finished }
  if (match.home_score == null || match.away_score == null) return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ ratified: true })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/matches')
  return {}
}
