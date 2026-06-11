'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'
import { recalcPredictionPoints } from './matches'
import type { Match } from '@/lib/types'

export type AdminProfile = { id: string; username: string; is_admin: boolean }

export async function getAllProfiles(): Promise<AdminProfile[]> {
  if (!await getAdminUserId()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, is_admin')
    .order('username')

  return (data ?? []) as AdminProfile[]
}

export async function updateUsername(_: unknown, formData: FormData): Promise<{ error?: string; success?: true }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const userId = formData.get('user_id') as string
  const username = (formData.get('username') as string)?.trim()
  if (!username || username.length < 2) return { error: dict.auth.invalid_username }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ username })
    .eq('id', userId)

  if (error) {
    if (error.code === '23505') return { error: dict.admin.username_taken }
    return { error: error.message }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

// ── Match ratification ──────────────────────────────────────────

export async function getRatifiableMatches(): Promise<Match[]> {
  if (!await getAdminUserId()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['live', 'finished'])
    .order('match_date', { ascending: false })

  return (data ?? []) as Match[]
}

export async function adminUpdateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }
  if (homeScore < 0 || awayScore < 0) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, ratified')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'live' && match.status !== 'finished') return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)

  if (error) return { error: error.message }

  if (match.status === 'finished') {
    await recalcPredictionPoints(supabase, matchId, homeScore, awayScore)
  }

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/ranking')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export async function adminFinishMatch(matchId: string): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score, ratified')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'live') return { error: dict.common.error }
  if (match.home_score == null || match.away_score == null) return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', matchId)

  if (error) return { error: error.message }

  await recalcPredictionPoints(supabase, matchId, match.home_score, match.away_score)

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/ranking')
  revalidatePath('/clan/[id]', 'layout')
  return {}
}

export async function ratifyMatch(matchId: string): Promise<{ error?: string }> {
  const { dict } = await getDict()
  if (!await getAdminUserId()) return { error: dict.common.error }

  const supabase = await createClient()
  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score, ratified')
    .eq('id', matchId)
    .single()

  if (!match || match.ratified) return { error: dict.admin.match_ratified_locked }
  if (match.status !== 'finished') return { error: dict.admin.match_not_finished }
  if (match.home_score == null || match.away_score == null) return { error: dict.common.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ ratified: true })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/matches')
  return {}
}
