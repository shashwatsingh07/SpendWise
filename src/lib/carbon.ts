/**
 * carbon — a spend-based carbon-footprint estimator.
 *
 * There's no transaction-level emissions data in a personal finance app, so we
 * use spend-based estimation: each expense category carries an emission factor
 * (kg CO₂e per ₹1,000 spent) drawn from rough consumption-based averages. This
 * is an indicative footprint, not an audited figure — enough to surface where a
 * user's money has the biggest environmental impact and how it trends.
 *
 * Like the rest of the analytics layer this is pure, offline JS. All amounts are
 * converted to the user's base currency first; factors are calibrated to ₹1,000,
 * so non-INR bases still produce a sensible relative breakdown.
 */

import { Transaction } from '../types'
import { getCategoryById } from '../data/categories'
import { convertCurrency } from '../data/currencies'

// kg CO₂e per ₹1,000 of spend, by category. Higher = more carbon-intensive.
export const CARBON_FACTORS: Record<string, number> = {
  travel: 18, // flights dominate
  transport: 12, // fuel, ride-hailing
  bills: 11, // grid electricity, gas
  shopping: 9, // manufactured goods
  food: 7, // groceries + dining (meat-weighted)
  housing: 6,
  gifts: 6,
  pets: 5,
  personal: 4,
  entertainment: 4,
  fitness: 3,
  health: 3,
  education: 2,
  subscriptions: 2, // digital services
  other_exp: 5,
}

const DEFAULT_FACTOR = 5
const MS_DAY = 86_400_000

// A mature tree absorbs ~21 kg CO₂ per year.
const KG_PER_TREE_YEAR = 21

export function factorFor(categoryId: string): number {
  return CARBON_FACTORS[categoryId] ?? DEFAULT_FACTOR
}

export interface CarbonCategory {
  category: string
  spend: number
  kg: number
  factor: number
  pct: number // share of total kg
}

export interface CarbonReport {
  totalKg: number
  totalSpend: number
  intensity: number // kg per ₹1,000 across all spend
  score: number // 0-100, higher = greener
  grade: string
  label: string
  perCategory: CarbonCategory[]
  treesPerYear: number // trees needed to offset at this monthly rate
  trendPct: number | null // vs previous month (+ = worse)
}

function sameMonth(d: Date, y: number, m: number) {
  return d.getFullYear() === y && d.getMonth() === m
}

function monthFootprint(txns: Transaction[], base: string, y: number, m: number) {
  let kg = 0
  for (const t of txns) {
    if (t.type !== 'expense') continue
    const d = new Date(t.date)
    if (!sameMonth(d, y, m)) continue
    kg += (convertCurrency(t.amount, t.currency, base) / 1000) * factorFor(t.category)
  }
  return kg
}

function gradeFor(score: number) {
  if (score >= 85) return { grade: 'A', label: 'Very low impact' }
  if (score >= 70) return { grade: 'B', label: 'Low impact' }
  if (score >= 55) return { grade: 'C', label: 'Moderate impact' }
  if (score >= 40) return { grade: 'D', label: 'High impact' }
  return { grade: 'E', label: 'Very high impact' }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function computeCarbon(
  txns: Transaction[],
  base: string,
  now = new Date(),
): CarbonReport {
  const y = now.getFullYear()
  const m = now.getMonth()

  const byCat: Record<string, { spend: number; kg: number }> = {}
  let totalKg = 0
  let totalSpend = 0

  for (const t of txns) {
    if (t.type !== 'expense') continue
    if (!sameMonth(new Date(t.date), y, m)) continue
    const spend = convertCurrency(t.amount, t.currency, base)
    const kg = (spend / 1000) * factorFor(t.category)
    const e = (byCat[t.category] ??= { spend: 0, kg: 0 })
    e.spend += spend
    e.kg += kg
    totalKg += kg
    totalSpend += spend
  }

  const perCategory: CarbonCategory[] = Object.entries(byCat)
    .map(([category, v]) => ({
      category,
      spend: v.spend,
      kg: v.kg,
      factor: factorFor(category),
      pct: totalKg > 0 ? (v.kg / totalKg) * 100 : 0,
    }))
    .sort((a, b) => b.kg - a.kg)

  // intensity vs a neutral baseline of ~8 kg per ₹1,000. Greener spend mixes
  // (digital, health, education) pull intensity down and the score up.
  const intensity = totalSpend > 0 ? (totalKg / totalSpend) * 1000 : 0
  const score = totalSpend > 0 ? clamp(Math.round(100 - (intensity - 4) * 7), 0, 100) : 100
  const { grade, label } = gradeFor(score)

  // previous month for trend
  const prev = new Date(y, m - 1, 1)
  const prevKg = monthFootprint(txns, base, prev.getFullYear(), prev.getMonth())
  const trendPct = prevKg > 0 ? ((totalKg - prevKg) / prevKg) * 100 : null

  return {
    totalKg,
    totalSpend,
    intensity,
    score,
    grade,
    label,
    perCategory,
    treesPerYear: (totalKg * 12) / KG_PER_TREE_YEAR,
    trendPct,
  }
}

/** A relatable comparison string for a monthly footprint. */
export function carbonEquivalent(monthlyKg: number): string {
  const annualKg = monthlyKg * 12
  // ~0.171 kg CO₂ per km in an average petrol car
  const km = Math.round(annualKg / 0.171)
  if (km >= 1000) return `≈ ${(km / 1000).toFixed(1)}k km driven per year`
  return `≈ ${km.toLocaleString('en-IN')} km driven per year`
}

export function categoryName(id: string): string {
  return getCategoryById(id).name
}
