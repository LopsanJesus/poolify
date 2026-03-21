import Link from 'next/link'
import { getUserClans } from '@/app/actions/clans'
import { Users, Plus, LogIn, ChevronRight, Shield } from 'lucide-react'

export default async function DashboardPage() {
  const clans = await getUserClans()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis Clanes</h1>
        <p className="text-blue-300 text-sm mt-1">Gestiona tus grupos de porras del Mundial 2026</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/clan/create"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-emerald-500/50 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-500/30 transition">
            <Plus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Crear Clan</p>
            <p className="text-blue-300 text-sm">Crea un grupo e invita amigos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/clan/join"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-blue-500/50 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center group-hover:bg-blue-500/30 transition">
            <LogIn className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Unirse a un Clan</p>
            <p className="text-blue-300 text-sm">Usa un código de invitación</p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Clan List */}
      {clans.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Tus grupos</h2>
          {clans.map((clan) => (
            <Link
              key={clan.id}
              href={`/clan/${clan.id}`}
              className="group flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{clan.name}</p>
                <p className="text-blue-400 text-xs font-mono">{clan.invite_code}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/20">
          <Users className="w-12 h-12 text-blue-500/50 mx-auto mb-3" />
          <p className="text-blue-300 font-medium">Aún no perteneces a ningún clan</p>
          <p className="text-blue-400/70 text-sm mt-1">Crea uno o únete con un código</p>
        </div>
      )}
    </div>
  )
}
