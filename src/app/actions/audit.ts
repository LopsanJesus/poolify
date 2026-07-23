'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUserId } from '@/lib/admin'
import { getClanRanking } from './clans'
import { calculatePoints, calculateAdvancePoints, resolveScoringConfig } from '@/lib/scoring'
import { isKnockoutRound } from '@/lib/rounds'
import { calculateTournamentPoints } from '@/lib/tournament-scoring'
import type { ClanSettings, PredScore, RoundConfig } from '@/lib/types'
import { DEFAULT_CLAN_SETTINGS, DEFAULT_FINAL_PREDICTIONS_CONFIG } from '@/lib/types'

export type AuditClanOption = { id: string; name: string }

export async function getAllClansForAdmin(): Promise<AuditClanOption[]> {
  if (!await getAdminUserId()) return []

  const admin = createAdminClient()
  const { data } = await admin.from('clans').select('id, name').order('name')

  return (data ?? []) as AuditClanOption[]
}

export type AuditMismatch = {
  match_id: string
  home_team: string | null
  away_team: string | null
  stage: string
  home_score: number
  away_score: number
  pred_home: PredScore
  pred_away: PredScore
  qualifier: 'home' | 'away' | null
  stored_points: number
  audited_points: number
  debug_scoring?: { points_sign: number; points_exact: number; points_advance: number; score_pts: number; advance_pts: number; used_round_config: boolean }
}

export type AuditFinalMismatch = {
  stored_points: number
  audited_points: number
  breakdown: { field: string; picked: string | null; points: number }[]
}

export type AuditEntry = {
  user_id: string
  username: string
  current_total: number
  audited_total: number
  diff: number
  mismatches: AuditMismatch[]
  final_mismatch: AuditFinalMismatch | null
}

export type ClanAudit = {
  clan_name: string
  entries: AuditEntry[]
  has_discrepancy: boolean
}

type MatchRow = {
  id: string
  home_team: string | null
  away_team: string | null
  stage: string
  home_score: number | null
  away_score: number | null
  status: string
  home_advances: boolean | null
  tournament_id: string | null
}

type PredRow = {
  user_id: string
  home_score: PredScore
  away_score: PredScore
  qualifier: 'home' | 'away' | null
  points: number | null
  matches: MatchRow | null
}

type MemberRow = { user_id: string; profiles: { username: string } | null }

type TourPredRow = {
  user_id: string
  winner: string | null; runner_up: string | null
  semi1: string | null; semi2: string | null; top_scorer: string | null
  custom_answers: Record<string, string> | null
  points: number | null
}

type TourResultRow = {
  winner: string | null; runner_up: string | null; semis: string[] | null
  top_scorer: string | null; custom_results: Record<string, string> | null
}

