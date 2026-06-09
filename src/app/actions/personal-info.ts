'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PersonalInfo = {
  bet_amount: number | null
  religion: string | null
  sexual_orientation: string | null
  race: string | null
  fav_cabo_verde_player: string | null
  personal_info_locked: boolean
}

export async function getMyPersonalInfo(): Promise<PersonalInfo | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('profiles')
    .select('bet_amount, religion, sexual_orientation, race, fav_cabo_verde_player, personal_info_locked')
    .eq('id', user.id)
    .single()

  return (data as PersonalInfo) ?? null
}

export async function getUserPersonalInfo(userId: string): Promise<PersonalInfo | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('profiles')
    .select('bet_amount, religion, sexual_orientation, race, fav_cabo_verde_player, personal_info_locked')
    .eq('id', userId)
    .single()

  return (data as PersonalInfo) ?? null
}

export async function savePersonalInfo(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if already locked
  const { data: current } = await (supabase as any)
    .from('profiles')
    .select('personal_info_locked')
    .eq('id', user.id)
    .single()

  if ((current as PersonalInfo | null)?.personal_info_locked) {
    return { error: 'Ya no puedes modificar tu información personal.' }
  }

  const betAmountRaw = formData.get('bet_amount') as string
  const betAmount = betAmountRaw ? parseFloat(betAmountRaw) : null
  const religion = (formData.get('religion') as string).trim() || null
  const sexualOrientation = (formData.get('sexual_orientation') as string).trim() || null
  const race = (formData.get('race') as string).trim() || null
  const favCaboVerde = (formData.get('fav_cabo_verde_player') as string).trim() || null

  const allFilled = betAmount !== null && religion && sexualOrientation && race && favCaboVerde

  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      bet_amount: betAmount,
      religion,
      sexual_orientation: sexualOrientation,
      race,
      fav_cabo_verde_player: favCaboVerde,
      personal_info_locked: Boolean(allFilled),
    })
    .eq('id', user.id)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/profile')
  revalidatePath('/profile/personal-info')
  return { success: true }
}
