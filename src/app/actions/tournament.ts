'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TournamentPrediction, TournamentResult, FinalPredictionsConfig, Team } from '@/lib/types'
import { getClanData } from './clans'

// Returns teams for the first tournament a clan is subscribed to.
// Used to populate dropdowns in final predictions.
export async function getTeamsForClan(clanId: string): Promise<Team[]> {
  const supabase = await createClient()

  const { data: ct } = await (supabase as any)
    .from('clan_tournaments')
    .select('tournament_id')
    .eq('clan_id', clanId)
    .limit(1)
    .single()

  if (!ct) return []

  const { data: teams } = await (supabase as any)
    .from('teams')
    .select('*')
    .eq('tournament_id', (ct as { tournament_id: string }).tournament_id)
    .order('name')

  return (teams ?? []) as Team[]
}

export async function getMyTournamentPrediction(clanId: string): Promise<TournamentPrediction | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('tournament_predictions')
    .select('*')
    .eq('clan_id', clanId)
    .eq('user_id', user.id)
    .single()

  return data as unknown as TournamentPrediction | null
}

export async function getAllTournamentPredictions(clanId: string): Promise<(TournamentPrediction & { username: string })[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tournament_predictions')
    .select('*, profiles(username)')
    .eq('clan_id', clanId)
    .order('points', { ascending: false })

  type Row = TournamentPrediction & { profiles: { username: string } | null }
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    username: r.profiles?.username ?? r.user_id,
  }))
}

export async function saveTournamentPrediction(
  clanId: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const winner    = (formData.get('winner')     as string)?.trim() || null
  const runner_up = (formData.get('runner_up')  as string)?.trim() || null
  const semi1     = (formData.get('semi1')      as string)?.trim() || null
  const semi2     = (formData.get('semi2')      as string)?.trim() || null
  const top_scorer = (formData.get('top_scorer') as string)?.trim() || null

  const clan = await getClanData(clanId)
  const customFields = clan?.settings?.final_predictions?.custom_fields ?? []
  const customAnswers: Record<string, string> = {}
  for (const f of customFields) {
    const val = (formData.get(`custom_${f.id}`) as string)?.trim()
    if (val) customAnswers[f.id] = val
  }

  const { error } = await supabase
    .from('tournament_predictions')
    .upsert(
      { clan_id: clanId, user_id: user.id, winner, runner_up, semi1, semi2, top_scorer, custom_answers: customAnswers, updated_at: new Date().toISOString() },
      { onConflict: 'clan_id,user_id' },
    )

  if (error) return { error: error.message }

  revalidatePath(`/clan/${clanId}/final-predictions`)
  return { success: true }
}

export async function getTournamentResults(clanId: string): Promise<TournamentResult | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tournament_results')
    .select('*')
    .eq('clan_id', clanId)
    .single()

  return data as unknown as TournamentResult | null
}

export async function saveTournamentResults(
  clanId: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const clan = await getClanData(clanId)
  if (!clan || clan.owner_id !== user.id) return { error: 'unauthorized' }

  const winner     = (formData.get('res_winner')     as string)?.trim() || null
  const runner_up  = (formData.get('res_runner_up')  as string)?.trim() || null
  const semisRaw   = (formData.get('res_semis')      as string)?.trim() || ''
  const top_scorer = (formData.get('res_top_scorer') as string)?.trim() || null
  const semis = semisRaw.split(',').map((s) => s.trim()).filter(Boolean)

  const customFields = clan.settings?.final_predictions?.custom_fields ?? []
  const customResults: Record<string, string> = {}
  for (const f of customFields) {
    const val = (formData.get(`res_custom_${f.id}`) as string)?.trim()
    if (val) customResults[f.id] = val
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('tournament_results')
    .upsert({ clan_id: clanId, winner, runner_up, semis, top_scorer, custom_results: customResults }, { onConflict: 'clan_id' })

  if (error) return { error: error.message }

  await awardTournamentPointsInternal(clanId, { winner, runner_up, semis, top_scorer, custom_results: customResults, awarded_at: null, clan_id: clanId }, clan.settings?.final_predictions)

  revalidatePath(`/clan/${clanId}/settings`)
  revalidatePath(`/clan/${clanId}/final-predictions`)
  return { success: true }
}

async function awardTournamentPointsInternal(
  clanId: string,
  results: TournamentResult,
  config?: FinalPredictionsConfig,
) {
  if (!config) return

  const supabase = await createClient()
  const { data: preds } = await supabase
    .from('tournament_predictions')
    .select('*')
    .eq('clan_id', clanId)

  const admin = createAdminClient()
  const atLeastFinal = [results.winner, results.runner_up].filter(Boolean) as string[]
  const atLeastSemi  = [...atLeastFinal, ...(results.semis ?? [])].filter(Boolean)

  for (const pred of (preds ?? []) as unknown as TournamentPrediction[]) {
    let pts = 0

    if (pred.winner    && results.winner === pred.winner) pts += config.winner_pts
    if (pred.runner_up && atLeastFinal.includes(pred.runner_up))  pts += config.runner_up_pts
    if (pred.semi1     && atLeastSemi.includes(pred.semi1))       pts += config.semi1_pts
    if (pred.semi2     && atLeastSemi.includes(pred.semi2))       pts += config.semi2_pts
    if (pred.top_scorer && results.top_scorer &&
        pred.top_scorer.toLowerCase() === results.top_scorer.toLowerCase()) pts += config.top_scorer_pts

    for (const f of config.custom_fields ?? []) {
      const pVal = pred.custom_answers?.[f.id]?.toLowerCase()
      const rVal = results.custom_results?.[f.id]?.toLowerCase()
      if (pVal && rVal && pVal === rVal) pts += f.points
    }

    await admin
      .from('tournament_predictions')
      .update({ points: pts })
      .eq('id', pred.id)
  }

  await admin
    .from('tournament_results')
    .update({ awarded_at: new Date().toISOString() })
    .eq('clan_id', clanId)
}
