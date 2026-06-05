import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getClanData, getTournamentDeadline } from '@/app/actions/clans'
import { getMyTournamentPrediction, getAllTournamentPredictions, getTeamsForClan } from '@/app/actions/tournament'
import { getDict } from '@/lib/i18n/server'
import { FinalPredictionsForm } from './_components/FinalPredictionsForm'
import { FinalPredictionsTable } from './_components/FinalPredictionsTable'

export default async function FinalPredictionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [clan, deadline, myPred, teams, { dict }] = await Promise.all([
    getClanData(id),
    getTournamentDeadline(),
    getMyTournamentPrediction(id),
    getTeamsForClan(id),
    getDict(),
  ])
  if (!clan) notFound()

  const config = clan.settings?.final_predictions
  const now = new Date()
  const isPastDeadline = deadline ? now >= deadline : false

  const allPreds = isPastDeadline ? await getAllTournamentPredictions(id) : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/clan/${id}`} className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-400" />
            {dict.final_predictions.title}
          </h1>
          <p className="text-blue-300 text-sm">{clan.name}</p>
        </div>
      </div>

      {/* Deadline info */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
        isPastDeadline
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
      }`}>
        <Lock className="w-4 h-4 shrink-0" />
        {isPastDeadline
          ? dict.final_predictions.deadline_passed
          : `${dict.final_predictions.deadline_info}${deadline ? ` (${deadline.toLocaleString()})` : ''}`}
      </div>

      {/* No config yet */}
      {!config && (
        <div className="text-center py-10 text-blue-400/60 text-sm">
          {dict.final_predictions.no_predictions}
        </div>
      )}

      {config && (
        <>
          {/* Your predictions */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-blue-400/60 uppercase tracking-wide">
              {dict.final_predictions.your_prediction}
            </h2>
            {isPastDeadline ? (
              <FinalPredictionsTable
                predictions={allPreds}
                config={config}
                currentUserId={user.id}
                dict={dict.final_predictions}
              />
            ) : (
              <FinalPredictionsForm
                clanId={id}
                config={config}
                existing={myPred}
                teams={teams}
                dict={dict.final_predictions}
                commonDict={dict.common}
              />
            )}
          </div>

          {/* After deadline: all members table */}
          {isPastDeadline && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-blue-400/60 uppercase tracking-wide">
                {dict.final_predictions.all_predictions}
              </h2>
              <FinalPredictionsTable
                predictions={allPreds}
                config={config}
                currentUserId={user.id}
                dict={dict.final_predictions}
                showAll
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
