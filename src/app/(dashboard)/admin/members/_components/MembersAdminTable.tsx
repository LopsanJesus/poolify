'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Pencil, Shield, X } from 'lucide-react'
import { updateUsername, type AdminProfile } from '@/app/actions/admin'
import type { Dict } from '@/lib/i18n/dictionaries'

export function MembersAdminTable({
  profiles,
  dict,
  commonDict,
}: {
  profiles: AdminProfile[]
  dict: Dict['admin']
  commonDict: Dict['common']
}) {
  return (
    <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
      {profiles.map((profile) => (
        <MemberRow key={profile.id} profile={profile} dict={dict} commonDict={commonDict} />
      ))}
    </div>
  )
}

function MemberRow({
  profile,
  dict,
  commonDict,
}: {
  profile: AdminProfile
  dict: Dict['admin']
  commonDict: Dict['common']
}) {
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile.username)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    const formData = new FormData()
    formData.set('user_id', profile.id)
    formData.set('username', username)
    startTransition(async () => {
      const res = await updateUsername(undefined, formData)
      if (res.error) setError(res.error)
      else setEditing(false)
    })
  }

  function handleCancel() {
    setUsername(profile.username)
    setError(null)
    setEditing(false)
  }

  return (
    <div className="px-4 py-3 bg-white/5">
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
            autoFocus
            className="flex-1 min-w-0 rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-400"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-white font-medium">{profile.username}</span>
        )}

        {profile.is_admin && (
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden />
        )}

        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="p-1.5 rounded-lg text-emerald-400 hover:bg-white/10 transition disabled:opacity-50"
              aria-label={dict.save}
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="p-1.5 rounded-lg text-red-400 hover:bg-white/10 transition disabled:opacity-50"
              aria-label={commonDict.cancel}
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-white/10 transition"
            aria-label={dict.save}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-300 mt-1.5">{error}</p>}
    </div>
  )
}
