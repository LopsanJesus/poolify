'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, KeyRound, Languages, LogOut, Shield, User, UserCircle2 } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { LanguageModal } from './LanguageModal'
import { LOCALE_LABELS, type Dict, type Locale } from '@/lib/i18n/dictionaries'

export function ProfileClient({
  username,
  email,
  locale,
  dict,
  personalInfoComplete,
  isAdmin,
}: {
  username: string | null
  email: string
  locale: Locale
  dict: Dict
  personalInfoComplete: boolean
  isAdmin: boolean
}) {
  const [langOpen, setLangOpen] = useState(false)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Avatar + info */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <UserCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate">{username ?? email}</p>
          <p className="text-blue-300 text-sm truncate">{email}</p>
        </div>
      </section>

      {/* Personal info */}
      <Link
        href="/profile/personal-info"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">{dict.profile.section_personal_info}</span>
        </div>
        <div className="flex items-center gap-2">
          {!personalInfoComplete && (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition" />
        </div>
      </Link>

      {/* Password */}
      <Link
        href="/profile/change-password"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-semibold">{dict.profile.section_password}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition" />
      </Link>

      {/* Language */}
      <button
        type="button"
        onClick={() => setLangOpen(true)}
        className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-blue-300" />
          <span className="text-white font-semibold">{dict.profile.section_language}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-400">{LOCALE_LABELS[locale]}</span>
          <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition" />
        </div>
      </button>

      <LanguageModal
        open={langOpen}
        onClose={() => setLangOpen(false)}
        current={locale}
        dict={dict.profile}
      />

      {/* Admin panel */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-white font-semibold">{dict.profile.section_admin}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition" />
        </Link>
      )}

      {/* Logout */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
        <h2 className="text-white font-semibold">{dict.profile.section_session}</h2>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:text-white transition text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            {dict.profile.logout}
          </button>
        </form>
      </section>
    </div>
  )
}
