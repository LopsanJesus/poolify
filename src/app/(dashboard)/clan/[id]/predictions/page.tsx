import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClanData } from '@/app/actions/clans'
import { getMatchesWithPredictions } from '@/app/actions/predictions'
import { ArrowLeft, Target, Star, Check, X } from 'lucide-react'
import { PredictionsForm } from './_components/PredictionsForm'
import { getDict } from '@/lib/i18n/server'

export default async function PredictionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [clan, matchesWithPreds] = await Promise.all([
    getClanData(id),
    getMatchesWithPredictions(id),
  ])

  if (!clan) notFound()

  const { dict, locale } = await getDict()

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

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
        <Target className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200 space-y-0.5">
          <p className="font-medium text-white">{dict.predictions.scoring_title}</p>
          <p className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <strong className="text-emerald-400">{dict.predictions.points_4}</strong>{' '}—{' '}
            {dict.predictions.scoring_exact}
          </p>
          <p className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <strong className="text-blue-300">{dict.predictions.points_1}</strong>{' '}—{' '}
            {dict.predictions.scoring_winner}
          </p>
          <p className="flex items-center gap-1.5">
            <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <strong className="text-red-400">{dict.predictions.points_0}</strong>{' '}—{' '}
            {dict.predictions.scoring_miss}
          </p>
        </div>
      </div>

      <PredictionsForm
        clanId={id}
        matchesWithPreds={matchesWithPreds}
        dict={dict.predictions}
        commonDict={dict.common}
        locale={locale}
      />
    </div>
  )
}
