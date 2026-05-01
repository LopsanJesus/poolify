import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserClans } from '@/app/actions/clans'
import { getMatchesWithPredictions } from '@/app/actions/predictions'
import { Calendar, Target, ChevronRight, AlertCircle } from 'lucide-react'
import { GroupSwitcher } from '@/app/(dashboard)/_components/GroupSwitcher'
import { DateCarousel } from '@/app/(dashboard)/matches/_components/DateCarousel'
import { getDict, format } from '@/lib/i18n/server'
import { getActiveClanId } from '@/lib/active-clan'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, clans, activeClanId] = await Promise.all([
    supabase.from('profiles').select('default_clan_id').eq('id', user.id).single(),
    getUserClans(),
    getActiveClanId(),
  ])

  if (clans.length === 0) {
    redirect('/dashboard')
  }

  const clanId =
    (activeClanId && clans.some((c) => c.id === activeClanId) ? activeClanId : null) ??
    profile?.default_clan_id ??
    clans[0].id

  const clan = clans.find((c) => c.id === clanId) ?? clans[0]

  const [matchesWithPreds, { dict, locale }] = await Promise.all([
    getMatchesWithPredictions(clan.id),
    getDict(),
  ])

  const upcomingMatches = matchesWithPreds.filter((m) => m.status === 'upcoming')
  const missingUpcoming = upcomingMatches.filter((m) => !m.prediction).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-300" />
          <h1 className="text-xl font-bold text-white">{dict.clan.matches}</h1>
          <span className="text-blue-400 text-sm font-medium truncate max-w-[140px]">· {clan.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <GroupSwitcher
            currentId={clan.id}
            clans={clans}
            label={dict.clan.switch_pool}
          />
          <Link
            href={`/clan/${clan.id}/predictions`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.clan.my_predictions}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {missingUpcoming > 0 && (
        <Link
          href={`/clan/${clan.id}/predictions`}
          className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/40 hover:bg-yellow-500/15 transition"
        >
          <AlertCircle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-yellow-200 font-semibold text-sm">
              {format(dict.clan.missing_banner_title, { n: missingUpcoming })}
            </p>
            <p className="text-yellow-200/80 text-xs mt-0.5">{dict.clan.missing_banner_desc}</p>
          </div>
          <span className="flex items-center gap-1 text-yellow-200 text-sm font-medium shrink-0">
            {dict.clan.missing_banner_cta}
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      )}

      <DateCarousel
        matches={matchesWithPreds}
        clanId={clan.id}
        currentUserId={user.id}
        clanDict={dict.clan}
        commonDict={dict.common}
        locale={locale}
      />
    </div>
  )
}
