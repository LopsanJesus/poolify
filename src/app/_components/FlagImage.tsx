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
      className={`rounded-full shrink-0 bg-white/10 border border-white/20 ${className}`}
      style={{ width: size, height: size }}
    />
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
