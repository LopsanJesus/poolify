'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Plus, LogIn, ListOrdered, X } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'
import { setActiveClan } from '@/app/actions/active-clan'

export function PoolSwitcherModal({
  currentId,
  currentName,
  clans,
  clanDict,
  navDict,
  dashboardDict,
}: {
  currentId: string
  currentName: string
  clans: { id: string; name: string }[]
  clanDict: Dict['clan']
  navDict: Dict['nav']
  dashboardDict: Dict['dashboard']
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <>
      {/* Trigger: clan name + chevron */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 min-w-0 group"
      >
        <span className="text-white font-bold text-lg truncate max-w-[180px] group-hover:text-blue-200 transition">
          {currentName}
        </span>
        <ChevronDown className="w-4 h-4 text-blue-400 group-hover:text-white transition shrink-0" />
      </button>

      {/* Modal backdrop + sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-blue-950 border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
              <span className="text-white font-semibold text-base">{navDict.my_pools}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-blue-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clan list */}
            <ul className="overflow-y-auto flex-1 py-2">
              {clans.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      if (c.id !== currentId) {
                        startTransition(async () => {
                          await setActiveClan(c.id)
                          router.push(`/clan/${c.id}`)
                        })
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-5 py-3 text-left text-sm transition ${
                      c.id === currentId
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-blue-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {c.id === currentId && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>

            {/* Footer actions */}
            <div className="border-t border-white/10 shrink-0">
              <Link
                href="/dashboard?all=1"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition"
              >
                <ListOrdered className="w-4 h-4" /> {navDict.my_pools}
              </Link>
              <Link
                href="/clan/create"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition"
              >
                <Plus className="w-4 h-4" /> {dashboardDict.create_pool}
              </Link>
              <Link
                href="/clan/join"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition pb-safe"
              >
                <LogIn className="w-4 h-4" /> {dashboardDict.join_pool}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
