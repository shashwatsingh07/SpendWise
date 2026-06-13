import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Sparkles, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getCategoryById } from '../data/categories'
import { formatCurrency, formatCurrencyFull, formatDateShort, getLast6Months, getProgressGradient } from '../lib/utils'
import { TransactionModal } from '../components/TransactionModal'
import { GlassTooltip } from '../components/ChartTooltip'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function Dashboard() {
  const { transactions, budgets, goals, settings, getMonthlyExpenses, getMonthlyIncome, getCategorySpend } = useStore()
  const [addOpen, setAddOpen] = useState(false)

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  const totalExpenses = getMonthlyExpenses(y, m)
  const totalIncome = getMonthlyIncome(y, m)
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

  // Last 6 months chart data
  const chartData = getLast6Months().map(({ year, month, label }) => ({
    label,
    Income: getMonthlyIncome(year, month),
    Expenses: getMonthlyExpenses(year, month),
  }))

  // Recent transactions (last 8)
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

  // Budget alerts
  const budgetAlerts = budgets.filter(b => {
    const spent = getCategorySpend(b.category, y, m)
    return spent / b.limit >= b.alertAt / 100
  })

  // Top spending goals progress
  const topGoals = goals.slice(0, 3)

  return (
    <div className="page-enter p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Good {getGreeting()}, {settings.name}! 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Here's your financial overview for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Summary Cards — gradient + count-up + stagger */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          index={0}
          label="Monthly Income"
          value={totalIncome}
          format={v => formatCurrencyFull(v, settings.currencySymbol)}
          icon={<TrendingUp size={20} className="text-white" />}
          gradient="from-emerald-500 to-teal-600"
          sub={`${transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === m).length} transactions`}
        />
        <SummaryCard
          index={1}
          label="Monthly Expenses"
          value={totalExpenses}
          format={v => formatCurrencyFull(v, settings.currencySymbol)}
          icon={<TrendingDown size={20} className="text-white" />}
          gradient="from-rose-500 to-pink-600"
          sub={`${transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m).length} transactions`}
        />
        <SummaryCard
          index={2}
          label="Net Balance"
          value={balance}
          format={v => formatCurrencyFull(v, settings.currencySymbol)}
          icon={<Wallet size={20} className="text-white" />}
          gradient="from-violet-600 to-indigo-600"
          sub={balance >= 0 ? 'You\'re in the green 🎉' : 'Overspent this month'}
        />
        <SummaryCard
          index={3}
          label="Savings Rate"
          value={savingsRate}
          format={v => `${Math.round(v)}%`}
          icon={<ArrowUpRight size={20} className="text-white" />}
          gradient="from-amber-500 to-orange-600"
          sub={savingsRate >= 20 ? 'Great job! Above 20%' : 'Target: 20%'}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="col-span-2 card p-5 stagger-in" style={{ animationDelay: '200ms' }}>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Income vs Expenses (6 months)</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                <Tooltip content={<GlassTooltip sym={settings.currencySymbol} />} />
                <Area type="monotone" dataKey="Income" stroke="#34d399" strokeWidth={2.5} fill="url(#income)" animationDuration={900} />
                <Area type="monotone" dataKey="Expenses" stroke="#fb7185" strokeWidth={2.5} fill="url(#expenses)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Alerts */}
        <div className="card p-5 stagger-in" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Budget Status</h2>
            {budgetAlerts.length > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                {budgetAlerts.length} alert{budgetAlerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 5).map(b => {
              const cat = getCategoryById(b.category)
              const spent = getCategorySpend(b.category, y, m)
              const pct = Math.min((spent / b.limit) * 100, 100)
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      {cat.icon} {cat.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatCurrency(spent)}/{formatCurrency(b.limit)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressGradient(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="col-span-2 card p-5 stagger-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent Transactions</h2>
          <div className="space-y-1">
            {recent.map(tx => {
              const cat = getCategoryById(tx.category)
              return (
                <div key={tx.id} className="group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl border-l-2 border-transparent
                                            hover:border-violet-500 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${cat.color}18` }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tx.merchant || cat.name}</p>
                    <p className="text-xs text-slate-400">{formatDateShort(tx.date)} · {cat.name}</p>
                  </div>
                  {tx.mood && <span className="text-base">{getMoodEmoji(tx.mood)}</span>}
                  <span className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount, settings.currencySymbol)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="card p-5 stagger-in" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Savings Goals</h2>
          </div>
          <div className="space-y-4">
            {topGoals.map(goal => {
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              return (
                <div key={goal.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{goal.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{goal.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="card p-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-300/30 stagger-in" style={{ animationDelay: '400ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">AI Insight</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {totalExpenses > totalIncome
                ? `⚠️ You've overspent by ${formatCurrencyFull(totalExpenses - totalIncome, settings.currencySymbol)} this month. Your Food spending is highest — consider cooking at home more.`
                : `✨ Great job! You've saved ${formatCurrencyFull(balance, settings.currencySymbol)} (${savingsRate}%) this month. You're on track for your ${topGoals[0]?.name ?? 'savings'} goal!`
              }
            </p>
          </div>
        </div>
      </div>

      {addOpen && <TransactionModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

/** Count-up hook — animates a number from 0 to target with ease-out. No libraries. */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(from + (target - from) * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return val
}

function SummaryCard({ index, label, value, format, icon, gradient, sub }: {
  index: number
  label: string
  value: number
  format: (v: number) => string
  icon: React.ReactNode
  gradient: string
  sub: string
}) {
  const animated = useCountUp(value)
  return (
    <div
      className={`stagger-in rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20 bg-gradient-to-br ${gradient}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-white/80">{label}</p>
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">{icon}</div>
      </div>
      <p className="text-xl font-bold tabular-nums">{format(animated)}</p>
      <p className="text-xs text-white/70 mt-1">{sub}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getMoodEmoji(mood?: string) {
  const map: Record<string, string> = { happy: '😊', neutral: '😐', stressed: '😰', impulsive: '😬' }
  return mood ? (map[mood] ?? '') : ''
}
