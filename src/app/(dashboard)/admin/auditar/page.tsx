import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'
import { getAllClansForAdmin, getClanAudit } from '@/app/actions/audit'
import { ClanAuditView } from './_components/ClanAuditView'

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ clan?: string }>
}) {
  const adminUserId = await getAdminUserId()
  if (!adminUserId) redirect('/profile')

  const [{ clan: clanParam }, { dict, locale }, clans] = await Promise.all([
    searchParams,
    getDict(),
    getAllClansForAdmin(),
  ])

  const clanId = (clanParam && clans.some((c) => c.id === clanParam) ? clanParam : clans[0]?.id) ?? null
  const audit = clanId ? await getClanAudit(clanId) : null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.admin.audit_title}</h1>
          <p className="text-blue-300 text-sm">{dict.admin.audit_subtitle}</p>
        </div>
      </div>

      <ClanAuditView
        clans={clans}
        selectedClanId={clanId}
        audit={audit}
        dict={dict.admin}
        locale={locale}
      />
    </div>
  )
}
