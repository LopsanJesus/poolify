'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, Loader2, Users } from 'lucide-react'
import { getClanPredictionsForMatch, type ClanPredictionEntry } from '@/app/actions/predictions'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'
import { FlagImage } from '@/app/_components/FlagImage'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

type MatchWithPrediction = Match & { prediction: Prediction | null }

export function MatchCard({
  clanId,
  match,
  currentUserId,
  clanDict,
  commonDict,
  locale,
}: {
  clanId: string
  match: MatchWithPrediction
  currentUserId: string
  clanDict: Dict['clan']
  commonDict: Dict['common']
  locale: Locale
}) {
  const [expanded, setExpanded] = useState(false)
  const [rows, setRows] = useState<ClanPredictionEntry[] | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !expanded
    setExpanded(next)
    if (next && rows === null) {
      startTransition(async () => {
        const data = await getClanPredictionsForMatch(clanId, match.id)
        setRows(data)
      })
    }
  }

  const isFinished = match.status === 'finished'
  const canRevealOthers = match.status !== 'upcoming'

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-400">{stageLabel(match.stage, locale)}</span>
          <StatusBadge status={match.status} clanDict={clanDict} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-white font-semibold flex items-center justify-end gap-2">
              {match.home_team ?? <TBD />} <TeamFlag team={match.home_team} />
            </p>
          </div>

          <div className="text-center px-3">
            {isFinished ? (
              <p className="text-white font-bold text-lg">
                {match.home_score} – {match.away_score}
              </p>
            ) : (
              <div>
                <p className="text-blue-400 font-mono text-sm">
                  {new Date(match.match_date).toLocaleDateString(DATE_LOCALE[locale], {
                    day: '2-digit', month: 'short',
                  })}
                </p>
                <p className="text-blue-300/60 font-mono text-xs text-center">
                  {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-white font-semibold flex items-center gap-2">
              <TeamFlag team={match.away_team} /> {match.away_team ?? <TBD />}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-blue-400">{clanDict.your_prediction}:</span>
          <div className="flex items-center gap-2">
            {match.prediction ? (
              <>
                <span className="text-sm text-blue-200 font-mono">
                  {match.prediction.home_score} – {match.prediction.away_score}
                </span>
                {isFinished && <PointsBadge points={match.prediction.points} />}
              </>
            ) : (
              <span className="text-xs text-red-300 font-medium">{clanDict.not_submitted}</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-blue-300 hover:text-white hover:bg-white/5 transition border-t border-white/10"
      >
        <Users className="w-3.5 h-3.5" />
        {expanded ? clanDict.hide_predictions : clanDict.view_predictions}
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="p-4 bg-blue-900/40 border-t border-white/10">
          {pending && !rows ? (
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              {commonDict.loading}
            </div>
          ) : rows && rows.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {rows.map((r) => {
                const isYou = r.user_id === currentUserId
                const reveal = canRevealOthers || isYou
                return (
                  <li
                    key={r.user_id}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg ${
                      isYou ? 'bg-emerald-500/15 text-emerald-200' : 'text-blue-100'
                    }`}
                  >
                    <span className="truncate">
                      {r.username}
                      {isYou && (
                        <span className="text-xs text-emerald-400 ml-1.5">({clanDict.you})</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="font-mono">
                        {reveal ? `${r.home_score} – ${r.away_score}` : '• – •'}
                      </span>
                      {isFinished && <PointsBadge points={r.points} small />}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-blue-400 italic">—</p>
          )}
        </div>
      )}
    </div>
  )
}

function TeamFlag({ team }: { team: string | null }) {
  if (!team) return null
  return <FlagImage team={team} size={24} />
}

function TBD() {
  return <span className="text-blue-400/60 font-normal text-sm">?</span>
}

function StatusBadge({
  status,
  clanDict,
}: {
  status: string
  clanDict: Dict['clan']
}) {
  if (status === 'live')
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 animate-pulse">
        {clanDict.status_live}
      </span>
    )
  if (status === 'finished')
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-blue-300">
        {clanDict.status_finished}
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
      {clanDict.status_upcoming}
    </span>
  )
}

function PointsBadge({ points, small = false }: { points: number; small?: boolean }) {
  const size = small ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'
  if (points === 4)
    return (
      <span className={`rounded-full bg-emerald-500/30 text-emerald-300 font-bold ${size}`}>
        +4
      </span>
    )
  if (points === 1)
    return (
      <span className={`rounded-full bg-blue-500/30 text-blue-300 font-bold ${size}`}>+1</span>
    )
  return <span className={`rounded-full bg-red-500/20 text-red-400 ${size}`}>0</span>
}
