import { getTestUsers, getClans } from '@/app/actions/dev'
import { DevShellClient } from './_components/DevShellClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DevShellPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  const [users, clans] = await Promise.all([
    getTestUsers(),
    getClans()
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Poolify Dev Shell</h1>
      <DevShellClient initialUsers={users} clans={clans} />
    </div>
  )
}
