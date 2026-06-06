'use client'

import { useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Loader2 } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

function RegisteredBanner({ message }: { message: string }) {
  const params = useSearchParams()
  if (!params.get('registered')) return null
  return (
    <div className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm">
      {message}
    </div>
  )
}

function NextInput() {
  const params = useSearchParams()
  const next = params.get('next')
  if (!next) return null
  return <input type="hidden" name="next" value={next} />
}

export function LoginForm({ dict }: { dict: Dict['auth'] }) {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">{dict.login_title}</h2>

      <Suspense>
        <RegisteredBanner message={dict.registered_banner} />
      </Suspense>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <Suspense><NextInput /></Suspense>
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-blue-200">
              {dict.password}
            </label>
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition">
              {dict.forgot_password_link}
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder={dict.password_placeholder}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? dict.login_pending : dict.login_cta}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-blue-300">
        {dict.no_account}{' '}
        <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition">
          {dict.signup_link}
        </Link>
      </p>
    </div>
  )
}
