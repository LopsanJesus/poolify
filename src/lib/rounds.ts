// Group stage matches use dynamic "Group X – Matchday N" stage labels but all
// share a single prediction deadline (the kickoff of the very first group match).
// Knockout stages (round_of_32, round_of_16, ...) each get their own deadline.
export const KNOCKOUT_STAGES = new Set([
  'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final',
])

export function isKnockoutRound(stage: string): boolean {
  return KNOCKOUT_STAGES.has(stage)
}

export function matchRound(stage: string): string {
  if (/^Group\s+[A-Z0-9]+\s*[–-]\s*Matchday\s+\d+$/i.test(stage)) return 'group_stage'
  return stage
}

// Returns, for each round, the deadline (kickoff of its earliest match minus 15 minutes).
export function getRoundDeadlines(matches: { stage: string; match_date: string }[]): Map<string, Date> {
  const earliestByRound = new Map<string, number>()
  for (const m of matches) {
    const round = matchRound(m.stage)
    const time = new Date(m.match_date).getTime()
    const current = earliestByRound.get(round)
    if (current === undefined || time < current) earliestByRound.set(round, time)
  }

  const deadlines = new Map<string, Date>()
  for (const [round, time] of earliestByRound) {
    const deadline = new Date(time - 15 * 60 * 1000)
    deadlines.set(round, deadline)
  }
  return deadlines
}
