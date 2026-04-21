'use client'

import { useActionState } from 'react'
import { createClan } from '@/app/actions/clans'
import { Loader2 } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

export function CreateClanForm({ dict }: { dict: Dict['create_clan'] }) {
  const [state, action, pending] = useActionState(createClan, undefined)

  return (
    <>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-blue-200 mb-1">
            {dict.name_label}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={40}
            placeholder={dict.name_placeholder}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? dict.submit_pending : dict.submit}
        </button>
      </form>
    </>
  )
}
