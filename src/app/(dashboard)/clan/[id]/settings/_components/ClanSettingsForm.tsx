'use client'

import { useActionState } from 'react'
import { Loader2, Check, Trophy, Users } from 'lucide-react'
import { updateClanSettings } from '@/app/actions/clans'
import type { ClanSettings } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'

export function ClanSettingsForm({
  clanId,
  settings,
  dict,
  commonDict,
}: {
  clanId: string
  settings: ClanSettings
  dict: Dict['clan_settings']
  commonDict: Dict['common']
}) {
  const [state, action, pending] = useActionState(updateClanSettings, undefined)

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="clan_id" value={clanId} />

      {state?.error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.saved}
        </div>
      )}

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-white font-semibold">{dict.section_scoring}</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-blue-300 mb-1.5">
              {dict.points_exact_label}
            </label>
            <input
              type="number"
              name="points_exact"
              min={0}
              max={100}
              defaultValue={settings.points_exact}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-blue-300 mb-1.5">
              {dict.points_sign_label}
            </label>
            <input
              type="number"
              name="points_sign"
              min={0}
              max={100}
              defaultValue={settings.points_sign}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-300" />
          <h2 className="text-white font-semibold">{dict.section_access}</h2>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="can_members_invite"
            defaultChecked={settings.can_members_invite}
            className="mt-0.5 w-4 h-4 accent-emerald-500"
          />
          <div>
            <p className="text-white text-sm font-medium">{dict.can_members_invite_label}</p>
            <p className="text-blue-400 text-xs mt-0.5">{dict.can_members_invite_hint}</p>
          </div>
        </label>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {pending ? commonDict.saving : dict.save}
      </button>
    </form>
  )
}
