import type { ClanSettings, PredScore } from './types'
import { DEFAULT_CLAN_SETTINGS } from './types'

// "+" means the player predicts 3 or more goals for that team.
// For sign comparison we treat "+" as its minimum value (3).
function predToMin(s: PredScore): number {
  return s === '+' ? 3 : parseInt(s, 10)
}

function predMatches(pred: PredScore, actual: number): boolean {
  return pred === '+' ? actual >= 3 : parseInt(pred, 10) === actual
}

// Real match scores follow the same 0/1/2/+ convention as predictions:
// any team that scored 3 or more goals is displayed as "+".
export function formatMatchScore(score: number | null): string {
  if (score == null) return '–'
  return score >= 3 ? '+' : String(score)
}

export function calculatePoints(
  predHome: PredScore,
  predAway: PredScore,
  realHome: number,
  realAway: number,
  settings?: ClanSettings,
): number {
  const exactPts = settings?.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact
  const signPts  = settings?.points_sign  ?? DEFAULT_CLAN_SETTINGS.points_sign

  if (predMatches(predHome, realHome) && predMatches(predAway, realAway)) return exactPts

  const predSign = Math.sign(predToMin(predHome) - predToMin(predAway))
  const realSign = Math.sign(realHome - realAway)
  if (predSign === realSign) return signPts

  return 0
}

// Derives which team advances based on 90-min score + (if draw) explicit home_advances flag.
export function whoAdvances(
  homeScore: number,
  awayScore: number,
  homeAdvances: boolean | null,
): 'home' | 'away' | null {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  if (homeAdvances === true) return 'home'
  if (homeAdvances === false) return 'away'
  return null // draw but home_advances not set yet
}

// Derives the forced qualifier from a predicted score (non-draw → locked, draw → user picks).
export function deriveQualifierFromScore(
  predHome: PredScore,
  predAway: PredScore,
): 'home' | 'away' | null {
  const h = predToMin(predHome)
  const a = predToMin(predAway)
  if (h > a) return 'home'
  if (a > h) return 'away'
  return null // draw → free choice
}

export function calculateAdvancePoints(
  qualifier: 'home' | 'away' | null,
  homeScore: number,
  awayScore: number,
  homeAdvances: boolean | null,
  settings?: ClanSettings,
): number {
  if (!qualifier) return 0
  const advancing = whoAdvances(homeScore, awayScore, homeAdvances)
  if (!advancing) return 0
  const advancePts = settings?.points_advance ?? DEFAULT_CLAN_SETTINGS.points_advance
  return qualifier === advancing ? advancePts : 0
}
