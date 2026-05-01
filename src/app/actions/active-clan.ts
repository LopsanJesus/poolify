'use server'

import { cookies } from 'next/headers'
import { ACTIVE_CLAN_COOKIE } from '@/lib/active-clan'

export async function setActiveClan(clanId: string) {
  const store = await cookies()
  store.set(ACTIVE_CLAN_COOKIE, clanId, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })
}
