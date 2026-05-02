import type { Locale } from '@/lib/i18n/dictionaries'

const LABELS: Record<string, Record<Locale, string>> = {
  group_stage:   { en: 'Group Stage',    es: 'Fase de Grupos',          de: 'Gruppenphase'    },
  round_of_32:   { en: 'Round of 32',    es: 'Dieciseisavos de Final',  de: 'Runde der 32'    },
  round_of_16:   { en: 'Round of 16',    es: 'Octavos de Final',        de: 'Achtelfinale'    },
  quarter_final: { en: 'Quarter-final',  es: 'Cuartos de Final',        de: 'Viertelfinale'   },
  semi_final:    { en: 'Semi-final',     es: 'Semifinal',               de: 'Halbfinale'      },
  final:         { en: 'Final',          es: 'Final',                   de: 'Finale'          },
}

export function stageLabel(stage: string, locale: Locale): string {
  return LABELS[stage]?.[locale] ?? stage
}
