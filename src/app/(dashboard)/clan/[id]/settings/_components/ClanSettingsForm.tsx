'use client'

import { useActionState, useState, useTransition } from 'react'
import { Loader2, Check, Trophy, Users, Star, ShieldAlert } from 'lucide-react'
import { updateClanSettings, updateFinalPredictionsConfig, removeClanMember, transferClanOwnership } from '@/app/actions/clans'
import { saveTournamentResults } from '@/app/actions/tournament'
import type { ClanSettings, Team } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'
import { TeamPickerModal, TeamPickerButton } from '@/app/_components/TeamPickerModal'

type Member = { user_id: string; username: string }
type ResKey = 'res_winner' | 'res_runner_up' | 'res_semi1' | 'res_semi2'

export function ClanSettingsForm({
  clanId,
  settings,
  dict,
  commonDict,
  readOnly = false,
  members,
  currentUserId,
  teams = [],
}: {
  clanId: string
  settings: ClanSettings
  dict: Dict['clan_settings']
  commonDict: Dict['common']
  readOnly?: boolean
  members: Member[]
  currentUserId: string
  teams?: Team[]
}) {
  const [state, action, pending] = useActionState(updateClanSettings, undefined)
  const [finalState, finalAction, finalPending] = useActionState(updateFinalPredictionsConfig, undefined)
  async function saveResults(_: { error?: string; success?: boolean } | undefined, fd: FormData) {
    return saveTournamentResults(clanId, fd)
  }
  const [resultsState, resultsAction, resultsPending] = useActionState(saveResults, undefined)

  const fp = settings.final_predictions

  const [resSelections, setResSelections] = useState<Record<ResKey, string>>({
    res_winner: '', res_runner_up: '', res_semi1: '', res_semi2: '',
  })
  const [openResPicker, setOpenResPicker] = useState<ResKey | null>(null)
  function setRes(key: ResKey, val: string) { setResSelections((s) => ({ ...s, [key]: val })) }
  function resExcluded(key: ResKey) {
    return (Object.entries(resSelections) as [ResKey, string][])
      .filter(([k, v]) => k !== key && v !== '').map(([, v]) => v)
  }

  return (
    <div className="space-y-6">
      {/* ── Scoring + Access form ── */}
      <form action={readOnly ? undefined : action} className="space-y-6">
        <input type="hidden" name="clan_id" value={clanId} />

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

        {!readOnly && (
          <button type="submit" disabled={pending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pending ? commonDict.saving : dict.save}
          </button>
        )}
      </form>

      {/* ── Final predictions config form — owner only ── */}
      {!readOnly && (
        <form action={finalAction} className="space-y-4">
          <input type="hidden" name="clan_id" value={clanId} />

          <section className="rounded-2xl bg-purple-500/5 border border-purple-500/20 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              <h2 className="text-white font-semibold">{dict.section_final_preds}</h2>
            </div>
            <p className="text-blue-400/70 text-xs">{dict.final_preds_hint}</p>

            {finalState?.error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
                {finalState.error}
              </div>
            )}
            {finalState?.success && (
              <div className="rounded-lg bg-purple-500/20 border border-purple-500/40 px-4 py-3 text-purple-300 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> {dict.saved}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                ['final_winner_pts',     dict.winner_pts_label,     fp?.winner_pts     ?? 10],
                ['final_runner_up_pts',  dict.runner_up_pts_label,  fp?.runner_up_pts  ?? 7],
                ['final_semi1_pts',      dict.semi1_pts_label,      fp?.semi1_pts      ?? 5],
                ['final_semi2_pts',      dict.semi2_pts_label,      fp?.semi2_pts      ?? 5],
                ['final_top_scorer_pts', dict.top_scorer_pts_label, fp?.top_scorer_pts ?? 5],
              ].map(([name, label, def]) => (
                <div key={name as string}>
                  <label className="block text-xs text-blue-300 mb-1">{label as string}</label>
                  <input type="number" name={name as string} min={0} max={100} defaultValue={def as number}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
                </div>
              ))}
            </div>
          </section>

          <button type="submit" disabled={finalPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold transition disabled:opacity-60">
            {finalPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {finalPending ? commonDict.saving : dict.save}
          </button>
        </form>
      )}

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

      {/* ── Transfer ownership (owner only) ── */}
      {!readOnly && (
        <TransferOwnershipSection
          clanId={clanId}
          members={members}
          currentUserId={currentUserId}
          dict={dict}
        />
      )}

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

            {/* Hidden inputs carry team picker selections */}
            {(['res_winner', 'res_runner_up', 'res_semi1', 'res_semi2'] as ResKey[]).map((k) =>
              resSelections[k] ? <input key={k} type="hidden" name={k} value={resSelections[k]} /> : null
            )}

            {([
              ['res_winner',    dict.results_winner]    as const,
              ['res_runner_up', dict.results_runner_up] as const,
              ['res_semi1',     dict.results_semi1]     as const,
              ['res_semi2',     dict.results_semi2]     as const,
            ] as [ResKey, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm text-blue-300 mb-1.5">{label}</label>
                <TeamPickerButton
                  value={resSelections[key]}
                  placeholder="—"
                  onClick={() => setOpenResPicker(key)}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm text-blue-300 mb-1.5">{dict.results_top_scorer}</label>
              <input type="text" name="res_top_scorer"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>

            {/* Team picker modals for results */}
            {([
              ['res_winner',    dict.results_winner]    as const,
              ['res_runner_up', dict.results_runner_up] as const,
              ['res_semi1',     dict.results_semi1]     as const,
              ['res_semi2',     dict.results_semi2]     as const,
            ] as [ResKey, string][]).map(([key, label]) => (
              <TeamPickerModal
                key={key}
                open={openResPicker === key}
                onClose={() => setOpenResPicker(null)}
                title={label}
                teams={teams}
                value={resSelections[key]}
                onChange={(name) => setRes(key, name)}
                excluded={resExcluded(key)}
              />
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

function TransferOwnershipSection({
  clanId,
  members,
  currentUserId,
  dict,
}: {
  clanId: string
  members: Member[]
  currentUserId: string
  dict: Dict['clan_settings']
}) {
  const otherMembers = members.filter((m) => m.user_id !== currentUserId)
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleTransfer() {
    if (!selected) return
    if (!confirm(dict.transfer_confirm)) return
    setError(null)
    startTransition(async () => {
      const res = await transferClanOwnership(clanId, selected)
      if (res.error) {
        setError(res.error)
      } else {
        setDone(true)
      }
    })
  }

  return (
    <section className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-red-400" />
        <h2 className="text-white font-semibold">{dict.section_transfer}</h2>
      </div>
      <p className="text-blue-400/70 text-xs">{dict.transfer_hint}</p>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}
      {done && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.transfer_done}
        </div>
      )}

      {!done && (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition disabled:opacity-60 text-sm"
          >
            <option value="" disabled className="bg-blue-950">{dict.transfer_select}</option>
            {otherMembers.map((m) => (
              <option key={m.user_id} value={m.user_id} className="bg-blue-950">
                @{m.username}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={!selected || isPending}
            className="px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {dict.transfer_cta}
          </button>
        </div>
      )}
    </section>
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
