import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_LOCALE, DICTIONARIES, LOCALES, type Dict, type Locale } from './dictionaries'

export const LOCALE_COOKIE = 'poolify_lang'

function normalize(value: string | null | undefined): Locale | null {
  if (!value) return null
  const lower = value.toLowerCase().slice(0, 2)
  return (LOCALES as readonly string[]).includes(lower) ? (lower as Locale) : null
}

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  for (const part of header.split(',')) {
    const code = part.trim().split(';')[0]
    const locale = normalize(code)
    if (locale) return locale
  }
  return null
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = normalize(cookieStore.get(LOCALE_COOKIE)?.value)
  if (cookieLocale) return cookieLocale

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single()
      const profileLocale = normalize(data?.language)
      if (profileLocale) return profileLocale
    }
  } catch {
    // Supabase may be unavailable during static rendering — fall through.
  }

  const hdrs = await headers()
  const headerLocale = parseAcceptLanguage(hdrs.get('accept-language'))
  if (headerLocale) return headerLocale

  return DEFAULT_LOCALE
}

export function getDictionary(locale: Locale): Dict {
  return DICTIONARIES[locale]
}

export async function getDict(): Promise<{ dict: Dict; locale: Locale }> {
  const locale = await getLocale()
  return { dict: getDictionary(locale), locale }
}

/** Replace `{name}` placeholders in a translated string. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    values[k] === undefined ? `{${k}}` : String(values[k])
  )
}
