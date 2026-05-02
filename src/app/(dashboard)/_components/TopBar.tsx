import Link from 'next/link'
import Image from 'next/image'

export function TopBar({ clanName }: { clanName?: string | null }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 bg-blue-900/90 backdrop-blur-md border-b border-white/10">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/logo.jpeg" alt="Poolify" width={32} height={32} className="rounded-xl" />
        <span className="font-semibold text-white text-lg tracking-tight">
          {clanName ? clanName.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Poolify'}
        </span>
      </Link>
    </header>
  )
}
