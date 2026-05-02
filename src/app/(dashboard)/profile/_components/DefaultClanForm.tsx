'use client'

import { Star } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

export function DefaultClanForm({
  dict,
  clans,
  current,
}: {
  dict: Dict['profile']
  commonDict: Dict['common']
  clans: { id: string; name: string }[]
  current: string | null
}) {
  const currentClan = clans.find((c) => c.id === current)

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" />
        <h2 className="text-white font-semibold">{dict.section_default_pool}</h2>
      </div>
      <p className="text-blue-300 text-sm">{dict.default_pool_hint}</p>

      {clans.length === 0 ? (
        <p className="text-blue-400 text-sm italic">{dict.no_pools_hint}</p>
      ) : currentClan ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
          <Star className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-white font-semibold truncate">{currentClan.name}</span>
        </div>
      ) : (
        <p className="text-blue-400 text-sm italic">{dict.no_default_hint}</p>
      )}
    </section>
  )
}
