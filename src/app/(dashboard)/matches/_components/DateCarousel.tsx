'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MatchCard } from '@/app/(dashboard)/clan/[id]/_components/MatchCard'
import type { Match, Prediction } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'

type MatchWithPrediction = Match & { prediction: Prediction | null; matchDeadlinePassed: boolean }

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

// World Cup 2026 runs in UTC-6 (Mexico/Central). Using the tournament's timezone
// as the day boundary means a 20:00 local match (02:00 UTC next day) still shows
// under the correct matchday date rather than splitting to the following calendar day.
const TOURNAMENT_OFFSET_MS = -6 * 60 * 60 * 1000

function toMatchdayDateKey(isoString: string) {
  const d = new Date(new Date(isoString).getTime() + TOURNAMENT_OFFSET_MS)
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function todayKey() {
  const d = new Date(Date.now() + TOURNAMENT_OFFSET_MS)
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function buildDateRange(first: string, last: string): string[] {
  const dates: string[] = []
  const cursor = new Date(first + 'T12:00:00Z')
  const end = new Date(last + 'T12:00:00Z')
  while (cursor <= end) {
    dates.push([
      cursor.getUTCFullYear(),
      String(cursor.getUTCMonth() + 1).padStart(2, '0'),
      String(cursor.getUTCDate()).padStart(2, '0'),
    ].join('-'))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

export function DateCarousel({
  matches,
  clanId,
  currentUserId,
  clanDict,
  commonDict,
  locale,
  canEditLive = false,
  pointsExact,
  pointsSign,
  pointsAdvance,
}: {
  matches: MatchWithPrediction[]
  clanId: string
  currentUserId: string
  clanDict: Dict['clan']
  commonDict: Dict['common']
  locale: Locale
  canEditLive?: boolean
  pointsExact: number
  pointsSign: number
  pointsAdvance: number
}) {
  const byDate = new Map<string, MatchWithPrediction[]>()
  for (const m of matches) {
    const key = toMatchdayDateKey(m.match_date)
    const existing = byDate.get(key)
    if (existing) existing.push(m)
    else byDate.set(key, [m])
  }

  const matchDates = Array.from(byDate.keys()).sort()

  if (matchDates.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
        {clanDict.no_upcoming}
      </div>
    )
  }

  const allDates = buildDateRange(matchDates[0], matchDates[matchDates.length - 1])

  const today = todayKey()
  let initialDate: string
  // Jump to the latest day that has already started (or the first future day)
  const nextWithMatches = matchDates.find((d) => d >= today)
  initialDate = nextWithMatches ?? matchDates[matchDates.length - 1]

  const [selected, setSelected] = useState(initialDate)
  const [direction, setDirection] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const container = scrollRef.current
    const item = selectedRef.current
    if (!container || !item) return
    const scrollTo = item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2
    if (isFirstRender.current) {
      container.scrollLeft = scrollTo
      isFirstRender.current = false
    } else {
      container.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }, [selected])

  function handleSelect(date: string) {
    if (date === selected) return
    setDirection(date > selected ? 1 : -1)
    setSelected(date)
  }

  const dayMatches = byDate.get(selected) ?? []

  return (
    <div className="space-y-5">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {allDates.map((date) => {
          const d = new Date(date + 'T12:00:00Z')
          const isToday = date === today
          const isSelected = date === selected
          const hasMatches = byDate.has(date)
          const hasLive = (byDate.get(date) ?? []).some((m) => m.status === 'live')
          const dayName = d.toLocaleDateString(DATE_LOCALE[locale], { weekday: 'short' })
          const dayNum = d.getDate()
          const month = d.toLocaleDateString(DATE_LOCALE[locale], { month: 'short' })

          return (
            <button
              key={date}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => handleSelect(date)}
              className={`flex flex-col items-center min-w-[52px] px-2 py-2.5 rounded-xl transition shrink-0 ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : isToday
                    ? 'bg-white/10 text-blue-200 ring-1 ring-blue-400/50'
                    : hasMatches
                      ? 'bg-white/5 text-blue-300 hover:bg-white/10'
                      : 'bg-white/[0.02] text-blue-300/40 hover:bg-white/5'
              }`}
            >
              <span className="text-[10px] uppercase opacity-70 leading-none">{dayName}</span>
              <span className="text-lg font-bold leading-tight mt-0.5">{dayNum}</span>
              <span className="text-[10px] opacity-70 leading-none mt-0.5">{month}</span>
              {hasLive ? (
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              ) : hasMatches ? (
                <span className="mt-1 w-1 h-1 rounded-full bg-blue-400/60" />
              ) : (
                <span className="mt-1 w-1 h-1" />
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={selected}
          custom={direction}
          initial={{ x: direction > 0 ? 32 : -32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -32 : 32, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {dayMatches.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/40 text-sm">
              {clanDict.no_matches_day}
            </div>
          ) : (
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
                  isPastDeadline={m.matchDeadlinePassed}
                  canEditLive={canEditLive}
                  pointsExact={pointsExact}
                  pointsSign={pointsSign}
                  pointsAdvance={pointsAdvance}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
