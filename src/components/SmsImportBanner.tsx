/**
 * SmsImportBanner — the Phase 2 "X new transactions found" prompt.
 *
 * Renders app-wide (mounted in Layout). On open it auto-scans the SMS inbox
 * via useSmsSync; if bank/UPI messages turn up that aren't already on record,
 * it shows a dismissible banner. "Review" opens the existing ImportPreview in
 * a modal so the user confirms before anything is saved.
 */

import { useState, useEffect } from 'react'
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
        <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="flex items-center gap-2">
            <Sparkles size={15} /> {imported} transaction{imported === 1 ? '' : 's'} imported from SMS.
          </span>
          <button onClick={() => setImported(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={15} />
          </button>
        </div>
      )
    }
    return null
  }

  const newCount = pending.filter(r => !r.duplicate).length

  return (
    <>
      {/* Banner */}
      <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white shadow-lg shadow-violet-500/20">
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
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
        >
          Review
        </button>
        <button onClick={dismiss} className="shrink-0 text-white/70 hover:text-white" aria-label="Dismiss">
          <X size={18} />
        </button>
      </div>

      {/* Review modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-8">
          <div className="card w-full max-w-4xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText size={20} className="text-violet-600" />
              <h2 className="text-lg font-bold text-slate-800">Import from SMS</h2>
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
          </div>
        </div>
      )}
    </>
  )
}
