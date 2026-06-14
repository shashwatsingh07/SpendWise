import { differenceInCalendarDays } from 'date-fns'
import { RecurringInterval, Transaction } from '../types'

/** Next occurrence on/after today, stepping forward from the last logged date. */
export function nextRenewal(dateISO: string, interval: RecurringInterval): Date {
  const next = new Date(dateISO)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let guard = 0
  while (next < now && guard++ < 1000) {
    if (interval === 'daily') next.setDate(next.getDate() + 1)
    else if (interval === 'weekly') next.setDate(next.getDate() + 7)
    else if (interval === 'monthly') next.setMonth(next.getMonth() + 1)
    else next.setFullYear(next.getFullYear() + 1)
  }
  return next
}

export interface UpcomingBill {
  tx: Transaction
  next: Date
  days: number
}

/** Recurring expenses whose next charge falls within `withinDays`, soonest first. */
export function upcomingBills(transactions: Transaction[], withinDays = 7): UpcomingBill[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return transactions
    .filter(t => t.isRecurring && t.type === 'expense')
    .map(t => {
      const next = nextRenewal(t.date, t.recurringInterval ?? 'monthly')
      return { tx: t, next, days: differenceInCalendarDays(next, today) }
    })
    .filter(b => b.days <= withinDays)
    .sort((a, b) => a.next.getTime() - b.next.getTime())
}
