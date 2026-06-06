import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, LogOut, UserCircle2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { getDict } from '@/lib/i18n/server'
import { LanguageForm } from './_components/LanguageForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { dict, locale }] = await Promise.all([
    supabase.from('profiles').select('username, language').eq('id', user.id).single(),
    getDict(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <UserCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate">
            {profile?.username ?? user.email}
          </p>
          <p className="text-blue-300 text-sm truncate">{user.email}</p>
        </div>
      </section>

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

      <LanguageForm key={locale} dict={dict.profile} commonDict={dict.common} current={locale} />

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
