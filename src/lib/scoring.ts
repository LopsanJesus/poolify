import type { ClanSettings } from './types'
import { DEFAULT_CLAN_SETTINGS } from './types'

export function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
  settings?: ClanSettings
): number {
  const exactPts = settings?.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact
  const signPts = settings?.points_sign ?? DEFAULT_CLAN_SETTINGS.points_sign

  if (predHome === realHome && predAway === realAway) return exactPts

  const predSign = Math.sign(predHome - predAway)
  const realSign = Math.sign(realHome - realAway)
  if (predSign === realSign) return signPts

  return 0
}
