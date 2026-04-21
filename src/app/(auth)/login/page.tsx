import { getDict } from '@/lib/i18n/server'
import { LoginForm } from './_components/LoginForm'

export default async function LoginPage() {
  const { dict } = await getDict()
  return <LoginForm dict={dict.auth} />
}
