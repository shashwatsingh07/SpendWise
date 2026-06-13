/**
 * upiMapper — decodes UPI VPAs ("virtual payment addresses") into readable
 * merchant names, and remembers the mapping so the next SMS from the same
 * payee is named correctly.
 *
 *   swiggy@okhdfcbank          -> "Swiggy"
 *   paytmqr281005@paytm        -> (random QR id, no clean name) -> null
 *   john.doe@oksbi             -> "John Doe"
 *
 * A VPA is `localpart@handle`. The handle identifies the PSP / sponsor bank
 * (oksbi, ybl, paytm …), NOT the merchant. The localpart usually carries the
 * merchant — but for P2P / dynamic QR it's a random id, so we only return a
 * name when we're reasonably confident.
 *
 * Learned VPA -> name pairs live in their own localStorage key (like
 * merchantMemory) so they survive a data reset.
 */

const STORE_KEY = 'spendwise-upi-map'

// Known PSP / sponsor-bank handles -> friendly app/bank name. Used as a weak
// fallback hint, never as the merchant itself.
const PSP_HANDLES: Record<string, string> = {
  ybl: 'PhonePe',
  ibl: 'PhonePe',
  axl: 'PhonePe',
  okhdfcbank: 'HDFC',
  okaxis: 'Axis',
  oksbi: 'SBI',
  okicici: 'ICICI',
  paytm: 'Paytm',
  ptyes: 'Paytm',
  ptsbi: 'Paytm',
  ptaxis: 'Paytm',
  pthdfc: 'Paytm',
  apl: 'Amazon Pay',
  yapl: 'Amazon Pay',
  rapl: 'Amazon Pay',
  abfspay: 'Amazon Pay',
  fbl: 'Fi',
  jupiteraxis: 'Jupiter',
  kotak: 'Kotak',
  icici: 'ICICI',
  hdfcbank: 'HDFC',
  axisbank: 'Axis',
  sbi: 'SBI',
  upi: 'UPI',
  waicici: 'WhatsApp Pay',
  waaxis: 'WhatsApp Pay',
  wahdfcbank: 'WhatsApp Pay',
}

// Random-looking localparts that carry no merchant meaning.
const NOISE_LOCALPART = /^(paytmqr|paytm-|q[0-9]|bharatpe|merchant|pay|payee|collect|[0-9]{6,}|[a-z]?[0-9]{4,})/i

type UpiMap = Record<string, string>

function load(): UpiMap {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as UpiMap) : {}
  } catch {
    return {}
  }
}

function save(map: UpiMap) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

/** Pull the first VPA out of a blob of text, or null. */
export function extractVpa(text: string): string | null {
  // localpart@handle — handle is letters only, localpart allows . _ - and digits
  const m = text.match(/\b([a-z0-9][a-z0-9._-]{1,}@[a-z]{2,})\b/i)
  if (!m) return null
  // avoid matching email-ish tokens that end in a TLD-looking handle
  const vpa = m[1].toLowerCase()
  if (/@(gmail|yahoo|outlook|hotmail|com|in|co)$/.test(vpa)) return null
  return vpa
}

/** The PSP / bank behind a VPA handle, e.g. "PhonePe" for `…@ybl`. */
export function pspFromVpa(vpa: string): string | null {
  const handle = vpa.split('@')[1]
  return handle ? PSP_HANDLES[handle] ?? null : null
}

function titleCase(s: string): string {
  return s
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/**
 * Best-effort merchant name for a VPA. Order:
 *   learned mapping -> recognisable localpart -> null (caller falls back).
 */
export function merchantFromVpa(vpa: string): string | null {
  const key = vpa.toLowerCase()
  const map = load()
  if (map[key]) return map[key]

  const localpart = key.split('@')[0]
  if (!localpart || NOISE_LOCALPART.test(localpart)) return null
  // strip trailing digits often appended to brand handles (swiggy123 -> swiggy)
  const cleaned = localpart.replace(/[0-9]+$/, '')
  if (cleaned.length < 3) return null
  return titleCase(cleaned)
}

/** Persist a confirmed VPA -> merchant name so future SMS resolve instantly. */
export function rememberVpa(vpa: string, merchant: string) {
  const key = vpa.toLowerCase().trim()
  const name = merchant.trim()
  if (!key.includes('@') || !name || name.toLowerCase() === 'unknown') return
  const map = load()
  map[key] = name
  save(map)
}
