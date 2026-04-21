'use client'

import { useActionState } from 'react'
import { Loader2, KeyRound, Check } from 'lucide-react'
import { updatePassword } from '@/app/actions/auth'
import type { Dict } from '@/lib/i18n/dictionaries'

export function PasswordForm({
  dict,
  commonDict,
}: {
  dict: Dict['profile']
  commonDict: Dict['common']
}) {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  const errorMessage = (() => {
    if (!state?.error) return null
    if (state.error === 'password_too_short') return dict.password_too_short
    if (state.error === 'password_mismatch') return dict.password_mismatch
    if (state.error === 'invalid_current_password') return dict.current_password + ' ❌'
    return state.error
  })()

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-emerald-400" />
        <h2 className="text-white font-semibold">{dict.section_password}</h2>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {errorMessage}
        </div>
      )}
      {state?.success === 'password_updated' && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.password_updated}
        </div>
      )}

      <form action={action} className="space-y-3">
        <div>
          <label className="block text-sm text-blue-200 mb-1" htmlFor="current_password">
            {dict.current_password}
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1" htmlFor="new_password">
            {dict.new_password}
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1" htmlFor="confirm_password">
            {dict.confirm_password}
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {pending ? commonDict.saving : dict.update_password}
        </button>
      </form>
    </section>
  )
}
