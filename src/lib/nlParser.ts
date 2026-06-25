/**
 * nlParser — turns a one-line natural sentence into transaction fields.
 *
 *   "spent 500 on Swiggy lunch"        -> expense ₹500, food, Swiggy
 *   "got 75000 salary today"           -> income ₹75000, salary
 *   "₹1.2k uber yesterday"             -> expense ₹1200, transport, Uber, -1 day
 *
 * Like the statement parser, there are two paths:
 *   1. parseNL()      — pure JS heuristics, no network. Always available.
 *   2. parseNLWithAI() — optional Claude pass for messy / ambiguous input.
 * The exported parseQuickAdd() picks the best available path.
 */

import { TransactionType } from '../types'
import { DEFAULT_CATEGORIES } from '../data/categories'
import { CURRENCIES } from '../data/currencies'
import { guessCategory } from './merchantMemory'

export interface ParsedQuickAdd {
  amount?: number
  currency?: string
  type: TransactionType
  category?: string
  merchant?: string
  note?: string
  date?: string // ISO
}

const INCOME_WORDS = /\b(salary|income|received|recd|got paid|credited|refund|refunded|earned|bonus|cashback|dividend|interest)\b/i

const SYMBOL_TO_CODE: Record<string, string> = Object.fromEntries(
  CURRENCIES.map(c => [c.symbol, c.code]),
)

function parseAmount(text: string): { amount?: number; currency?: string } {
  // optional symbol/code, number with commas/decimals, optional k/l/lakh suffix
  const re = /(₹|\$|€|£|¥|rs\.?|inr|usd|eur|gbp)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|l|lakh|lac|cr|crore)?/i
  const m = text.match(re)
  if (!m) return {}
  let amount = parseFloat(m[2].replace(/,/g, ''))
  if (isNaN(amount)) return {}
  const suffix = m[3]?.toLowerCase()
  if (suffix === 'k') amount *= 1_000
  else if (suffix === 'l' || suffix === 'lakh' || suffix === 'lac') amount *= 100_000
  else if (suffix === 'cr' || suffix === 'crore') amount *= 10_000_000

  let currency: string | undefined
  const sym = m[1]
  if (sym) {
    const s = sym.toLowerCase()
    if (s === 'rs.' || s === 'rs' || s === 'inr') currency = 'INR'
    else if (s === 'usd') currency = 'USD'
    else if (s === 'eur') currency = 'EUR'
    else if (s === 'gbp') currency = 'GBP'
    else currency = SYMBOL_TO_CODE[sym]
  }
  return { amount, currency }
}

function parseRelativeDate(text: string): string | undefined {
  const t = text.toLowerCase()
  const now = new Date()
  if (/\byesterday\b|\blast night\b/.test(t)) {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return d.toISOString()
  }
  if (/\bday before yesterday\b/.test(t)) {
    const d = new Date(now)
    d.setDate(d.getDate() - 2)
    return d.toISOString()
  }
  if (/\btoday\b|\bthis morning\b|\btonight\b|\bjust now\b/.test(t)) {
    return now.toISOString()
  }
  return undefined
}

function extractMerchant(text: string): string | undefined {
  // prefer the chunk after "on" / "at" / "for" / "to"
  const m = text.match(/\b(?:on|at|for|to|from)\s+([a-z0-9&'.\- ]{2,40})/i)
  if (m) {
    let cand = m[1].trim()
    // strip trailing time/date words
    cand = cand.replace(/\b(today|yesterday|tonight|this morning|last night|just now)\b.*$/i, '').trim()
    cand = cand.replace(/\b(lunch|dinner|breakfast|snacks?|coffee|tea)\b/gi, '').trim()
    if (cand.length >= 2) return titleCase(cand)
  }
  return undefined
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

export function parseNL(text: string, baseCurrency = 'INR'): ParsedQuickAdd {
  const { amount, currency } = parseAmount(text)
  const type: TransactionType = INCOME_WORDS.test(text) ? 'income' : 'expense'
  const date = parseRelativeDate(text)
  const merchant = extractMerchant(text)

  let category: string | undefined
  if (type === 'income') {
    category = /salary/i.test(text) ? 'salary'
      : /freelance|client|invoice/i.test(text) ? 'freelance'
      : /dividend|interest|investment/i.test(text) ? 'investment'
      : 'other_inc'
  } else {
    // guess from merchant first, then from the whole sentence
    const guess = guessCategory(merchant || text)
    category = guess
    if (guess === 'other_exp') {
      // try matching a category name word directly
      const lower = text.toLowerCase()
      const named = DEFAULT_CATEGORIES.find(
        c => c.type !== 'income' && lower.includes(c.name.split(' ')[0].toLowerCase()),
      )
      if (named) category = named.id
    }
  }

  return {
    amount,
    currency: currency || baseCurrency,
    type,
    category,
    merchant,
    date,
  }
}

// ---------- optional AI path ----------

export async function parseNLWithAI(
  text: string,
  apiKey: string,
  baseCurrency = 'INR',
): Promise<ParsedQuickAdd> {
  const catList = DEFAULT_CATEGORIES.map(c => `${c.id} (${c.name})`).join(', ')
  const today = new Date().toISOString().slice(0, 10)
  const system = `You convert a short natural-language money note into one JSON object, no prose:
{"amount":<positive number>,"currency":"<ISO code>","type":"expense"|"income","category":"<id>","merchant":"<clean name or empty>","date":"YYYY-MM-DD"}
Today is ${today}. Resolve relative dates ("yesterday", "this morning"). Default currency ${baseCurrency}.
Pick category id from: ${catList}. Output ONLY the JSON object.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system,
      messages: [{ role: 'user', content: text }],
    }),
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  const data = await res.json()
  const raw = data.content?.[0]?.text ?? '{}'
  const match = raw.match(/\{[\s\S]*\}/)
  const obj = JSON.parse(match ? match[0] : '{}') as Record<string, unknown>

  const type: TransactionType = obj.type === 'income' ? 'income' : 'expense'
  const validCats = DEFAULT_CATEGORIES
    .filter(c => (type === 'income' ? c.type !== 'expense' : c.type !== 'income'))
    .map(c => c.id)
  const amount = Number(obj.amount)
  const dateStr = typeof obj.date === 'string' ? obj.date : undefined
  return {
    amount: isNaN(amount) || amount <= 0 ? undefined : amount,
    currency: typeof obj.currency === 'string' ? obj.currency : baseCurrency,
    type,
    category: validCats.includes(obj.category as string) ? (obj.category as string) : undefined,
    merchant: obj.merchant ? String(obj.merchant).slice(0, 80) : undefined,
    date: dateStr ? new Date(dateStr).toISOString() : undefined,
  }
}

// ---------- entry point ----------

export async function parseQuickAdd(
  text: string,
  opts: { apiKey?: string; baseCurrency?: string } = {},
): Promise<{ parsed: ParsedQuickAdd; usedAI: boolean }> {
  const base = opts.baseCurrency ?? 'INR'
  if (opts.apiKey) {
    try {
      const parsed = await parseNLWithAI(text, opts.apiKey, base)
      if (parsed.amount) return { parsed, usedAI: true }
    } catch {
      /* fall through to heuristic */
    }
  }
  return { parsed: parseNL(text, base), usedAI: false }
}
