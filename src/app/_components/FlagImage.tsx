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
  if (!url) return <span className="text-xl leading-none">🏳️</span>

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
