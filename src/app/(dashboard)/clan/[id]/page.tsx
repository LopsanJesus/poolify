import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClanData, getClanRanking, getUserClans } from '@/app/actions/clans'
import { getMatchesWithPredictions } from '@/app/actions/predictions'
import {
  ArrowLeft, Trophy, Users, Star,
  Target, Calendar, ChevronRight, Medal, AlertCircle, BarChart3,
} from 'lucide-react'
import { CopyButton } from './_components/CopyButton'
import { PoolSwitcher } from './_components/PoolSwitcher'
import { MatchCard } from './_components/MatchCard'
import { ClanCookieSync } from './_components/ClanCookieSync'
import { format, getDict } from '@/lib/i18n/server'
import type { Dict } from '@/lib/i18n/dictionaries'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function ClanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [clan, ranking, matchesWithPreds, clans] = await Promise.all([
    getClanData(id),
    getClanRanking(id),
    getMatchesWithPredictions(id),
    getUserClans(),
  ])

  if (!clan) notFound()

  const myRank = ranking.findIndex((r) => r.user_id === user.id)
  const myStats = ranking[myRank]

  const { dict, locale } = await getDict()

  const pastMatches = matchesWithPreds.filter((m) => m.status !== 'upcoming')
  const upcomingMatches = matchesWithPreds.filter((m) => m.status === 'upcoming')
  const missingUpcoming = upcomingMatches.filter((m) => !m.prediction).length

  const totalPredictions = ranking.reduce((acc, r) => acc + r.exact + r.winner, 0)
  const avgPoints =
    ranking.length > 0
      ? Math.round((ranking.reduce((acc, r) => acc + r.total, 0) / ranking.length) * 10) / 10
      : 0

  return (
    <div className="space-y-8">
      <ClanCookieSync clanId={id} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard?all=1"
            className="text-blue-300 hover:text-white transition shrink-0"
            aria-label={dict.common.back}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{clan.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-blue-400 text-sm font-mono">{clan.invite_code}</span>
              <CopyButton code={clan.invite_code} label={dict.clan.copy_code} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PoolSwitcher
            currentId={clan.id}
            clans={clans}
            clanDict={dict.clan}
            navDict={dict.nav}
            dashboardDict={dict.dashboard}
          />
          <Link
            href={`/clan/${id}/predictions`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.clan.my_predictions}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {missingUpcoming > 0 && (
        <Link
          href={`/clan/${id}/predictions`}
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

      {myStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label={dict.clan.stats_points}
            value={myStats.total}
            accent="yellow"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-emerald-400" />}
            label={dict.clan.stats_exact}
            value={myStats.exact}
            accent="emerald"
          />
          <StatCard
            icon={<Medal className="w-5 h-5 text-blue-400" />}
            label={dict.clan.stats_position}
            value={myRank === -1 ? '–' : `#${myRank + 1}`}
            accent="blue"
          />
        </div>
      )}

      {/* 1. Past matches */}
      <section>
        <SectionHeader icon={<Calendar className="w-5 h-5 text-blue-300" />} title={dict.clan.past_matches} />
        {pastMatches.length === 0 ? (
          <EmptyState text={dict.clan.no_past} />
        ) : (
          <div className="space-y-3">
            {pastMatches.map((m) => (
              <MatchCard
                key={m.id}
                clanId={id}
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

      {/* 2. Upcoming matches */}
      <section>
        <SectionHeader icon={<Calendar className="w-5 h-5 text-blue-300" />} title={dict.clan.upcoming_matches} />
        {upcomingMatches.length === 0 ? (
          <EmptyState text={dict.clan.no_upcoming} />
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((m) => (
              <MatchCard
                key={m.id}
                clanId={id}
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

      {/* 3. Ranking */}
      <section>
        <SectionHeader icon={<Users className="w-5 h-5 text-blue-300" />} title={dict.clan.ranking} />
        {ranking.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/20">
            <Trophy className="w-10 h-10 text-blue-500/40 mx-auto mb-2" />
            <p className="text-blue-300">{dict.clan.no_ranking}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, i) => (
              <RankingRow
                key={entry.user_id}
                entry={entry}
                position={i}
                isMe={entry.user_id === user.id}
                clanDict={dict.clan}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Pool stats */}
      <section>
        <SectionHeader icon={<BarChart3 className="w-5 h-5 text-blue-300" />} title={dict.clan.pool_stats} />
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-300" />}
            label={dict.clan.players}
            value={ranking.length}
            accent="blue"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-emerald-300" />}
            label={dict.clan.total_predictions}
            value={totalPredictions}
            accent="emerald"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-300" />}
            label={dict.clan.average_points}
            value={avgPoints}
            accent="yellow"
          />
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
      {text}
    </div>
  )
}

function RankingRow({
  entry,
  position,
  isMe,
  clanDict,
}: {
  entry: { user_id: string; username: string; total: number; exact: number; winner: number }
  position: number
  isMe: boolean
  clanDict: Dict['clan']
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition ${
        isMe
          ? 'bg-emerald-500/15 border-emerald-500/40'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <span className="w-8 text-center text-lg">
        {position < 3 ? MEDALS[position] : <span className="text-blue-400 font-mono text-sm">#{position + 1}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${isMe ? 'text-emerald-300' : 'text-white'}`}>
          {entry.username}
          {isMe && <span className="text-xs text-emerald-400 ml-2">({clanDict.you})</span>}
        </p>
        <p className="text-xs text-blue-400">
          {format(clanDict.exact_count, { n: entry.exact })} · {format(clanDict.winner_count, { n: entry.winner })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-lg">{entry.total}</p>
        <p className="text-blue-400 text-xs">pts</p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: 'yellow' | 'emerald' | 'blue'
}) {
  const bg = {
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
  }
  return (
    <div className={`p-4 rounded-xl border ${bg[accent]} text-center`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white font-bold text-2xl">{value}</p>
      <p className="text-blue-300 text-xs mt-0.5">{label}</p>
    </div>
  )
}
