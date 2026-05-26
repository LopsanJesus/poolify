'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LOCALES, type Locale } from '@/lib/i18n/dictionaries'
import { LOCALE_COOKIE, getDict } from '@/lib/i18n/server'
import { THEME_COOKIE, type Theme } from '@/lib/theme/server'

import { getHomeRedirectPath } from '@/lib/home-redirect'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  // Sync locale cookie with the user's stored preference so the session
  // picks up their language right away.
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', data.user.id)
      .single()
    if (profile?.language) {
      const cookieStore = await cookies()
      cookieStore.set(LOCALE_COOKIE, profile.language, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
  }

  const path = await getHomeRedirectPath()
  redirect(path)
}

export async function signup(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!username || username.length < 2) {
    const { dict } = await getDict()
    return { error: dict.auth.invalid_username }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })

  if (error) return { error: error.message }

  redirect('/login?registered=true')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const current = formData.get('current_password') as string
  const next = formData.get('new_password') as string
  const confirm = formData.get('confirm_password') as string

  if (!next || next.length < 6) return { error: 'password_too_short' }
  if (next !== confirm) return { error: 'password_mismatch' }

  // Re-authenticate to confirm current password before rotating.
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: current,
  })
  if (verifyErr) return { error: 'invalid_current_password' }

  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) return { error: error.message }

  return { success: 'password_updated' }
}

export async function updateDefaultClan(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const raw = formData.get('default_clan_id')
  const defaultClanId = raw && raw !== '' ? (raw as string) : null

  const { error } = await supabase
    .from('profiles')
    .update({ default_clan_id: defaultClanId })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: 'default_saved' }
}

export async function updateLanguage(_: unknown, formData: FormData) {
  const raw = formData.get('language') as string
  if (!(LOCALES as readonly string[]).includes(raw)) return { error: 'invalid_language' }
  const language = raw as Locale

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ language }).eq('id', user.id)
  }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, language, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  revalidatePath('/', 'layout')
  return { success: 'language_saved' }
}

export async function updateTheme(_: unknown, formData: FormData) {
  const raw = formData.get('theme') as string
  const theme: Theme = raw === 'light' ? 'light' : 'dark'

  const cookieStore = await cookies()
  cookieStore.set(THEME_COOKIE, theme, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  revalidatePath('/', 'layout')
  return { success: 'theme_saved' }
}
