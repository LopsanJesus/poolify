import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, ClipboardCheck, ListChecks, PlusCircle, Trophy, Users } from 'lucide-react'
import { getAdminUserId } from '@/lib/admin'
import { getDict } from '@/lib/i18n/server'

export default async function AdminPage() {
  const adminUserId = await getAdminUserId()
  if (!adminUserId) redirect('/profile')

  const { dict } = await getDict()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.admin.title}</h1>
          <p className="text-blue-300 text-sm">{dict.admin.subtitle}</p>
        </div>
      </div>

      <Link
        href="/admin/members"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-white font-semibold">{dict.admin.card_members_title}</p>
            <p className="text-blue-400 text-xs">{dict.admin.card_members_desc}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition shrink-0" />
      </Link>

      <Link
        href="/admin/matches"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-white font-semibold">{dict.admin.card_matches_title}</p>
            <p className="text-blue-400 text-xs">{dict.admin.card_matches_desc}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition shrink-0" />
      </Link>

      <Link
        href="/admin/auditar"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <ListChecks className="w-5 h-5 text-pink-400" />
          <div>
            <p className="text-white font-semibold">{dict.admin.card_audit_title}</p>
            <p className="text-blue-400 text-xs">{dict.admin.card_audit_desc}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition shrink-0" />
      </Link>

      <Link
        href="/admin/final-audit"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-white font-semibold">{dict.admin.card_final_audit_title}</p>
            <p className="text-blue-400 text-xs">{dict.admin.card_final_audit_desc}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition shrink-0" />
      </Link>

      <Link
        href="/admin/add-round"
        className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-white font-semibold">{dict.admin.add_round}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition shrink-0" />
      </Link>
    </div>
  )
}
