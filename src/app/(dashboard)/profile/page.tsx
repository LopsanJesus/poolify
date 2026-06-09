export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import { getMyPersonalInfo } from '@/app/actions/personal-info'
import { ProfileClient } from './_components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { dict, locale }, personalInfo] = await Promise.all([
    supabase.from('profiles').select('username, language').eq('id', user.id).single(),
    getDict(),
    getMyPersonalInfo(),
  ])

  const personalInfoComplete = !!(
    personalInfo?.bet_amount != null &&
    personalInfo?.religion &&
    personalInfo?.sexual_orientation &&
    personalInfo?.race &&
    personalInfo?.fav_cabo_verde_player
  )

  return (
    <ProfileClient
      username={profile?.username ?? null}
      email={user.email!}
      locale={locale}
      dict={dict}
      personalInfoComplete={personalInfoComplete}
    />
  )
}
