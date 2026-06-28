'use client'

import { useTransition, useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { seedRoundOf32 } from '@/app/actions/admin'
import type { Dict } from '@/lib/i18n/dictionaries'

export function SeedRoundOf32Button({ dict }: { dict: Dict['admin'] }) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function handleSeed() {
    if (!window.confirm(dict.seed_round_of_32_confirm)) return
    setMsg(null)
    startTransition(async () => {
      const res = await seedRoundOf32()
      if (res.error) setMsg(`Error: ${res.error}`)
      else setMsg(dict.seed_round_of_32_done.replace('{n}', String(res.inserted ?? 0)))
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSeed}
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm font-semibold transition disabled:opacity-60"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {dict.seed_round_of_32}
      </button>
      {msg && (
        <p className={`text-xs ${msg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
