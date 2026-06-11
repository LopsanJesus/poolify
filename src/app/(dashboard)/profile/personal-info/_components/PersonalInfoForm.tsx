'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { savePersonalInfo, type PersonalInfo } from '@/app/actions/personal-info'
import { SuccessToast } from '@/app/_components/SuccessToast'
import type { Dict } from '@/lib/i18n/dictionaries'

export function PersonalInfoForm({ info, dict }: { info: PersonalInfo | null; dict: Dict['profile'] }) {
  const [state, action, pending] = useActionState(savePersonalInfo, undefined)
  const [showToast, setShowToast] = useState(false)

  const locked = info?.personal_info_locked ?? false

  useEffect(() => {
    if (state?.success) setShowToast(true)
  }, [state?.success])

  const field = (label: string, name: string, defaultValue: string | null, type = 'text') => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-blue-300">{label}</label>
      {locked ? (
        <p className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm">
          {defaultValue ?? <span className="text-blue-400/50 italic">—</span>}
        </p>
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue ?? ''}
          step={type === 'number' ? '0.01' : undefined}
          min={type === 'number' ? '0' : undefined}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-400/40 focus:outline-none focus:border-emerald-500/60 focus:bg-white/10 transition text-sm"
        />
      )}
    </div>
  )

  return (
    <>
      {locked && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <Lock className="w-4 h-4 shrink-0" />
          {dict.personal_info_locked}
        </div>
      )}

      <form action={action} className="space-y-4">
        {field(dict.bet_amount_label, 'bet_amount', info?.bet_amount != null ? String(info.bet_amount) : null, 'number')}
        {field(dict.religion_label, 'religion', info?.religion ?? null)}
        {field(dict.sexual_orientation_label, 'sexual_orientation', info?.sexual_orientation ?? null)}
        {field(dict.race_label, 'race', info?.race ?? null)}
        {field(dict.fav_cabo_verde_player_label, 'fav_cabo_verde_player', info?.fav_cabo_verde_player ?? null)}

        {state?.error && (
          <p className="text-red-300 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            {state.error}
          </p>
        )}

        {!locked && (
          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60 text-sm"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? dict.saving_personal_info : dict.save_personal_info}
          </button>
        )}
      </form>

      <SuccessToast
        show={showToast}
        message={dict.personal_info_saved}
        onDone={() => setShowToast(false)}
      />
    </>
  )
}
