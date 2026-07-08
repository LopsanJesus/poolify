import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClanData } from '@/app/actions/clans'
import { getMatchesWithPredictions, getRoundConfigsForClan } from '@/app/actions/predictions'
import { ArrowLeft, Lock } from 'lucide-react'
import { PredictionsForm } from './_components/PredictionsForm'
import { getDict } from '@/lib/i18n/server'
import { resolveScoringConfig } from '@/lib/scoring'

export default async function PredictionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [clan, { matches: matchesWithPreds, roundDeadlines, isAdmin }, roundConfigs] = await Promise.all([
    getClanData(id),
    getMatchesWithPredictions(id),
    getRoundConfigsForClan(id),
  ])

  if (!clan) notFound()

  const { dict, locale } = await getDict()

  const clanScoring = resolveScoringConfig(clan.settings)
  const roundConfigMap = new Map(roundConfigs.map((rc) => [`${rc.tournament_id}:${rc.stage}`, rc]))

  // The "Sistema de puntos" panel should reflect the round the user is about
  // to predict, not always the clan's group-stage defaults — mirrors the
  // editable-match filtering in PredictionsForm.
  const editableCandidates = matchesWithPreds
    .filter((m) => m.status === 'upcoming' || (isAdmin && m.status === 'live'))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  const activeMatch = editableCandidates.find((m) => {
    if (!m.matchDeadlinePassed) return true
    return isAdmin && m.prediction === null
  }) ?? null

  const activeRoundConfig = activeMatch?.tournament_id
    ? roundConfigMap.get(`${activeMatch.tournament_id}:${activeMatch.stage}`) ?? null
    : null

  const panelScoring = resolveScoringConfig(clan.settings, activeRoundConfig)

  const exactPts   = panelScoring.points_exact
  const signPts    = panelScoring.points_sign
  const advancePts = panelScoring.points_advance

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/clan/${id}`} className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.predictions.title}</h1>
          <p className="text-blue-300 text-sm">{clan.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm bg-blue-500/10 border-blue-500/20 text-blue-300">
        <Lock className="w-4 h-4 shrink-0" />
        {dict.predictions.deadline_info}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-xs font-semibold text-blue-400/70 uppercase tracking-wide">
          {dict.predictions.scoring_title}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-3">
            <span className="text-emerald-400 font-black text-lg leading-none tabular-nums">+{exactPts}</span>
            <span className="text-[11px] text-emerald-300/80 text-center leading-tight">{dict.predictions.scoring_exact}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-3">
            <span className="text-blue-300 font-black text-lg leading-none tabular-nums">+{signPts}</span>
            <span className="text-[11px] text-blue-300/80 text-center leading-tight">1X2</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-3">
            <span className="text-amber-300 font-black text-lg leading-none tabular-nums">+{advancePts}</span>
            <span className="text-[11px] text-amber-300/80 text-center leading-tight">{dict.predictions.scoring_advance}</span>
          </div>
        </div>
      </div>

      <PredictionsForm
        clanId={id}
        matchesWithPreds={matchesWithPreds}
        roundDeadlines={roundDeadlines}
        isAdmin={isAdmin}
        dict={dict.predictions}
        commonDict={dict.common}
        locale={locale}
        clanScoring={clanScoring}
        roundConfigs={roundConfigs}
      />
    </div>
  )
}
