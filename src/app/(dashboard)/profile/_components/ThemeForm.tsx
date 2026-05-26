'use client'

import { useActionState } from 'react'
import { Loader2, Moon, Sun, Check } from 'lucide-react'
import { updateTheme } from '@/app/actions/auth'
import type { Theme } from '@/lib/theme/server'
import type { Dict } from '@/lib/i18n/dictionaries'

export function ThemeForm({
  dict,
  commonDict,
  current,
}: {
  dict: Dict['profile']
  commonDict: Dict['common']
  current: Theme
}) {
  const [state, action, pending] = useActionState(updateTheme, undefined)

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        {current === 'dark' ? (
          <Moon className="w-5 h-5 text-blue-300" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
        <h2 className="text-white font-semibold">{dict.section_theme}</h2>
      </div>

      {state?.success === 'theme_saved' && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.theme_saved}
        </div>
      )}

      <form action={action} className="flex gap-3">
        <button
          type="submit"
          name="theme"
          value="light"
          disabled={pending || current === 'light'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-semibold text-sm transition ${
            current === 'light'
              ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-300'
              : 'bg-white/5 border-white/10 text-blue-300 hover:bg-white/10 hover:text-white'
          } disabled:opacity-60`}
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sun className="w-4 h-4" />}
          {dict.theme_light}
        </button>
        <button
          type="submit"
          name="theme"
          value="dark"
          disabled={pending || current === 'dark'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-semibold text-sm transition ${
            current === 'dark'
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
              : 'bg-white/5 border-white/10 text-blue-300 hover:bg-white/10 hover:text-white'
          } disabled:opacity-60`}
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4" />}
          {dict.theme_dark}
        </button>
      </form>
    </section>
  )
}
