'use client'

import { useActionState } from 'react'
import { savePredictions } from '@/app/actions/predictions'
import type { Match, Prediction } from '@/lib/types'
import { Loader2, Check } from 'lucide-react'

type MatchWithPrediction = Match & { prediction: Prediction | null }

const FLAG: Record<string, string> = {
  'México': '🇲🇽', 'Estados Unidos': '🇺🇸', 'España': '🇪🇸',
  'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
}

export function PredictionsForm({
  clanId,
  matchesWithPreds,
}: {
  clanId: string
  matchesWithPreds: MatchWithPrediction[]
}) {
  const [state, action, pending] = useActionState(savePredictions, undefined)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="clan_id" value={clanId} />

      {matchesWithPreds.map((match) => {
        const locked = match.status !== 'upcoming'
        return (
          <div
            key={match.id}
            className={`rounded-2xl border p-5 space-y-4 transition ${
              locked
                ? 'bg-white/5 border-white/10 opacity-80'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <input type="hidden" name="match_id" value={match.id} />

            {/* Match header */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400 font-medium">{match.stage}</span>
              <StatusPill status={match.status} />
            </div>

            {/* Teams & Score Inputs */}
            <div className="flex items-center gap-3">
              {/* Home */}
              <div className="flex-1 text-right space-y-1">
                <p className="text-white font-semibold text-sm">
                  {FLAG[match.home_team] ?? '🏳️'} {match.home_team}
                </p>
                <input
                  type="number"
                  name={`home_${match.id}`}
                  defaultValue={match.prediction?.home_score ?? ''}
                  min={0}
                  max={20}
                  disabled={locked}
                  placeholder="0"
                  required
                  className="w-full text-center text-xl font-bold px-3 py-2 rounded-lg bg-blue-950/60 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-blue-300 text-lg font-bold">–</span>
                {match.status === 'finished' && (
                  <span className="text-xs text-blue-400 font-mono">
                    {match.home_score}–{match.away_score}
                  </span>
                )}
              </div>

              {/* Away */}
              <div className="flex-1 space-y-1">
                <p className="text-white font-semibold text-sm">
                  {FLAG[match.away_team] ?? '🏳️'} {match.away_team}
                </p>
                <input
                  type="number"
                  name={`away_${match.id}`}
                  defaultValue={match.prediction?.away_score ?? ''}
                  min={0}
                  max={20}
                  disabled={locked}
                  placeholder="0"
                  required
                  className="w-full text-center text-xl font-bold px-3 py-2 rounded-lg bg-blue-950/60 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Match date */}
            <p className="text-center text-xs text-blue-400">
              {new Date(match.match_date).toLocaleDateString('es-MX', {
                weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>

            {/* Points badge if finished */}
            {match.prediction && match.status === 'finished' && (
              <div className="text-center">
                <PointsBadge points={match.prediction.points} />
              </div>
            )}
          </div>
        )
      })}

      {/* Feedback */}
      {state?.error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> ¡Pronósticos guardados correctamente!
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? 'Guardando...' : 'Guardar Pronósticos'}
      </button>
    </form>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'live')
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 animate-pulse">EN VIVO</span>
  if (status === 'finished')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-blue-300">Finalizado · Solo lectura</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">Abierto</span>
}

function PointsBadge({ points }: { points: number }) {
  if (points === 4)
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">⭐ Resultado exacto · 4 pts</span>
  if (points === 1)
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/30 text-blue-300 text-sm font-bold">✅ Ganador correcto · 1 pt</span>
  return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">❌ Sin acierto · 0 pts</span>
}
