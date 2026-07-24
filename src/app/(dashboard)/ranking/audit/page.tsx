import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import { getUserClans } from '@/app/actions/clans'
import { getActiveClanId } from '@/lib/active-clan'
import { getFinalAudit } from '@/app/actions/final-audit'
import { FinalAuditView } from './_components/FinalAuditView'

export default async function RankingAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, clans, activeClanId] = await Promise.all([
    supabase.from('profiles').select('default_clan_id').eq('id', user.id).single(),
    getUserClans(),
    getActiveClanId(),
  ])

  if (clans.length === 0) redirect('/dashboard')

  const clanId =
    (activeClanId && clans.some((c) => c.id === activeClanId) ? activeClanId : null) ??
    profile?.default_clan_id ??
    clans[0].id

  const { dict, locale } = await getDict()

  const labels = {
    winner: dict.final_predictions.field_winner,
    runner_up: dict.final_predictions.field_runner_up,
    semi1: dict.final_predictions.field_semi1,
    semi2: dict.final_predictions.field_semi2,
    top_scorer: dict.final_predictions.field_top_scorer,
  }

  const audit = await getFinalAudit(clanId, labels)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/ranking" className="text-blue-300 hover:text-white transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.ranking_audit.title}</h1>
          <p className="text-blue-300 text-sm">{dict.ranking_audit.subtitle}</p>
        </div>
      </div>

      <FinalAuditView audit={audit} dict={dict.ranking_audit} locale={locale} />
    </div>
  )
}
