'use client'

import { useEffect, useState } from 'react'

const WC_START = new Date('2026-06-11T18:00:00Z')

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
  phase: 'days' | 'hours' | 'done'
}

function calc(): TimeLeft {
  const ms = WC_START.getTime() - Date.now()
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, phase: 'done' }
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    phase: s >= 86400 ? 'days' : 'hours',
  }
}

type Props = {
  label: string
  days: string
  hours: string
  minutes: string
  seconds: string
}

export function Countdown({ label, days, hours, minutes, seconds }: Props) {
  const [t, setT] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setT(calc())
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  const p2 = (n: number) => String(n).padStart(2, '0')

  if (!t) return <div className="h-24" />

  if (t.phase === 'done') {
    return <p className="text-center text-white text-3xl font-bold">⚽ Kick-off!</p>
  }

  const bigNum = t.phase === 'days' ? t.days : p2(t.hours)
  const bigLabel = t.phase === 'days' ? days : hours
  const smalls =
    t.phase === 'days'
      ? [{ v: p2(t.hours), l: hours }, { v: p2(t.minutes), l: minutes }, { v: p2(t.seconds), l: seconds }]
      : [{ v: p2(t.minutes), l: minutes }, { v: p2(t.seconds), l: seconds }]

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-blue-300/70 text-xs uppercase tracking-[0.2em] mb-3">{label}</p>

      <span
        className="text-white font-black tabular-nums leading-none"
        style={{ fontSize: 'clamp(3.5rem, 14vw, 8rem)' }}
      >
        {bigNum}
      </span>
      <span className="text-blue-300 text-xs uppercase tracking-widest mt-1 mb-3">{bigLabel}</span>

      <div className="flex items-center gap-3">
        {smalls.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <span className="text-blue-400/40 text-base font-bold -mt-3">:</span>}
            <div className="flex flex-col items-center">
              <span className="text-white/60 text-xl font-bold tabular-nums">{item.v}</span>
              <span className="text-blue-400/50 text-[10px] uppercase tracking-wide">{item.l}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
