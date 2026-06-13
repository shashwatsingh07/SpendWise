/**
 * bankPatterns — turns Indian bank / UPI / wallet SMS into ParsedTransaction
 * rows. Designed for the Phase 2 Android SMS auto-import flow, but pure and
 * testable on its own (no Capacitor / DOM needed).
 *
 * Strategy: rather than one brittle regex per bank, we use a single robust
 * extractor that works across SBI, HDFC, ICICI, Axis, Kotak, Paytm, PhonePe,
 * GPay etc., plus a sender-prefix table to label the source bank and to filter
 * out promotional senders. A message is only treated as a transaction when it
 * carries BOTH a money amount AND a debit/credit keyword — that alone discards
 * almost all OTP / promo / balance-enquiry noise.
 */

import { v4 as uuid } from 'uuid'
import { ParsedTransaction, SmsMessage, TransactionType } from '../types'
import { DEFAULT_CATEGORIES } from '../data/categories'
import { guessCategory } from './merchantMemory'
import { extractVpa, merchantFromVpa, pspFromVpa } from './upiMapper'

const EXPENSE_CATS = DEFAULT_CATEGORIES.filter(c => c.type !== 'income').map(c => c.id)
const INCOME_CATS = DEFAULT_CATEGORIES.filter(c => c.type !== 'expense').map(c => c.id)

// ---------- sender → bank ----------

// DLT sender ids look like "VK-HDFCBK", "AD-SBIINB", "JM-ICICIB". We match on
// the alphabetic part after the hyphen.
const BANK_SENDERS: { re: RegExp; bank: string }[] = [
  { re: /HDFC/i, bank: 'HDFC Bank' },
  { re: /SBI|SBIINB|SBICRD/i, bank: 'SBI' },
  { re: /ICICI|ICICIB/i, bank: 'ICICI Bank' },
  { re: /AXIS|AXISBK/i, bank: 'Axis Bank' },
  { re: /KOTAK|KOTAKB/i, bank: 'Kotak' },
  { re: /PAYTM|PYTM/i, bank: 'Paytm' },
  { re: /PHONEPE|PHNPE/i, bank: 'PhonePe' },
  { re: /GPAY|GOOGLE/i, bank: 'GPay' },
  { re: /BOI|BARODA|BOB|PNB|CANARA|UNION|YESBNK|IDFC|INDUS|RBL|FEDERAL|CITI/i, bank: 'Bank' },
]

export function detectBank(sender?: string): string | null {
  if (!sender) return null
  for (const { re, bank } of BANK_SENDERS) if (re.test(sender)) return bank
  return null
}

// ---------- classification ----------

const DEBIT_WORDS = /\b(debited|debit|spent|paid|sent|withdrawn|purchase|deducted|charged)\b/i
const CREDIT_WORDS = /\b(credited|credit|received|deposited|added|refund(?:ed)?)\b/i

// Messages that look financial but are NOT a completed transaction.
const SKIP_WORDS =
  /\b(otp|one[\s-]?time|will be debited|has been requested|requesting|request(?:ed)? money|collect request|is requesting|failed|declined|reversed|unsuccessful|e-?mandate|auto[\s-]?pay set|due on|payment due|bill of|statement|min(?:imum)? (?:amt|amount) due|available balance is|avl bal|balance in your|cashback of|you have won|apply now|pre-?approved|eligible for|interest rate|kyc)\b/i

function classify(body: string): TransactionType | null {
  const debit = DEBIT_WORDS.test(body)
  const credit = CREDIT_WORDS.test(body)
  if (debit && !credit) return 'expense'
  if (credit && !debit) return 'income'
  if (debit && credit) {
    // both present (e.g. "debited … beneficiary credited") — the subject of the
    // sentence is the account holder's side; "debited"/"spent" wins.
    return 'expense'
  }
  return null
}

// ---------- amount ----------

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) || n <= 0 ? null : n
}

