'use client'

import { useEffect, useState } from 'react'
import { X, MoreVertical, Plus, Check, Download } from 'lucide-react'
import Image from 'next/image'
import type { Dict } from '@/lib/i18n/dictionaries'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa_prompt_v1'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function detectPlatform(): 'ios' | 'android' | null {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return null
}

function shouldShow(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return true
  try {
    const { firstShown, count } = JSON.parse(raw) as { firstShown: number; count: number }
    if (count >= 2) return false
    return Date.now() - firstShown >= 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function markShown(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstShown: Date.now(), count: 1 }))
    return
  }
  try {
    const data = JSON.parse(raw) as { firstShown: number; count: number }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, count: data.count + 1 }))
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstShown: Date.now(), count: 1 }))
  }
}

const IosShareIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 5 12 1 8 5" />
    <line x1="12" y1="1" x2="12" y2="15" />
    <path d="M9 9H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-3" />
  </svg>
)

export function PwaInstallModal({ t }: { t: Dict['pwa'] }) {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (isStandalone()) return
    if (!shouldShow()) return
    const p = detectPlatform()
    if (!p) return
    const timer = setTimeout(() => {
      setPlatform(p)
      setOpen(true)
      markShown()
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setOpen(false)
  }

  if (!open) return null

  const steps =
    platform === 'ios'
      ? [
          { icon: <IosShareIcon />, text: t.ios_step1 },
          { icon: <Plus className="w-5 h-5" />, text: t.ios_step2 },
          { icon: <Check className="w-5 h-5" />, text: t.ios_step3 },
        ]
      : [
          { icon: <MoreVertical className="w-5 h-5" />, text: t.android_step1 },
          { icon: <Plus className="w-5 h-5" />, text: t.android_step2 },
          { icon: <Check className="w-5 h-5" />, text: t.android_step3 },
        ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="animate-slide-up relative w-full max-w-md bg-blue-900 border border-white/10 rounded-t-2xl p-6 pb-10 shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-1 text-blue-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <Image src="/logo.jpeg" alt="Poolify" width={48} height={48} className="rounded-xl shrink-0" />
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{t.title}</h2>
            <p className="text-blue-300 text-sm mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <ol className="space-y-3 mb-6">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                {step.icon}
              </span>
              <span className="text-sm text-blue-100">{step.text}</span>
            </li>
          ))}
        </ol>

        <div className="flex gap-3">
          {platform === 'android' && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              {t.install_btn}
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-blue-200 rounded-xl transition text-sm"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}
