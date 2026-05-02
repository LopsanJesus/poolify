import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import { PwaInstallModal } from '@/app/_components/PwaInstallModal'
import { NavBar } from './_components/NavBar'
import { TopBar } from './_components/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { dict } = await getDict()

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('default_clan_id, clans(name)')
    .eq('id', user.id)
    .single()

  type ProfileRow = { default_clan_id: string | null; clans: { name: string } | null }
  const profile = profileRow as unknown as ProfileRow | null
  const defaultClanName = profile?.clans?.name ?? null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900">
      <TopBar clanName={defaultClanName} />
      <NavBar />

      <main className="pt-14 md:pl-16 pb-nav">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      <PwaInstallModal t={dict.pwa} />
    </div>
  )
}
