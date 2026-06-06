export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import { ProfileClient } from './_components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { dict, locale }] = await Promise.all([
    supabase.from('profiles').select('username, language').eq('id', user.id).single(),
    getDict(),
  ])

  return (
    <ProfileClient
      username={profile?.username ?? null}
      email={user.email!}
      locale={locale}
      dict={dict}
    />
  )
}
