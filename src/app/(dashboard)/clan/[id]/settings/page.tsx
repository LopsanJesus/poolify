import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getClanData } from '@/app/actions/clans'
import { getDict } from '@/lib/i18n/server'
import { DEFAULT_CLAN_SETTINGS } from '@/lib/types'
import { ClanSettingsForm } from './_components/ClanSettingsForm'

export default async function ClanSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clan = await getClanData(id)
  if (!clan) notFound()
  if (clan.owner_id !== user.id) redirect(`/clan/${id}`)

  const { dict } = await getDict()
  const settings = clan.settings ?? DEFAULT_CLAN_SETTINGS

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href={`/clan/${id}`} className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.clan_settings.title}</h1>
          <p className="text-blue-300 text-sm truncate">{clan.name}</p>
        </div>
      </div>

      <ClanSettingsForm
        clanId={id}
        settings={settings}
        dict={dict.clan_settings}
        commonDict={dict.common}
      />
    </div>
  )
}
