/**
 * smsBridge — thin, dependency-light bridge to the device SMS inbox.
 *
 * On Android (inside the Capacitor APK) it talks to a registered SMS-reader
 * plugin. On the web it has no inbox, so it reports "unsupported" and the UI
 * falls back to demo data. We deliberately access Capacitor through `window`
 * rather than a static `import '@capacitor/core'` so the web bundle keeps
 * building even before Capacitor is installed/added.
 *
 * Expected native plugin shape (register under the name `SmsInbox`):
 *   SmsInbox.checkPermission()   -> { granted: boolean }
 *   SmsInbox.requestPermission() -> { granted: boolean }
 *   SmsInbox.getMessages({ minDate? }) -> { messages: { address, body, date }[] }
 *
 * The recommended community plugin is `capacitor-sms-inbox`; if you use a
 * different one, adapt `readDeviceSms()` below to its API.
 */

import { SmsMessage } from '../types'

type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: Record<string, any>
}

function cap(): CapacitorGlobal | null {
  return (typeof window !== 'undefined' && (window as any).Capacitor) || null
}

/** True only inside the native Android/iOS shell. */
export function isNativePlatform(): boolean {
  const c = cap()
  return !!c?.isNativePlatform?.()
}

function smsPlugin(): any | null {
  return cap()?.Plugins?.SmsInbox ?? null
}

/** Has the user granted READ_SMS yet? */
export async function hasSmsPermission(): Promise<boolean> {
  const p = smsPlugin()
  if (!p?.checkPermission) return false
  try {
    const res = await p.checkPermission()
    return !!res?.granted
  } catch {
    return false
  }
}

/** Prompt for READ_SMS. Returns whether it ended up granted. */
export async function requestSmsPermission(): Promise<boolean> {
  const p = smsPlugin()
  if (!p?.requestPermission) return false
  try {
    const res = await p.requestPermission()
    return !!res?.granted
  } catch {
    return false
  }
}

/**
 * Read SMS received since `sinceMs`. Returns [] (never throws) when there's no
 * inbox available — callers treat an empty result as "nothing new".
 */
export async function readDeviceSms(sinceMs?: number): Promise<SmsMessage[]> {
  const p = smsPlugin()
  if (!p?.getMessages) return []
  try {
    const res = await p.getMessages(sinceMs ? { minDate: sinceMs } : {})
    const raw: any[] = res?.messages ?? res ?? []
    return raw.map((m, i) => ({
      id: String(m.id ?? m._id ?? i),
      sender: m.address ?? m.sender ?? m.from,
      body: m.body ?? m.message ?? '',
      date: typeof m.date === 'number' ? m.date : Date.parse(m.date) || Date.now(),
    }))
  } catch {
    return []
  }
}
