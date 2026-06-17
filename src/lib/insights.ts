/**
 * insights — the Phase 3 financial analytics engine.
 *
 * Everything here is pure, deterministic JS that runs offline with no API key,
 * mirroring the Phase 2 philosophy ("works without a key, better with one").
 * The AI layer (Insights page / Assistant) wraps these numbers in narrative when
 * the user has supplied a Claude key — but the maths never depends on the network.
 *
 * All amounts are converted to the user's base currency before aggregation.
 */

import { Transaction, Budget } from '../types'
import { getCategoryById } from '../data/categories'
import { convertCurrency, currencySymbol } from '../data/currencies'

// ---------- date helpers ----------

const MS_DAY = 86_400_000

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function sameMonth(d: Date, year: number, month: number) {
  return d.getFullYear() === year && d.getMonth() === month
}

// ---------- shared base-currency reducer ----------

type Tx = Pick<Transaction, 'amount' | 'currency' | 'type' | 'category' | 'date' | 'merchant'>

function makeToBase(base: string) {
  return (t: Pick<Tx, 'amount' | 'currency'>) => convertCurrency(t.amount, t.currency, base)
}

function sumExpenses(txns: Tx[], base: string, filter: (d: Date, t: Tx) => boolean) {
  const toBase = makeToBase(base)
  return txns
    .filter(t => t.type === 'expense' && filter(new Date(t.date), t))
    .reduce((s, t) => s + toBase(t), 0)
}

// ---------- needs / wants classification (for 50/30/20) ----------

// Fixed essentials vs discretionary. Used by budget recommendations + health.
const NEEDS = new Set(['housing', 'bills', 'health', 'transport', 'education'])
const WANTS = new Set([
  'food', 'shopping', 'entertainment', 'subscriptions', 'fitness',
  'travel', 'personal', 'gifts', 'pets', 'other_exp',
])

export function classifyCategory(catId: string): 'needs' | 'wants' {
  if (NEEDS.has(catId)) return 'needs'
  if (WANTS.has(catId)) return 'wants'
  return 'wants'
}

// ---------- Financial Health Score ----------

export interface HealthComponent {
  label: string
  score: number // points earned
  max: number // points available
  detail: string
}

export interface HealthScore {
  score: number // 0-100
  grade: string // A+ .. F
  label: string // "Excellent" etc.
  components: HealthComponent[]
}

