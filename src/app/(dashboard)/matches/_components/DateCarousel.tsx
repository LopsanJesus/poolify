'use client'

import { useState, useRef, useEffect } from 'react'
import { MatchCard } from '@/app/(dashboard)/clan/[id]/_components/MatchCard'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'

type MatchWithPrediction = Match & { prediction: Prediction | null }

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

function toLocalDateKey(isoString: string) {
  const d = new Date(isoString)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function todayKey() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function DateCarousel({
  matches,
  clanId,
  currentUserId,
  clanDict,
  commonDict,
  locale,
}: {
  matches: MatchWithPrediction[]
  clanId: string
  currentUserId: string
  clanDict: Dict['clan']
  commonDict: Dict['common']
  locale: Locale
}) {
  const byDate = new Map<string, MatchWithPrediction[]>()
  for (const m of matches) {
    const key = toLocalDateKey(m.match_date)
    const existing = byDate.get(key)
    if (existing) existing.push(m)
    else byDate.set(key, [m])
  }
  const dates = Array.from(byDate.keys()).sort()

  const today = todayKey()
  let initialDate: string
  if (dates.includes(today)) {
    initialDate = today
  } else {
    const future = dates.find((d) => d > today)
    const past = [...dates].reverse().find((d) => d < today)
    initialDate = future ?? past ?? dates[0]
  }

  const [selected, setSelected] = useState(initialDate)
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    const item = selectedRef.current
    if (!container || !item) return
    container.scrollLeft = item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2
  }, [])

  if (dates.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
        {clanDict.no_upcoming}
      </div>
    )
  }

  const dayMatches = byDate.get(selected) ?? []

  return (
    <div className="space-y-5">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {dates.map((date) => {
          const d = new Date(date + 'T12:00:00')
          const isToday = date === today
          const isSelected = date === selected
          const hasLive = (byDate.get(date) ?? []).some((m) => m.status === 'live')
          const dayName = d.toLocaleDateString(DATE_LOCALE[locale], { weekday: 'short' })
          const dayNum = d.getDate()
          const month = d.toLocaleDateString(DATE_LOCALE[locale], { month: 'short' })

          return (
            <button
              key={date}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => setSelected(date)}
              className={`flex flex-col items-center min-w-[52px] px-2 py-2.5 rounded-xl transition shrink-0 ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : isToday
                    ? 'bg-white/10 text-blue-200 ring-1 ring-blue-400/50'
                    : 'bg-white/5 text-blue-300 hover:bg-white/10'
              }`}
            >
              <span className="text-[10px] uppercase opacity-70 leading-none">{dayName}</span>
              <span className="text-lg font-bold leading-tight mt-0.5">{dayNum}</span>
              <span className="text-[10px] opacity-70 leading-none mt-0.5">{month}</span>
              {hasLive && (
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {dayMatches.map((m) => (
          <MatchCard
            key={m.id}
            clanId={clanId}
            match={m}
            currentUserId={currentUserId}
            clanDict={clanDict}
            commonDict={commonDict}
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}