// Recomputes every prediction's points from scratch (group + knockout scoring
// criteria), one by one, ignoring the stored `points` column entirely, then
// compares the resulting totals against the live /ranking figures.
export async function getClanAudit(clanId: string): Promise<ClanAudit | null> {
  if (!await getAdminUserId()) return null

  const supabase = await createClient()

  const [{ data: clanRow }, { data: memberData }, { data: predData }, { data: tourPredData }, { data: tourResultData }, currentRanking] = await Promise.all([
    supabase.from('clans').select('name, settings').eq('id', clanId).single(),
    supabase.from('clan_members').select('user_id, profiles(username)').eq('clan_id', clanId),
    supabase
      .from('predictions')
      .select('user_id, home_score, away_score, qualifier, points, matches(id, home_team, away_team, stage, home_score, away_score, status, home_advances, tournament_id)')
      .eq('clan_id', clanId),
    supabase
      .from('tournament_predictions')
      .select('user_id, winner, runner_up, semi1, semi2, top_scorer, custom_answers, points')
      .eq('clan_id', clanId),
    supabase.from('tournament_results').select('*').eq('clan_id', clanId).single(),
    getClanRanking(clanId),
  ])

  if (!clanRow) return null

  const clanSettings = (clanRow.settings as ClanSettings | null) ?? DEFAULT_CLAN_SETTINGS
  const finalConfig = clanSettings.final_predictions ?? DEFAULT_FINAL_PREDICTIONS_CONFIG
  const members = (memberData ?? []) as unknown as MemberRow[]
  const preds = (predData ?? []) as unknown as PredRow[]
  const tourPreds = (tourPredData ?? []) as unknown as TourPredRow[]
  const tourResults = tourResultData as TourResultRow | null

  // Batch-fetch every round config (knockout scoring criteria) referenced by these predictions.
  const tournamentIds = new Set<string>()
  for (const p of preds) {
    if (p.matches && isKnockoutRound(p.matches.stage) && p.matches.tournament_id) {
      tournamentIds.add(p.matches.tournament_id)
    }
  }

  const roundConfigMap = new Map<string, RoundConfig>()
  if (tournamentIds.size > 0) {
    const admin = createAdminClient()
    const { data: rcData } = await (admin as any)
      .from('round_configs')
      .select('*')
      .in('tournament_id', [...tournamentIds])
    for (const rc of (rcData ?? []) as RoundConfig[]) {
      roundConfigMap.set(`${rc.tournament_id}::${rc.stage}`, rc)
    }
  }

  type Accumulator = { username: string; audited_total: number; mismatches: AuditMismatch[]; final_mismatch: AuditFinalMismatch | null }
  const usersMap = new Map<string, Accumulator>()
  for (const m of members) {
    usersMap.set(m.user_id, { username: m.profiles?.username ?? m.user_id, audited_total: 0, mismatches: [], final_mismatch: null })
  }

  for (const pred of preds) {
    const entry = usersMap.get(pred.user_id)
    if (!entry) continue

    const match = pred.matches
    const stored = pred.points ?? 0
    let audited = 0

    // Only finished matches with a real score were ever scored by the app — mirror that here.
    if (match && match.status === 'finished' && match.home_score != null && match.away_score != null) {
      const knockout = isKnockoutRound(match.stage)
      const roundConfig = knockout && match.tournament_id
        ? roundConfigMap.get(`${match.tournament_id}::${match.stage}`) ?? null
        : null
      const scoring = resolveScoringConfig(clanSettings, roundConfig)

      const scorePts = calculatePoints(pred.home_score, pred.away_score, match.home_score, match.away_score, scoring)
      const advancePts = knockout
        ? calculateAdvancePoints(pred.qualifier, match.home_score, match.away_score, match.home_advances, scoring)
        : 0
      audited = scorePts + advancePts

      if (audited !== stored) {
        entry.mismatches.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          stage: match.stage,
          home_score: match.home_score,
          away_score: match.away_score,
          pred_home: pred.home_score,
          pred_away: pred.away_score,
          qualifier: pred.qualifier,
          stored_points: stored,
          audited_points: audited,
          debug_scoring: {
            points_sign: scoring.points_sign,
            points_exact: scoring.points_exact,
            points_advance: scoring.points_advance,
            score_pts: scorePts,
            advance_pts: advancePts,
            used_round_config: roundConfig !== null,
          },
        })
      }
    } else if (match && stored !== 0) {
      // Unfinished match with non-zero stored points
      entry.mismatches.push({
        match_id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        stage: match.stage,
        home_score: match.home_score ?? 0,
        away_score: match.away_score ?? 0,
        pred_home: pred.home_score,
        pred_away: pred.away_score,
        qualifier: pred.qualifier,
        stored_points: stored,
        audited_points: 0,
      })
    }

    entry.audited_total += audited
  }

  // Recompute final-predictions (winner/runner-up/semis/top scorer/custom) points
  // and fold them into the audited total, so it matches getClanRanking's totals.
  if (tourResults) {
    for (const tp of tourPreds) {
      const entry = usersMap.get(tp.user_id)
      if (!entry) continue

      const stored = tp.points ?? 0
      const { total: audited, breakdown } = calculateTournamentPoints(tp, tourResults, finalConfig)

      entry.audited_total += audited
      if (audited !== stored) {
        entry.final_mismatch = { stored_points: stored, audited_points: audited, breakdown }
      }
    }
  }

  const currentTotals = new Map(currentRanking.map((r) => [r.user_id, r.total]))

  const entries: AuditEntry[] = [...usersMap.entries()]
    .map(([user_id, v]) => {
      const current_total = currentTotals.get(user_id) ?? 0
      return {
        user_id,
        username: v.username,
        current_total,
        audited_total: v.audited_total,
        diff: v.audited_total - current_total,
        mismatches: v.mismatches,
        final_mismatch: v.final_mismatch,
      }
    })
    .sort((a, b) => {
      if (b.audited_total !== a.audited_total) return b.audited_total - a.audited_total
      return a.username.localeCompare(b.username)
    })

  return {
    clan_name: clanRow.name,
    entries,
    has_discrepancy: entries.some((e) => e.diff !== 0),
  }
}
