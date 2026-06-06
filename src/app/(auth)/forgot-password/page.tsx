import { getDict } from '@/lib/i18n/server'
import { ForgotPasswordForm } from './_components/ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  const { dict } = await getDict()
  return <ForgotPasswordForm dict={dict.auth} />
}
