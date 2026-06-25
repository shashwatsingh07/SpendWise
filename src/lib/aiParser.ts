/**
 * aiParser — turns raw statement text (CSV / TXT / extracted PDF text) into
 * ParsedTransaction rows.
 *
 * Two paths:
 *   1. parseHeuristic() — pure JS, no network. Detects delimiter + columns.
 *      Always runs as a baseline and as fallback.
 *   2. parseWithAI()   — if the user has a Claude API key, send messy text to
 *      Claude and ask for clean JSON rows. Good for PDF text / odd formats.
 *
 * The exported parseStatement() picks the best available path.
 */

import { v4 as uuid } from 'uuid'
import { ParsedTransaction, TransactionType, SmsMessage } from '../types'
import { DEFAULT_CATEGORIES } from '../data/categories'
import { guessCategory } from './merchantMemory'
import { parseSmsMessages } from './bankPatterns'

/**
 * Treat pasted text as one-or-more bank / UPI SMS messages (one per line) and
 * run the dedicated SMS parser. Used as a fallback when the tabular heuristic
 * finds nothing — e.g. someone pastes a single "… debited for Rs 10 …" SMS.
 */
function parseAsSms(text: string): ParsedTransaction[] {
  const msgs: SmsMessage[] = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map((body, i) => ({ id: String(i), body, date: Date.now() }))
  return parseSmsMessages(msgs)
}

const SMS_VERBS = /\b(debited|credited|spent|paid|sent|received|withdrawn|deposited|trf|transferred)\b/i

/**
 * Heuristic: does the pasted text read as bank/UPI SMS (sentences with a
 * debit/credit verb) rather than a CSV/statement export? Used to route to the
 * SMS parser first so a tabular guesser doesn't grab a ref-number as the amount.
 */
function looksLikeSms(text: string): boolean {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return false
  const verbLines = lines.filter(l => SMS_VERBS.test(l)).length
  return verbLines > 0 && verbLines >= lines.length / 2
}

// ---------- shared helpers ----------

const EXPENSE_CATS = DEFAULT_CATEGORIES.filter(c => c.type !== 'income').map(c => c.id)
const INCOME_CATS = DEFAULT_CATEGORIES.filter(c => c.type !== 'expense').map(c => c.id)

function parseAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[₹$,\s]/g, '').replace(/[()]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.abs(n)
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim()

  // ISO first: yyyy-mm-dd / yyyy/mm/dd  (unambiguous, check before locale guess)
  const iso = s.match(/(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/)
  if (iso) {
    const d = new Date(+iso[1], +iso[2] - 1, +iso[3])
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  // dd/mm/yyyy or dd-mm-yyyy (Indian default — day first, NOT JS's mm/dd guess)
  const m = s.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    const [, dd, mm, yy] = m
    const year = parseInt(yy.length === 2 ? '20' + yy : yy, 10)
    const d = new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10))
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  // dd Mon yyyy / dd-Mon-yy
  const m2 = s.match(/(\d{1,2})[\s\-]*([A-Za-z]{3,9})[\s\-]*(\d{2,4})/)
  if (m2) {
    const yy = m2[3]
    const d = new Date(`${m2[1]} ${m2[2]} ${yy.length === 2 ? '20' + yy : yy}`)
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  // last resort: only if it carries a 4-digit year and a month name
  if (/\d{4}/.test(s) && /[A-Za-z]{3,}/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

function detectDelimiter(line: string): string {
  const counts = [
    { d: ',', n: (line.match(/,/g) || []).length },
    { d: '\t', n: (line.match(/\t/g) || []).length },
    { d: ';', n: (line.match(/;/g) || []).length },
    { d: '|', n: (line.match(/\|/g) || []).length },
  ]
  counts.sort((a, b) => b.n - a.n)
  return counts[0].n > 0 ? counts[0].d : ','
}

function splitRow(line: string, delim: string): string[] {
  // simple CSV split that respects double quotes
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQ = !inQ
    else if (ch === delim && !inQ) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map(c => c.trim().replace(/^"|"$/g, ''))
}

const HEADER_HINTS = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting'],
  desc: ['description', 'narration', 'details', 'particulars', 'remarks', 'merchant', 'transaction'],
  amount: ['amount', 'amt'],
  debit: ['debit', 'withdrawal', 'dr', 'paid out', 'spent'],
  credit: ['credit', 'deposit', 'cr', 'paid in', 'received'],
  type: ['type', 'dr/cr', 'transaction type'],
}

function findCol(headers: string[], hints: string[]): number {
  const lc = headers.map(h => h.toLowerCase().trim())
  // tokens, so short hints like "dr"/"cr" match whole words only
  // (otherwise "cr" wrongly matches "des-cr-iption")
  const tokens = lc.map(h => h.split(/[^a-z]+/).filter(Boolean))
  for (const hint of hints) {
    if (hint.length <= 3) {
      const idx = tokens.findIndex(t => t.includes(hint))
      if (idx !== -1) return idx
    } else {
      const idx = lc.findIndex(h => h.includes(hint))
      if (idx !== -1) return idx
    }
  }
  return -1
}

function finalize(rows: Omit<ParsedTransaction, 'id' | 'selected' | 'duplicate'>[]): ParsedTransaction[] {
  return rows.map(r => ({
    ...r,
    id: uuid(),
    selected: true,
    duplicate: false,
  }))
}

const INCOME_WORDS = /\b(credit|received|refund|salary|deposit|cashback|interest|cr)\b/i

/**
 * Loose, delimiter-less parser for space-separated text — e.g. text extracted
 * from a PDF, or a pasted statement with no commas. For each line: pull out the
 * date, then the trailing money value, and treat the middle as the merchant.
 */
function parseLoose(lines: string[]): ParsedTransaction[] {
  const dateRe =
    /(\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2})|(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})|(\d{1,2}[\s\-][A-Za-z]{3,9}[\s\-]\d{2,4})/
  const moneyRe = /-?\(?(?:₹|rs\.?|inr)?\s*(?:\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+\.\d{2}|\d{2,})\)?/gi

  const out: Omit<ParsedTransaction, 'id' | 'selected' | 'duplicate'>[] = []
  for (const line of lines) {
    const dm = line.match(dateRe)
    if (!dm) continue
    const dateISO = parseDate(dm[0])
    if (!dateISO) continue

    const rest = line.replace(dm[0], ' ')
    const amts = [...rest.matchAll(moneyRe)].map(a => a[0])
    if (amts.length === 0) continue
    const amtStr = amts[amts.length - 1] // trailing value is usually the txn amount
    const amount = parseAmount(amtStr)
    if (!amount || amount <= 0) continue

    let type: TransactionType = 'expense'
    if (/^-|\(|\bdr\b/i.test(amtStr.trim())) type = 'expense'
    else if (INCOME_WORDS.test(rest)) type = 'income'

    let merchant = rest.replace(amtStr, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Unknown'
    const category = type === 'income' ? 'other_inc' : guessCategory(merchant)
    const validCat = (type === 'income' ? INCOME_CATS : EXPENSE_CATS).includes(category)

    out.push({
      date: dateISO,
      amount,
      type,
      category: validCat ? category : type === 'income' ? 'other_inc' : 'other_exp',
      merchant,
      note: '',
      rawText: line,
      confidence: 0.5,
    })
  }
  return finalize(out)
}

// ---------- heuristic parser ----------

export function parseHeuristic(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const delim = detectDelimiter(lines[0])
  const headerCells = splitRow(lines[0], delim)
  const looksLikeHeader = headerCells.some(c =>
    /date|amount|debit|credit|description|narration|particulars|balance/i.test(c)
  )

  const headers = looksLikeHeader ? headerCells : []
  const dataLines = looksLikeHeader ? lines.slice(1) : lines

  const dateCol = findCol(headers, HEADER_HINTS.date)
  const descCol = findCol(headers, HEADER_HINTS.desc)
  const amtCol = findCol(headers, HEADER_HINTS.amount)
  const debitCol = findCol(headers, HEADER_HINTS.debit)
  const creditCol = findCol(headers, HEADER_HINTS.credit)

  const out: Omit<ParsedTransaction, 'id' | 'selected' | 'duplicate'>[] = []

  for (const line of dataLines) {
    const cells = splitRow(line, delim)
    if (cells.length < 2) continue

    // date
    let dateISO: string | null = null
    if (dateCol >= 0) dateISO = parseDate(cells[dateCol])
    if (!dateISO) {
      for (const c of cells) {
        const d = parseDate(c)
        if (d) { dateISO = d; break }
      }
    }
    if (!dateISO) continue

    // amount + type
    let amount: number | null = null
    let type: TransactionType = 'expense'

    if (debitCol >= 0 || creditCol >= 0) {
      const debit = debitCol >= 0 ? parseAmount(cells[debitCol]) : null
      const credit = creditCol >= 0 ? parseAmount(cells[creditCol]) : null
      if (debit && debit > 0) { amount = debit; type = 'expense' }
      else if (credit && credit > 0) { amount = credit; type = 'income' }
    } else if (amtCol >= 0) {
      const raw = cells[amtCol]
      amount = parseAmount(raw)
      // negative / (brackets) / trailing Dr => expense, else credit
      if (/^-|\(|dr\b/i.test(raw.trim())) type = 'expense'
      else if (/cr\b|\+/i.test(raw.trim())) type = 'income'
    } else {
      // no known amount column: pick the cell that looks most like money
      for (const c of cells) {
        if (/[₹$]|\d{1,3}(,\d{2,3})+(\.\d+)?|\d+\.\d{2}/.test(c)) {
          const a = parseAmount(c)
          if (a) { amount = a; break }
        }
      }
    }
    if (!amount || amount <= 0) continue

    // merchant / description
    let merchant = descCol >= 0 ? cells[descCol] : ''
    if (!merchant) {
      // longest non-numeric, non-date cell
      merchant = cells
        .filter(c => !parseAmount(c) && !parseDate(c))
        .sort((a, b) => b.length - a.length)[0] || 'Unknown'
    }
    merchant = merchant.replace(/\s+/g, ' ').trim().slice(0, 80) || 'Unknown'

    const category = type === 'income'
      ? 'other_inc'
      : guessCategory(merchant)
    const validCat = (type === 'income' ? INCOME_CATS : EXPENSE_CATS).includes(category)

    out.push({
      date: dateISO,
      amount,
      type,
      category: validCat ? category : (type === 'income' ? 'other_inc' : 'other_exp'),
      merchant,
      note: '',
      rawText: line,
      confidence: descCol >= 0 && (amtCol >= 0 || debitCol >= 0) ? 0.9 : 0.6,
    })
  }

  // Delimiter-less or unrecognised layout (common for PDF text): fall back to
  // line-by-line loose parsing.
  if (out.length === 0) return parseLoose(dataLines)

  return finalize(out)
}

// ---------- AI parser ----------

export async function parseWithAI(text: string, apiKey: string): Promise<ParsedTransaction[]> {
  const catList = DEFAULT_CATEGORIES.map(c => `${c.id} (${c.name})`).join(', ')
  const sample = text.slice(0, 12000) // keep within token budget

  const system = `You extract financial transactions from raw bank / UPI / wallet statement text.
Return ONLY a JSON array, no prose. Each item:
{"date":"YYYY-MM-DD","amount":<positive number>,"type":"expense"|"income","merchant":"<clean name>","category":"<id>"}
Pick category id from: ${catList}.
Clean cryptic merchant codes into readable names (e.g. "SWGY*1234" -> "Swiggy"). Skip header rows, balances, and non-transaction lines. Use today's century for 2-digit years.`

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
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: sample }],
    }),
  })

  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  const data = await res.json()
  const raw = data.content?.[0]?.text ?? '[]'
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  const arr = JSON.parse(jsonMatch ? jsonMatch[0] : '[]') as any[]

  const out = arr
    .map(r => {
      const dateISO = parseDate(String(r.date))
      const amount = parseAmount(String(r.amount))
      if (!dateISO || !amount) return null
      const type: TransactionType = r.type === 'income' ? 'income' : 'expense'
      const valid = (type === 'income' ? INCOME_CATS : EXPENSE_CATS)
      const category = valid.includes(r.category)
        ? r.category
        : type === 'income' ? 'other_inc' : 'other_exp'
      return {
        date: dateISO,
        amount,
        type,
        category,
        merchant: String(r.merchant || 'Unknown').slice(0, 80),
        note: '',
        rawText: '',
        confidence: 0.95,
      } as Omit<ParsedTransaction, 'id' | 'selected' | 'duplicate'>
    })
    .filter(Boolean) as Omit<ParsedTransaction, 'id' | 'selected' | 'duplicate'>[]

  return finalize(out)
}

// ---------- entry point ----------

export async function parseStatement(
  text: string,
  opts: { apiKey?: string; preferAI?: boolean } = {}
): Promise<{ rows: ParsedTransaction[]; usedAI: boolean }> {
  if (opts.apiKey && (opts.preferAI ?? true)) {
    try {
      const rows = await parseWithAI(text, opts.apiKey)
      if (rows.length > 0) return { rows, usedAI: true }
    } catch {
      /* fall through to heuristic */
    }
  }
  // If it reads as bank/UPI SMS, parse it that way first — the tabular guesser
  // would otherwise mistake a ref number for the amount.
  if (looksLikeSms(text)) {
    const sms = parseAsSms(text)
    if (sms.length > 0) return { rows: sms, usedAI: false }
  }
  // Tabular heuristic for CSV / statement exports…
  const heuristic = parseHeuristic(text)
  if (heuristic.length > 0) return { rows: heuristic, usedAI: false }
  // …and a final SMS attempt for anything that slipped through.
  return { rows: parseAsSms(text), usedAI: false }
}
