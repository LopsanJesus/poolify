import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, LogOut, UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserClans } from '@/app/actions/clans'
import { logout } from '@/app/actions/auth'
import { getDict } from '@/lib/i18n/server'
import { PasswordForm } from './_components/PasswordForm'
import { DefaultClanForm } from './_components/DefaultClanForm'
import { LanguageForm } from './_components/LanguageForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, clans] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, default_clan_id, language')
      .eq('id', user.id)
      .single(),
    getUserClans(),
  ])

  const { dict, locale } = await getDict()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.profile.title}</h1>
          <p className="text-blue-300 text-sm">{dict.profile.subtitle}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <UserCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-blue-400">{dict.profile.username_label}</p>
          <p className="text-white font-semibold truncate">@{profile?.username ?? user.email}</p>
          <p className="text-blue-300 text-sm truncate">{user.email}</p>
        </div>
      </section>

      <PasswordForm dict={dict.profile} commonDict={dict.common} />

      <DefaultClanForm
        dict={dict.profile}
        commonDict={dict.common}
        clans={clans}
        current={profile?.default_clan_id ?? null}
      />

      <LanguageForm dict={dict.profile} commonDict={dict.common} current={locale} />

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
