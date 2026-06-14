import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Repeat, CalendarClock, TrendingUp, Layers, BellRing } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { useStore } from '../store/useStore'
import { getCategoryById } from '../data/categories'
import { currencySymbol, convertCurrency } from '../data/currencies'
import { formatCurrencyFull } from '../lib/utils'
import { nextRenewal } from '../lib/recurring'
import { staggerContainer, fadeUp, scaleIn } from '../lib/motion'
import { RecurringInterval, Transaction } from '../types'

const MONTHLY_FACTOR: Record<RecurringInterval, number> = {
  daily: 30,
  weekly: 4.345,
  monthly: 1,
  yearly: 1 / 12,
}

const INTERVAL_LABEL: Record<RecurringInterval, string> = {
  daily: '/day',
  weekly: '/week',
  monthly: '/month',
  yearly: '/year',
}

function toMonthly(amount: number, interval: RecurringInterval) {
  return amount * MONTHLY_FACTOR[interval]
}

export default function Recurring() {
  const { transactions, settings } = useStore()
  const sym = settings.currencySymbol

  const { subs, other, monthlyTotal, monthlyIncome, upcoming } = useMemo(() => {
    const recurring = transactions
      .filter(t => t.isRecurring)
      .map(t => {
        const interval = t.recurringInterval ?? 'monthly'
        const baseAmount = convertCurrency(t.amount, t.currency, settings.currency)
        return { tx: t, interval, monthly: toMonthly(baseAmount, interval), next: nextRenewal(t.date, interval) }
      })

    const expense = recurring.filter(r => r.tx.type === 'expense')
    const subs = expense
      .filter(r => r.tx.category === 'subscriptions')
      .sort((a, b) => b.monthly - a.monthly)
    const other = expense
      .filter(r => r.tx.category !== 'subscriptions')
      .sort((a, b) => b.monthly - a.monthly)

    const monthlyTotal = expense.reduce((s, r) => s + r.monthly, 0)
    const monthlyIncome = recurring
      .filter(r => r.tx.type === 'income')
      .reduce((s, r) => s + r.monthly, 0)

    // Bills due within the next 14 days, soonest first.
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcoming = expense
      .filter(r => differenceInCalendarDays(r.next, today) <= 14)
      .sort((a, b) => a.next.getTime() - b.next.getTime())

    return { subs, other, monthlyTotal, monthlyIncome, upcoming }
  }, [transactions, settings.currency])

  const incomePct = settings.monthlyIncome > 0 ? Math.round((monthlyTotal / settings.monthlyIncome) * 100) : 0
  const isEmpty = subs.length === 0 && other.length === 0

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Repeat size={24} className="text-violet-500" />
          Recurring &amp; Subscriptions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Every repeating charge, normalized to a monthly cost
        </p>
      </motion.div>

      {isEmpty ? (
        <motion.div variants={fadeUp} className="card p-16 text-center text-slate-400">
          <Repeat size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recurring transactions yet</p>
          <p className="text-sm mt-1">Mark a transaction as “Recurring” when adding it to see it here.</p>
        </motion.div>
      ) : (
        <>
          {/* Summary cards */}
          <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<CalendarClock size={18} />}
              label="Monthly recurring"
              value={formatCurrencyFull(Math.round(monthlyTotal), sym)}
              sub={incomePct > 0 ? `${incomePct}% of monthly income` : `${subs.length + other.length} active`}
              gradient="from-violet-500 to-indigo-600"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Yearly projection"
              value={formatCurrencyFull(Math.round(monthlyTotal * 12), sym)}
              sub="At the current rate"
              gradient="from-rose-500 to-pink-600"
            />
            <StatCard
              icon={<Layers size={18} />}
              label="Net recurring"
              value={formatCurrencyFull(Math.round(monthlyIncome - monthlyTotal), sym)}
              sub={monthlyIncome > 0 ? `incl. ${formatCurrencyFull(Math.round(monthlyIncome), sym)} income` : 'expenses only'}
              gradient="from-emerald-500 to-teal-600"
            />
          </motion.div>

          {/* Upcoming bills */}
          {upcoming.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-2 mb-3">
                <BellRing size={16} className="text-amber-500" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200">Upcoming bills</h2>
                <span className="text-xs text-slate-400">next 14 days</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {upcoming.map(r => {
                  const cat = getCategoryById(r.tx.category)
                  const days = differenceInCalendarDays(r.next, new Date())
                  const soon = days <= 3
                  return (
                    <div
                      key={r.tx.id}
                      className={`card p-4 flex items-center gap-3 ${soon ? 'border-amber-300/50 dark:border-amber-400/30 bg-amber-50/40 dark:bg-amber-500/[0.07]' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${cat.color}22` }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.tx.merchant || cat.name}</p>
                        <p className={`text-xs mt-0.5 ${soon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-400'}`}>
                          {days <= 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`} · {format(r.next, 'dd MMM')}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatCurrencyFull(r.tx.amount, currencySymbol(r.tx.currency))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Subscriptions */}
          {subs.length > 0 && (
            <Section title="Subscriptions" count={subs.length}>
              {subs.map(r => (
                <RecurringRow key={r.tx.id} tx={r.tx} interval={r.interval} monthly={r.monthly} next={r.next} sym={sym} base={settings.currency} />
              ))}
            </Section>
          )}

          {/* Other recurring */}
          {other.length > 0 && (
            <Section title="Other recurring" count={other.length}>
              {other.map(r => (
                <RecurringRow key={r.tx.id} tx={r.tx} interval={r.interval} monthly={r.monthly} next={r.next} sym={sym} base={settings.currency} />
              ))}
            </Section>
          )}
        </>
      )}
    </motion.div>
  )
}

function StatCard({ icon, label, value, sub, gradient }: {
  icon: React.ReactNode; label: string; value: string; sub: string; gradient: string
}) {
  return (
    <motion.div variants={scaleIn} className="card card-hover p-5">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center`}>
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-3 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </motion.div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
        <span className="text-xs text-slate-400">{count}</span>
      </div>
      <div className="card divide-y divide-slate-100/70 dark:divide-white/[0.06] overflow-hidden">
        {children}
      </div>
    </motion.div>
  )
}

function RecurringRow({ tx, interval, monthly, next, sym, base }: {
  tx: Transaction; interval: RecurringInterval; monthly: number; next: Date; sym: string; base: string
}) {
  const cat = getCategoryById(tx.category)
  const daysLeft = differenceInCalendarDays(next, new Date())
  const soon = daysLeft <= 3
  const renewLabel =
    daysLeft <= 0 ? 'Due today' : daysLeft === 1 ? 'Renews tomorrow' : `Renews in ${daysLeft} days`

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cat.color}22` }}>
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tx.merchant || cat.name}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
          <CalendarClock size={11} />
          <span className={soon ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>{renewLabel}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          {format(next, 'dd MMM')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
          {formatCurrencyFull(tx.amount, currencySymbol(tx.currency))}
          <span className="text-xs font-normal text-slate-400">{INTERVAL_LABEL[interval]}</span>
        </p>
        {(interval !== 'monthly' || tx.currency !== base) && (
          <p className="text-xs text-slate-400 tabular-nums">≈ {formatCurrencyFull(Math.round(monthly), sym)}/mo</p>
        )}
      </div>
    </div>
  )
}
