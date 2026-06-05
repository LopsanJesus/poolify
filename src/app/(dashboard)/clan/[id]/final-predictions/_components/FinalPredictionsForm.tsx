'use client'

import { useActionState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { saveTournamentPrediction } from '@/app/actions/tournament'
import type { FinalPredictionsConfig, TournamentPrediction, Team } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'

// Fields that expect a team name (show dropdown when teams available)
const TEAM_FIELDS: (keyof TournamentPrediction)[] = ['winner', 'runner_up', 'semi1', 'semi2']

export function FinalPredictionsForm({
  clanId,
  config,
  existing,
  teams,
  dict,
  commonDict,
}: {
  clanId: string
  config: FinalPredictionsConfig
  existing: TournamentPrediction | null
  teams: Team[]
  dict: Dict['final_predictions']
  commonDict: Dict['common']
}) {
  async function save(_: { error?: string; success?: boolean } | undefined, fd: FormData) {
    return saveTournamentPrediction(clanId, fd)
  }
  const [state, action, pending] = useActionState(save, undefined)

  const fields: [keyof TournamentPrediction, string, string, number][] = [
    ['winner',     dict.field_winner,     dict.placeholder_team,   config.winner_pts],
    ['runner_up',  dict.field_runner_up,  dict.placeholder_team,   config.runner_up_pts],
    ['semi1',      dict.field_semi1,      dict.placeholder_team,   config.semi1_pts],
    ['semi2',      dict.field_semi2,      dict.placeholder_team,   config.semi2_pts],
    ['top_scorer', dict.field_top_scorer, dict.placeholder_player, config.top_scorer_pts],
  ]

  const hasTeams = teams.length > 0

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.saved}
        </div>
      )}

      {fields.map(([name, label, placeholder, pts]) => {
        const isTeamField = TEAM_FIELDS.includes(name)
        const currentValue = (existing?.[name] as string) ?? ''

        return (
          <div key={name} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">{label}</label>
              <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                {dict.pts_label.replace('{pts}', String(pts))}
              </span>
            </div>

            {isTeamField && hasTeams ? (
              <select
                name={name}
                defaultValue={currentValue}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition appearance-none"
              >
                <option value="" className="bg-blue-950 text-blue-400">{placeholder}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name} className="bg-blue-950 text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name={name}
                defaultValue={currentValue}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            )}
          </div>
        )
      })}

      {/* Custom fields — always text input */}
      {config.custom_fields?.map((f) => (
        <div key={f.id} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">{f.label}</label>
            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
              {dict.pts_label.replace('{pts}', String(f.points))}
            </span>
          </div>
          <input
            type="text"
            name={`custom_${f.id}`}
            defaultValue={existing?.custom_answers?.[f.id] ?? ''}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold transition disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? commonDict.saving : dict.save_cta}
      </button>
    </form>
  )
}
