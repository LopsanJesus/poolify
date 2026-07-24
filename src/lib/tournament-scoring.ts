import type { FinalPredictionsConfig } from './types'

// Free-text answers (top scorer, custom fields) are compared with accents
// stripped so a typo like "Mbappe" vs "Mbappé" still counts as a match.
function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

type PredictionFields = {
  winner: string | null
  runner_up: string | null
  semi1: string | null
  semi2: string | null
  top_scorer: string | null
  custom_answers: Record<string, string> | null
}

type ResultFields = {
  winner: string | null
  runner_up: string | null
  semis: string[] | null
  top_scorer: string | null
  custom_results: Record<string, string> | null
}

export type TournamentPointsBreakdownItem = {
  field: string
  picked: string | null
  points: number
}

export type TournamentPointsResult = {
  total: number
  breakdown: TournamentPointsBreakdownItem[]
}

// Pure recomputation of final-predictions (winner/runner-up/semis/top scorer/custom
// fields) points from a prediction + the admin-entered results. Shared by the live
// awarding path (tournament.ts) and the audit tool, so both stay in sync.
export function calculateTournamentPoints(
  pred: PredictionFields,
  results: ResultFields,
  config: FinalPredictionsConfig,
): TournamentPointsResult {
  const atLeastFinal = [results.winner, results.runner_up].filter(Boolean) as string[]
  const atLeastSemi = [...atLeastFinal, ...(results.semis ?? [])].filter(Boolean) as string[]

  const breakdown: TournamentPointsBreakdownItem[] = []
  let total = 0
  const add = (field: string, picked: string | null, points: number) => {
    breakdown.push({ field, picked, points })
    total += points
  }

  add('winner', pred.winner, pred.winner && results.winner === pred.winner ? config.winner_pts : 0)
  add('runner_up', pred.runner_up, pred.runner_up && atLeastFinal.includes(pred.runner_up) ? config.runner_up_pts : 0)
  add('semi1', pred.semi1, pred.semi1 && atLeastSemi.includes(pred.semi1) ? config.semi1_pts : 0)
  add('semi2', pred.semi2, pred.semi2 && atLeastSemi.includes(pred.semi2) ? config.semi2_pts : 0)

  const predScorer = pred.top_scorer ? normalizeAnswer(pred.top_scorer) : null
  const realScorer = results.top_scorer ? normalizeAnswer(results.top_scorer) : null
  add('top_scorer', pred.top_scorer, predScorer && realScorer && predScorer === realScorer ? config.top_scorer_pts : 0)

  for (const f of config.custom_fields ?? []) {
    const pVal = pred.custom_answers?.[f.id] ? normalizeAnswer(pred.custom_answers[f.id]) : null
    const rVal = results.custom_results?.[f.id] ? normalizeAnswer(results.custom_results[f.id]) : null
    add(`custom:${f.id}`, pred.custom_answers?.[f.id] ?? null, pVal && rVal && pVal === rVal ? f.points : 0)
  }

  return { total, breakdown }
}
