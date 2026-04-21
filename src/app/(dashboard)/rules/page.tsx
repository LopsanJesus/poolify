import Link from 'next/link'
import { ArrowLeft, BookOpen, Star, Trophy, Clock, Users, Shield } from 'lucide-react'
import { getDict } from '@/lib/i18n/server'

export default async function RulesPage() {
  const { dict } = await getDict()

  const sections = [
    {
      icon: <Star className="w-5 h-5 text-emerald-400" />,
      title: dict.rules.scoring_exact_title,
      body: dict.rules.scoring_exact_body,
    },
    {
      icon: <Trophy className="w-5 h-5 text-blue-400" />,
      title: dict.rules.scoring_winner_title,
      body: dict.rules.scoring_winner_body,
    },
    {
      icon: <Shield className="w-5 h-5 text-red-400" />,
      title: dict.rules.scoring_miss_title,
      body: dict.rules.scoring_miss_body,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-blue-300 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{dict.rules.title}</h1>
          <p className="text-blue-300 text-sm">{dict.rules.subtitle}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-white font-semibold">{dict.rules.scoring_title}</h2>
        </div>
        <p className="text-blue-200 text-sm leading-relaxed">{dict.rules.scoring_body}</p>
        <ul className="space-y-2">
          {sections.map((s) => (
            <li key={s.title} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="mt-0.5">{s.icon}</div>
              <div>
                <p className="text-white font-semibold text-sm">{s.title}</p>
                <p className="text-blue-200 text-sm">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-300" />
          <h2 className="text-white font-semibold">{dict.rules.deadlines_title}</h2>
        </div>
        <p className="text-blue-200 text-sm leading-relaxed">{dict.rules.deadlines_body}</p>
      </section>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-300" />
          <h2 className="text-white font-semibold">{dict.rules.pools_title}</h2>
        </div>
        <p className="text-blue-200 text-sm leading-relaxed">{dict.rules.pools_body}</p>
      </section>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-300" />
          <h2 className="text-white font-semibold">{dict.rules.fairplay_title}</h2>
        </div>
        <p className="text-blue-200 text-sm leading-relaxed">{dict.rules.fairplay_body}</p>
      </section>
    </div>
  )
}
