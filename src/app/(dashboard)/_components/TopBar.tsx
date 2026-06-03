import Link from 'next/link'
import Image from 'next/image'
import { HelpCircle, Settings } from 'lucide-react'
import type { Dict } from '@/lib/i18n/dictionaries'
import { PoolSwitcherModal } from '../clan/[id]/_components/PoolSwitcherModal'
import { InviteButton } from '../clan/[id]/_components/InviteButton'

export function TopBar({
  activeClanId,
  activeClanName,
  inviteCode,
  isOwner,
  canInvite,
  isPastDeadline,
  clans,
  clanDict,
  navDict,
  dashboardDict,
  inviteDict,
  settingsTitle,
}: {
  activeClanId: string | null
  activeClanName: string | null
  inviteCode: string | null
  isOwner: boolean
  canInvite: boolean
  isPastDeadline: boolean
  clans: { id: string; name: string }[]
  clanDict: Dict['clan']
  navDict: Dict['nav']
  dashboardDict: Dict['dashboard']
  inviteDict: Dict['invite']
  settingsTitle: string
}) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-blue-900/90 backdrop-blur-md border-b border-white/10">
      {/* Left: logo + clan switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/dashboard" className="shrink-0">
          <Image src="/logo.jpeg" alt="Poolify" width={32} height={32} className="rounded-xl" />
        </Link>

        {activeClanId && activeClanName ? (
          <PoolSwitcherModal
            currentId={activeClanId}
            currentName={activeClanName}
            clans={clans}
            clanDict={clanDict}
            navDict={navDict}
            dashboardDict={dashboardDict}
          />
        ) : (
          <Link href="/dashboard" className="font-semibold text-white text-lg tracking-tight hover:text-blue-200 transition">
            Poolify
          </Link>
        )}
      </div>

      {/* Right: invite + settings (only when clan active) */}
      {activeClanId && (
        <div className="flex items-center gap-2 shrink-0">
          {canInvite && !isPastDeadline && inviteCode && (
            <InviteButton inviteCode={inviteCode} dict={inviteDict} />
          )}
          <Link
            href={`/clan/${activeClanId}/settings`}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-blue-300 hover:text-white transition"
            aria-label={settingsTitle}
          >
            {isOwner ? <Settings className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
          </Link>
        </div>
      )}
    </header>
  )
}
