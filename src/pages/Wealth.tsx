import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Sparkles } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useStore } from '../store/useStore'
import { formatCurrency, formatCurrencyFull } from '../lib/utils'
import { GlassTooltip } from '../components/ChartTooltip'
import { staggerContainer, fadeUp } from '../lib/motion'
import { projectWealth } from '../lib/wealth'

const TICK = '#94a3b8'

export default function Wealth() {
  const { settings, getNetWorth, getMonthlyIncome, getMonthlyExpenses } = useStore()
  const sym = settings.currencySymbol

  const now = new Date()
  const suggestedMonthly = useMemo(() => {
    const inc = getMonthlyIncome(now.getFullYear(), now.getMonth())
    const exp = getMonthlyExpenses(now.getFullYear(), now.getMonth())
    return Math.max(0, Math.round((inc - exp) / 500) * 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const suggestedInitial = Math.max(0, Math.round(getNetWorth().net))

  const [initial, setInitial] = useState(suggestedInitial)
  const [monthly, setMonthly] = useState(suggestedMonthly || 10000)
  const [rate, setRate] = useState(8)
  const [years, setYears] = useState(20)

  const proj = useMemo(
    () => projectWealth({ initial, monthly, annualRatePct: rate, years }),
    [initial, monthly, rate, years],
  )

  const chartData = proj.points.map(p => ({
    label: p.year === 0 ? 'Now' : `${Math.round(p.year)}y`,
    Contributed: Math.round(p.contributed),
    Value: Math.round(p.value),
  }))

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-glow">
          <TrendingUp size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Wealth Projection</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            See how regular saving compounds over time
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inputs */}
        <motion.div variants={fadeUp} className="card card-hover p-5 space-y-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Assumptions</h2>

          <Field label="Starting balance" value={`${sym}${initial.toLocaleString('en-IN')}`}>
            <input type="number" min={0} step={1000} value={initial}
              onChange={e => setInitial(Math.max(0, Number(e.target.value)))} className="input" />
          </Field>

          <Field label="Monthly contribution" value={`${sym}${monthly.toLocaleString('en-IN')}`}>
            <input type="number" min={0} step={500} value={monthly}
              onChange={e => setMonthly(Math.max(0, Number(e.target.value)))} className="input" />
          </Field>

          <SliderField label="Expected annual return" display={`${rate}%`}
            min={1} max={15} step={0.5} value={rate} onChange={setRate} />

          <SliderField label="Time horizon" display={`${years} years`}
            min={1} max={40} step={1} value={years} onChange={setYears} />
        </motion.div>

        {/* Result + chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2 card card-hover p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <Stat label={`In ${years} years`} value={formatCurrencyFull(Math.round(proj.finalValue), sym)} accent />
            <Stat label="You contribute" value={formatCurrencyFull(Math.round(proj.totalContributed), sym)} />
            <Stat label="Growth (returns)" value={formatCurrencyFull(Math.round(proj.totalGrowth), sym)} positive />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v, sym)} />
                <Tooltip content={<GlassTooltip sym={sym} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Value" stroke="#10b981" strokeWidth={2} fill="url(#valueGrad)" />
                <Area type="monotone" dataKey="Contributed" stroke="#6366f1" strokeWidth={2} fill="url(#contribGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3">
            <Sparkles size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Saving <span className="font-semibold">{formatCurrencyFull(monthly, sym)}/mo</span> at{' '}
              <span className="font-semibold">{rate}%</span> grows to{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrencyFull(Math.round(proj.finalValue), sym)}</span>{' '}
              in {years} years — {formatCurrencyFull(Math.round(proj.totalGrowth), sym)} of that is investment growth.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="text-[11px] text-slate-400 text-center px-6">
        Projections assume a constant return compounded monthly and exclude tax and inflation. For illustration only — not financial advice.
      </motion.div>
    </motion.div>
  )
}

function Field({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{value}</span>
      </div>
      {children}
    </div>
  )
}

function SliderField({ label, display, min, max, step, value, onChange }: {
  label: string; display: string; min: number; max: number; step: number
  value: number; onChange: (n: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tabular-nums">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-violet-500" />
    </div>
  )
}

function Stat({ label, value, accent, positive }: { label: string; value: string; accent?: boolean; positive?: boolean }) {
  const color = accent
    ? 'text-emerald-600 dark:text-emerald-400'
    : positive
      ? 'text-teal-600 dark:text-teal-400'
      : 'text-slate-800 dark:text-slate-100'
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold tabular-nums leading-tight ${color}`}>{value}</p>
    </div>
  )
}
