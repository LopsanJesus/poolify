'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { joinClan } from '@/app/actions/clans'
import { ArrowLeft, Loader2, LogIn } from 'lucide-react'

export default function JoinClanPage() {
  const [state, action, pending] = useActionState(joinClan, undefined)

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Unirse a un Clan</h1>
          <p className="text-blue-300 text-sm">Usa el código de invitación</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-blue-200 mb-1">
              Código de invitación
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength={12}
              placeholder="A1B2C3D4"
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 uppercase tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="mt-1.5 text-xs text-blue-400">El código es de 8 caracteres (sin distinción de mayúsculas)</p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-60"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Uniéndose...' : 'Unirse al Clan'}
          </button>
        </form>
      </div>
    </div>
  )
}
