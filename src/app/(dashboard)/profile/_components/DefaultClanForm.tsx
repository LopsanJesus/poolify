'use client'

import { useActionState } from 'react'
import { Loader2, Star, Check } from 'lucide-react'
import { updateDefaultClan } from '@/app/actions/auth'
import type { Dict } from '@/lib/i18n/dictionaries'

export function DefaultClanForm({
  dict,
  commonDict,
  clans,
  current,
}: {
  dict: Dict['profile']
  commonDict: Dict['common']
  clans: { id: string; name: string }[]
  current: string | null
}) {
  const [state, action, pending] = useActionState(updateDefaultClan, undefined)

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" />
        <h2 className="text-white font-semibold">{dict.section_default_pool}</h2>
      </div>
      <p className="text-blue-300 text-sm">{dict.default_pool_hint}</p>

      {state?.success === 'default_saved' && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.default_saved}
        </div>
      )}

      {clans.length === 0 ? (
        <p className="text-blue-400 text-sm italic">{dict.no_pools_hint}</p>
      ) : (
        <form action={action} className="space-y-3">
          <select
            name="default_clan_id"
            defaultValue={current ?? ''}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="">{dict.none_option}</option>
            {clans.map((c) => (
              <option key={c.id} value={c.id} className="text-black">
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pending ? commonDict.saving : dict.save_default}
          </button>
        </form>
      )}
    </section>
  )
}
