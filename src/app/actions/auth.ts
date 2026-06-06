'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LOCALES, type Locale } from '@/lib/i18n/dictionaries'
import { LOCALE_COOKIE, getDict } from '@/lib/i18n/server'
import { ACTIVE_CLAN_COOKIE } from '@/lib/active-clan'
import { getHomeRedirectPath } from '@/lib/home-redirect'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string | null)?.trim() || null

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

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

  const path = next && next.startsWith('/') ? next : await getHomeRedirectPath()
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

  // For @test.com addresses use the admin API directly — bypasses Supabase's
  // email domain validation and confirms the account in one step.
  if (email.toLowerCase().endsWith('@test.com')) {
    const admin = createAdminClient()
    const { data: created, error: adminError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    })
    if (adminError) return { error: adminError.message }
    // Force-set the correct username regardless of what the trigger inserted
    if (created?.user) {
      await admin.from('profiles').update({ username }).eq('id', created.user.id)
    }
    redirect('/login?registered=true')
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
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_CLAN_COOKIE)
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

export async function forgotPassword(_: unknown, formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'email_required' }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function resetPassword(_: unknown, formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string

  if (!password || password.length < 6) return { error: 'password_too_short' }
  if (password !== confirm) return { error: 'password_mismatch' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: true }
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
