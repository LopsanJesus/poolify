'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'
import type { AuditClanOption, AuditEntry, ClanAudit } from '@/app/actions/audit'
import { recalcAllFinishedMatchPoints } from '@/app/actions/admin'
import type { Dict, Locale } from '@/lib/i18n/dictionaries'
import { stageLabel } from '@/lib/stages'
import { translateTeam } from '@/lib/team-flags'
import { formatMatchScore } from '@/lib/scoring'

function formatDiff(diff: number): string {
  if (diff === 0) return '0'
  return diff > 0 ? `+${diff}` : `${diff}`
}

export function ClanAuditView({
  clans,
  selectedClanId,
  audit,
  dict,
  locale,
}: {
  clans: AuditClanOption[]
  selectedClanId: string | null
  audit: ClanAudit | null
  dict: Dict['admin']
  locale: Locale
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fixMsg, setFixMsg] = useState<string | null>(null)

  function handleFix() {
    if (!window.confirm(dict.audit_fix_confirm)) return
    setFixMsg(null)
    startTransition(async () => {
      const res = await recalcAllFinishedMatchPoints()
      if (res.error) setFixMsg(`Error: ${res.error}`)
      else {
        setFixMsg(dict.audit_fix_success.replace('{n}', String(res.updated ?? 0)))
        router.refresh()
      }
    })
  }

  if (clans.length === 0) {
    return <p className="text-center text-blue-400/70 text-sm py-6">{dict.audit_no_clans}</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleFix}
          disabled={pending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm font-semibold transition disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {dict.audit_fix_button}
        </button>
        {fixMsg && (
          <p className={`text-xs ${fixMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {fixMsg}
          </p>
        )}
      </div>

      <select
        value={selectedClanId ?? ''}
        onChange={(e) => router.push(`/admin/auditar?clan=${e.target.value}`)}
        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {clans.map((c) => (
          <option key={c.id} value={c.id} className="bg-slate-900">
            {c.name}
          </option>
        ))}
      </select>

      {audit && audit.entries.length === 0 && (
        <p className="text-center text-blue-400/70 text-sm py-6">{dict.audit_no_predictions}</p>
      )}

      {audit && audit.entries.length > 0 && (
        <>
          <div
            className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
              audit.has_discrepancy
                ? 'bg-amber-500/10 border-amber-400/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
            }`}
          >
            {audit.has_discrepancy ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{audit.has_discrepancy ? dict.audit_discrepancies_found : dict.audit_all_match}</span>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 text-xs font-semibold text-blue-400/70 uppercase tracking-wide bg-white/5">
              <span>{dict.audit_table_user}</span>
              <span className="text-right">{dict.audit_table_current}</span>
              <span className="text-right">{dict.audit_table_audited}</span>
              <span className="text-right">{dict.audit_table_diff}</span>
            </div>
            {audit.entries.map((entry, i) => (
              <AuditRow key={entry.user_id} entry={entry} position={i + 1} dict={dict} locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AuditRow({
  entry,
  position,
  dict,
  locale,
}: {
  entry: AuditEntry
  position: number
  dict: Dict['admin']
  locale: Locale
}) {
  const [expanded, setExpanded] = useState(false)
  const hasMismatches = entry.mismatches.length > 0 || entry.final_mismatch !== null

  return (
    <div className="bg-white/[0.02]">
      <button
        type="button"
        onClick={() => hasMismatches && setExpanded((v) => !v)}
        disabled={!hasMismatches}
        className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-3 items-center text-left disabled:cursor-default"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-blue-400/50 text-xs w-5 shrink-0">{position}</span>
          <span className="text-white text-sm font-medium truncate">{entry.username}</span>
          {hasMismatches &&
            (expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
            ))}
        </span>
        <span className="text-blue-200 text-sm text-right">{entry.current_total}</span>
        <span className="text-white text-sm font-semibold text-right">{entry.audited_total}</span>
        <span className={`text-sm font-bold text-right ${entry.diff === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatDiff(entry.diff)}
        </span>
      </button>

      {expanded && hasMismatches && (
        <div className="px-4 pb-3 space-y-2">
          {entry.final_mismatch && (
            <div className="rounded-lg bg-black/20 border border-purple-400/20 p-3 text-xs space-y-1">
              <p className="text-purple-400/60 uppercase tracking-wide text-[10px]">{dict.audit_final_predictions_title}</p>
              <p className="text-blue-400/70">
                {dict.audit_mismatch_stored}: <span className="text-red-300 font-semibold">{entry.final_mismatch.stored_points}</span>
                {' → '}
                {dict.audit_mismatch_audited}: <span className="text-emerald-300 font-semibold">{entry.final_mismatch.audited_points}</span>
              </p>
              <p className="text-yellow-400/60 font-mono text-[10px]">
                {entry.final_mismatch.breakdown.filter((b) => b.picked).map((b) => `${b.field}=${b.points}`).join(' | ')}
              </p>
            </div>
          )}
          {entry.mismatches.map((m) => {
            const homeName = m.home_team ? translateTeam(m.home_team, locale) : '?'
            const awayName = m.away_team ? translateTeam(m.away_team, locale) : '?'
            const qualifierName = m.qualifier === 'home' ? homeName : m.qualifier === 'away' ? awayName : null
            return (
              <div key={m.match_id} className="rounded-lg bg-black/20 border border-white/10 p-3 text-xs space-y-1">
                <p className="text-blue-400/50 uppercase tracking-wide text-[10px]">{stageLabel(m.stage, locale)}</p>
                <p className="text-blue-300">
                  {dict.audit_mismatch_result}: {homeName} {formatMatchScore(m.home_score)}-{formatMatchScore(m.away_score)} {awayName}
                </p>
                <p className="text-blue-400/70">
                  {dict.audit_mismatch_predicted}: {m.pred_home}-{m.pred_away}
                  {qualifierName && ` (${qualifierName})`}
                </p>
                <p className="text-blue-400/70">
                  {dict.audit_mismatch_stored}: <span className="text-red-300 font-semibold">{m.stored_points}</span>
                  {' → '}
                  {dict.audit_mismatch_audited}: <span className="text-emerald-300 font-semibold">{m.audited_points}</span>
                </p>
                {m.debug_scoring && (
                  <p className="text-yellow-400/60 font-mono text-[10px]">
                    cfg: sign={m.debug_scoring.points_sign} exact={m.debug_scoring.points_exact} adv={m.debug_scoring.points_advance} | score={m.debug_scoring.score_pts} adv={m.debug_scoring.advance_pts} rc={m.debug_scoring.used_round_config ? 'yes' : 'no'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
