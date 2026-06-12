import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`
  return `${symbol}${amount.toLocaleString('en-IN')}`
}

export function formatCurrencyFull(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN')}`
}

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'dd MMM yyyy')
}

export function formatDateShort(isoString: string): string {
  return format(parseISO(isoString), 'dd MMM')
}

export function getMonthLabel(year: number, month: number): string {
  return format(new Date(year, month, 1), 'MMMM yyyy')
}

export function getLast6Months(): { year: number; month: number; label: string }[] {
  const result = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: format(d, 'MMM'),
    })
  }
  return result
}

export function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

/** Gradient version of the progress fill, used by budget/goal bars. */
export function getProgressGradient(pct: number): string {
  if (pct >= 100) return 'bg-gradient-to-r from-rose-500 to-red-500'
  if (pct >= 80) return 'bg-gradient-to-r from-amber-400 to-orange-500'
  return 'bg-gradient-to-r from-emerald-400 to-teal-500'
}

export function getMoodEmoji(mood?: string): string {
  const map: Record<string, string> = {
    happy: '😊',
    neutral: '😐',
    stressed: '😰',
    impulsive: '😬',
  }
  return mood ? (map[mood] ?? '') : ''
}
