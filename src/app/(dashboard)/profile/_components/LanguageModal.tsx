'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { Modal } from '@/app/_components/Modal'
import { updateLanguage } from '@/app/actions/auth'
import { LOCALES, LOCALE_LABELS, type Dict, type Locale } from '@/lib/i18n/dictionaries'

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
}

export function LanguageModal({
  open,
  onClose,
  current,
  dict,
}: {
  open: boolean
  onClose: () => void
  current: Locale
  dict: Dict['profile']
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSelect(locale: Locale) {
    if (locale === current || isPending) return
    const fd = new FormData()
    fd.set('language', locale)
    startTransition(async () => {
      await updateLanguage(undefined, fd)
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={dict.section_language}>
      <div className="space-y-2">
        {LOCALES.map((loc) => {
          const isSelected = loc === current
          return (
            <button
              key={loc}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(loc)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                  : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10 hover:border-white/20'
              } disabled:opacity-50`}
            >
              <span className="text-2xl leading-none">{LOCALE_FLAGS[loc]}</span>
              <span className="font-medium flex-1 text-left">{LOCALE_LABELS[loc]}</span>
              {isPending && loc !== current ? null : isSelected ? (
                isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400" />
                )
              ) : null}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
