import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, UserCircle2 } from 'lucide-react'
import Image from 'next/image'
import { getDict } from '@/lib/i18n/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { dict } = await getDict()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900">
      <nav className="border-b border-white/10 bg-blue-950/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.jpeg" alt="Poolify" width={32} height={32} className="rounded-lg" />
            <span className="text-white font-bold text-lg tracking-tight">Poolify</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/rules"
              className="flex items-center gap-1.5 text-blue-300 hover:text-white transition text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{dict.nav.rules}</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-blue-300 hover:text-white transition text-sm"
            >
              <UserCircle2 className="w-5 h-5" />
              <span className="hidden sm:inline">@{profile?.username ?? user.email}</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
