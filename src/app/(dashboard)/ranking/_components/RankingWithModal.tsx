'use client'

import { useState } from 'react'
import { Star, Target } from 'lucide-react'
import { Modal } from '@/app/_components/Modal'
import type { Dict } from '@/lib/i18n/dictionaries'
import type { PersonalInfo } from '@/app/actions/personal-info'

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

export function RankingWithModal({
  ranking,
  currentUserId,
  clanDict,
  personalInfoMap,
}: {
  ranking: RankingEntry[]
  currentUserId: string
  clanDict: Dict['clan']
  personalInfoMap: PersonalInfoMap
}) {
  const [selected, setSelected] = useState<{ entry: RankingEntry; info: PersonalInfo | null } | null>(null)

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
              onClick={() => setSelected({ entry, info: personalInfoMap[entry.user_id] ?? null })}
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
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function PersonalInfoModal({
  entry,
  info,
  onClose,
}: {
  entry: RankingEntry
  info: PersonalInfo | null
  onClose: () => void
}) {
  const hasInfo = info && (
    info.bet_amount != null || info.religion || info.sexual_orientation || info.race || info.fav_cabo_verde_player
  )

  return (
    <Modal open title={entry.username} onClose={onClose}>
      {!hasInfo ? (
        <p className="text-blue-400/60 text-sm italic py-2">Este usuario no ha rellenado su información personal.</p>
      ) : (
        <div className="space-y-3">
          {info.bet_amount != null && (
            <InfoRow label="Apuesta" value={`${info.bet_amount} €`} />
          )}
          {info.religion && <InfoRow label="Religión" value={info.religion} />}
          {info.sexual_orientation && <InfoRow label="Orientación sexual" value={info.sexual_orientation} />}
          {info.race && <InfoRow label="Raza" value={info.race} />}
          {info.fav_cabo_verde_player && <InfoRow label="Jugador Cabo Verde favorito" value={info.fav_cabo_verde_player} />}
        </div>
      )}
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
