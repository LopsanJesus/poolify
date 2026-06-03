'use client'

import { useState } from 'react'
import { UserPlus, Check } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'

export function InviteButton({
  inviteCode,
  dict,
}: {
  inviteCode: string
  dict: Dict['invite']
}) {
  const [copied, setCopied] = useState(false)

  async function handleInvite() {
    const url = `${window.location.origin}/join/${inviteCode}`
    if (navigator.share) {
      try { await navigator.share({ url }) } catch { /* user cancelled */ }
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleInvite}
      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-blue-200 hover:text-white transition text-sm"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <UserPlus className="w-4 h-4" />}
      <span className="hidden sm:inline">{copied ? dict.link_copied : dict.button}</span>
    </button>
  )
}
