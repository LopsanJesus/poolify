'use client'

import { useState, useTransition } from 'react'
import { Loader2, Lock, RotateCcw, ShieldCheck, Pencil } from 'lucide-react'
import {
  adminUpdateMatchScore,
  adminFinishMatch,
  adminReopenMatch,
  ratifyMatch,
  adminSetHomeAdvances,
  adminUpdateMatchTeams,
} from '@/app/actions/admin'
import { LiveScoreButtons } from '@/app/_components/ScoreSelector'
import { FlagImage } from '@/app/_components/FlagImage'
import type { Match } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'
import { translateTeam } from '@/lib/team-flags'
import { isKnockoutRound } from '@/lib/rounds'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

export function RatifyMatchesView({
  matches,
  dict,
  clanDict,
  locale,
}: {
  matches: Match[]
  dict: Dict['admin']
  clanDict: Dict['clan']
  locale: Locale
}) {
  if (matches.length === 0) {
    return <p className="text-center text-blue-400/70 text-sm py-6">{dict.no_matches}</p>
  }

  const pending = matches.filter((m) => !m.ratified)
  const ratified = matches.filter((m) => m.ratified)

  return (
    <div className="space-y-3">
      {pending.length === 0 ? (
        <p className="text-center text-blue-400/70 text-sm py-6">{dict.no_matches}</p>
      ) : (
        pending.map((match) => (
          <MatchRow key={match.id} match={match} dict={dict} clanDict={clanDict} locale={locale} />
        ))
      )}

      {ratified.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-semibold text-blue-400/50 uppercase tracking-wide whitespace-nowrap">
              {dict.ratified_section_title}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          {ratified.map((match) => (
            <MatchRow key={match.id} match={match} dict={dict} clanDict={clanDict} locale={locale} />
          ))}
        </>
      )}
    </div>
  )
}

