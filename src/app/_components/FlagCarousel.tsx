import Image from 'next/image'
import { TEAM_FLAG_CODE } from '@/lib/team-flags'

const TEAMS = Object.entries(TEAM_FLAG_CODE).map(([name, code]) => ({ name, code }))

export function FlagCarousel({ label }: { label: string }) {
  const doubled = [...TEAMS, ...TEAMS]
  return (
    <div>
      <p className="text-center text-blue-300/60 text-xs uppercase tracking-[0.2em] mb-4">{label}</p>
      <div className="overflow-hidden">
        <div className="animate-marquee flex gap-3 w-max px-4">
          {doubled.map((team, i) => (
            <div
              key={i}
              title={team.name}
              className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden"
            >
              <Image
                src={`https://flagcdn.com/w80/${team.code}.png`}
                alt={team.name}
                width={80}
                height={60}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
