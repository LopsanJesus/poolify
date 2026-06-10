'use client'

import { useState } from 'react'
import { Star, Target } from 'lucide-react'
import { Modal } from '@/app/_components/Modal'
import type { Dict } from '@/lib/i18n/dictionaries'
import type { PersonalInfo } from '@/app/actions/personal-info'
import type { TournamentPrediction, FinalPredictionsConfig } from '@/lib/types'

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-300', 'text-orange-400']
const COLS = '2.5rem 1fr 3.5rem 3.5rem'

type RankingEntry = {
  user_id: string
  username: string
  total: number
  exact: number
  winner: number
}

type PersonalInfoMap = Record<string, PersonalInfo | null>
type FinalPredsMap = Record<string, TournamentPrediction>

export function RankingWithModal({
  ranking,
  currentUserId,
  clanDict,
  personalInfoMap,
  finalPredsMap = {},
  isPastDeadline = false,
  finalPredictionsConfig = null,
  finalPredictionsDict,
}: {
  ranking: RankingEntry[]
  currentUserId: string
  clanDict: Dict['clan']
  personalInfoMap: PersonalInfoMap
  finalPredsMap?: FinalPredsMap
  isPastDeadline?: boolean
  finalPredictionsConfig?: FinalPredictionsConfig | null
  finalPredictionsDict?: Dict['final_predictions']
}) {
  const [selected, setSelected] = useState<{
    entry: RankingEntry
    info: PersonalInfo | null
    finalPred: TournamentPrediction | null
  } | null>(null)

  return (
    <>
      <div
        className="rounded-xl border border-white/10 overflow-hidden grid"
        style={{ gridTemplateColumns: COLS }}
      >
        <div className="contents">
          <span className="px-4 py-3 border-b border-white/10 text-blue-400/70">#</span>
          <span className="px-4 py-3 border-b border-white/10 text-blue-400/70 text-xs uppercase tracking-wide">{clanDict.ranking_name}</span>
          <span className="px-4 py-3 border-b border-white/10 text-blue-400/70"><Target className="w-3.5 h-3.5" /></span>
          <span className="px-4 py-3 border-b border-white/10 text-blue-400/70"><Star className="w-3.5 h-3.5" /></span>
        </div>

        {ranking.map((entry, i) => {
          const isMe = entry.user_id === currentUserId
          const cell = `px-4 py-3 flex items-center border-b border-white/5 text-sm cursor-pointer hover:bg-white/5 transition ${isMe ? 'bg-emerald-500/10' : ''}`
          return (
            <div
              key={entry.user_id}
              className="contents"
              onClick={() => setSelected({
                entry,
                info: personalInfoMap[entry.user_id] ?? null,
                finalPred: finalPredsMap[entry.user_id] ?? null,
              })}
            >
              <div className={cell}>
                <span className={`font-mono font-bold text-xs ${i < 3 ? MEDAL_COLORS[i] : 'text-blue-400'}`}>
                  #{i + 1}
                </span>
              </div>
              <div className={`${cell} gap-1 min-w-0`}>
                <span className={`font-semibold truncate ${isMe ? 'text-emerald-300' : 'text-white'}`}>
                  {entry.username}
                </span>
                {isMe && (
                  <span className="text-xs text-emerald-400 shrink-0">({clanDict.you})</span>
                )}
              </div>
              <div className={`${cell} text-white/80`}>{entry.exact}</div>
              <div className={`${cell} font-bold text-white`}>{entry.total}</div>
            </div>
          )
        })}
      </div>

      {selected && (
        <PersonalInfoModal
          entry={selected.entry}
          info={selected.info}
          finalPred={selected.finalPred}
          isPastDeadline={isPastDeadline}
          finalPredictionsConfig={finalPredictionsConfig}
          finalPredictionsDict={finalPredictionsDict}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function PersonalInfoModal({
  entry,
  info,
  finalPred,
  isPastDeadline,
  finalPredictionsConfig,
  finalPredictionsDict,
  onClose,
}: {
  entry: RankingEntry
  info: PersonalInfo | null
  finalPred: TournamentPrediction | null
  isPastDeadline: boolean
  finalPredictionsConfig: FinalPredictionsConfig | null
  finalPredictionsDict?: Dict['final_predictions']
  onClose: () => void
}) {
  const hasInfo = info && (
    info.bet_amount != null || info.religion || info.sexual_orientation || info.race || info.fav_cabo_verde_player
  )

  const showFinalPreds = isPastDeadline && finalPredictionsConfig && finalPred && finalPredictionsDict

  return (
    <Modal open title={entry.username} onClose={onClose}>
      <div className="space-y-4">
        {!hasInfo ? (
          <p className="text-blue-400/60 text-sm italic py-2">Este usuario no ha rellenado su información personal.</p>
        ) : (
          <div className="space-y-0">
            {info.bet_amount != null && (
              <InfoRow label="Apuesta" value={`${info.bet_amount} €`} />
            )}
            {info.religion && <InfoRow label="Religión" value={info.religion} />}
            {info.sexual_orientation && <InfoRow label="Orientación sexual" value={info.sexual_orientation} />}
            {info.race && <InfoRow label="Raza" value={info.race} />}
            {info.fav_cabo_verde_player && <InfoRow label="Jugador Cabo Verde favorito" value={info.fav_cabo_verde_player} />}
          </div>
        )}

        {showFinalPreds && (
          <div className="space-y-0 pt-2 border-t border-white/10">
            <p className="text-purple-400/80 text-xs uppercase tracking-wide font-semibold pb-2 flex items-center gap-1.5">
              <Star className="w-3 h-3" />
              {finalPredictionsDict.title}
            </p>
            {finalPred.winner && <InfoRow label={finalPredictionsDict.field_winner} value={finalPred.winner} />}
            {finalPred.runner_up && <InfoRow label={finalPredictionsDict.field_runner_up} value={finalPred.runner_up} />}
            {finalPred.semi1 && <InfoRow label={finalPredictionsDict.field_semi1} value={finalPred.semi1} />}
            {finalPred.semi2 && <InfoRow label={finalPredictionsDict.field_semi2} value={finalPred.semi2} />}
            {finalPred.top_scorer && <InfoRow label={finalPredictionsDict.field_top_scorer} value={finalPred.top_scorer} />}
            {finalPredictionsConfig.custom_fields?.map((f) =>
              finalPred.custom_answers?.[f.id] ? (
                <InfoRow key={f.id} label={f.label} value={finalPred.custom_answers[f.id]} />
              ) : null
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-blue-400 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}
