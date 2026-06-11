import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'
import { getRatifiableMatches } from '@/app/actions/admin'
import { RatifyMatchesView } from './_components/RatifyMatchesView'

export default async function AdminMatchesPage() {
  const adminUserId = await getAdminUserId()
  if (!adminUserId) redirect('/profile')

  const [{ dict, locale }, matches] = await Promise.all([
    getDict(),
    getRatifiableMatches(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.admin.matches_title}</h1>
          <p className="text-blue-300 text-sm">{dict.admin.matches_subtitle}</p>
        </div>
      </div>

      <RatifyMatchesView matches={matches} dict={dict.admin} clanDict={dict.clan} locale={locale} />
    </div>
  )
}
