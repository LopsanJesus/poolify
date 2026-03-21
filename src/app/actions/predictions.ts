'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculatePoints } from '@/lib/scoring'
import type { Match, Prediction } from '@/lib/types'

export async function getMatchesWithPredictions(clanId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: matchData }, { data: predData }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date'),
    supabase
      .from('predictions')
      .select('*')
      .eq('clan_id', clanId)
      .eq('user_id', user.id),
  ])

  const matches = (matchData ?? []) as Match[]
  const predictions = (predData ?? []) as Prediction[]

  return matches.map((match) => ({
    ...match,
    prediction: predictions.find((p) => p.match_id === match.id) ?? null,
  }))
}

export async function savePredictions(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const clanId = formData.get('clan_id') as string
  const matchIds = formData.getAll('match_id') as string[]

  const { data: matchData } = await supabase.from('matches').select('*')
  const matches = (matchData ?? []) as Match[]

  const upserts = matchIds.map((matchId) => {
    const homeScore = parseInt(formData.get(`home_${matchId}`) as string, 10)
    const awayScore = parseInt(formData.get(`away_${matchId}`) as string, 10)
    const match = matches.find((m) => m.id === matchId)

    let points = 0
    if (
      match?.status === 'finished' &&
      match.home_score != null &&
      match.away_score != null
    ) {
      points = calculatePoints(homeScore, awayScore, match.home_score, match.away_score)
    }

    return {
      user_id: user.id,
      match_id: matchId,
      clan_id: clanId,
      home_score: isNaN(homeScore) ? 0 : homeScore,
      away_score: isNaN(awayScore) ? 0 : awayScore,
      points,
      updated_at: new Date().toISOString(),
    }
  })

  const { error } = await supabase
    .from('predictions')
    .upsert(upserts, { onConflict: 'user_id,match_id,clan_id' })

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}`)
  revalidatePath(`/clan/${clanId}/predictions`)

  return { success: true }
}
