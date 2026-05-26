import { cookies } from 'next/headers'

export type Theme = 'dark' | 'light'
export const THEME_COOKIE = 'poolify_theme'
export const DEFAULT_THEME: Theme = 'dark'

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies()
  const value = cookieStore.get(THEME_COOKIE)?.value
  return value === 'light' || value === 'dark' ? value : DEFAULT_THEME
}
