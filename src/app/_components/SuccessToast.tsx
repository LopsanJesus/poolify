'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export function SuccessToast({
  show,
  message,
  onDone,
  durationMs = 2500,
}: {
  show: boolean
  message: string
  onDone?: () => void
  durationMs?: number
}) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => onDone?.(), durationMs)
    return () => clearTimeout(t)
  }, [show, durationMs, onDone])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-base shadow-2xl shadow-emerald-900/60 pointer-events-auto"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {message}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
