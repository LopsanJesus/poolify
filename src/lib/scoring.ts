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
