'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

const FLAG: Record<string, string> = {
  'México': '🇲🇽', 'Estados Unidos': '🇺🇸', 'España': '🇪🇸',
  'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
}

function toLocalDateKey(isoString: string) {
  const d = new Date(isoString)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function AllMatchesView({
  matches,
  predictions,
  clanDict,
  locale,
}: {
  matches: Match[]
  predictions: Record<string, Prediction>
  clanDict: Dict['clan']
  locale: Locale
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
        {clanDict.no_upcoming}
      </div>
    )
  }

  const byDate = new Map<string, Match[]>()
  for (const m of matches) {
    const key = toLocalDateKey(m.match_date)
    const existing = byDate.get(key)
    if (existing) existing.push(m)
    else byDate.set(key, [m])
  }

  const sortedDates = Array.from(byDate.keys()).sort()

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const d = new Date(dateKey + 'T12:00:00')
        const label = d.toLocaleDateString(DATE_LOCALE[locale], {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const dayMatches = byDate.get(dateKey)!

        return (
          <section key={dateKey}>
            <h2 className="text-sm font-semibold text-blue-400/60 uppercase tracking-wide mb-3 capitalize">
              {label}
            </h2>
            <div className="space-y-2">
              {dayMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  prediction={predictions[m.id] ?? null}
                  clanDict={clanDict}
                  locale={locale}
                  isExpanded={expanded === m.id}
                  onToggle={() => toggle(m.id)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MatchRow({
  match,
  prediction,
  clanDict,
  locale,
  isExpanded,
  onToggle,
}: {
  match: Match
  prediction: Prediction | null
  clanDict: Dict['clan']
  locale: Locale
  isExpanded: boolean
  onToggle: () => void
}) {
  const isFinished = match.status === 'finished'

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition text-left"
      >
        {/* Home */}
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="text-white font-medium truncate text-sm">
            {match.home_team ?? '?'}
          </span>
          <span className="shrink-0 text-base">{FLAG[match.home_team ?? ''] ?? (match.home_team ? '🏳️' : '')}</span>
        </div>

        {/* Score / time */}
        <div className="shrink-0 w-20 text-center">
          {isFinished ? (
            <span className="text-white font-bold tabular-nums">
              {match.home_score} – {match.away_score}
            </span>
          ) : match.status === 'live' ? (
            <span className="text-red-400 font-bold text-xs animate-pulse">{clanDict.status_live}</span>
          ) : (
            <span className="text-blue-300/70 font-mono text-sm tabular-nums">
              {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="shrink-0 text-base">{FLAG[match.away_team ?? ''] ?? (match.away_team ? '🏳️' : '')}</span>
          <span className="text-white font-medium truncate text-sm">
            {match.away_team ?? '?'}
          </span>
        </div>

        <ChevronDown
          className={`shrink-0 w-4 h-4 text-blue-400/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-white/10 bg-blue-900/30 space-y-1.5">
          <p className="text-xs text-blue-400/60">{stageLabel(match.stage, locale)}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-300">{clanDict.your_prediction}</span>
            {prediction ? (
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white tabular-nums">
                  {prediction.home_score} – {prediction.away_score}
                </span>
                {isFinished && <PointsBadge points={prediction.points} />}
              </div>
            ) : (
              <span className="text-sm text-red-300/80">{clanDict.not_submitted}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PointsBadge({ points }: { points: number }) {
  if (points === 4)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">+4 ⭐</span>
  if (points === 1)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-bold">+1</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">0</span>
}
