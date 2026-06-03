import Link from 'next/link'
import Image from 'next/image'
import type { Dict } from '@/lib/i18n/dictionaries'
import { PoolSwitcherModal } from '../clan/[id]/_components/PoolSwitcherModal'

export function TopBar({
  activeClanId,
  activeClanName,
  clans,
  clanDict,
  navDict,
  dashboardDict,
}: {
  activeClanId: string | null
  activeClanName: string | null
  clans: { id: string; name: string }[]
  clanDict: Dict['clan']
  navDict: Dict['nav']
  dashboardDict: Dict['dashboard']
}) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 bg-blue-900/90 backdrop-blur-md border-b border-white/10">
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
    </header>
  )
}
