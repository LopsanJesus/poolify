import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserClans } from '@/app/actions/clans'
import { Users, Plus, LogIn, ChevronRight, Shield, Star } from 'lucide-react'
import { getDict } from '@/lib/i18n/server'
import { getActiveClanId } from '@/lib/active-clan'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>
}) {
  const { all } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, clans, activeClanId] = await Promise.all([
    supabase
      .from('profiles')
      .select('default_clan_id')
      .eq('id', user.id)
      .single(),
    getUserClans(),
    getActiveClanId(),
  ])

  if (!all) {
    const targetId =
      (activeClanId && clans.some((c) => c.id === activeClanId) ? activeClanId : null) ??
      (profile?.default_clan_id && clans.some((c) => c.id === profile.default_clan_id)
        ? profile.default_clan_id
        : null)
    if (targetId) redirect(`/clan/${targetId}`)
  }

  const { dict } = await getDict()
  const defaultClanId = profile?.default_clan_id ?? null

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/clan/create"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-emerald-500/50 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-500/30 transition">
            <Plus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{dict.dashboard.create_pool}</p>
            <p className="text-blue-300 text-sm">{dict.dashboard.create_pool_desc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/clan/join"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-blue-500/50 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center group-hover:bg-blue-500/30 transition">
            <LogIn className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{dict.dashboard.join_pool}</p>
            <p className="text-blue-300 text-sm">{dict.dashboard.join_pool_desc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {clans.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{dict.dashboard.your_groups}</h2>
          {clans.map((clan) => (
            <Link
              key={clan.id}
              href={`/clan/${clan.id}`}
              className="group flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">{clan.name}</p>
                  {clan.id === defaultClanId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] font-semibold uppercase">
                      <Star className="w-3 h-3" />
                      {dict.dashboard.default_badge}
                    </span>
                  )}
                </div>
                <p className="text-blue-400 text-xs font-mono">{clan.invite_code}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/20">
          <Users className="w-12 h-12 text-blue-500/50 mx-auto mb-3" />
          <p className="text-blue-300 font-medium">{dict.dashboard.empty_title}</p>
          <p className="text-blue-400/70 text-sm mt-1">{dict.dashboard.empty_desc}</p>
        </div>
      )}
    </div>
  )
}
