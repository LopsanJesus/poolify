import type { Locale } from '@/lib/i18n/dictionaries'

const LABELS: Record<string, Record<Locale, string>> = {
  group_stage:   { en: 'Group Stage',    es: 'Fase de Grupos',          de: 'Gruppenphase'    },
  round_of_32:   { en: 'Round of 32',    es: 'Dieciseisavos de Final',  de: 'Runde der 32'    },
  round_of_16:   { en: 'Round of 16',    es: 'Octavos de Final',        de: 'Achtelfinale'    },
  quarter_final: { en: 'Quarter-final',  es: 'Cuartos de Final',        de: 'Viertelfinale'   },
  semi_final:    { en: 'Semi-final',     es: 'Semifinal',               de: 'Halbfinale'      },
  third_place:   { en: 'Third place play-off', es: 'Tercer y cuarto puesto', de: 'Spiel um Platz drei' },
  final:         { en: 'Final',          es: 'Final',                   de: 'Finale'          },
}

const GROUP_WORD:    Record<Locale, string> = { en: 'Group',    es: 'Grupo',   de: 'Gruppe'   }
const MATCHDAY_WORD: Record<Locale, string> = { en: 'Matchday', es: 'Jornada', de: 'Spieltag' }

// Handles both static keys (e.g. "semi_final") and dynamic "Group X – Matchday N" strings.
export function stageLabel(stage: string, locale: Locale): string {
  if (LABELS[stage]) return LABELS[stage][locale]

  const m = stage.match(/^Group\s+([A-Z0-9]+)\s*[–-]\s*Matchday\s+(\d+)$/i)
  if (m) return `${GROUP_WORD[locale]} ${m[1]} – ${MATCHDAY_WORD[locale]} ${m[2]}`

  return stage
}
