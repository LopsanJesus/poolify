'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { Modal } from '@/app/_components/Modal'
import type { Dict } from '@/lib/i18n/dictionaries'

export function InviteModal({
  open,
  onClose,
  inviteCode,
  dict,
}: {
  open: boolean
  onClose: () => void
  inviteCode: string
  dict: Dict['invite']
}) {
  const [copied, setCopied] = useState(false)

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ url: inviteUrl }) } catch { /* cancelled */ }
    } else {
      await handleCopy()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={dict.modal_title}>
      <div className="space-y-4">
        {/* Link display */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <span className="text-blue-300 text-sm truncate flex-1 font-mono">
            {inviteUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition text-blue-400 hover:text-white"
            aria-label={dict.link_copied}
          >
            {copied
              ? <Check className="w-4 h-4 text-emerald-400" />
              : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {copied && (
          <p className="text-center text-sm text-emerald-400">{dict.link_copied}</p>
        )}

        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition"
        >
          <Share2 className="w-4 h-4" />
          {dict.share_cta}
        </button>
      </div>
    </Modal>
  )
}
