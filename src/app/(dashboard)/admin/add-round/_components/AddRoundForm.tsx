'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createRoundWithMatches } from '@/app/actions/admin'
import type { Team } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'

const KNOCKOUT_STAGE_ORDER = [
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'final',
] as const

type Stage = (typeof KNOCKOUT_STAGE_ORDER)[number]

type MatchEntry = {
  id: number
  home_team: string
  away_team: string
  date: string
  time: string
}

let nextId = 1

function emptyMatch(): MatchEntry {
  return { id: nextId++, home_team: '', away_team: '', date: '', time: '' }
}

// Convert Madrid date+time (CEST = UTC+2) to UTC ISO string
function madridToUtc(date: string, time: string): string {
  if (!date || !time) return ''
  const localIso = `${date}T${time}:00`
  const dt = new Date(localIso)
  // CEST is UTC+2
  dt.setHours(dt.getHours() - 2)
  return dt.toISOString()
}

type Props = {
  teams: Team[]
  dict: Dict['admin']
}

export function AddRoundForm({ teams, dict }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [stage, setStage] = useState<Stage>('round_of_32')
  const [pointsSign, setPointsSign] = useState(1)
  const [pointsExact, setPointsExact] = useState(4)
  const [pointsAdvance, setPointsAdvance] = useState(2)
  const [matches, setMatches] = useState<MatchEntry[]>([emptyMatch()])
  const [error, setError] = useState<string | null>(null)

  const stageLabel: Record<Stage, string> = {
    round_of_32: dict.round_of_32,
    round_of_16: dict.round_of_16,
    quarter_final: dict.quarter_final,
    semi_final: dict.semi_final,
    final: dict.final,
  }

  function addMatch() {
    setMatches((prev) => [...prev, emptyMatch()])
  }

  function removeMatch(id: number) {
    setMatches((prev) => prev.filter((m) => m.id !== id))
  }

  function updateMatch(id: number, field: keyof Omit<MatchEntry, 'id'>, value: string) {
    setMatches((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const newMatches = matches.map((m) => ({
      home_team: m.home_team,
      away_team: m.away_team,
      match_date: madridToUtc(m.date, m.time),
    }))

    const invalid = newMatches.some((m) => !m.match_date)
    if (invalid) {
      setError('Todos los partidos deben tener fecha y hora.')
      return
    }

    startTransition(async () => {
      const result = await createRoundWithMatches(
        stage,
        pointsSign,
        pointsExact,
        pointsAdvance,
        newMatches,
      )
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Round selector */}
      <div className="space-y-2">
        <label className="text-sm text-blue-300">{dict.add_round_select}</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
        >
          {KNOCKOUT_STAGE_ORDER.map((s) => (
            <option key={s} value={s} className="bg-slate-800">{stageLabel[s]}</option>
          ))}
        </select>
      </div>

      {/* Points config */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
        <p className="text-white font-semibold text-sm">Puntos</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-blue-300">{dict.add_round_points_sign}</label>
            <input
              type="number"
              min={0}
              value={pointsSign}
              onChange={(e) => setPointsSign(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-blue-300">{dict.add_round_points_exact}</label>
            <input
              type="number"
              min={0}
              value={pointsExact}
              onChange={(e) => setPointsExact(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-blue-300">{dict.add_round_points_advance}</label>
            <input
              type="number"
              min={0}
              value={pointsAdvance}
              onChange={(e) => setPointsAdvance(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <p className="text-xs text-blue-400">
          Resultado exacto + signo + quién pasa = {pointsExact} + {pointsSign} + {pointsAdvance} ={' '}
          <span className="text-white font-semibold">{pointsExact + pointsSign + pointsAdvance} pts máx</span>
        </p>
      </div>

      {/* Match builder */}
      <div className="space-y-3">
        <p className="text-white font-semibold text-sm">{dict.add_round_matches_title}</p>
        {matches.map((m, i) => (
          <div key={m.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-blue-300 text-xs">Partido {i + 1}</p>
              {matches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMatch(m.id)}
                  className="text-red-400 hover:text-red-300 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-blue-300">{dict.add_round_home_team}</label>
                {teams.length > 0 ? (
                  <select
                    value={m.home_team}
                    onChange={(e) => updateMatch(m.id, 'home_team', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="" className="bg-slate-800">—</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name} className="bg-slate-800">{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={m.home_team}
                    onChange={(e) => updateMatch(m.id, 'home_team', e.target.value)}
                    placeholder="1A"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-blue-300">{dict.add_round_away_team}</label>
                {teams.length > 0 ? (
                  <select
                    value={m.away_team}
                    onChange={(e) => updateMatch(m.id, 'away_team', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="" className="bg-slate-800">—</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name} className="bg-slate-800">{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={m.away_team}
                    onChange={(e) => updateMatch(m.id, 'away_team', e.target.value)}
                    placeholder="2B"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-blue-300">{dict.add_round_date}</label>
                <input
                  type="date"
                  value={m.date}
                  onChange={(e) => updateMatch(m.id, 'date', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-blue-300">{dict.add_round_time}</label>
                <input
                  type="time"
                  value={m.time}
                  onChange={(e) => updateMatch(m.id, 'time', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addMatch}
          className="flex items-center gap-2 text-sm text-blue-300 hover:text-white transition"
        >
          <Plus className="w-4 h-4" />
          {dict.add_round_add_match}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 rounded-2xl transition"
      >
        {isPending ? '…' : dict.add_round_submit}
      </button>
    </form>
  )
}
