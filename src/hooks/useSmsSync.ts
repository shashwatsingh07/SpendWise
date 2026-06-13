/**
 * useSmsSync — the orchestration hook behind the SMS auto-import banner.
 *
 * On app open it: reads recent SMS (native) → parses bank/UPI messages →
 * drops anything already imported or already on record → exposes the remaining
 * "pending" transactions plus confirm / dismiss actions.
 *
 * On the web (no inbox) it can surface a built-in demo batch so the whole flow
 * is visible and testable without an Android device — pass `{ demoOnWeb: true }`.
 */

import { useCallback, useEffect, useState } from 'react'
import { ParsedTransaction, SmsMessage } from '../types'
import { parseSmsMessages } from '../lib/bankPatterns'
import { extractVpa, rememberVpa } from '../lib/upiMapper'
import { rememberBatch } from '../lib/merchantMemory'
import {
  isNativePlatform,
  hasSmsPermission,
  requestSmsPermission,
  readDeviceSms,
} from '../lib/smsBridge'
import { SAMPLE_SMS } from '../data/sampleSms'
import { useStore } from '../store/useStore'

export type SmsSyncStatus =
  | 'idle' // not started
  | 'syncing' // reading + parsing
  | 'ready' // pending rows available
  | 'empty' // nothing new found
  | 'denied' // permission refused
  | 'unsupported' // no inbox (plain web, no demo)

const LAST_SYNC_KEY = 'spendwise-sms-lastsync'
const PROCESSED_KEY = 'spendwise-sms-processed'
const WINDOW_DAYS = 30

// --- processed-message bookkeeping (so a row never re-appears once handled) ---

function loadProcessed(): Set<string> {
  try {
    const raw = localStorage.getItem(PROCESSED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveProcessed(set: Set<string>) {
  try {
    // cap the list so it can't grow unbounded
    const arr = [...set].slice(-2000)
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(arr))
  } catch {
    /* ignore */
  }
}

/** Stable fingerprint for a parsed row, used for "already seen" tracking. */
function fingerprint(r: ParsedTransaction): string {
  return `${r.date.slice(0, 10)}|${r.amount}|${(r.merchant || '').toLowerCase()}`
}

interface Options {
  demoOnWeb?: boolean
  autoSync?: boolean
}

export function useSmsSync(opts: Options = {}) {
  const { demoOnWeb = false, autoSync = true } = opts
  const { bulkAddTransactions, isDuplicate, settings } = useStore()

  const [status, setStatus] = useState<SmsSyncStatus>('idle')
  const [pending, setPending] = useState<ParsedTransaction[]>([])

  const sync = useCallback(async () => {
    setStatus('syncing')
    const native = isNativePlatform()

    // 1) get raw messages
    let messages: SmsMessage[] = []
    if (native) {
      if (!(await hasSmsPermission()) && !(await requestSmsPermission())) {
        setStatus('denied')
        return
      }
      const since = Number(localStorage.getItem(LAST_SYNC_KEY)) || Date.now() - WINDOW_DAYS * 864e5
      messages = await readDeviceSms(since)
    } else if (demoOnWeb) {
      messages = SAMPLE_SMS
    } else {
      setStatus('unsupported')
      return
    }

    // 2) parse → drop already-processed / already-on-record duplicates
    const processed = loadProcessed()
    const rows = parseSmsMessages(messages)
      .filter(r => !processed.has(fingerprint(r)))
      .map(r => ({ ...r, duplicate: isDuplicate(r.amount, r.date, r.merchant) }))

    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
    setPending(rows)
    setStatus(rows.length > 0 ? 'ready' : 'empty')
  }, [demoOnWeb, isDuplicate])

  useEffect(() => {
    if (autoSync) sync()
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Import the chosen rows; teach merchant + VPA memory; mark all as handled. */
  const confirm = useCallback(
    (rows: ParsedTransaction[]) => {
      const selected = rows.filter(r => r.selected)
      const count = bulkAddTransactions(
        selected.map(r => ({
          type: r.type,
          amount: r.amount,
          currency: settings.currency,
          category: r.category,
          merchant: r.merchant,
          note: r.note,
          date: r.date,
          tags: [],
          isRecurring: false,
          taxDeductible: false,
          importSource: 'sms' as const,
        }))
      )

      rememberBatch(
        selected
          .filter(r => r.type === 'expense' && r.merchant !== 'Unknown')
          .map(r => ({ merchant: r.merchant, category: r.category }))
      )
      for (const r of selected) {
        const vpa = r.rawText ? extractVpa(r.rawText) : null
        if (vpa && r.merchant !== 'Unknown') rememberVpa(vpa, r.merchant)
      }

      // every row shown is now handled — selected ones imported, the rest
      // explicitly skipped — so none should resurface.
      const processed = loadProcessed()
      for (const r of rows) processed.add(fingerprint(r))
      saveProcessed(processed)

      setPending([])
      setStatus('empty')
      return count
    },
    [bulkAddTransactions, settings.currency]
  )

  /** Dismiss the banner without importing; don't re-prompt for these. */
  const dismiss = useCallback(() => {
    const processed = loadProcessed()
    for (const r of pending) processed.add(fingerprint(r))
    saveProcessed(processed)
    setPending([])
    setStatus('empty')
  }, [pending])

  return { status, pending, sync, confirm, dismiss }
}
