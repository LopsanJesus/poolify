'use client'

import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'
import { FlagImage } from '@/app/_components/FlagImage'
import { getRankingUpToMatch } from '@/app/actions/clans'
import type { MatchRankingEntry } from '@/app/actions/clans'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

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
  clanId,
  currentUserId,
  pointsExact,
  pointsSign,
}: {
  matches: Match[]
  predictions: Record<string, Prediction>
  clanDict: Dict['clan']
  locale: Locale
  clanId: string | null
  currentUserId: string
  pointsExact: number
  pointsSign: number
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
                  clanId={clanId}
                  currentUserId={currentUserId}
                  pointsExact={pointsExact}
                  pointsSign={pointsSign}
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
  clanId,
  currentUserId,
  pointsExact,
  pointsSign,
}: {
  match: Match
  prediction: Prediction | null
  clanDict: Dict['clan']
  locale: Locale
  isExpanded: boolean
  onToggle: () => void
  clanId: string | null
  currentUserId: string
  pointsExact: number
  pointsSign: number
}) {
  const isFinished = match.status === 'finished'
  const [rankingRows, setRankingRows] = useState<MatchRankingEntry[] | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    onToggle()
    if (!isExpanded && isFinished && clanId && rankingRows === null) {
      startTransition(async () => {
        const data = await getRankingUpToMatch(clanId, match.id)
        setRankingRows(data)
      })
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-left px-3 pt-3 pb-2 space-y-2"
      >
        {/* Stage + status row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50 uppercase tracking-wide">
            {stageLabel(match.stage, locale)}
          </span>
          <StatusChip status={match.status} clanDict={clanDict} />
        </div>

        {/* Teams + score row */}
        <div className="flex items-center gap-1.5">
          {/* Home team */}
          <div className="flex-1 flex flex-col items-start gap-0.5">
            <FlagImage team={match.home_team ?? ''} size={28} />
            <span className="text-white font-semibold text-xs leading-tight break-words">
              {match.home_team ?? '?'}
            </span>
          </div>

          {/* Center score / time */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            {isFinished ? (
              <span className="bg-black/60 backdrop-blur-sm text-white font-bold px-2 py-0.5 rounded-lg text-base tabular-nums ring-1 ring-white/10">
                {match.home_score} – {match.away_score}
              </span>
            ) : match.status === 'live' ? (
              <span className="bg-red-500/80 text-white font-bold text-xs px-2 py-1 rounded-lg animate-pulse">
                {clanDict.status_live}
              </span>
            ) : (
              <span className="bg-black/50 backdrop-blur-sm text-blue-200 font-mono text-sm px-2 py-0.5 rounded-lg tabular-nums">
                {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-end gap-0.5">
            <FlagImage team={match.away_team ?? ''} size={28} />
            <span className="text-white font-semibold text-xs leading-tight break-words text-right">
              {match.away_team ?? '?'}
            </span>
          </div>

          <ChevronDown
            className={`shrink-0 w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {/* Your prediction */}
          <div className="px-4 py-3 bg-blue-950/80 flex items-center justify-between">
            <span className="text-sm text-blue-300">{clanDict.your_prediction}</span>
            {prediction ? (
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white tabular-nums">
                  {prediction.home_score} – {prediction.away_score}
                </span>
                {isFinished && <PointsBadge points={prediction.points} exactPts={pointsExact} signPts={pointsSign} />}
              </div>
            ) : (
              <span className="text-sm text-red-300/80">{clanDict.not_submitted}</span>
            )}
          </div>

          {/* Match ranking — only when finished and clan is set */}
          {isFinished && clanId && (
            <div className="bg-black/30 px-3 py-3">
              <p className="text-[10px] font-semibold text-blue-400/60 uppercase tracking-wide mb-2">
                {clanDict.match_ranking}
              </p>
              {isPending || rankingRows === null ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-8 rounded-lg" />
                  ))}
                </div>
              ) : rankingRows.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-2">{clanDict.no_ranking}</p>
              ) : (
                <div className="space-y-1">
                  {rankingRows.map((entry, idx) => (
                    <MatchRankingRow
                      key={entry.user_id}
                      entry={entry}
                      rank={idx + 1}
                      isCurrentUser={entry.user_id === currentUserId}
                      clanDict={clanDict}
                      pointsExact={pointsExact}
                      pointsSign={pointsSign}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MatchRankingRow({
  entry,
  rank,
  isCurrentUser,
  clanDict,
  pointsExact,
  pointsSign,
}: {
  entry: MatchRankingEntry
  rank: number
  isCurrentUser: boolean
  clanDict: Dict['clan']
  pointsExact: number
  pointsSign: number
}) {
  const pred = entry.prediction

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
        isCurrentUser ? 'bg-blue-500/20 ring-1 ring-blue-400/30' : 'bg-white/5'
      }`}
    >
      {/* Rank */}
      <span className="w-5 text-center text-xs font-bold text-white/40 shrink-0">{rank}</span>

      {/* Name */}
      <span className={`flex-1 truncate font-medium ${isCurrentUser ? 'text-blue-200' : 'text-white/80'}`}>
        {entry.username}
        {isCurrentUser && (
          <span className="ml-1 text-[10px] text-blue-400/70">({clanDict.you})</span>
        )}
      </span>

      {/* Prediction for this match + points gained */}
      <div className="flex items-center gap-1.5 shrink-0">
        {pred ? (
          <>
            <span className="font-mono text-xs text-white/60 tabular-nums">
              {pred.home_score}–{pred.away_score}
            </span>
            <PointsBadge points={pred.points} exactPts={pointsExact} signPts={pointsSign} />
          </>
        ) : (
          <span className="text-xs text-white/25">—</span>
        )}
      </div>

      {/* Total points */}
      <span className="w-12 text-right font-bold text-white tabular-nums text-sm shrink-0">
        {entry.total} <span className="text-[10px] font-normal text-white/40">{clanDict.ranking_points}</span>
      </span>
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

function PointsBadge({ points, exactPts, signPts }: { points: number; exactPts: number; signPts: number }) {
  if (points === exactPts)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">+{exactPts}</span>
  if (points === signPts)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-bold">+{signPts}</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">0</span>
}
