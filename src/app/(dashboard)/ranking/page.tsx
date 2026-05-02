import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserClans, getClanRanking, getClanData } from '@/app/actions/clans'
import { Trophy, Users, Target, Star, Medal } from 'lucide-react'
import { GroupSwitcher } from '@/app/(dashboard)/_components/GroupSwitcher'
import { getDict, format } from '@/lib/i18n/server'
import { getActiveClanId } from '@/lib/active-clan'
import type { Dict } from '@/lib/i18n/dictionaries'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, clans, activeClanId] = await Promise.all([
    supabase.from('profiles').select('default_clan_id').eq('id', user.id).single(),
    getUserClans(),
    getActiveClanId(),
  ])

  if (clans.length === 0) redirect('/dashboard')

  const clanId =
    (activeClanId && clans.some((c) => c.id === activeClanId) ? activeClanId : null) ??
    profile?.default_clan_id ??
    clans[0].id

  const clan = clans.find((c) => c.id === clanId) ?? clans[0]

  const [ranking, { dict }] = await Promise.all([
    getClanRanking(clan.id),
    getDict(),
  ])

  const myRank = ranking.findIndex((r) => r.user_id === user.id)
  const myStats = ranking[myRank]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end gap-4">
        <GroupSwitcher
          currentId={clan.id}
          clans={clans}
          label={dict.clan.switch_pool}
        />
      </div>

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

      {ranking.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/20">
          <Trophy className="w-12 h-12 text-blue-500/50 mx-auto mb-3" />
          <p className="text-blue-300 font-medium">{dict.clan.no_ranking}</p>
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
          value={ranking.reduce((acc, r) => acc + r.exact + r.winner, 0)}
          accent="emerald"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-300" />}
          label={dict.clan.average_points}
          value={
            ranking.length > 0
              ? Math.round((ranking.reduce((acc, r) => acc + r.total, 0) / ranking.length) * 10) / 10
              : 0
          }
          accent="yellow"
        />
      </div>
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
