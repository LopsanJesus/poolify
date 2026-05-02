'use server'

import { cookies } from 'next/headers'
import { ACTIVE_CLAN_COOKIE } from '@/lib/active-clan'
import { createClient } from '@/lib/supabase/server'

export async function setActiveClan(clanId: string) {
  const store = await cookies()
  store.set(ACTIVE_CLAN_COOKIE, clanId, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('profiles')
      .update({ default_clan_id: clanId })
      .eq('id', user.id)
  }
}
