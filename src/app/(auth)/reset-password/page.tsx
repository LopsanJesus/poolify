import { getDict } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './_components/ResetPasswordForm'
import Link from 'next/link'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const { dict } = await getDict()

  if (!code) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl space-y-4">
        <p className="text-red-300 text-sm">{dict.auth.reset_password_invalid}</p>
        <Link href="/forgot-password" className="block text-center text-sm text-blue-300 hover:text-white transition">
          {dict.auth.forgot_password_link}
        </Link>
      </div>
    )
  }

  // Exchange the one-time code for a session so updateUser works in the form action.
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl space-y-4">
        <p className="text-red-300 text-sm">{dict.auth.reset_password_invalid}</p>
        <Link href="/forgot-password" className="block text-center text-sm text-blue-300 hover:text-white transition">
          {dict.auth.forgot_password_link}
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm dict={dict.auth} />
}
