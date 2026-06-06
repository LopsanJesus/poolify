// Maps any known team name variant (English or Spanish) to an ISO flag code.
// flagcdn.com uses ISO 3166-1 alpha-2 codes; GB subdivisions use gb-eng, gb-sct, etc.
const RAW: Record<string, string> = {
  // ── North & Central America ──────────────────────────────────
  'Canada': 'ca',       'Canadá': 'ca',
  'USA': 'us',          'Estados Unidos': 'us',   'United States': 'us',
  'Mexico': 'mx',       'México': 'mx',
  'Panama': 'pa',       'Panamá': 'pa',
  'Haiti': 'ht',        'Haití': 'ht',
  'Curaçao': 'cw',      'Curazao': 'cw',          'Curacao': 'cw',
  'Honduras': 'hn',
  'Costa Rica': 'cr',
  'El Salvador': 'sv',
  'Jamaica': 'jm',
  'Trinidad & Tobago': 'tt',

  // ── South America ────────────────────────────────────────────
  'Argentina': 'ar',
  'Brazil': 'br',       'Brasil': 'br',
  'Ecuador': 'ec',
  'Uruguay': 'uy',
  'Colombia': 'co',
  'Paraguay': 'py',
  'Chile': 'cl',
  'Peru': 'pe',         'Perú': 'pe',
  'Bolivia': 'bo',
  'Venezuela': 've',

  // ── Africa ───────────────────────────────────────────────────
  'Morocco': 'ma',      'Marruecos': 'ma',
  'Tunisia': 'tn',      'Túnez': 'tn',             'Tunez': 'tn',
  'Egypt': 'eg',        'Egipto': 'eg',
  'Algeria': 'dz',      'Argelia': 'dz',
  'Ghana': 'gh',
  'Cape Verde': 'cv',   'Cabo Verde': 'cv',
  'South Africa': 'za', 'Sudáfrica': 'za',         'Sudafrica': 'za',
  "Ivory Coast": 'ci',  'Costa de Marfil': 'ci',   "Côte d'Ivoire": 'ci',
  'Senegal': 'sn',
  'DR Congo': 'cd',     'R. D. del Congo': 'cd',   'Congo DR': 'cd',
  'Nigeria': 'ng',
  'Cameroon': 'cm',     'Camerún': 'cm',
  'Mali': 'ml',
  'Zambia': 'zm',
  'Tanzania': 'tz',
  'Burkina Faso': 'bf',
  'Guinea': 'gn',
  'Mozambique': 'mz',
  'Zimbabwe': 'zw',
  'Sudan': 'sd',
  'Kenya': 'ke',

  // ── Asia & Oceania ───────────────────────────────────────────
  'Japan': 'jp',        'Japón': 'jp',
  'South Korea': 'kr',  'Corea del Sur': 'kr',     'Korea Republic': 'kr',
  'Australia': 'au',
  'Saudi Arabia': 'sa', 'Arabia Saudita': 'sa',    'Saudi': 'sa',
  'Qatar': 'qa',        'Catar': 'qa',
  'Iran': 'ir',         'Irán': 'ir',
  'Iraq': 'iq',         'Irak': 'iq',
  'Jordan': 'jo',       'Jordania': 'jo',
  'Uzbekistan': 'uz',   'Uzbekistán': 'uz',
  'New Zealand': 'nz',  'Nueva Zelanda': 'nz',
  'China': 'cn',
  'Indonesia': 'id',
  'Thailand': 'th',
  'Vietnam': 'vn',
  'India': 'in',
  'Bahrain': 'bh',
  'United Arab Emirates': 'ae',
  'Oman': 'om',
  'Kuwait': 'kw',

  // ── Europe ───────────────────────────────────────────────────
  'England': 'gb-eng',  'Inglaterra': 'gb-eng',
  'Scotland': 'gb-sct', 'Escocia': 'gb-sct',
  'Wales': 'gb-wls',    'Gales': 'gb-wls',
  'France': 'fr',       'Francia': 'fr',
  'Germany': 'de',      'Alemania': 'de',
  'Spain': 'es',        'España': 'es',
  'Portugal': 'pt',
  'Netherlands': 'nl',  'Países Bajos': 'nl',      'Holland': 'nl',
  'Belgium': 'be',      'Bélgica': 'be',            'Belgica': 'be',
  'Italy': 'it',        'Italia': 'it',
  'Croatia': 'hr',      'Croacia': 'hr',
  'Serbia': 'rs',
  'Switzerland': 'ch',  'Suiza': 'ch',
  'Austria': 'at',
  'Sweden': 'se',       'Suecia': 'se',
  'Norway': 'no',       'Noruega': 'no',
  'Denmark': 'dk',      'Dinamarca': 'dk',
  'Finland': 'fi',      'Finlandia': 'fi',
  'Poland': 'pl',       'Polonia': 'pl',
  'Czech Republic': 'cz', 'Rep. Checa': 'cz',      'Czechia': 'cz',
  'Slovakia': 'sk',     'Eslovaquia': 'sk',
  'Hungary': 'hu',      'Hungría': 'hu',
  'Romania': 'ro',      'Rumanía': 'ro',
  'Turkey': 'tr',       'Turquía': 'tr',
  'Greece': 'gr',       'Grecia': 'gr',
  'Ukraine': 'ua',      'Ucrania': 'ua',
  'Russia': 'ru',       'Rusia': 'ru',
  'Albania': 'al',
  'Bosnia & Herzegovina': 'ba', 'Bosnia y Herz.': 'ba', 'Bosnia': 'ba',
  'Kosovo': 'xk',
  'North Macedonia': 'mk',
  'Slovenia': 'si',      'Eslovenia': 'si',
  'Iceland': 'is',       'Islandia': 'is',
  'Ireland': 'ie',       'Irlanda': 'ie',
  'Northern Ireland': 'gb-nir',
  'Georgia': 'ge',
  'Armenia': 'am',
  'Azerbaijan': 'az',
  'Belarus': 'by',
  'Moldova': 'md',
  'Estonia': 'ee',
  'Latvia': 'lv',
  'Lithuania': 'lt',
  'Luxembourg': 'lu',
  'Malta': 'mt',
  'Cyprus': 'cy',
}

