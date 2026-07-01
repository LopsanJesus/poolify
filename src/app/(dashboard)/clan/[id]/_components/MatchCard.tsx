'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, Loader2, Users } from 'lucide-react'
import { getClanPredictionsForMatch, type ClanPredictionEntry } from '@/app/actions/predictions'
import { startMatch, updateLiveScore, finishMatch } from '@/app/actions/matches'
import { isKnockoutRound } from '@/lib/rounds'
import { calculatePoints, calculateAdvancePoints, whoAdvances } from '@/lib/scoring'
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
  pointsAdvance = 2,
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
  pointsAdvance: number
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
  const isLiveOrFinished = match.status === 'live' || isFinished
  const knockout = isKnockoutRound(match.stage)
  const canRevealOthers = isPastDeadline

  // Who actually advanced (knockout finished with home_advances resolved)
  const actualAdvancer = (isFinished && knockout && match.home_score != null && match.away_score != null)
    ? whoAdvances(match.home_score, match.away_score, match.home_advances)
    : null

  const scoring = { points_exact: pointsExact, points_sign: pointsSign, points_advance: pointsAdvance }

  function liveMatchPts(pred: ClanPredictionEntry): number {
    if (match.home_score == null || match.away_score == null) return 0
    const scorePts = calculatePoints(pred.home_score, pred.away_score, match.home_score, match.away_score, scoring)
    const advancePts = knockout
      ? calculateAdvancePoints(pred.qualifier, match.home_score, match.away_score, match.home_advances, scoring)
      : 0
    return scorePts + advancePts
  }

  // Once the match is finished, points are already persisted (computed server-side with the
  // round-specific scoring config, same as /ranking). Reuse that value instead of recomputing
  // it client-side with only the clan-level config, which can disagree for knockout rounds.
  function matchPtsFor(pred: ClanPredictionEntry): number {
    return isFinished ? pred.points : liveMatchPts(pred)
  }

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
              <TeamFlag team={match.home_team} dim={actualAdvancer === 'away'} />
              <span className={`font-semibold truncate ${
                actualAdvancer === 'home' ? 'text-emerald-400' :
                actualAdvancer === 'away' ? 'text-white/35' : 'text-white'
              }`}>
                {match.home_team ? translateTeam(match.home_team, locale) : <TBD />}
              </span>
            </div>
            {isLiveOrFinished && (
              <span className="text-white font-bold text-lg tabular-nums shrink-0">
                {formatMatchScore(match.home_score)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TeamFlag team={match.away_team} dim={actualAdvancer === 'home'} />
              <span className={`font-semibold truncate ${
                actualAdvancer === 'away' ? 'text-emerald-400' :
                actualAdvancer === 'home' ? 'text-white/35' : 'text-white'
              }`}>
                {match.away_team ? translateTeam(match.away_team, locale) : <TBD />}
              </span>
            </div>
            {isLiveOrFinished && (
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
        <div className="p-3 bg-blue-900/40 border-t border-white/10">
          {pending && !rows ? (
            <div className="flex items-center gap-2 text-sm text-blue-300 px-1 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {commonDict.loading}
            </div>
          ) : rows && rows.length > 0 ? (() => {
            const hasScore = match.home_score != null && match.away_score != null

            // Ranking WITHOUT this match: total_points minus what this match contributed (r.points)
            const rankBefore = new Map(
              [...rows]
                .sort((a, b) => (b.total_points - b.points) - (a.total_points - a.points) || a.username.localeCompare(b.username))
                .map((r, i) => [r.user_id, i + 1])
            )

            const sorted = [...rows].sort((a, b) => {
              const aTotal = a.total_points - a.points + (hasScore ? matchPtsFor(a) : 0)
              const bTotal = b.total_points - b.points + (hasScore ? matchPtsFor(b) : 0)
              return bTotal - aTotal || a.username.localeCompare(b.username)
            })

            // Position after = index in sorted array
            const rankAfter = new Map(sorted.map((r, i) => [r.user_id, i + 1]))
            return (
              <ul className="space-y-1">
                {sorted.map((r) => {
                  const isYou = r.user_id === currentUserId
                  const reveal = canRevealOthers || isYou
                  const matchPts = hasScore ? matchPtsFor(r) : null
                  const totalWithMatch = r.total_points - r.points + (matchPts ?? 0)
                  const posBefore = rankBefore.get(r.user_id) ?? 0
                  const posAfter = rankAfter.get(r.user_id) ?? 0
                  const posChange = hasScore ? posBefore - posAfter : 0 // positive = moved up
                  return (
                    <li
                      key={r.user_id}
                      className={`px-2.5 py-2 rounded-lg ${isYou ? 'bg-emerald-500/15' : ''}`}
                    >
                      {/* Row 1: name · score · qualifier */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium truncate ${isYou ? 'text-emerald-200' : 'text-blue-100'}`}>
                          {r.username}
                          {isYou && <span className="text-xs text-emerald-400 ml-1">({clanDict.you})</span>}
                        </span>
                        <span className="font-mono text-sm shrink-0">
                          {reveal ? (
                            <>
                              <span className={knockout && r.qualifier === 'home' ? 'text-orange-300 font-bold' : 'text-blue-100'}>
                                {r.home_score}
                              </span>
                              <span className="text-blue-100/50"> – </span>
                              <span className={knockout && r.qualifier === 'away' ? 'text-orange-300 font-bold' : 'text-blue-100'}>
                                {r.away_score}
                              </span>
                            </>
                          ) : '• – •'}
                        </span>
                      </div>
                      {/* Row 2: total pts · arrow · match pts · badge */}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-blue-400/70">
                          {totalWithMatch} pts
                          {posChange > 0 && <span className="text-emerald-400 text-[10px] leading-none">▲</span>}
                          {posChange < 0 && <span className="text-red-400 text-[10px] leading-none">▼</span>}
                        </span>
                        {matchPts !== null && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <MatchPtsBadge pts={matchPts} exactPts={pointsExact} signPts={pointsSign} />
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )
          })() : (
            <p className="text-sm text-blue-400 italic px-1">—</p>
          )}
        </div>
      )}
    </div>
  )
}

function TeamFlag({ team, dim = false }: { team: string | null; dim?: boolean }) {
  if (!team) return null
  return <FlagImage team={team} size={24} className={dim ? 'opacity-30' : ''} />
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
  if (points <= 0)
    return <span className={`rounded-full bg-red-500/20 text-red-400 ${size}`}>+0</span>
  if (points >= exactPts + signPts)
    return (
      <span className={`rounded-full bg-emerald-500/30 text-emerald-300 font-bold ${size}`}>
        +{points}
      </span>
    )
  return <span className={`rounded-full bg-blue-500/30 text-blue-300 font-bold ${size}`}>+{points}</span>
}

// Badge for live/finished match points — always small, with 0 shown as muted
function MatchPtsBadge({ pts, exactPts, signPts }: { pts: number; exactPts: number; signPts: number }) {
  if (pts >= exactPts + signPts)
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">+{pts}</span>
  if (pts >= signPts && pts > 0)
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-bold">+{pts}</span>
  if (pts > 0)
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">+{pts}</span>
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">+0</span>
}
