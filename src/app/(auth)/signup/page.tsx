import { getDict } from '@/lib/i18n/server'
import { SignupForm } from './_components/SignupForm'

export default async function SignupPage() {
  const { dict } = await getDict()
  return <SignupForm dict={dict.auth} />
}
