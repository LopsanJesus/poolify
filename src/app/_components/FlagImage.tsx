import Image from 'next/image'
import { flagUrl } from '@/lib/team-flags'

export function FlagImage({
  team,
  size = 32,
  className = '',
}: {
  team: string
  size?: number
  className?: string
}) {
  const url = flagUrl(team)
  if (!url) return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.55 }} className="leading-none">🏳️</span>
    </div>
  )

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={url}
        alt={team}
        width={80}
        height={60}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