export const TEAM_FLAG_CODE: Record<string, string> = RAW

export function flagUrl(teamName: string): string | null {
  const code = TEAM_FLAG_CODE[teamName]
  return code ? `https://flagcdn.com/w80/${code}.png` : null
}

// Returns the flag code for a team, or null if not found.
export function flagCode(teamName: string): string | null {
  return TEAM_FLAG_CODE[teamName] ?? null
}

// Manual overrides for codes that Intl.DisplayNames can't handle
const LOCALE_OVERRIDES: Record<string, Record<string, string>> = {
  'gb-eng': { es: 'Inglaterra',         de: 'England'             },
  'gb-sct': { es: 'Escocia',            de: 'Schottland'          },
  'gb-wls': { es: 'Gales',              de: 'Wales'               },
  'gb-nir': { es: 'Irlanda del Norte',  de: 'Nordirland'          },
  'xk':     { es: 'Kosovo',             de: 'Kosovo'              },
}

// Returns the team name translated to the given locale (BCP 47, e.g. 'es', 'de').
// Falls back to the original English name if no translation is available.
export function translateTeam(name: string, locale: string): string {
  if (locale === 'en') return name
  const code = TEAM_FLAG_CODE[name]
  if (!code) return name
  const override = LOCALE_OVERRIDES[code]?.[locale]
  if (override) return override
  try {
    const fmt = new Intl.DisplayNames([locale], { type: 'region' })
    return fmt.of(code.toUpperCase()) ?? name
  } catch {
    return name
  }
}
