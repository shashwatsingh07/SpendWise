import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { getCategoryById } from '../data/categories'
import { formatCurrencyFull, formatCurrency, getLast6Months } from '../lib/utils'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts'

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

  const RADIAN = Math.PI / 180
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{percentage}%</text>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visualize your spending patterns</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pie: Category breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Spending by Category (This Month)</h2>
          {categoryData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No expenses this month</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={renderLabel}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrencyFull(v, sym)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.slice(0, 6).map(c => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.color }} />
                      <span className="text-slate-600">{c.icon} {c.name}</span>
                    </div>
                    <span className="font-medium text-slate-700">{formatCurrency(c.value, sym)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar: Monthly income vs expenses */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Monthly Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
              <Tooltip formatter={(v: number) => formatCurrencyFull(v, sym)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Line: Daily spending */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Daily Spending (This Month)</h2>
          {dailyData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No expenses yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                <Tooltip formatter={(v: number) => formatCurrencyFull(v, sym)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 3 }} name="Amount" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie: Mood-based spending */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Spending by Mood</h2>
          <p className="text-xs text-slate-400 mb-4">Understand your emotional spending triggers</p>
          {moodData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No mood data yet — tag your transactions!</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={moodData} cx="50%" cy="50%" outerRadius={70} dataKey="value" labelLine={false} label={renderLabel}>
                    {moodData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrencyFull(v, sym)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {moodData.map(m => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                      <span className="text-slate-600">{m.name}</span>
                    </div>
                    <span className="font-medium text-slate-700">{formatCurrencyFull(m.value, sym)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Savings trend */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Savings Trend (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrencyFull(v, sym)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
            <Bar dataKey="savings" name="Savings" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, i) => <Cell key={i} fill={entry.savings >= 0 ? '#22c55e' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
