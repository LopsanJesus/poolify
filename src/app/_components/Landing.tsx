import Image from 'next/image'
import Link from 'next/link'
import type { Dict } from '@/lib/i18n/dictionaries'
import { Countdown } from './Countdown'
import { FlagCarousel } from './FlagCarousel'

export function Landing({ dict }: { dict: Dict }) {
  const t = dict.landing
  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900 text-white">
      {/* Hero — dominant section */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 min-h-0"
        style={{ flexGrow: 3 }}
      >
        <Image
          src="/logo.jpeg"
          alt="Poolify"
          width={60}
          height={60}
          className="rounded-2xl shadow-xl mb-4"
        />
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-3 leading-none">
          Poolify
        </h1>
        <p className="text-blue-300 text-sm sm:text-base max-w-xs sm:max-w-sm mb-6">
          {t.hero_subtitle}
        </p>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm sm:text-base transition shadow-lg shadow-emerald-900/60 whitespace-nowrap"
          >
            {t.cta_signup}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white/10 font-semibold text-sm sm:text-base transition whitespace-nowrap"
          >
            {t.cta_login}
          </Link>
        </div>
      </section>

      <div className="h-px bg-white/10 mx-6 flex-none" />

      {/* Countdown */}
      <section
        className="flex flex-col items-center justify-center px-6 min-h-0"
        style={{ flexGrow: 2 }}
      >
        <Countdown
          label={t.countdown_label}
          days={t.days}
          hours={t.hours}
          minutes={t.minutes}
          seconds={t.seconds}
        />
      </section>

      <div className="h-px bg-white/10 mx-6 flex-none" />

      {/* Flag carousel */}
      <section
        className="flex flex-col items-center justify-center min-h-0"
        style={{ flexGrow: 1 }}
      >
        <FlagCarousel label={t.countries_label} />
      </section>
    </main>
  )
}
