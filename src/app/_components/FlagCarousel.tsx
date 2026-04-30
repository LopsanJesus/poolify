import Image from 'next/image'

const TEAMS = [
  // CONCACAF (anfitriones)
  { code: 'ca', name: 'Canadá' },
  { code: 'us', name: 'Estados Unidos' },
  { code: 'mx', name: 'México' },
  { code: 'pa', name: 'Panamá' },
  { code: 'ht', name: 'Haití' },
  { code: 'cw', name: 'Curazao' },
  // AFC
  { code: 'jp', name: 'Japón' },
  { code: 'nz', name: 'Nueva Zelanda' },
  { code: 'ir', name: 'Irán' },
  { code: 'uz', name: 'Uzbekistán' },
  { code: 'kr', name: 'Corea del Sur' },
  { code: 'jo', name: 'Jordania' },
  { code: 'au', name: 'Australia' },
  { code: 'sa', name: 'Arabia Saudita' },
  { code: 'qa', name: 'Catar' },
  // CONMEBOL
  { code: 'ar', name: 'Argentina' },
  { code: 'br', name: 'Brasil' },
  { code: 'ec', name: 'Ecuador' },
  { code: 'uy', name: 'Uruguay' },
  { code: 'co', name: 'Colombia' },
  { code: 'py', name: 'Paraguay' },
  // CAF
  { code: 'ma', name: 'Marruecos' },
  { code: 'tn', name: 'Túnez' },
  { code: 'eg', name: 'Egipto' },
  { code: 'dz', name: 'Argelia' },
  { code: 'gh', name: 'Ghana' },
  { code: 'cv', name: 'Cabo Verde' },
  { code: 'za', name: 'Sudáfrica' },
  { code: 'ci', name: 'Costa de Marfil' },
  { code: 'sn', name: 'Senegal' },
  { code: 'cd', name: 'R. D. del Congo' },
  // UEFA
  { code: 'gb-eng', name: 'Inglaterra' },
  { code: 'fr', name: 'Francia' },
  { code: 'hr', name: 'Croacia' },
  { code: 'pt', name: 'Portugal' },
  { code: 'no', name: 'Noruega' },
  { code: 'de', name: 'Alemania' },
  { code: 'nl', name: 'Países Bajos' },
  { code: 'be', name: 'Bélgica' },
  { code: 'at', name: 'Austria' },
  { code: 'ch', name: 'Suiza' },
  { code: 'es', name: 'España' },
  { code: 'gb-sct', name: 'Escocia' },
  { code: 'se', name: 'Suecia' },
  { code: 'tr', name: 'Turquía' },
  { code: 'cz', name: 'Rep. Checa' },
  { code: 'ba', name: 'Bosnia y Herz.' },
  // Repechaje intercontinental
  { code: 'iq', name: 'Irak' },
]

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
