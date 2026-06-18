/**
 * report — aggregates a period (a month or a whole year) into the figures the
 * AI Report Generator renders and narrates. Pure, offline, base-currency.
 */

import { Transaction } from '../types'
import { convertCurrency } from '../data/currencies'
import { getCategoryById } from '../data/categories'

export type ReportPeriod =
  | { kind: 'month'; year: number; month: number }
  | { kind: 'year'; year: number }

export interface ReportCategory {
  category: string
  name: string
  icon: string
  amount: number
  pct: number
}

export interface ReportData {
  label: string // e.g. "June 2026" or "2026"
  income: number
  expenses: number
  net: number
  savingsRatePct: number
  txCount: number
  topCategories: ReportCategory[]
  topMerchants: { name: string; amount: number }[]
}

function inPeriod(d: Date, p: ReportPeriod): boolean {
  if (p.kind === 'year') return d.getFullYear() === p.year
  return d.getFullYear() === p.year && d.getMonth() === p.month
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function buildReport(txns: Transaction[], base: string, p: ReportPeriod): ReportData {
  const label = p.kind === 'year' ? `${p.year}` : `${MONTHS[p.month]} ${p.year}`

  let income = 0
  let expenses = 0
  let txCount = 0
  const byCat: Record<string, number> = {}
  const byMerchant: Record<string, number> = {}

  for (const t of txns) {
    if (!inPeriod(new Date(t.date), p)) continue
    txCount++
    const amt = convertCurrency(t.amount, t.currency, base)
    if (t.type === 'income') {
      income += amt
    } else {
      expenses += amt
      byCat[t.category] = (byCat[t.category] ?? 0) + amt
      const m = (t.merchant || getCategoryById(t.category).name).trim()
      byMerchant[m] = (byMerchant[m] ?? 0) + amt
    }
  }

  const topCategories: ReportCategory[] = Object.entries(byCat)
    .map(([category, amount]) => {
      const c = getCategoryById(category)
      return { category, name: c.name, icon: c.icon, amount, pct: expenses > 0 ? (amount / expenses) * 100 : 0 }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const topMerchants = Object.entries(byMerchant)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return {
    label,
    income,
    expenses,
    net: income - expenses,
    savingsRatePct: income > 0 ? ((income - expenses) / income) * 100 : 0,
    txCount,
    topCategories,
    topMerchants,
  }
}
