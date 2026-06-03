'use client'

import { useActionState, useState, useTransition } from 'react'
import { Loader2, Check, Trophy, Users, Star, Plus, Trash2 } from 'lucide-react'
import { updateClanSettings } from '@/app/actions/clans'
import { removeClanMember } from '@/app/actions/clans'
import { saveTournamentResults } from '@/app/actions/tournament'
import type { ClanSettings } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'

type Member = { user_id: string; username: string }

export function ClanSettingsForm({
  clanId,
  settings,
  dict,
  commonDict,
  readOnly = false,
  members,
  currentUserId,
}: {
  clanId: string
  settings: ClanSettings
  dict: Dict['clan_settings']
  commonDict: Dict['common']
  readOnly?: boolean
  members: Member[]
  currentUserId: string
}) {
  const [state, action, pending] = useActionState(updateClanSettings, undefined)
  async function saveResults(_: { error?: string; success?: boolean } | undefined, fd: FormData) {
    return saveTournamentResults(clanId, fd)
  }
  const [resultsState, resultsAction, resultsPending] = useActionState(saveResults, undefined)

  const fp = settings.final_predictions
  const [customFields, setCustomFields] = useState(fp?.custom_fields ?? [])

  function addField() {
    setCustomFields((prev) => [...prev, { id: crypto.randomUUID(), label: '', points: 3 }])
  }
  function removeField(id: string) {
    setCustomFields((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* ── Scoring form ── */}
      <form action={readOnly ? undefined : action} className="space-y-6">
        <input type="hidden" name="clan_id" value={clanId} />
        {/* Sync custom fields as JSON */}
        <input type="hidden" name="custom_fields_json" value={JSON.stringify(customFields)} />

        {state?.error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> {dict.saved}
          </div>
        )}

        {/* Match scoring */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">{dict.section_scoring}</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-blue-300 mb-1.5">{dict.points_exact_label}</label>
              <input type="number" name="points_exact" min={0} max={100} defaultValue={settings.points_exact} disabled={readOnly}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-60 disabled:cursor-default" />
            </div>
            <div>
              <label className="block text-sm text-blue-300 mb-1.5">{dict.points_sign_label}</label>
              <input type="number" name="points_sign" min={0} max={100} defaultValue={settings.points_sign} disabled={readOnly}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-60 disabled:cursor-default" />
            </div>
          </div>
        </section>

        {/* Access */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-300" />
            <h2 className="text-white font-semibold">{dict.section_access}</h2>
          </div>
          <label className={`flex items-start gap-3 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
            <input type="checkbox" name="can_members_invite" defaultChecked={settings.can_members_invite} disabled={readOnly}
              className="mt-0.5 w-4 h-4 accent-emerald-500 disabled:opacity-60" />
            <div>
              <p className="text-white text-sm font-medium">{dict.can_members_invite_label}</p>
              <p className="text-blue-400 text-xs mt-0.5">{dict.can_members_invite_hint}</p>
            </div>
          </label>
        </section>

        {/* Final predictions config — owner only */}
        {!readOnly && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              <h2 className="text-white font-semibold">{dict.section_final_preds}</h2>
            </div>
            <p className="text-blue-400/70 text-xs">{dict.final_preds_hint}</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['final_winner_pts',    dict.winner_pts_label,     fp?.winner_pts    ?? 10],
                ['final_runner_up_pts', dict.runner_up_pts_label,  fp?.runner_up_pts ?? 7],
                ['final_semi1_pts',     dict.semi1_pts_label,      fp?.semi1_pts     ?? 5],
                ['final_semi2_pts',     dict.semi2_pts_label,      fp?.semi2_pts     ?? 5],
                ['final_top_scorer_pts',dict.top_scorer_pts_label, fp?.top_scorer_pts ?? 5],
              ].map(([name, label, def]) => (
                <div key={name as string}>
                  <label className="block text-xs text-blue-300 mb-1">{label as string}</label>
                  <input type="number" name={name as string} min={0} max={100} defaultValue={def as number}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
              ))}
            </div>

            {/* Custom fields */}
            <div className="space-y-2">
              <p className="text-sm text-blue-300 font-medium">{dict.custom_fields_label}</p>
              {customFields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={dict.custom_field_label_placeholder}
                    value={f.label}
                    onChange={(e) => setCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <input
                    type="number"
                    placeholder={dict.custom_field_pts_placeholder}
                    value={f.points}
                    min={0}
                    onChange={(e) => setCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, points: parseInt(e.target.value) || 0 } : x))}
                    className="w-16 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-center"
                  />
                  <button type="button" onClick={() => removeField(f.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addField}
                className="flex items-center gap-1.5 text-sm text-blue-300 hover:text-white transition">
                <Plus className="w-4 h-4" /> {dict.add_custom_field}
              </button>
            </div>
          </section>
        )}

        {!readOnly && (
          <button type="submit" disabled={pending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pending ? commonDict.saving : dict.save}
          </button>
        )}
      </form>

      {/* ── Members list ── */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-300" />
          <h2 className="text-white font-semibold">{dict.section_members}</h2>
        </div>
        <ul className="space-y-2">
          {members.map((m) => (
            <MemberRow
              key={m.user_id}
              member={m}
              clanId={clanId}
              isCurrentUser={m.user_id === currentUserId}
              canRemove={!readOnly && m.user_id !== currentUserId}
              dict={dict}
            />
          ))}
        </ul>
      </section>

      {/* ── Mark results (owner, after tournament) ── */}
      {!readOnly && (
        <form action={resultsAction} className="space-y-4">
          <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <h2 className="text-white font-semibold">{dict.section_results}</h2>
            </div>
            <p className="text-blue-400/70 text-xs">{dict.results_hint}</p>

            {resultsState?.error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">{resultsState.error}</div>
            )}
            {resultsState?.success && (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> {dict.results_saved}
              </div>
            )}

            {[
              ['res_winner',     dict.results_winner],
              ['res_runner_up',  dict.results_runner_up],
              ['res_semis',      dict.results_semis],
              ['res_top_scorer', dict.results_top_scorer],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="block text-sm text-blue-300 mb-1.5">{label}</label>
                <input type="text" name={name}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            ))}

            <button type="submit" disabled={resultsPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold transition disabled:opacity-60">
              {resultsPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {resultsPending ? commonDict.saving : dict.save_results}
            </button>
          </section>
        </form>
      )}
    </div>
  )
}

function MemberRow({
  member,
  clanId,
  isCurrentUser,
  canRemove,
  dict,
}: {
  member: Member
  clanId: string
  isCurrentUser: boolean
  canRemove: boolean
  dict: Dict['clan_settings']
}) {
  const [, startTransition] = useTransition()
  const [removed, setRemoved] = useState(false)

  if (removed) return null

  return (
    <li className="flex items-center justify-between gap-2 py-1">
      <span className={`text-sm ${isCurrentUser ? 'text-emerald-300 font-semibold' : 'text-white/80'}`}>
        @{member.username}
      </span>
      {canRemove && (
        <button
          type="button"
          onClick={() => {
            if (!confirm(dict.member_remove_confirm)) return
            startTransition(async () => {
              const res = await removeClanMember(clanId, member.user_id)
              if (!res.error) setRemoved(true)
            })
          }}
          className="text-xs px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition"
        >
          {dict.member_remove}
        </button>
      )}
    </li>
  )
}
