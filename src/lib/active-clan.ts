import { cookies } from 'next/headers'

export const ACTIVE_CLAN_COOKIE = 'active_clan_id'

export async function getActiveClanId(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_CLAN_COOKIE)?.value ?? null
}
