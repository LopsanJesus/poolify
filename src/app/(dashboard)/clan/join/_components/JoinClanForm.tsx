'use client'

import { useActionState } from 'react'
import { joinClan } from '@/app/actions/clans'
import { Loader2 } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

export function JoinClanForm({ dict }: { dict: Dict['join_clan'] }) {
  const [state, action, pending] = useActionState(joinClan, undefined)

  return (
    <>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-blue-200 mb-1">
            {dict.code_label}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={12}
            placeholder={dict.code_placeholder}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 uppercase tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <p className="mt-1.5 text-xs text-blue-400">{dict.code_hint}</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? dict.submit_pending : dict.submit}
        </button>
      </form>
    </>
  )
}
