import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClanData, getClanRanking } from '@/app/actions/clans'
import { getMatchesWithPredictions } from '@/app/actions/predictions'
import {
  ArrowLeft, Trophy, Users, Star,
  Target, Calendar, ChevronRight, Medal,
} from 'lucide-react'
import { CopyButton } from './_components/CopyButton'

const MEDALS = ['🥇', '🥈', '🥉']
const FLAG: Record<string, string> = {
  'México': '🇲🇽', 'Estados Unidos': '🇺🇸', 'España': '🇪🇸',
  'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
}

function TeamFlag({ team }: { team: string }) {
  return <span title={team}>{FLAG[team] ?? '🏳️'}</span>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live')
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 animate-pulse">EN VIVO</span>
  if (status === 'finished')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-blue-300">Finalizado</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">Próximo</span>
}

export default async function ClanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [clan, ranking, matchesWithPreds] = await Promise.all([
    getClanData(id),
    getClanRanking(id),
    getMatchesWithPredictions(id),
  ])

  if (!clan) notFound()

  const myRank = ranking.findIndex((r) => r.user_id === user.id)
  const myStats = ranking[myRank]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-300 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{clan.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-blue-400 text-sm font-mono">{clan.invite_code}</span>
              <CopyButton code={clan.invite_code} />
            </div>
          </div>
        </div>
        <Link
          href={`/clan/${id}/predictions`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition shrink-0"
        >
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Mis Pronósticos</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* My stats */}
      {myStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label="Puntos"
            value={myStats.total}
            accent="yellow"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-emerald-400" />}
            label="Exactos"
            value={myStats.exact}
            accent="emerald"
          />
          <StatCard
            icon={<Medal className="w-5 h-5 text-blue-400" />}
            label="Posición"
            value={myRank === -1 ? '–' : `#${myRank + 1}`}
            accent="blue"
          />
        </div>
      )}

      {/* Ranking */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-300" />
          <h2 className="text-lg font-semibold text-white">Clasificación</h2>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/20">
            <Trophy className="w-10 h-10 text-blue-500/40 mx-auto mb-2" />
            <p className="text-blue-300">Aún no hay pronósticos. ¡Sé el primero!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, i) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition ${
                  entry.user_id === user.id
                    ? 'bg-emerald-500/15 border-emerald-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="w-8 text-center text-lg">
                  {i < 3 ? MEDALS[i] : <span className="text-blue-400 font-mono text-sm">#{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${entry.user_id === user.id ? 'text-emerald-300' : 'text-white'}`}>
                    {entry.username}
                    {entry.user_id === user.id && <span className="text-xs text-emerald-400 ml-2">(tú)</span>}
                  </p>
                  <p className="text-xs text-blue-400">
                    {entry.exact} exactos · {entry.winner} ganadores
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">{entry.total}</p>
                  <p className="text-blue-400 text-xs">pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Matches */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-300" />
          <h2 className="text-lg font-semibold text-white">Partidos</h2>
        </div>

        <div className="space-y-3">
          {matchesWithPreds.map((match) => (
            <div
              key={match.id}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-400">{match.stage}</span>
                <StatusBadge status={match.status} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 text-right">
                  <p className="text-white font-semibold flex items-center justify-end gap-2">
                    {match.home_team} <TeamFlag team={match.home_team} />
                  </p>
                </div>

                <div className="text-center px-3">
                  {match.status === 'finished' ? (
                    <p className="text-white font-bold text-lg">
                      {match.home_score} – {match.away_score}
                    </p>
                  ) : (
                    <p className="text-blue-400 font-mono text-sm">
                      {new Date(match.match_date).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short',
                      })}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-white font-semibold flex items-center gap-2">
                    <TeamFlag team={match.away_team} /> {match.away_team}
                  </p>
                </div>
              </div>

              {match.prediction && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-blue-400">Tu pronóstico:</span>
                  <span className="text-sm text-blue-200 font-mono">
                    {match.prediction.home_score} – {match.prediction.away_score}
                  </span>
                  {match.status === 'finished' && (
                    <PointsBadge points={match.prediction.points} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: 'yellow' | 'emerald' | 'blue'
}) {
  const bg = { yellow: 'bg-yellow-500/10 border-yellow-500/20', emerald: 'bg-emerald-500/10 border-emerald-500/20', blue: 'bg-blue-500/10 border-blue-500/20' }
  return (
    <div className={`p-4 rounded-xl border ${bg[accent]} text-center`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white font-bold text-2xl">{value}</p>
      <p className="text-blue-300 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function PointsBadge({ points }: { points: number }) {
  if (points === 4) return <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold">+4 pts ⭐</span>
  if (points === 1) return <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs font-bold">+1 pt</span>
  return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">0 pts</span>
}

