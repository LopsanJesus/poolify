'use client'

import { useState, useMemo } from 'react'
import { Check, Search, X } from 'lucide-react'
import { Modal } from './Modal'
import { FlagImage } from './FlagImage'
import type { Team } from '@/lib/types'
import { TEAM_FLAG_CODE } from '@/lib/team-flags'

// Synthetic team list from the static flag map — used when the DB teams table is empty
const FALLBACK_TEAMS: Team[] = Object.keys(TEAM_FLAG_CODE)
  .sort()
  .map((name) => ({
    id: name,
    name,
    flag_code: TEAM_FLAG_CODE[name] ?? null,
    tournament_id: null,
    created_at: '',
  }))

export function TeamPickerModal({
  open,
  onClose,
  title,
  teams,
  value,
  onChange,
  excluded = [],
}: {
  open: boolean
  onClose: () => void
  title: string
  teams: Team[]
  value: string
  onChange: (name: string) => void
  excluded?: string[]
}) {
  const [search, setSearch] = useState('')
  const source = teams.length > 0 ? teams : FALLBACK_TEAMS

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return q ? source.filter((t) => t.name.toLowerCase().includes(q)) : source
  }, [source, search])

  function handleSelect(name: string) {
    onChange(name)
    setSearch('')
    onClose()
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/60 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo…"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Flag grid */}
      <div className="overflow-y-auto max-h-[55vh]">
        {filtered.length === 0 ? (
          <p className="text-center text-blue-400/50 text-sm py-8">Sin resultados</p>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {filtered.map((team) => {
              const isSelected = team.name === value
              const isExcluded = excluded.includes(team.name)
              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={isExcluded}
                  onClick={() => handleSelect(team.name)}
                  title={team.name}
                  className={`relative flex items-center justify-center p-1 rounded-xl transition ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 bg-emerald-500/20'
                      : isExcluded
                        ? 'opacity-25 cursor-not-allowed'
                        : 'hover:bg-white/10 active:bg-white/20'
                  }`}
                >
                  <FlagImage team={team.name} size={36} />
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected team name */}
      {value && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
          <FlagImage team={value} size={20} />
          <span className="text-sm text-emerald-300 font-medium">{value}</span>
          <button
            type="button"
            onClick={() => { onChange(''); onClose() }}
            className="ml-auto text-xs text-blue-400/60 hover:text-red-400 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </Modal>
  )
}

// ── Picker button ──────────────────────────────────────────────

export function TeamPickerButton({
  value,
  placeholder,
  onClick,
  accentClass = 'ring-emerald-500',
}: {
  value: string
  placeholder: string
  onClick: () => void
  accentClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition focus:outline-none focus:ring-2 ${accentClass}`}
    >
      {value ? (
        <>
          <FlagImage team={value} size={22} className="shrink-0" />
          <span className="text-white text-sm font-medium truncate flex-1 text-left">{value}</span>
        </>
      ) : (
        <span className="text-blue-400/50 text-sm flex-1 text-left">{placeholder}</span>
      )}
      <span className="text-blue-400/40 text-xs shrink-0">▾</span>
    </button>
  )
}
