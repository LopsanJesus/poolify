'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

// Flag images — add more as they become available
const FLAG_IMAGES: Record<string, string> = {
  'México': '/mexico.webp',
  'España': '/spain.png',
}

// Emoji fallback for teams without a flag image
const FLAG_EMOJI: Record<string, string> = {
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
  const homeImg = FLAG_IMAGES[match.home_team ?? ''] ?? null
  const awayImg = FLAG_IMAGES[match.away_team ?? ''] ?? null
  const homeEmoji = FLAG_EMOJI[match.home_team ?? '']
  const awayEmoji = FLAG_EMOJI[match.away_team ?? '']
  const isFinished = match.status === 'finished'

  // diagonal split: left half goes from x=55% at top to x=45% at bottom
  const leftClip  = 'polygon(0 0, 55% 0, 45% 100%, 0 100%)'
  const rightClip = 'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)'

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="relative w-full text-left"
      >
        {/* ── Flag backgrounds ── */}
        {/* Home flag — anchored left, natural proportions */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: homeImg ? `url(${homeImg})` : undefined,
            backgroundColor: homeImg ? undefined : '#172554',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'left center',
            backgroundRepeat: 'no-repeat',
            clipPath: leftClip,
          }}
        />
        {/* Home gradient overlay — dark bottom for text, slight diagonal fade */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.15) 100%)',
            clipPath: leftClip,
          }}
        />

        {/* Away flag — also anchored left */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: awayImg ? `url(${awayImg})` : undefined,
            backgroundColor: awayImg ? undefined : '#172554',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'left center',
            backgroundRepeat: 'no-repeat',
            clipPath: rightClip,
          }}
        />
        {/* Away gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.15) 100%)',
            clipPath: rightClip,
          }}
        />

        {/* ── Content ── */}
        <div className="relative px-3 pt-3 pb-2 space-y-2">
          {/* Stage + status row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-wide">
              {stageLabel(match.stage, locale)}
            </span>
            <StatusChip status={match.status} clanDict={clanDict} />
          </div>

          {/* Teams + score row */}
          <div className="flex items-center gap-2">
            {/* Home team */}
            <div className="flex-1 flex flex-col items-start gap-0.5 min-w-0">
              {!homeImg && homeEmoji && (
                <span className="text-xl leading-none">{homeEmoji}</span>
              )}
              <span
                className="text-white font-bold text-sm leading-tight truncate w-full"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)' }}
              >
                {match.home_team ?? '?'}
              </span>
            </div>

            {/* Center score / time */}
            <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[64px]">
              {isFinished ? (
                <span className="bg-black/60 backdrop-blur-sm text-white font-bold px-2.5 py-0.5 rounded-lg text-base tabular-nums ring-1 ring-white/10">
                  {match.home_score} – {match.away_score}
                </span>
              ) : match.status === 'live' ? (
                <span className="bg-red-500/80 text-white font-bold text-xs px-2.5 py-1 rounded-lg animate-pulse">
                  {clanDict.status_live}
                </span>
              ) : (
                <span className="bg-black/50 backdrop-blur-sm text-blue-200 font-mono text-sm px-2.5 py-0.5 rounded-lg tabular-nums">
                  {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {/* Away team */}
            <div className="flex-1 flex flex-col items-end gap-0.5 min-w-0">
              {!awayImg && awayEmoji && (
                <span className="text-xl leading-none">{awayEmoji}</span>
              )}
              <span
                className="text-white font-bold text-sm leading-tight truncate w-full text-right"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)' }}
              >
                {match.away_team ?? '?'}
              </span>
            </div>

            <ChevronDown
              className={`shrink-0 w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* ── Prediction dropdown ── */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-white/10 bg-blue-950/80 flex items-center justify-between">
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
      )}
    </div>
  )
}

function StatusChip({ status, clanDict }: { status: string; clanDict: Dict['clan'] }) {
  if (status === 'live')
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/40 text-red-200 animate-pulse ring-1 ring-red-500/30">
        {clanDict.status_live}
      </span>
    )
  if (status === 'finished')
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/40 text-white/50">
        {clanDict.status_finished}
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/30 text-emerald-300">
      {clanDict.status_upcoming}
    </span>
  )
}

function PointsBadge({ points }: { points: number }) {
  if (points === 4)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">+4 ⭐</span>
  if (points === 1)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-bold">+1</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">0</span>
}