function MatchRow({
  match,
  dict,
  clanDict,
  locale,
}: {
  match: Match
  dict: Dict['admin']
  clanDict: Dict['clan']
  locale: Locale
}) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingTeams, setEditingTeams] = useState(false)
  const [homeTeamInput, setHomeTeamInput] = useState(match.home_team ?? '')
  const [awayTeamInput, setAwayTeamInput] = useState(match.away_team ?? '')

  const dirty = homeScore !== (match.home_score ?? 0) || awayScore !== (match.away_score ?? 0)
  const locked = match.ratified
  const knockout = isKnockoutRound(match.stage)
  const isDraw = match.home_score !== null && match.away_score !== null && match.home_score === match.away_score
  const needsAdvance = knockout && isDraw && match.home_advances == null && match.status === 'finished'

  function handleSaveScore() {
    setError(null)
    startTransition(async () => {
      const res = await adminUpdateMatchScore(match.id, homeScore, awayScore)
      if (res.error) setError(res.error)
    })
  }

  function handleFinish() {
    setError(null)
    startTransition(async () => {
      const res = await adminFinishMatch(match.id)
      if (res.error) setError(res.error)
    })
  }

  function handleRatify() {
    if (!window.confirm(dict.ratify_confirm)) return
    setError(null)
    startTransition(async () => {
      const res = await ratifyMatch(match.id)
      if (res.error) setError(res.error)
    })
  }

  function handleReopen() {
    if (!window.confirm(dict.reopen_confirm)) return
    setError(null)
    startTransition(async () => {
      const res = await adminReopenMatch(match.id)
      if (res.error) setError(res.error)
    })
  }

  function handleSetAdvances(homeAdvances: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await adminSetHomeAdvances(match.id, homeAdvances)
      if (res.error) setError(res.error)
    })
  }

  function handleSaveTeams() {
    setError(null)
    startTransition(async () => {
      const res = await adminUpdateMatchTeams(match.id, homeTeamInput.trim(), awayTeamInput.trim())
      if (res.error) setError(res.error)
      else setEditingTeams(false)
    })
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-400">{stageLabel(match.stage, locale)}</span>
        <div className="flex items-center gap-2">
          {locked && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
              <Lock className="w-3 h-3" />
              {dict.status_ratified}
            </span>
          )}
          {match.status === 'live' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 animate-pulse">
              {clanDict.status_live}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-blue-300">
              {clanDict.status_finished}
            </span>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-blue-300/60">
        {new Date(match.match_date).toLocaleDateString(DATE_LOCALE[locale], {
          weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </p>

      {/* Team name editor */}
      {!locked && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditingTeams((v) => !v)}
            className="flex items-center gap-1 text-xs text-blue-400/60 hover:text-blue-300 transition"
          >
            <Pencil className="w-3 h-3" />
            {dict.edit_teams_label}
          </button>
        </div>
      )}

      {editingTeams && !locked && (
        <div className="flex gap-2 items-center">
          <input
            value={homeTeamInput}
            onChange={(e) => setHomeTeamInput(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-blue-400/40 font-bold">–</span>
          <input
            value={awayTeamInput}
            onChange={(e) => setAwayTeamInput(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSaveTeams}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-semibold transition disabled:opacity-60"
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : dict.save_teams}
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {match.home_team && <FlagImage team={match.home_team} size={20} className="shrink-0" />}
            <span className="text-white text-sm font-semibold truncate">
              {match.home_team ? translateTeam(match.home_team, locale) : '?'}
            </span>
          </div>
          <LiveScoreButtons value={homeScore} onChange={setHomeScore} disabled={pending || locked} />
        </div>

        <span className="text-blue-300/40 font-bold text-lg">–</span>

        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {match.away_team && <FlagImage team={match.away_team} size={20} className="shrink-0" />}
            <span className="text-white text-sm font-semibold truncate">
              {match.away_team ? translateTeam(match.away_team, locale) : '?'}
            </span>
          </div>
          <LiveScoreButtons value={awayScore} onChange={setAwayScore} disabled={pending || locked} />
        </div>
      </div>

      {/* Knockout draw: pick who advances */}
      {knockout && isDraw && !locked && (
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <p className="text-xs text-amber-400/80 text-center">{dict.home_advances_label}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSetAdvances(true)}
              disabled={pending}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition disabled:opacity-60 ${
                match.home_advances === true
                  ? 'bg-amber-500/30 border-amber-400/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
              }`}
            >
              {match.home_team ? translateTeam(match.home_team, locale) : dict.home_advances_home}
              {match.home_advances === true && ' ✓'}
            </button>
            <button
              type="button"
              onClick={() => handleSetAdvances(false)}
              disabled={pending}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition disabled:opacity-60 ${
                match.home_advances === false
                  ? 'bg-amber-500/30 border-amber-400/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
              }`}
            >
              {match.away_team ? translateTeam(match.away_team, locale) : dict.home_advances_away}
              {match.home_advances === false && ' ✓'}
            </button>
          </div>
          {needsAdvance && (
            <p className="text-xs text-amber-400/70 text-center">⚠ Pendiente de confirmar quien pasa</p>
          )}
        </div>
      )}

      {locked ? (
        <p className="text-center text-xs text-emerald-400/80">{dict.ratified_hint}</p>
      ) : (
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={handleSaveScore}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-semibold transition disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {dict.save_score}
            </button>
          )}
          {match.status === 'live' && (
            <button
              type="button"
              onClick={handleFinish}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-semibold transition disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {dict.finish_match}
            </button>
          )}
          {match.status === 'finished' && (
            <>
              <button
                type="button"
                onClick={handleReopen}
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-semibold transition disabled:opacity-60"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                <RotateCcw className="w-4 h-4" />
                {dict.reopen_cta}
              </button>
              <button
                type="button"
                onClick={handleRatify}
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                <ShieldCheck className="w-4 h-4" />
                {dict.ratify_cta}
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-300 text-center">{error}</p>}
    </div>
  )
}
