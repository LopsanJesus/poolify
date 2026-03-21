'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Clan } from '@/lib/types'

export async function createClan(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const name = (formData.get('name') as string)?.trim()
  if (!name || name.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' }

  const { data: clanData, error } = await supabase
    .from('clans')
    .insert({ name, owner_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  const clan = clanData as Clan
  await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id })

  redirect(`/clan/${clan.id}`)
}

export async function joinClan(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const code = (formData.get('code') as string)?.trim().toUpperCase()

  const { data: clanData, error: clanError } = await supabase
    .from('clans')
    .select('id, name')
    .eq('invite_code', code)
    .single()

  if (clanError || !clanData) return { error: 'Código de invitación inválido.' }

  const clan = clanData as Pick<Clan, 'id' | 'name'>

  const { error: joinError } = await supabase
    .from('clan_members')
    .insert({ clan_id: clan.id, user_id: user.id })

  if (joinError) {
    if (joinError.code === '23505') return { error: 'Ya eres miembro de este clan.' }
    return { error: joinError.message }
  }

  redirect(`/clan/${clan.id}`)
}

export async function getUserClans(): Promise<Pick<Clan, 'id' | 'name' | 'invite_code' | 'owner_id'>[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('clan_members')
    .select('clan_id, clans(id, name, invite_code, owner_id)')
    .eq('user_id', user.id)

  type ClanRow = { id: string; name: string; invite_code: string; owner_id: string }
  return (data ?? [])
    .map((row) => row.clans as unknown as ClanRow | null)
    .filter((c): c is ClanRow => c !== null)
}

export async function getClanRanking(clanId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('predictions')
    .select('user_id, points, profiles(username)')
    .eq('clan_id', clanId)

  if (!data) return []

  type PredRow = { user_id: string; points: number | null; profiles: { username: string } | null }
  const rows = data as unknown as PredRow[]

  const map = new Map<string, { username: string; total: number; exact: number; winner: number }>()
  for (const row of rows) {
    const uid = row.user_id
    const username = row.profiles?.username ?? uid
    const pts = row.points ?? 0
    const existing = map.get(uid) ?? { username, total: 0, exact: 0, winner: 0 }
    existing.total += pts
    if (pts === 4) existing.exact += 1
    if (pts === 1) existing.winner += 1
    map.set(uid, existing)
  }

  return [...map.entries()]
    .map(([user_id, v]) => ({ user_id, ...v }))
    .sort((a, b) => b.total - a.total)
}

export async function getClanData(clanId: string): Promise<Pick<Clan, 'id' | 'name' | 'invite_code' | 'owner_id'> | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('clans')
    .select('id, name, invite_code, owner_id')
    .eq('id', clanId)
    .single()

  return data as Pick<Clan, 'id' | 'name' | 'invite_code' | 'owner_id'> | null
}

export async function refreshClanPage(clanId: string) {
  revalidatePath(`/clan/${clanId}`)
}
