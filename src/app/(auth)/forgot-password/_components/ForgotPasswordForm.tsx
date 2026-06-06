'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/app/actions/auth'
import { Loader2, ArrowLeft } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

export function ForgotPasswordForm({ dict }: { dict: Dict['auth'] }) {
  const [state, action, pending] = useActionState(forgotPassword, undefined)

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-2">{dict.forgot_password_title}</h2>
      <p className="text-blue-300 text-sm mb-6">{dict.forgot_password_desc}</p>

      {state?.success ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm">
            {dict.forgot_password_sent}
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-blue-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {dict.back_to_login}
          </Link>
        </div>
      ) : (
        <>
          {state?.error && (
            <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1">
                {dict.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder={dict.email_placeholder}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? dict.forgot_password_pending : dict.forgot_password_cta}
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="flex items-center justify-center gap-1.5 text-blue-300 hover:text-white transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              {dict.back_to_login}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
