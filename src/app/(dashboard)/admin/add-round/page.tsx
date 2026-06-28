import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'
import { getTeamsForAdmin } from '@/app/actions/admin'
import { AddRoundForm } from './_components/AddRoundForm'

export default async function AddRoundPage() {
  const adminUserId = await getAdminUserId()
  if (!adminUserId) redirect('/profile')

  const [{ dict }, teams] = await Promise.all([
    getDict(),
    getTeamsForAdmin(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.admin.add_round_title}</h1>
        </div>
      </div>

      <AddRoundForm teams={teams} dict={dict.admin} />
    </div>
  )
}
