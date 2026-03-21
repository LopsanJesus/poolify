import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClanData } from '@/app/actions/clans'
import { getMatchesWithPredictions } from '@/app/actions/predictions'
import { ArrowLeft, Target } from 'lucide-react'
import { PredictionsForm } from './_components/PredictionsForm'

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/clan/${id}`} className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Pronósticos</h1>
          <p className="text-blue-300 text-sm">{clan.name}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
        <Target className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200 space-y-0.5">
          <p className="font-medium text-white">Sistema de puntos</p>
          <p>⭐ <strong className="text-emerald-400">4 puntos</strong> — resultado exacto</p>
          <p>✅ <strong className="text-blue-300">1 punto</strong> — aciertas ganador o empate</p>
          <p>❌ <strong className="text-red-400">0 puntos</strong> — sin acierto</p>
        </div>
      </div>

      <PredictionsForm clanId={id} matchesWithPreds={matchesWithPreds} />
    </div>
  )
}
