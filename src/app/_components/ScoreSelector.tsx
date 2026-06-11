'use client'

import type { PredScore } from '@/lib/types'

export const SCORE_OPTIONS: PredScore[] = ['0', '1', '2', '+']

// Shared 0 / 1 / 2 / + button grid, used by the predictions form and by
// live score editing (admin panel + clan live controls) for visual consistency.
export function ScoreButtons({
  name,
  value,
  onSelect,
  disabled,
}: {
  name?: string
  value: PredScore | ''
  onSelect?: (v: PredScore | '') => void
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="flex justify-center">
        <span
          className={`min-w-[2.5rem] text-center text-xl font-bold px-3 py-2 rounded-lg border ${
            value === '+'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-blue-900/60 border-white/20 text-white'
          }`}
        >
          {value || '–'}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-1">
      {name && value !== '' && <input type="hidden" name={name} value={value} />}
      {SCORE_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect?.(opt === value ? '' : opt)}
          className={`h-9 w-full rounded-lg font-bold text-sm transition-all border ${
            value === opt
              ? opt === '+'
                ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30 scale-110'
                : 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-110'
              : 'bg-white/5 border-white/15 text-blue-200 hover:bg-white/15 hover:border-white/30'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// Numeric variant for editing a real match score (0, 1, 2, or 3+).
// "0"/"1"/"2" jump straight to that score; "+" bumps the score up by one
// each time it's pressed (3, 4, 5…), so it stays usable for high scores.
export function LiveScoreButtons({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
}) {
  const selected: PredScore = value === 0 ? '0' : value === 1 ? '1' : value === 2 ? '2' : '+'

  function handleSelect(opt: PredScore | '') {
    if (opt === '') return
    if (opt === '+') onChange(value < 3 ? 3 : value + 1)
    else onChange(parseInt(opt, 10))
  }

  return <ScoreButtons value={selected} onSelect={handleSelect} disabled={disabled} />
}
