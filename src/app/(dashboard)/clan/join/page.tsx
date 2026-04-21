import Link from 'next/link'
import { ArrowLeft, LogIn } from 'lucide-react'
import { getDict } from '@/lib/i18n/server'
import { JoinClanForm } from './_components/JoinClanForm'

export default async function JoinClanPage() {
  const { dict } = await getDict()

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard?all=1" className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.join_clan.title}</h1>
          <p className="text-blue-300 text-sm">{dict.join_clan.subtitle}</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <JoinClanForm dict={dict.join_clan} />
      </div>
    </div>
  )
}
