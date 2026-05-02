'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Plus, LogIn, ListOrdered } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'
import { setActiveClan } from '@/app/actions/active-clan'

export function PoolSwitcher({
  currentId,
  clans,
  clanDict,
  navDict,
  dashboardDict,
}: {
  currentId: string
  clans: { id: string; name: string }[]
  clanDict: Dict['clan']
  navDict: Dict['nav']
  dashboardDict: Dict['dashboard']
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-blue-200 hover:text-white transition text-sm"
      >
        <ListOrdered className="w-4 h-4" />
        <span className="hidden sm:inline">{clanDict.switch_pool}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/15 bg-blue-900/95 backdrop-blur-md shadow-2xl overflow-hidden z-30">
          <ul className="max-h-72 overflow-y-auto">
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
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition ${
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
          <div className="border-t border-white/10">
            <Link
              href="/dashboard?all=1"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition"
            >
              <ListOrdered className="w-4 h-4" /> {navDict.my_pools}
            </Link>
            <Link
              href="/clan/create"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition"
            >
              <Plus className="w-4 h-4" /> {dashboardDict.create_pool}
            </Link>
            <Link
              href="/clan/join"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition"
            >
              <LogIn className="w-4 h-4" /> {dashboardDict.join_pool}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
