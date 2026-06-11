import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'
import { getAllProfiles } from '@/app/actions/admin'
import { MembersAdminTable } from './_components/MembersAdminTable'

export default async function AdminMembersPage() {
  const adminUserId = await getAdminUserId()
  if (!adminUserId) redirect('/profile')

  const [{ dict }, profiles] = await Promise.all([
    getDict(),
    getAllProfiles(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.admin.card_members_title}</h1>
          <p className="text-blue-300 text-sm">{dict.admin.members_title}</p>
        </div>
      </div>

      <MembersAdminTable profiles={profiles} dict={dict.admin} commonDict={dict.common} />
    </div>
  )
}
