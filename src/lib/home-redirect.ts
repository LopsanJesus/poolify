import { createClient } from '@/lib/supabase/server'
import { getActiveClanId } from '@/lib/active-clan'
import { getUserClans } from '@/app/actions/clans'

export async function getHomeRedirectPath(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return '/login'

  const [activeClanId, { data: profile }, clans] = await Promise.all([
    getActiveClanId(),
    supabase.from('profiles').select('default_clan_id').eq('id', user.id).single(),
    getUserClans(),
  ])

  const targetId =
    (activeClanId && clans.some((c) => c.id === activeClanId) ? activeClanId : null) ??
    (profile?.default_clan_id && clans.some((c) => c.id === profile.default_clan_id)
      ? profile.default_clan_id
      : null)

  return targetId ? `/clan/${targetId}` : '/dashboard'
}
