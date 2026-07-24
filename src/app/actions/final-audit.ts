'use server'

// Independent, from-scratch recalculation of a clan's final ranking — group stage
// matches, elimination (knockout) matches, and final predictions (winner/runner-up/
// semifinalists/top scorer/custom fields). Deliberately does NOT reuse the scoring
// helpers in `@/lib/scoring.ts` or the awarding logic in `@/app/actions/tournament.ts` —
// this is a separate calculation meant to double-check those against, not a shared path.
// It only produces a ranking; it does not compare against the live totals.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUserId } from '@/lib/admin'
import { DEFAULT_CLAN_SETTINGS, DEFAULT_FINAL_PREDICTIONS_CONFIG } from '@/lib/types'
import type { ClanSettings, FinalPredictionsConfig, PredScore, RoundConfig } from '@/lib/types'

// ── Fresh stage classification (independent of src/lib/rounds.ts) ──────────────
const ELIMINATION_STAGES = new Set([
  'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final',
])
function isEliminationStage(stage: string): boolean {
  return ELIMINATION_STAGES.has(stage)
}

// ── Fresh match-score scoring (independent of src/lib/scoring.ts) ──────────────
function predToNumber(p: PredScore): number {
  return p === '+' ? 3 : Number(p)
}

function predictionHitsScore(p: PredScore, real: number): boolean {
  return p === '+' ? real >= 3 : Number(p) === real
}

function isExactHit(predHome: PredScore, predAway: PredScore, realHome: number, realAway: number): boolean {
  return predictionHitsScore(predHome, realHome) && predictionHitsScore(predAway, realAway)
}

function scoreMatch(
  predHome: PredScore, predAway: PredScore,
  realHome: number, realAway: number,
  exactPts: number, signPts: number,
): number {
  if (isExactHit(predHome, predAway, realHome, realAway)) return exactPts + signPts
  const predSign = Math.sign(predToNumber(predHome) - predToNumber(predAway))
  const realSign = Math.sign(realHome - realAway)
  return predSign === realSign ? signPts : 0
}

function whoQualifies(realHome: number, realAway: number, homeAdvances: boolean | null): 'home' | 'away' | null {
  if (realHome > realAway) return 'home'
  if (realAway > realHome) return 'away'
  if (homeAdvances === true) return 'home'
  if (homeAdvances === false) return 'away'
  return null
}

// A non-draw score prediction locks in the qualifier (whoever it predicts to win).
// A drawn score prediction leaves it open — the user picks the qualifier separately
// via the `qualifier` field, which is the only source of truth in that case.
function predictedQualifier(
  predHome: PredScore, predAway: PredScore,
  storedQualifier: 'home' | 'away' | null,
): 'home' | 'away' | null {
  const h = predToNumber(predHome)
  const a = predToNumber(predAway)
  if (h > a) return 'home'
  if (a > h) return 'away'
  return storedQualifier
}

function scoreQualifierBonus(
  predHome: PredScore, predAway: PredScore, storedQualifier: 'home' | 'away' | null,
  realHome: number, realAway: number,
  homeAdvances: boolean | null, advancePts: number,
): number {
  const predicted = predictedQualifier(predHome, predAway, storedQualifier)
  if (!predicted) return 0
  const actual = whoQualifies(realHome, realAway, homeAdvances)
  return actual && predicted === actual ? advancePts : 0
}

function resolveMatchScoring(clanSettings: ClanSettings, roundConfig: RoundConfig | null) {
  if (roundConfig) {
    return { exact: roundConfig.points_exact, sign: roundConfig.points_sign, advance: roundConfig.points_advance }
  }
  return {
    exact: clanSettings.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact,
    sign: clanSettings.points_sign ?? DEFAULT_CLAN_SETTINGS.points_sign,
    advance: clanSettings.points_advance ?? DEFAULT_CLAN_SETTINGS.points_advance,
  }
}

// ── Fresh final-predictions scoring, with accent-insensitive text matching ─────
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeAnswer(s: string): string {
  return stripAccents(s.trim().toLowerCase())
}

type FinalPredictionsLabels = {
  winner: string; runner_up: string; semi1: string; semi2: string; top_scorer: string
}

const DEFAULT_LABELS: FinalPredictionsLabels = {
  winner: 'Winner', runner_up: 'Runner-up', semi1: 'Semifinalist 1', semi2: 'Semifinalist 2', top_scorer: 'Top scorer',
}

