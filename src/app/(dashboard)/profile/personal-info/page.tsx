export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/server'
import { getMyPersonalInfo } from '@/app/actions/personal-info'
import { PersonalInfoForm } from './_components/PersonalInfoForm'

export default async function PersonalInfoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [info, { dict }] = await Promise.all([
    getMyPersonalInfo(),
    getDict(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-blue-300 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{dict.profile.section_personal_info}</h1>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
        <PersonalInfoForm info={info} dict={dict.profile} />
      </div>
    </div>
  )
}
