'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Star, Target } from 'lucide-react'
import type { AuditClanOption } from '@/app/actions/audit'
import type { FinalAuditEntry, FinalAuditMatchItem, FinalAuditResult } from '@/app/actions/final-audit'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'
import { translateTeam } from '@/lib/team-flags'
import { formatMatchScore } from '@/lib/scoring'

export function FinalAuditView({
  clans,
  selectedClanId,
  audit,
  dict,
  locale,
}: {
  clans: AuditClanOption[]
  selectedClanId: string | null
  audit: FinalAuditResult | null
  dict: Dict['admin']
  locale: Locale
}) {
  const router = useRouter()

  if (clans.length === 0) {
    return <p className="text-center text-blue-400/70 text-sm py-6">{dict.audit_no_clans}</p>
  }

  return (
    <div className="space-y-4">
      <select
        value={selectedClanId ?? ''}
        onChange={(e) => router.push(`/admin/final-audit?clan=${e.target.value}`)}
        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {clans.map((c) => (
          <option key={c.id} value={c.id} className="bg-slate-900">
            {c.name}
          </option>
        ))}
      </select>

      {audit && audit.entries.length === 0 && (
        <p className="text-center text-blue-400/70 text-sm py-6">{dict.final_audit_no_data}</p>
      )}

      {audit && audit.entries.length > 0 && (
        <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-2 text-xs font-semibold text-blue-400/70 uppercase tracking-wide bg-white/5">
            <span>{dict.audit_table_user}</span>
            <span className="text-right">{dict.final_audit_table_group}</span>
            <span className="text-right">{dict.final_audit_table_elimination}</span>
            <span className="text-right">{dict.final_audit_table_final}</span>
            <span className="text-right"><Target className="w-3.5 h-3.5 inline" /></span>
            <span className="text-right">{dict.final_audit_table_total}</span>
          </div>
          {audit.entries.map((entry, i) => (
            <FinalAuditRow key={entry.user_id} entry={entry} position={i + 1} dict={dict} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}

function FinalAuditRow({
  entry,
  position,
  dict,
  locale,
}: {
  entry: FinalAuditEntry
  position: number
  dict: Dict['admin']
  locale: Locale
}) {
  const [expanded, setExpanded] = useState(false)

  const groupMatches = entry.matches.filter((m) => !m.is_elimination)
  const eliminationMatches = entry.matches.filter((m) => m.is_elimination)

  return (
    <div className="bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-3 items-center text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-blue-400/50 text-xs w-5 shrink-0">{position}</span>
          <span className="text-white text-sm font-medium truncate">{entry.username}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
          )}
        </span>
        <span className="text-blue-200 text-sm text-right">{entry.group_points}</span>
        <span className="text-blue-200 text-sm text-right">{entry.elimination_points}</span>
        <span className="text-purple-300 text-sm text-right">{entry.final_prediction_points}</span>
        <span className="text-blue-200 text-sm text-right">{entry.exact_count}</span>
        <span className="text-white text-sm font-bold text-right">{entry.total}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {groupMatches.length > 0 && (
            <MatchGroup title={dict.final_audit_section_group} matches={groupMatches} locale={locale} />
          )}
          {eliminationMatches.length > 0 && (
            <MatchGroup title={dict.final_audit_section_elimination} matches={eliminationMatches} locale={locale} />
          )}

          {entry.final_predictions.length > 0 && (
            <div className="rounded-lg bg-black/20 border border-purple-400/20 p-3 space-y-1.5">
              <p className="text-purple-400/80 text-xs uppercase tracking-wide font-semibold flex items-center gap-1.5">
                <Star className="w-3 h-3" />
                {dict.final_audit_section_final}
              </p>
              {entry.final_predictions.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-blue-300 truncate">
                    {item.label}
                    {item.picked && <span className="text-blue-400/60"> — {translateTeam(item.picked, locale)}</span>}
                  </span>
                  <span className={`font-semibold shrink-0 ml-2 ${item.points > 0 ? 'text-emerald-300' : 'text-blue-400/50'}`}>
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MatchGroup({
  title,
  matches,
  locale,
}: {
  title: string
  matches: FinalAuditMatchItem[]
  locale: Locale
}) {
  return (
    <div className="rounded-lg bg-black/20 border border-white/10 p-3 space-y-1.5">
      <p className="text-blue-400/50 uppercase tracking-wide text-[10px] font-semibold">{title}</p>
      {matches.map((m) => {
        const homeName = m.home_team ? translateTeam(m.home_team, locale) : '?'
        const awayName = m.away_team ? translateTeam(m.away_team, locale) : '?'
        return (
          <div key={m.match_id} className="flex items-center justify-between text-xs gap-2">
            <span className="text-blue-300 truncate">
              <span className="text-blue-400/50">{stageLabel(m.stage, locale)}</span>{' '}
              {homeName} {formatMatchScore(m.home_score)}-{formatMatchScore(m.away_score)} {awayName}
              {' '}
              <span className="text-blue-400/50">({m.pred_home}-{m.pred_away})</span>
            </span>
            <span className={`font-semibold shrink-0 ${m.points > 0 ? 'text-emerald-300' : 'text-blue-400/50'}`}>
              +{m.points}
            </span>
          </div>
        )
      })}
    </div>
  )
}
