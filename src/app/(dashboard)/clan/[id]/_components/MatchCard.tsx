'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, Loader2, Users } from 'lucide-react'
import { getClanPredictionsForMatch, type ClanPredictionEntry } from '@/app/actions/predictions'
import { startMatch, updateLiveScore, finishMatch } from '@/app/actions/matches'
import { isKnockoutRound } from '@/lib/rounds'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'
import { translateTeam } from '@/lib/team-flags'
import { FlagImage } from '@/app/_components/FlagImage'
import { LiveScoreButtons } from '@/app/_components/ScoreSelector'
import { formatMatchScore } from '@/lib/scoring'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

type MatchWithPrediction = Match & { prediction: Prediction | null }

export function MatchCard({
  clanId,
  match,
  currentUserId,
  clanDict,
  commonDict,
  locale,
  isPastDeadline = false,
  canEditLive = false,
  pointsExact,
  pointsSign,
}: {
  clanId: string
  match: MatchWithPrediction
  currentUserId: string
  clanDict: Dict['clan']
  commonDict: Dict['common']
  locale: Locale
  isPastDeadline?: boolean
  canEditLive?: boolean
  pointsExact: number
  pointsSign: number
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
  // Only reveal other users' predictions after the global deadline closes (prevents copying)
  const canRevealOthers = isPastDeadline

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs text-blue-400">{stageLabel(match.stage, locale)}</span>
          <div className="flex items-center gap-2 shrink-0">
            {match.status === 'upcoming' && (
              <span className="text-xs text-blue-300/60 font-mono whitespace-nowrap">
                {new Date(match.match_date).toLocaleDateString(DATE_LOCALE[locale], {
                  day: '2-digit', month: 'short', timeZone: 'Europe/Madrid',
                })}{' '}
                {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                  hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
                })}
              </span>
            )}
            <StatusBadge status={match.status} clanDict={clanDict} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TeamFlag team={match.home_team} />
              <span className="text-white font-semibold truncate">
                {match.home_team ? translateTeam(match.home_team, locale) : <TBD />}
              </span>
            </div>
            {(isFinished || match.status === 'live') && (
              <span className="text-white font-bold text-lg tabular-nums shrink-0">
                {formatMatchScore(match.home_score)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TeamFlag team={match.away_team} />
              <span className="text-white font-semibold truncate">
                {match.away_team ? translateTeam(match.away_team, locale) : <TBD />}
              </span>
            </div>
            {(isFinished || match.status === 'live') && (
              <span className="text-white font-bold text-lg tabular-nums shrink-0">
                {formatMatchScore(match.away_score)}
              </span>
            )}
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
                {isFinished && <PointsBadge points={match.prediction.points} exactPts={pointsExact} signPts={pointsSign} />}
              </>
            ) : (
              <span className="text-xs text-red-300 font-medium">{clanDict.not_submitted}</span>
            )}
          </div>
        </div>
      </div>

      {canEditLive && (match.status === 'live' || match.status === 'upcoming') && (
        <LiveControls match={match} clanId={clanId} clanDict={clanDict} />
      )}

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
                      {reveal && isKnockoutRound(match.stage) && r.qualifier && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium whitespace-nowrap">
                          {r.qualifier === 'home'
                            ? (match.home_team ?? '?')
                            : (match.away_team ?? '?')}
                        </span>
                      )}
                      {isFinished && <PointsBadge points={r.points} exactPts={pointsExact} signPts={pointsSign} small />}
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

function LiveControls({
  match,
  clanId,
  clanDict,
}: {
  match: MatchWithPrediction
  clanId: string
  clanDict: Dict['clan']
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // knockout draw: show qualifier picker before finishing
  const [awaitingAdvances, setAwaitingAdvances] = useState(false)
  const homeScore = match.home_score ?? 0
  const awayScore = match.away_score ?? 0

  function handleStart() {
    setError(null)
    startTransition(async () => {
      const res = await startMatch(match.id, clanId)
      if (res.error) setError(res.error)
    })
  }

  function setScore(team: 'home' | 'away', score: number) {
    setError(null)
    const newHome = team === 'home' ? score : homeScore
    const newAway = team === 'away' ? score : awayScore
    startTransition(async () => {
      const res = await updateLiveScore(match.id, clanId, newHome, newAway)
      if (res.error) setError(res.error)
    })
  }

  function handleFinishClick() {
    // Knockout draw → ask who advances before finishing
    if (isKnockoutRound(match.stage) && homeScore === awayScore) {
      setAwaitingAdvances(true)
      return
    }
    doFinish()
  }

  function doFinish(homeAdvances?: boolean) {
    setError(null)
    setAwaitingAdvances(false)
    startTransition(async () => {
      const res = await finishMatch(match.id, clanId, homeAdvances)
      if (res.error) setError(res.error)
    })
  }

  if (match.status === 'upcoming') {
    if (new Date() < new Date(match.match_date)) return null
    return (
      <div className="px-4 py-3 border-t border-white/10 bg-white/5">
        <button
          type="button"
          onClick={handleStart}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {clanDict.start_match}
        </button>
        {error && <p className="text-xs text-red-300 text-center mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-white/10 bg-white/5 space-y-3">
      <p className="text-xs text-blue-400 text-center font-medium">{clanDict.live_score}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <LiveScoreButtons value={homeScore} onChange={(v) => setScore('home', v)} disabled={pending} />
        <span className="text-blue-300/40 font-bold">–</span>
        <LiveScoreButtons value={awayScore} onChange={(v) => setScore('away', v)} disabled={pending} />
      </div>

      {awaitingAdvances ? (
        <div className="space-y-2">
          <p className="text-xs text-amber-300 text-center font-medium">
            Empate — ¿quién pasa?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => doFinish(true)}
              disabled={pending}
              className="py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-semibold transition disabled:opacity-60"
            >
              {match.home_team ?? 'Local'}
            </button>
            <button
              type="button"
              onClick={() => doFinish(false)}
              disabled={pending}
              className="py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-semibold transition disabled:opacity-60"
            >
              {match.away_team ?? 'Visitante'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAwaitingAdvances(false)}
            className="w-full text-xs text-blue-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleFinishClick}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-semibold transition disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {clanDict.finish_match}
        </button>
      )}

      {error && <p className="text-xs text-red-300 text-center">{error}</p>}
    </div>
  )
}

function PointsBadge({
  points,
  exactPts,
  signPts,
  small = false,
}: {
  points: number
  exactPts: number
  signPts: number
  small?: boolean
}) {
  const size = small ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'
  if (points === exactPts)
    return (
      <span className={`rounded-full bg-emerald-500/30 text-emerald-300 font-bold ${size}`}>
        +{exactPts}
      </span>
    )
  if (points === signPts)
    return (
      <span className={`rounded-full bg-blue-500/30 text-blue-300 font-bold ${size}`}>+{signPts}</span>
    )
  return <span className={`rounded-full bg-red-500/20 text-red-400 ${size}`}>0</span>
}
