'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'
import { InviteModal } from './InviteModal'

export function InviteButton({
  inviteCode,
  dict,
}: {
  inviteCode: string
  dict: Dict['invite']
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-blue-200 hover:text-white transition text-sm"
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">{dict.button}</span>
      </button>

      <InviteModal
        open={open}
        onClose={() => setOpen(false)}
        inviteCode={inviteCode}
        dict={dict}
      />
    </>
  )
}
