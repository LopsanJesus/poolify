import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserClans } from '@/app/actions/clans'
import { getMatchesWithPredictions } from '@/app/actions/predictions'
import { Calendar, Target, ChevronRight, AlertCircle, Users } from 'lucide-react'
import { MatchCard } from '@/app/(dashboard)/clan/[id]/_components/MatchCard'
import { MatchesPoolSwitcher } from './_components/MatchesPoolSwitcher'
import { getDict, format } from '@/lib/i18n/server'

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ clan?: string }>
}) {
  const { clan: clanParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, clans] = await Promise.all([
    supabase.from('profiles').select('default_clan_id').eq('id', user.id).single(),
    getUserClans(),
  ])

  if (clans.length === 0) {
    redirect('/dashboard')
  }

  const clanId =
    (clanParam && clans.some((c) => c.id === clanParam) ? clanParam : null) ??
    profile?.default_clan_id ??
    clans[0].id

  const clan = clans.find((c) => c.id === clanId) ?? clans[0]

  const [matchesWithPreds, { dict, locale }] = await Promise.all([
    getMatchesWithPredictions(clan.id),
    getDict(),
  ])

  const pastMatches = matchesWithPreds.filter((m) => m.status !== 'upcoming')
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
          <MatchesPoolSwitcher
            currentId={clan.id}
            clans={clans}
            switchLabel={dict.clan.switch_pool}
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

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-300" />
          <h2 className="text-lg font-semibold text-white">{dict.clan.upcoming_matches}</h2>
        </div>
        {upcomingMatches.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
            {dict.clan.no_upcoming}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((m) => (
              <MatchCard
                key={m.id}
                clanId={clan.id}
                match={m}
                currentUserId={user.id}
                clanDict={dict.clan}
                commonDict={dict.common}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-300" />
          <h2 className="text-lg font-semibold text-white">{dict.clan.past_matches}</h2>
        </div>
        {pastMatches.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
            {dict.clan.no_past}
          </div>
        ) : (
          <div className="space-y-3">
            {pastMatches.map((m) => (
              <MatchCard
                key={m.id}
                clanId={clan.id}
                match={m}
                currentUserId={user.id}
                clanDict={dict.clan}
                commonDict={dict.common}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
