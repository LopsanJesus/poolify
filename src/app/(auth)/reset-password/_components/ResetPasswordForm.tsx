'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/app/actions/auth'
import { Loader2 } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

export function ResetPasswordForm({ dict }: { dict: Dict['auth'] }) {
  const [state, action, pending] = useActionState(resetPassword, undefined)

  if (state?.success) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl space-y-4">
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm">
          {dict.reset_password_success}
        </div>
        <Link
          href="/login"
          className="block text-center text-sm text-blue-300 hover:text-white transition"
        >
          {dict.back_to_login}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">{dict.reset_password_title}</h2>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1">
            {dict.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder={dict.password_placeholder}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <p className="text-xs text-blue-400/70 mt-1">{dict.password_hint}</p>
        </div>
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-blue-200 mb-1">
            {dict.password}
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            placeholder={dict.password_placeholder}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? dict.reset_password_pending : dict.reset_password_cta}
        </button>
      </form>
    </div>
  )
}
