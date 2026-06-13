/**
 * SmsImportBanner — the Phase 2 "X new transactions found" prompt.
 *
 * Renders app-wide (mounted in Layout). On open it auto-scans the SMS inbox
 * via useSmsSync; if bank/UPI messages turn up that aren't already on record,
 * it shows a dismissible banner. "Review" opens the existing ImportPreview in
 * a modal so the user confirms before anything is saved.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareText, X, Sparkles } from 'lucide-react'
import { useSmsSync } from '../hooks/useSmsSync'
import { ImportPreview } from './ImportPreview'
import { ParsedTransaction } from '../types'

export function SmsImportBanner() {
  // demoOnWeb lets the banner work in the browser during development; on the
  // real APK the native inbox is used automatically and demo data is ignored.
  // Gated to dev so a production web build never shows sample SMS.
  const { status, pending, confirm, dismiss } = useSmsSync({ demoOnWeb: import.meta.env.DEV })
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedTransaction[]>([])
  const [imported, setImported] = useState<number | null>(null)

  // keep the modal's editable copy in sync when a new scan lands
  useEffect(() => {
    setRows(pending)
  }, [pending])

  if (status !== 'ready' || pending.length === 0) {
    // brief success toast after an import
    if (imported !== null) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={15} /> {imported} transaction{imported === 1 ? '' : 's'} imported from SMS.
          </span>
          <button onClick={() => setImported(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200">
            <X size={15} />
          </button>
        </motion.div>
      )
    }
    return null
  }

  const newCount = pending.filter(r => !r.duplicate).length

  return (
    <>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white shadow-lg shadow-violet-500/30">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <MessageSquareText size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {newCount} new transaction{newCount === 1 ? '' : 's'} found in your SMS
          </p>
          <p className="truncate text-xs text-white/70">
            From your bank &amp; UPI messages — review and import in one tap.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
        >
          Review
        </motion.button>
        <button onClick={dismiss} className="shrink-0 text-white/70 hover:text-white" aria-label="Dismiss">
          <X size={18} />
        </button>
      </motion.div>

      {/* Review modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="card w-full max-w-4xl p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText size={20} className="text-violet-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Import from SMS</h2>
              </div>
              <ImportPreview
                rows={rows}
                usedAI={false}
                onChange={setRows}
                onConfirm={() => {
                  const n = confirm(rows)
                  setImported(n)
                  setOpen(false)
                }}
                onCancel={() => setOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
