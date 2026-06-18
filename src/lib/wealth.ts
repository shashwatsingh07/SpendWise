/**
 * wealth — compound-growth projection for long-term saving/investing.
 *
 * Pure maths: future value of an initial lump sum plus a fixed monthly
 * contribution, compounded monthly. Used by the Wealth Projection page to answer
 * "if I save ₹X/month at Y% returns, what will I have in N years?"
 */

export interface WealthInput {
  initial: number // starting balance
  monthly: number // monthly contribution
  annualRatePct: number // expected annual return, %
  years: number
}

export interface WealthPoint {
  year: number
  contributed: number // principal in by this year (initial + contributions)
  value: number // projected balance incl. growth
  growth: number // value - contributed
}

export interface WealthProjection {
  points: WealthPoint[] // index 0 = today, then end of each year
  finalValue: number
  totalContributed: number
  totalGrowth: number
}

export function projectWealth({ initial, monthly, annualRatePct, years }: WealthInput): WealthProjection {
  const r = annualRatePct / 100 / 12 // monthly rate
  const months = Math.max(0, Math.round(years * 12))

  const points: WealthPoint[] = []
  let value = initial

  const pushPoint = (monthIdx: number) => {
    const contributed = initial + monthly * monthIdx
    points.push({
      year: monthIdx / 12,
      contributed,
      value,
      growth: value - contributed,
    })
  }

  pushPoint(0)
  for (let i = 1; i <= months; i++) {
    // contribute at the start of the month, then grow
    value = (value + monthly) * (1 + r)
    if (i % 12 === 0 || i === months) pushPoint(i)
  }

  const totalContributed = initial + monthly * months
  return {
    points,
    finalValue: value,
    totalContributed,
    totalGrowth: value - totalContributed,
  }
}
