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

export function AllMatchesView({
  matches,
  clanDict,
  locale,
}: {
  matches: Match[]
  clanDict: Dict['clan']
  locale: Locale
}) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-blue-400/70 text-sm">
        {clanDict.no_upcoming}
      </div>
    )
  }

  const byDate = new Map<string, Match[]>()
  for (const m of matches) {
    const key = toLocalDateKey(m.match_date)
    const existing = byDate.get(key)
    if (existing) existing.push(m)
    else byDate.set(key, [m])
  }

  const sortedDates = Array.from(byDate.keys()).sort()

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const d = new Date(dateKey + 'T12:00:00')
        const label = d.toLocaleDateString(DATE_LOCALE[locale], {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const dayMatches = byDate.get(dateKey)!

        return (
          <section key={dateKey}>
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3 capitalize">
              {label}
            </h2>
            <div className="space-y-2">
              {dayMatches.map((m) => (
                <MatchRow key={m.id} match={m} clanDict={clanDict} locale={locale} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MatchRow({
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
    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="text-white font-medium truncate text-sm">
            {match.home_team ?? <span className="text-blue-400/60">?</span>}
          </span>
          <span className="shrink-0">{FLAG[match.home_team ?? ''] ?? (match.home_team ? '🏳️' : '')}</span>
        </div>

        {/* Score / time */}
        <div className="shrink-0 w-20 text-center">
          {isFinished ? (
            <span className="text-white font-bold tabular-nums">
              {match.home_score} – {match.away_score}
            </span>
          ) : match.status === 'live' ? (
            <span className="text-red-400 font-bold text-xs animate-pulse">{clanDict.status_live}</span>
          ) : (
            <span className="text-blue-300/70 font-mono text-sm tabular-nums">
              {new Date(match.match_date).toLocaleTimeString(DATE_LOCALE[locale], {
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="shrink-0">{FLAG[match.away_team ?? ''] ?? (match.away_team ? '🏳️' : '')}</span>
          <span className="text-white font-medium truncate text-sm">
            {match.away_team ?? <span className="text-blue-400/60">?</span>}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-blue-400/70">{stageLabel(match.stage, locale)}</span>
        {isFinished && (
          <span className="text-xs text-blue-400/50">{clanDict.status_finished}</span>
        )}
      </div>
    </div>
  )
}
