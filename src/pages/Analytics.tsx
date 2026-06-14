import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { getCategoryById } from '../data/categories'
import { formatCurrencyFull, formatCurrency, getLast6Months } from '../lib/utils'
import { GlassTooltip } from '../components/ChartTooltip'
import { ExpenseHeatmap } from '../components/ExpenseHeatmap'
import { staggerContainer, scaleIn } from '../lib/motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts'

const GRID = 'rgba(148,163,184,0.14)'
const TICK = '#94a3b8'

export default function Analytics() {
  const { transactions, settings } = useStore()
  const sym = settings.currencySymbol

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  // Category breakdown (current month expenses)
  const categoryData = useMemo(() => {
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getFullYear() === y && d.getMonth() === m
    })
    const total = thisMonth.reduce((s, t) => s + t.amount, 0)
    const map: Record<string, number> = {}
    thisMonth.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount })
    return Object.entries(map)
      .map(([cat, amount]) => {
        const c = getCategoryById(cat)
        return { name: c.name, value: amount, color: c.color, icon: c.icon, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }
      })
      .sort((a, b) => b.value - a.value)
  }, [transactions, y, m])

  // Monthly bar data (last 6 months)
  const monthlyData = useMemo(() => {
    return getLast6Months().map(({ year, month, label }) => {
      const income = transactions
        .filter(t => { const d = new Date(t.date); return t.type === 'income' && d.getFullYear() === year && d.getMonth() === month })
        .reduce((s, t) => s + t.amount, 0)
      const expenses = transactions
        .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getFullYear() === year && d.getMonth() === month })
        .reduce((s, t) => s + t.amount, 0)
      return { label, income, expenses, savings: income - expenses }
    })
  }, [transactions])

  // Daily spending (current month)
  const dailyData = useMemo(() => {
    const days: Record<number, number> = {}
    transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getFullYear() === y && d.getMonth() === m })
      .forEach(t => {
        const day = new Date(t.date).getDate()
        days[day] = (days[day] ?? 0) + t.amount
      })
    return Object.entries(days).sort(([a], [b]) => +a - +b).map(([day, amount]) => ({ day: `${day}`, amount }))
  }, [transactions, y, m])

  // Mood spending analysis
  const moodData = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense' && t.mood).forEach(t => {
      map[t.mood!] = (map[t.mood!] ?? 0) + t.amount
    })
    const labels: Record<string, string> = { happy: '😊 Happy', neutral: '😐 Neutral', stressed: '😰 Stressed', impulsive: '😬 Impulsive' }
    const colors: Record<string, string> = { happy: '#22c55e', neutral: '#64748b', stressed: '#ef4444', impulsive: '#f97316' }
    return Object.entries(map).map(([mood, amount]) => ({ name: labels[mood] ?? mood, value: amount, color: colors[mood] ?? '#64748b' }))
  }, [transactions])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visualize your spending patterns</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
        {/* Donut: Category breakdown */}
        <motion.div variants={scaleIn} className="card card-hover p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Spending by Category (This Month)</h2>
          {categoryData.length === 0 ? (
            <Empty label="No expenses this month" />
          ) : (
            <>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData} cx="50%" cy="50%"
                      innerRadius={58} outerRadius={92} paddingAngle={2}
                      dataKey="value" stroke="none"
                      animationDuration={800} animationBegin={150}
                    >
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<GlassTooltip sym={sym} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <Legend2 items={categoryData.slice(0, 6).map(c => ({ name: `${c.icon} ${c.name}`, color: c.color, value: c.value }))} sym={sym} />
            </>
          )}
        </motion.div>

        {/* Bar: Monthly income vs expenses */}
        <motion.div variants={scaleIn} className="card card-hover p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Income vs Expenses</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" /><stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} content={<GlassTooltip sym={sym} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="url(#barIncome)" radius={[5, 5, 0, 0]} animationDuration={800} />
                <Bar dataKey="expenses" name="Expenses" fill="url(#barExpense)" radius={[5, 5, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
        {/* Line: Daily spending */}
        <motion.div variants={scaleIn} className="card card-hover p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Daily Spending (This Month)</h2>
          {dailyData.length === 0 ? (
            <Empty label="No expenses yet" />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineDaily" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={<GlassTooltip sym={sym} />} />
                  <Line type="monotone" dataKey="amount" name="Amount" stroke="url(#lineDaily)" strokeWidth={2.5}
                    dot={{ fill: '#22d3ee', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22d3ee' }} animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Donut: Mood-based spending */}
        <motion.div variants={scaleIn} className="card card-hover p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Spending by Mood</h2>
          <p className="text-xs text-slate-400 mb-4">Understand your emotional spending triggers</p>
          {moodData.length === 0 ? (
            <Empty label="No mood data yet — tag your transactions!" />
          ) : (
            <>
              <div className="h-[170px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={moodData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={2}
                      dataKey="value" stroke="none" animationDuration={800}>
                      {moodData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<GlassTooltip sym={sym} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <Legend2 items={moodData.map(d => ({ name: d.name, color: d.color, value: d.value }))} sym={sym} />
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Expense heatmap calendar */}
      <motion.div variants={scaleIn} initial="hidden" animate="show" className="card card-hover p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Spending Heatmap</h2>
        <p className="text-xs text-slate-400 mb-4">Daily expense intensity over the last few months</p>
        <ExpenseHeatmap />
      </motion.div>

      {/* Savings trend */}
      <motion.div variants={scaleIn} initial="hidden" animate="show" className="card card-hover p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Savings Trend (Last 6 Months)</h2>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} content={<GlassTooltip sym={sym} />} />
              <Bar dataKey="savings" name="Savings" radius={[5, 5, 0, 0]} animationDuration={800}>
                {monthlyData.map((entry, i) => <Cell key={i} fill={entry.savings >= 0 ? '#22c55e' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}

function Legend2({ items, sym }: { items: { name: string; color: string; value: number }[]; sym: string }) {
  return (
    <div className="space-y-1.5 mt-3">
      {items.map(it => (
        <div key={it.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: it.color }} />
            <span className="text-slate-600 dark:text-slate-300">{it.name}</span>
          </div>
          <span className="font-medium text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(it.value, sym)}</span>
        </div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-12">{label}</p>
}
