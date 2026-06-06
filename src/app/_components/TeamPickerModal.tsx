'use client'

import { useState, useMemo } from 'react'
import { Check, Search } from 'lucide-react'
import { Modal } from './Modal'
import { FlagImage } from './FlagImage'
import type { Team } from '@/lib/types'

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return q ? teams.filter((t) => t.name.toLowerCase().includes(q)) : teams
  }, [teams, search])

  function handleSelect(name: string) {
    onChange(name)
    setSearch('')
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { setSearch(''); onClose() }} title={title}>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/60 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          autoFocus
        />
      </div>

      {/* Team list */}
      <div className="space-y-1 max-h-[55vh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-blue-400/50 text-sm py-6">Sin resultados</p>
        )}
        {filtered.map((team) => {
          const isSelected = team.name === value
          const isExcluded = excluded.includes(team.name)
          return (
            <button
              key={team.id}
              type="button"
              disabled={isExcluded}
              onClick={() => handleSelect(team.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                isSelected
                  ? 'bg-emerald-500/20 border border-emerald-500/40'
                  : isExcluded
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white/10'
              }`}
            >
              <FlagImage team={team.name} size={24} className="shrink-0" />
              <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                {team.name}
              </span>
              {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>
          )
        })}
      </div>
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
