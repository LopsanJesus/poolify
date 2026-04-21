'use client'

import { useActionState } from 'react'
import { Loader2, Languages, Check } from 'lucide-react'
import { updateLanguage } from '@/app/actions/auth'
import { LOCALES, LOCALE_LABELS, type Dict, type Locale } from '@/lib/i18n/dictionaries'

export function LanguageForm({
  dict,
  commonDict,
  current,
}: {
  dict: Dict['profile']
  commonDict: Dict['common']
  current: Locale
}) {
  const [state, action, pending] = useActionState(updateLanguage, undefined)

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Languages className="w-5 h-5 text-blue-300" />
        <h2 className="text-white font-semibold">{dict.section_language}</h2>
      </div>
      <p className="text-blue-300 text-sm">{dict.language_hint}</p>

      {state?.success === 'language_saved' && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {dict.language_saved}
        </div>
      )}

      <form action={action} className="space-y-3">
        <select
          name="language"
          defaultValue={current}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        >
          {LOCALES.map((loc) => (
            <option key={loc} value={loc} className="text-black">
              {LOCALE_LABELS[loc]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {pending ? commonDict.saving : dict.save_language}
        </button>
      </form>
    </section>
  )
}
