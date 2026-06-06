'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { saveTournamentPrediction } from '@/app/actions/tournament'
import type { FinalPredictionsConfig, TournamentPrediction, Team } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'
import { TeamPickerModal, TeamPickerButton } from '@/app/_components/TeamPickerModal'
import { SuccessToast } from '@/app/_components/SuccessToast'

type TeamKey = 'winner' | 'runner_up' | 'semi1' | 'semi2'

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
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (state?.success) setShowToast(true)
  }, [state?.success])

  const [selections, setSelections] = useState<Record<TeamKey, string>>({
    winner:    (existing?.winner    as string) ?? '',
    runner_up: (existing?.runner_up as string) ?? '',
    semi1:     (existing?.semi1     as string) ?? '',
    semi2:     (existing?.semi2     as string) ?? '',
  })
  const [openPicker, setOpenPicker] = useState<TeamKey | null>(null)

  function set(key: TeamKey, val: string) {
    setSelections((s) => ({ ...s, [key]: val }))
  }

  function excluded(key: TeamKey) {
    return (Object.entries(selections) as [TeamKey, string][])
      .filter(([k, v]) => k !== key && v !== '')
      .map(([, v]) => v)
  }

  const teamFields: { key: TeamKey; label: string; pts: number }[] = [
    { key: 'winner',    label: dict.field_winner,    pts: config.winner_pts    },
    { key: 'runner_up', label: dict.field_runner_up, pts: config.runner_up_pts },
    { key: 'semi1',     label: dict.field_semi1,     pts: config.semi1_pts     },
    { key: 'semi2',     label: dict.field_semi2,     pts: config.semi2_pts     },
  ]

  return (
    <form action={action} className="space-y-4">
      {/* Hidden inputs carry the selections into the server action */}
      {teamFields.map(({ key }) =>
        selections[key] ? (
          <input key={key} type="hidden" name={key} value={selections[key]} />
        ) : null
      )}

      {state?.error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">{state.error}</div>
      )}

      <SuccessToast
        show={showToast}
        message={dict.saved}
        onDone={() => setShowToast(false)}
      />

      {/* Team pickers */}
      {teamFields.map(({ key, label, pts }) => (
        <div key={key} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">{label}</label>
            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
              {dict.pts_label.replace('{pts}', String(pts))}
            </span>
          </div>
          <TeamPickerButton
            value={selections[key]}
            placeholder={dict.placeholder_team}
            onClick={() => setOpenPicker(key)}
            accentClass="ring-purple-500"
          />
        </div>
      ))}

      {/* Top scorer — stays as text input */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white">{dict.field_top_scorer}</label>
          <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
            {dict.pts_label.replace('{pts}', String(config.top_scorer_pts))}
          </span>
        </div>
        <input
          type="text"
          name="top_scorer"
          defaultValue={(existing?.top_scorer as string) ?? ''}
          placeholder={dict.placeholder_player}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        />
      </div>

      {/* Custom fields */}
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

      {/* Team picker modals */}
      {teamFields.map(({ key, label }) => (
        <TeamPickerModal
          key={key}
          open={openPicker === key}
          onClose={() => setOpenPicker(null)}
          title={label}
          teams={teams}
          value={selections[key]}
          onChange={(name) => set(key, name)}
          excluded={excluded(key)}
        />
      ))}
    </form>
  )
}
