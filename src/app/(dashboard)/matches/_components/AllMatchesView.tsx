'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Match } from '@/lib/types'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'

const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

const FLAG: Record<string, string> = {
  'México': '🇲🇽', 'Estados Unidos': '🇺🇸', 'España': '🇪🇸',
  'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
}

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

function buildDateRange(first: string, last: string): string[] {
  const dates: string[] = []
  const cursor = new Date(first + 'T12:00:00')
  const end = new Date(last + 'T12:00:00')
  while (cursor <= end) {
    dates.push([
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, '0'),
      String(cursor.getDate()).padStart(2, '0'),
    ].join('-'))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function AllMatchesView({
  matches,
  clanDict,
  locale,
}: {
  matches: Match[]
  clanDict: Dict['clan']
  locale: Locale
}) {
  const byDate = new Map<string, Match[]>()
  for (const m of matches) {
    const key = toLocalDateKey(m.match_date)
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
  if (allDates.includes(today)) {
    initialDate = today
  } else if (today < allDates[0]) {
    initialDate = allDates[0]
  } else {
    initialDate = allDates[allDates.length - 1]
  }

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
          const d = new Date(date + 'T12:00:00')
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
                <GlobalMatchCard key={m.id} match={m} clanDict={clanDict} locale={locale} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function GlobalMatchCard({
  match,
  clanDict,
  locale,
}: {
  match: Match
  clanDict: Dict['clan']
  locale: Locale
}) {
  const isFinished = match.status === 'finished'

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-blue-400">{stageLabel(match.stage, locale)}</span>
        <StatusBadge status={match.status} clanDict={clanDict} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 text-right">
          <p className="text-white font-semibold flex items-center justify-end gap-2">
            {match.home_team ?? <TBD />}
            <span>{FLAG[match.home_team ?? ''] ?? (match.home_team ? '🏳️' : '')}</span>
          </p>
        </div>

        <div className="text-center px-3 min-w-[64px]">
          {isFinished ? (
            <p className="text-white font-bold text-lg">
              {match.home_score} – {match.away_score}
            </p>
          ) : (
            <div>
              <p className="text-blue-300/60 font-mono text-sm">
                {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-white font-semibold flex items-center gap-2">
            <span>{FLAG[match.away_team ?? ''] ?? (match.away_team ? '🏳️' : '')}</span>
            {match.away_team ?? <TBD />}
          </p>
        </div>
      </div>
    </div>
  )
}

function TBD() {
  return <span className="text-blue-400/60 font-normal text-sm">?</span>
}

function StatusBadge({ status, clanDict }: { status: string; clanDict: Dict['clan'] }) {
  if (status === 'live')
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 animate-pulse">
        {clanDict.status_live}
      </span>
    )
  if (status === 'finished')
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-blue-300">
        {clanDict.status_finished}
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
      {clanDict.status_upcoming}
    </span>
  )
}