function scoreFinalPredictions(
  pred: {
    winner: string | null; runner_up: string | null
    semi1: string | null; semi2: string | null; top_scorer: string | null
    custom_answers: Record<string, string> | null
  },
  results: {
    winner: string | null; runner_up: string | null; semis: string[] | null
    top_scorer: string | null; custom_results: Record<string, string> | null
  },
  config: FinalPredictionsConfig,
  labels: FinalPredictionsLabels,
): { total: number; items: FinalAuditPredictionItem[] } {
  // Reaching the final earns runner-up credit; reaching the semis (or further)
  // earns semifinalist credit — going further than picked still counts.
  const reachedFinal = [results.winner, results.runner_up].filter(Boolean) as string[]
  const reachedSemiOrBetter = [...reachedFinal, ...(results.semis ?? [])].filter(Boolean) as string[]

  const items: FinalAuditPredictionItem[] = []
  let total = 0
  const add = (label: string, picked: string | null, points: number) => {
    items.push({ label, picked, points })
    total += points
  }

  add(labels.winner, pred.winner, pred.winner && pred.winner === results.winner ? config.winner_pts : 0)
  add(labels.runner_up, pred.runner_up, pred.runner_up && reachedFinal.includes(pred.runner_up) ? config.runner_up_pts : 0)
  add(labels.semi1, pred.semi1, pred.semi1 && reachedSemiOrBetter.includes(pred.semi1) ? config.semi1_pts : 0)
  add(labels.semi2, pred.semi2, pred.semi2 && reachedSemiOrBetter.includes(pred.semi2) ? config.semi2_pts : 0)

  const predScorer = pred.top_scorer ? normalizeAnswer(pred.top_scorer) : null
  const realScorer = results.top_scorer ? normalizeAnswer(results.top_scorer) : null
  add(labels.top_scorer, pred.top_scorer, predScorer && realScorer && predScorer === realScorer ? config.top_scorer_pts : 0)

  for (const f of config.custom_fields ?? []) {
    const pVal = pred.custom_answers?.[f.id] ? normalizeAnswer(pred.custom_answers[f.id]) : null
    const rVal = results.custom_results?.[f.id] ? normalizeAnswer(results.custom_results[f.id]) : null
    add(f.label, pred.custom_answers?.[f.id] ?? null, pVal && rVal && pVal === rVal ? f.points : 0)
  }

  return { total, items }
}

// ── Data shapes returned to the UI ──────────────────────────────────────────────
export type FinalAuditMatchItem = {
  match_id: string
  stage: string
  is_elimination: boolean
  match_date: string
  home_team: string | null
  away_team: string | null
  home_score: number
  away_score: number
  pred_home: PredScore
  pred_away: PredScore
  points: number
}

export type FinalAuditPredictionItem = { label: string; picked: string | null; points: number }

export type FinalAuditEntry = {
  user_id: string
  username: string
  group_points: number
  elimination_points: number
  final_prediction_points: number
  total: number
  matches: FinalAuditMatchItem[]
  final_predictions: FinalAuditPredictionItem[]
}

export type FinalAuditResult = {
  clan_name: string
  entries: FinalAuditEntry[]
}

type MemberRow = { user_id: string; profiles: { username: string } | null }

type MatchRow = {
  id: string; home_team: string | null; away_team: string | null; stage: string
  match_date: string
  home_score: number | null; away_score: number | null; status: string
  home_advances: boolean | null; tournament_id: string | null
}

type PredRow = {
  user_id: string; home_score: PredScore; away_score: PredScore
  qualifier: 'home' | 'away' | null; matches: MatchRow | null
}

type TourPredRow = {
  user_id: string
  winner: string | null; runner_up: string | null
  semi1: string | null; semi2: string | null; top_scorer: string | null
  custom_answers: Record<string, string> | null
}

type TourResultRow = {
  winner: string | null; runner_up: string | null; semis: string[] | null
  top_scorer: string | null; custom_results: Record<string, string> | null
}

