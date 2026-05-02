import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import { Landing } from './_components/Landing'
import { getHomeRedirectPath } from '@/lib/home-redirect'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const path = await getHomeRedirectPath()
    redirect(path)
  }

  const { dict } = await getDict()
  return <Landing dict={dict} />
}