function gradeFor(score: number): { grade: string; label: string } {
  if (score >= 90) return { grade: 'A+', label: 'Excellent' }
  if (score >= 80) return { grade: 'A', label: 'Great' }
  if (score >= 70) return { grade: 'B', label: 'Good' }
  if (score >= 55) return { grade: 'C', label: 'Fair' }
  if (score >= 40) return { grade: 'D', label: 'Needs work' }
  return { grade: 'F', label: 'At risk' }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function computeHealthScore(
  txns: Tx[],
  budgets: Budget[],
  base: string,
  now = new Date(),
): HealthScore {
  const y = now.getFullYear()
  const m = now.getMonth()
  const toBase = makeToBase(base)

  const income = txns
    .filter(t => t.type === 'income' && sameMonth(new Date(t.date), y, m))
    .reduce((s, t) => s + toBase(t), 0)
  const expenses = sumExpenses(txns, base, d => sameMonth(d, y, m))

  // 1. Savings rate — 35 pts. 20%+ saved earns full marks.
  const savingsRate = income > 0 ? (income - expenses) / income : 0
  const savingsScore = clamp((savingsRate / 0.2) * 35, 0, 35)

  // 2. Expense-to-income ratio — 25 pts. <=50% great, >=100% none.
  const ratio = income > 0 ? expenses / income : 1.2
  const ratioScore = clamp((1 - (ratio - 0.5) / 0.5) * 25, 0, 25)

  // 3. Budget adherence — 25 pts. Share of budgets still within limit.
  let budgetScore = 17 // neutral when no budgets set
  let budgetDetail = 'No budgets set'
  if (budgets.length > 0) {
    const withinCount = budgets.filter(
      b => sumExpensesForCategory(txns, base, b.category, y, m) <= b.limit,
    ).length
    budgetScore = (withinCount / budgets.length) * 25
    budgetDetail = `${withinCount}/${budgets.length} budgets within limit`
  }

  // 4. Consistency — 15 pts. Positive-balance months over the last 6.
  let positiveMonths = 0
  for (let i = 0; i < 6; i++) {
    const d = new Date(y, m - i, 1)
    const inc = txns
      .filter(t => t.type === 'income' && sameMonth(new Date(t.date), d.getFullYear(), d.getMonth()))
      .reduce((s, t) => s + toBase(t), 0)
    const exp = sumExpenses(txns, base, dd => sameMonth(dd, d.getFullYear(), d.getMonth()))
    if (inc - exp >= 0) positiveMonths++
  }
  const consistencyScore = (positiveMonths / 6) * 15

  const total = Math.round(savingsScore + ratioScore + budgetScore + consistencyScore)
  const { grade, label } = gradeFor(total)

  return {
    score: clamp(total, 0, 100),
    grade,
    label,
    components: [
      {
        label: 'Savings rate',
        score: Math.round(savingsScore),
        max: 35,
        detail: `${Math.round(savingsRate * 100)}% saved this month (target 20%)`,
      },
      {
        label: 'Spending ratio',
        score: Math.round(ratioScore),
        max: 25,
        detail: income > 0 ? `Spending ${Math.round(ratio * 100)}% of income` : 'No income logged this month',
      },
      {
        label: 'Budget adherence',
        score: Math.round(budgetScore),
        max: 25,
        detail: budgetDetail,
      },
      {
        label: 'Consistency',
        score: Math.round(consistencyScore),
        max: 15,
        detail: `${positiveMonths}/6 recent months in the green`,
      },
    ],
  }
}

function sumExpensesForCategory(txns: Tx[], base: string, catId: string, y: number, m: number) {
  const toBase = makeToBase(base)
  return txns
    .filter(t => t.type === 'expense' && t.category === catId && sameMonth(new Date(t.date), y, m))
    .reduce((s, t) => s + toBase(t), 0)
}

// ---------- Month-over-month spending insights ----------

export interface Insight {
  id: string
  tone: 'positive' | 'warning' | 'neutral'
  emoji: string
  title: string
  detail: string
}

export function computeInsights(
  txns: Tx[],
  base: string,
  now = new Date(),
): Insight[] {
  const y = now.getFullYear()
  const m = now.getMonth()
  const prev = new Date(y, m - 1, 1)
  const py = prev.getFullYear()
  const pm = prev.getMonth()
  const toBase = makeToBase(base)
  const out: Insight[] = []

  const thisTotal = sumExpenses(txns, base, d => sameMonth(d, y, m))
  const lastTotal = sumExpenses(txns, base, d => sameMonth(d, py, pm))

  // Overall trend
  if (lastTotal > 0) {
    const delta = (thisTotal - lastTotal) / lastTotal
    if (Math.abs(delta) >= 0.1) {
      out.push({
        id: 'overall-trend',
        tone: delta > 0 ? 'warning' : 'positive',
        emoji: delta > 0 ? '📈' : '📉',
        title: `Spending ${delta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(delta * 100))}% vs last month`,
        detail: `You've spent ${fmt(thisTotal, base)} so far this month vs ${fmt(lastTotal, base)} last month.`,
      })
    }
  }

  // Per-category deltas
  const catThis: Record<string, number> = {}
  const catLast: Record<string, number> = {}
  for (const t of txns) {
    if (t.type !== 'expense') continue
    const d = new Date(t.date)
    if (sameMonth(d, y, m)) catThis[t.category] = (catThis[t.category] ?? 0) + toBase(t)
    else if (sameMonth(d, py, pm)) catLast[t.category] = (catLast[t.category] ?? 0) + toBase(t)
  }

  const deltas = Object.keys(catThis)
    .map(cat => {
      const cur = catThis[cat] ?? 0
      const prevAmt = catLast[cat] ?? 0
      const change = prevAmt > 0 ? (cur - prevAmt) / prevAmt : cur > 0 ? 1 : 0
      return { cat, cur, prevAmt, change }
    })
    .filter(d => d.prevAmt > 0 && Math.abs(d.change) >= 0.25 && Math.abs(d.cur - d.prevAmt) > 200)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  for (const d of deltas.slice(0, 3)) {
    const c = getCategoryById(d.cat)
    const up = d.change > 0
    out.push({
      id: `cat-${d.cat}`,
      tone: up ? 'warning' : 'positive',
      emoji: c.icon,
      title: `${c.name} ${up ? 'up' : 'down'} ${Math.abs(Math.round(d.change * 100))}%`,
      detail: `${fmt(d.cur, base)} this month vs ${fmt(d.prevAmt, base)} last month.`,
    })
  }

  // Biggest category this month
  const topCat = Object.entries(catThis).sort(([, a], [, b]) => b - a)[0]
  if (topCat && thisTotal > 0) {
    const c = getCategoryById(topCat[0])
    out.push({
      id: 'top-cat',
      tone: 'neutral',
      emoji: '🏆',
      title: `${c.name} is your top category`,
      detail: `${fmt(topCat[1], base)} — ${Math.round((topCat[1] / thisTotal) * 100)}% of this month's spending.`,
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'steady',
      tone: 'neutral',
      emoji: '✨',
      title: 'Spending is steady',
      detail: 'No major changes versus last month. Keep it up!',
    })
  }
  return out
}

// ---------- Anomaly detection ----------

export interface Anomaly {
  txId?: string
  category: string
  merchant: string
  amount: number
  multiple: number // how many times the category average
  date: string
}

/**
 * Flags recent (last 30 days) expenses that are unusually large for their
 * category, using a 90-day baseline (mean + 2·σ, and at least 2× the mean).
 */
export function detectAnomalies(
  txns: Transaction[],
  base: string,
  now = new Date(),
): Anomaly[] {
  const toBase = makeToBase(base)
  const cutoff90 = now.getTime() - 90 * MS_DAY
  const cutoff30 = now.getTime() - 30 * MS_DAY

  // baseline samples per category over 90 days
  const samples: Record<string, number[]> = {}
  for (const t of txns) {
    if (t.type !== 'expense') continue
    const ts = new Date(t.date).getTime()
    if (ts < cutoff90 || ts > now.getTime()) continue
    ;(samples[t.category] ??= []).push(toBase(t))
  }

  const stats: Record<string, { mean: number; std: number; n: number }> = {}
  for (const [cat, arr] of Object.entries(samples)) {
    const n = arr.length
    const mean = arr.reduce((s, v) => s + v, 0) / n
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n
    stats[cat] = { mean, std: Math.sqrt(variance), n }
  }

  const out: Anomaly[] = []
  for (const t of txns) {
    if (t.type !== 'expense') continue
    const ts = new Date(t.date).getTime()
    if (ts < cutoff30 || ts > now.getTime()) continue
    const st = stats[t.category]
    if (!st || st.n < 4) continue
    const amt = toBase(t)
    const threshold = Math.max(st.mean + 2 * st.std, st.mean * 2)
    if (amt > threshold && amt > st.mean) {
      out.push({
        txId: t.id,
        category: t.category,
        merchant: t.merchant || getCategoryById(t.category).name,
        amount: amt,
        multiple: st.mean > 0 ? amt / st.mean : 0,
        date: t.date,
      })
    }
  }
  return out.sort((a, b) => b.multiple - a.multiple).slice(0, 6)
}

// ---------- Run-rate forecasting ----------

export interface Forecast {
  spentSoFar: number
  projectedTotal: number
  daysElapsed: number
  daysInMonth: number
  perCategory: {
    category: string
    spent: number
    projected: number
    budget?: number
    overBy?: number // projected - budget, if > 0
  }[]
}

export function forecastMonth(
  txns: Tx[],
  budgets: Budget[],
  base: string,
  now = new Date(),
): Forecast {
  const y = now.getFullYear()
  const m = now.getMonth()
  const toBase = makeToBase(base)
  const dim = daysInMonth(y, m)
  const elapsed = Math.max(1, Math.ceil((now.getTime() - startOfMonth(now).getTime()) / MS_DAY))
  const factor = dim / elapsed

  const spentSoFar = sumExpenses(txns, base, d => sameMonth(d, y, m))

  const catSpent: Record<string, number> = {}
  for (const t of txns) {
    if (t.type !== 'expense') continue
    if (!sameMonth(new Date(t.date), y, m)) continue
    catSpent[t.category] = (catSpent[t.category] ?? 0) + toBase(t)
  }

  const budgetByCat = new Map(budgets.map(b => [b.category, b.limit]))

  const perCategory = Object.entries(catSpent)
    .map(([category, spent]) => {
      const projected = spent * factor
      const budget = budgetByCat.get(category)
      const overBy = budget && projected > budget ? projected - budget : undefined
      return { category, spent, projected, budget, overBy }
    })
    .sort((a, b) => b.projected - a.projected)

  return {
    spentSoFar,
    projectedTotal: spentSoFar * factor,
    daysElapsed: elapsed,
    daysInMonth: dim,
    perCategory,
  }
}

// ---------- 50 / 30 / 20 budget recommendations ----------

export interface BudgetRec {
  monthlyIncome: number
  needs: number
  wants: number
  savings: number
  currentNeeds: number
  currentWants: number
  currentSavings: number
}

export function recommendBudget(
  txns: Tx[],
  base: string,
  monthlyIncome: number,
  now = new Date(),
): BudgetRec {
  const y = now.getFullYear()
  const m = now.getMonth()
  const toBase = makeToBase(base)

  let currentNeeds = 0
  let currentWants = 0
  for (const t of txns) {
    if (t.type !== 'expense' || !sameMonth(new Date(t.date), y, m)) continue
    const amt = toBase(t)
    if (classifyCategory(t.category) === 'needs') currentNeeds += amt
    else currentWants += amt
  }
  const currentSavings = monthlyIncome - currentNeeds - currentWants

  return {
    monthlyIncome,
    needs: monthlyIncome * 0.5,
    wants: monthlyIncome * 0.3,
    savings: monthlyIncome * 0.2,
    currentNeeds,
    currentWants,
    currentSavings,
  }
}

// ---------- What-if scenarios ----------

export interface WhatIf {
  category: string
  currentMonthly: number
  reductionPct: number
  monthlySaving: number
  yearlySaving: number
}

/** Average monthly spend for a category over the last `months` whole months. */
export function avgMonthlySpend(
  txns: Tx[],
  base: string,
  category: string,
  months = 3,
  now = new Date(),
): number {
  const toBase = makeToBase(base)
  let total = 0
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    total += txns
      .filter(t => t.type === 'expense' && t.category === category &&
        sameMonth(new Date(t.date), d.getFullYear(), d.getMonth()))
      .reduce((s, t) => s + toBase(t), 0)
  }
  return total / months
}

export function whatIf(
  txns: Tx[],
  base: string,
  category: string,
  reductionPct: number,
  now = new Date(),
): WhatIf {
  const currentMonthly = avgMonthlySpend(txns, base, category, 3, now)
  const monthlySaving = currentMonthly * (reductionPct / 100)
  return {
    category,
    currentMonthly,
    reductionPct,
    monthlySaving,
    yearlySaving: monthlySaving * 12,
  }
}

// ---------- formatting (kept here so engine output is self-describing) ----------

function fmt(amount: number, base: string): string {
  return `${currencySymbol(base)}${Math.round(amount).toLocaleString('en-IN')}`
}