export async function getFinalAudit(
  clanId: string,
  labels: FinalPredictionsLabels = DEFAULT_LABELS,
): Promise<FinalAuditResult | null> {
  if (!await getAdminUserId()) return null

  const supabase = await createClient()

  const [{ data: clanRow }, { data: memberData }, { data: predData }, { data: tourPredData }, { data: tourResultData }] = await Promise.all([
    supabase.from('clans').select('name, settings').eq('id', clanId).single(),
    supabase.from('clan_members').select('user_id, profiles(username)').eq('clan_id', clanId),
    supabase
      .from('predictions')
      .select('user_id, home_score, away_score, qualifier, matches(id, home_team, away_team, stage, match_date, home_score, away_score, status, home_advances, tournament_id)')
      .eq('clan_id', clanId),
    supabase
      .from('tournament_predictions')
      .select('user_id, winner, runner_up, semi1, semi2, top_scorer, custom_answers')
      .eq('clan_id', clanId),
    supabase.from('tournament_results').select('*').eq('clan_id', clanId).single(),
  ])

  if (!clanRow) return null

  const clanSettings = (clanRow.settings as ClanSettings | null) ?? DEFAULT_CLAN_SETTINGS
  const finalConfig = clanSettings.final_predictions ?? DEFAULT_FINAL_PREDICTIONS_CONFIG

  const members = (memberData ?? []) as unknown as MemberRow[]
  const preds = (predData ?? []) as unknown as PredRow[]
  const tourPreds = (tourPredData ?? []) as unknown as TourPredRow[]
  const tourResults = tourResultData as TourResultRow | null

  // Batch-fetch round configs referenced by elimination-stage matches.
  const tournamentIds = new Set<string>()
  for (const p of preds) {
    if (p.matches && isEliminationStage(p.matches.stage) && p.matches.tournament_id) {
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

  type Acc = {
    username: string
    group_points: number
    elimination_points: number
    final_prediction_points: number
    matches: FinalAuditMatchItem[]
    final_predictions: FinalAuditPredictionItem[]
  }
  const usersMap = new Map<string, Acc>()
  for (const m of members) {
    usersMap.set(m.user_id, {
      username: m.profiles?.username ?? m.user_id,
      group_points: 0, elimination_points: 0, final_prediction_points: 0,
      matches: [], final_predictions: [],
    })
  }

  for (const pred of preds) {
    const entry = usersMap.get(pred.user_id)
    if (!entry) continue

    const match = pred.matches
    if (!match || match.status !== 'finished' || match.home_score == null || match.away_score == null) continue

    const elimination = isEliminationStage(match.stage)
    const roundConfig = elimination && match.tournament_id
      ? roundConfigMap.get(`${match.tournament_id}::${match.stage}`) ?? null
      : null
    const scoring = resolveMatchScoring(clanSettings, roundConfig)

    const basePts = scoreMatch(pred.home_score, pred.away_score, match.home_score, match.away_score, scoring.exact, scoring.sign)
    const bonusPts = elimination
      ? scoreQualifierBonus(pred.home_score, pred.away_score, pred.qualifier, match.home_score, match.away_score, match.home_advances, scoring.advance)
      : 0
    const points = basePts + bonusPts

    entry.matches.push({
      match_id: match.id,
      stage: match.stage,
      is_elimination: elimination,
      match_date: match.match_date,
      home_team: match.home_team,
      away_team: match.away_team,
      home_score: match.home_score,
      away_score: match.away_score,
      pred_home: pred.home_score,
      pred_away: pred.away_score,
      points,
    })

    if (elimination) entry.elimination_points += points
    else entry.group_points += points
  }

  if (tourResults) {
    for (const tp of tourPreds) {
      const entry = usersMap.get(tp.user_id)
      if (!entry) continue

      const { total, items } = scoreFinalPredictions(tp, tourResults, finalConfig, labels)
      entry.final_prediction_points += total
      entry.final_predictions = items
    }
  }

  const entries: FinalAuditEntry[] = [...usersMap.entries()]
    .map(([user_id, v]) => ({
      user_id,
      username: v.username,
      group_points: v.group_points,
      elimination_points: v.elimination_points,
      final_prediction_points: v.final_prediction_points,
      total: v.group_points + v.elimination_points + v.final_prediction_points,
      matches: [...v.matches].sort((a, b) => a.match_date.localeCompare(b.match_date)),
      final_predictions: v.final_predictions,
    }))
    .sort((a, b) => b.total - a.total || a.username.localeCompare(b.username))

  return { clan_name: clanRow.name, entries }
}
