import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { joinClanByCode } from '@/app/actions/clans'
import { getDict } from '@/lib/i18n/server'
import { setActiveClan } from '@/app/actions/active-clan'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { dict } = await getDict()
  const d = dict.invite

  // Not logged in → send to login with next param
  if (!user) {
    redirect(`/login?next=/join/${code}`)
  }

  // Logged in → try to join
  const result = await joinClanByCode(code)

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-red-300 font-semibold">{result.error}</p>
          <Link href="/dashboard" className="text-blue-300 hover:text-white text-sm underline transition">
            {dict.nav.my_pools}
          </Link>
        </div>
      </div>
    )
  }

  if (result.clanId) {
    await setActiveClan(result.clanId)
    redirect(`/clan/${result.clanId}`)
  }

  redirect('/dashboard')
}
