/**
 * Poolify scoring rules:
 *  4 pts  – exact score (3 base + 1 bonus for sign)
 *  1 pt   – correct winner / draw only
 *  0 pts  – miss
 */
export function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): number {
  if (predHome === realHome && predAway === realAway) return 4

  const predSign = Math.sign(predHome - predAway)
  const realSign = Math.sign(realHome - realAway)
  if (predSign === realSign) return 1

  return 0
}