function extractAmount(body: string): number | null {
  // 1) currency-tagged: Rs.450 / INR 1,450.50 / ₹450 / Rs 1,23,456.78
  const tagged = body.match(/(?:rs|inr|₹)\.?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i)
  if (tagged) {
    const a = parseAmount(tagged[1])
    if (a) return a
  }
  // 2) "debited by 450.0" / "credited by 5000" (SBI style, no currency token)
  const byAmt = body.match(/\b(?:by|for|of)\s+([0-9][0-9,]*\.[0-9]{1,2}|[0-9][0-9,]{2,})\b/i)
  if (byAmt) {
    const a = parseAmount(byAmt[1])
    if (a) return a
  }
  return null
}

// ---------- date ----------

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function fourDigitYear(yy: string): number {
  const n = parseInt(yy, 10)
  return yy.length === 2 ? 2000 + n : n
}

/** Pull a transaction date out of the SMS; fall back to the received time. */
function extractDate(body: string, receivedMs: number): string {
  // 12Jun26 / 12-Jun-26 / 12 Jun 2026
  const named = body.match(/\b(\d{1,2})[\s-]?([A-Za-z]{3})[\s-]?(\d{2,4})\b/)
  if (named && MONTHS[named[2].toLowerCase()] !== undefined) {
    const d = new Date(fourDigitYear(named[3]), MONTHS[named[2].toLowerCase()], +named[1])
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  // 12-06-26 / 12/06/2026 (Indian dd-mm-yy first)
  const numeric = body.match(/\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b/)
  if (numeric) {
    const d = new Date(fourDigitYear(numeric[3]), +numeric[2] - 1, +numeric[1])
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return new Date(receivedMs).toISOString()
}

// ---------- merchant ----------

const ACCT_TAIL = /\b(?:a\/?c|acct|account|card)\s*(?:no\.?|number|x+|\*+)?\s*[xX*]*(\d{3,6})\b/i

function cleanMerchant(raw: string): string {
  return raw
    .replace(/\b(via|using|on|ref(?:no|erence)?|upi|imps|neft|rtgs|p2a|p2m|txn|trf|to|from)\b.*$/i, '')
    .replace(/[*_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\s(.,;:)-]+$/, '')
    .trim()
    .slice(0, 60)
}

// Reject captures that aren't real merchant names: too short, no letters
// (phone/ref numbers), or a generic banking word.
function isJunkMerchant(s: string): boolean {
  const t = s.trim()
  if (t.length < 2) return true
  if (!/[a-z]/i.test(t)) return true // pure digits → phone / ref no
  if (/^(?:rs|inr|₹)\.?\s*[0-9]/i.test(t)) return true // a currency amount, not a payee
  if (/^(a\/?c|ac|acct|account|upi|the|your|info|card|no|number|bank|rs|inr)$/i.test(t)) return true
  return false
}

/**
 * Find the counterparty. Tries, in order: decoded VPA → "<name> credited"
 * beneficiary (ICICI) → card-spend name before "Avl Lmt" (Axis) → "to/at NAME"
 * (debit) / "from/by NAME" (credit) → PSP hint → "Unknown". The first capture
 * that isn't junk (a phone/ref number or generic word) wins.
 */
function extractMerchant(body: string, type: TransactionType): { merchant: string; vpa: string | null } {
  const vpa = extractVpa(body)
  if (vpa) {
    const fromVpa = merchantFromVpa(vpa)
    if (fromVpa) return { merchant: fromVpa, vpa }
  }

  const candidates: (string | undefined)[] = []

  if (type === 'expense') {
    // ICICI: "... debited for Rs X; AMAZON credited."
    candidates.push(body.match(/[;,]\s*([A-Za-z][A-Za-z0-9 &.'_-]{1,40}?)\s+credited\b/i)?.[1])
    // Axis card: "Spent Card ... INR 780 10-06-2026 UBER INDIA Avl Lmt ..."
    // letters-only capture so it locks onto the merchant words, not the
    // preceding amount/date digits.
    candidates.push(body.match(/([A-Za-z][A-Za-z &.'-]{2,40}?)\s+(?:avl|avbl|avlbl|aval|avail)\b/i)?.[1])
    // "spent at X" / "trf to X" / "paid to X" / "sent to X" / "to X"
    candidates.push(body.match(/\bspent at\s+([A-Za-z][A-Za-z0-9 &.'@_-]{1,40})/i)?.[1])
    candidates.push(body.match(/\b(?:trf to|transfer(?:red)? to|paid to|sent to|to)\s+([A-Za-z0-9][A-Za-z0-9 &.'@_-]{1,40})/i)?.[1])
  } else {
    // income: "received from X", "credited by X", "from X", "by X". Collect ALL
    // matches — the first "by" often precedes the amount ("credited by Rs.75000
    // … by SALARY"), so we keep going until a non-amount payee turns up.
    const stop = /(?=\s+(?:on|ref|dated|via|upi|imps|neft|txn|rs|inr|by)\b|\s*\(|[,;]|$)/
    const incomeRe = new RegExp(
      String.raw`\b(?:received from|credited by|from|by)\s+([A-Za-z0-9][A-Za-z0-9 &.'@_-]{1,40}?)` + stop.source,
      'gi'
    )
    for (const m of body.matchAll(incomeRe)) candidates.push(m[1])
  }

  for (const c of candidates) {
    if (!c) continue
    const m = cleanMerchant(c)
    if (m && !isJunkMerchant(m)) return { merchant: m, vpa }
  }

  if (vpa) {
    const psp = pspFromVpa(vpa)
    if (psp) return { merchant: psp, vpa }
  }
  return { merchant: 'Unknown', vpa }
}

// ---------- single message ----------

type RawRow = Omit<ParsedTransaction, 'id' | 'selected' | 'duplicate'>

/**
 * Parse one SMS into a transaction draft, or null if it isn't a completed
 * debit/credit. Exposed (rather than only the batch form) for unit testing.
 */
export function parseBankSms(msg: SmsMessage): RawRow | null {
  const body = msg.body || ''
  if (!body || SKIP_WORDS.test(body)) return null

  const type = classify(body)
  if (!type) return null

  const amount = extractAmount(body)
  if (!amount) return null

  const date = extractDate(body, msg.date || Date.now())
  const { merchant } = extractMerchant(body, type)

  const bank = detectBank(msg.sender)
  const acct = body.match(ACCT_TAIL)
  const noteParts = [bank, acct ? `A/c …${acct[1]}` : null].filter(Boolean)

  const rawCat = type === 'income' ? 'other_inc' : guessCategory(merchant)
  const validCats = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const category = validCats.includes(rawCat)
    ? rawCat
    : type === 'income' ? 'other_inc' : 'other_exp'

  // Confidence: known bank sender + a real merchant name => high.
  let confidence = 0.6
  if (bank) confidence += 0.15
  if (merchant !== 'Unknown') confidence += 0.15
  confidence = Math.min(confidence, 0.95)

  return {
    date,
    amount,
    type,
    category,
    merchant,
    note: noteParts.join(' · '),
    rawText: body,
    confidence,
  }
}

// ---------- batch ----------

/**
 * Parse a list of SMS into ParsedTransaction rows ready for ImportPreview.
 * Non-transaction messages are dropped. Rows come back newest-first.
 */
export function parseSmsMessages(messages: SmsMessage[]): ParsedTransaction[] {
  const rows: ParsedTransaction[] = []
  for (const msg of messages) {
    const parsed = parseBankSms(msg)
    if (!parsed) continue
    rows.push({ ...parsed, id: uuid(), selected: true, duplicate: false })
  }
  rows.sort((a, b) => +new Date(b.date) - +new Date(a.date))
  return rows
}
