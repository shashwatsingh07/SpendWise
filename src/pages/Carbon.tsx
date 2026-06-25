import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Leaf, TreePine, TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getCategoryById } from '../data/categories'
import { formatCurrencyFull } from '../lib/utils'
import { staggerContainer, fadeUp } from '../lib/motion'
import { ProgressBar } from '../components/ProgressBar'
import { computeCarbon, carbonEquivalent } from '../lib/carbon'

function scoreColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#f43f5e'
}

const fmtKg = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${kg.toFixed(1)} kg`

export default function Carbon() {
  const { transactions, settings } = useStore()
  const base = settings.currency
  const sym = settings.currencySymbol
  const report = useMemo(() => computeCarbon(transactions, base), [transactions, base])

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-glow">
          <Leaf size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Carbon Footprint</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Estimated CO₂e from this month's spending
          </p>
        </div>
      </motion.div>

      {report.totalSpend === 0 ? (
        <motion.div variants={fadeUp} className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No expenses logged this month yet — add some to see your footprint. 🌱
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Eco score */}
            <motion.div variants={fadeUp} className="card card-hover p-5 flex flex-col items-center">
              <div className="flex items-center gap-2 self-start mb-3">
                <Leaf size={16} className="text-emerald-500" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200">Eco Score</h2>
              </div>
              <ScoreRing score={report.score} grade={report.grade} />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{report.label}</p>
              <p className="text-xs text-slate-400 mt-1 text-center">
                {report.intensity.toFixed(1)} kg CO₂e per {sym}1,000 spent
              </p>
            </motion.div>

            {/* Totals */}
            <motion.div variants={fadeUp} className="col-span-2 card card-hover p-5">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">This Month</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-slate-400">Total footprint</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtKg(report.totalKg)}</p>
                  <p className="text-xs text-slate-400 mt-1">CO₂e from {formatCurrencyFull(Math.round(report.totalSpend), sym)} spent</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><TreePine size={12} /> To offset (yearly rate)</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                    {Math.ceil(report.treesPerYear)} <span className="text-base font-medium text-slate-400">trees</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{carbonEquivalent(report.totalKg)}</p>
                </div>
              </div>
              {report.trendPct !== null && (
                <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
                  report.trendPct > 0
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {report.trendPct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {report.trendPct > 0 ? '+' : ''}{Math.round(report.trendPct)}% vs last month
                </div>
              )}
            </motion.div>
          </div>

          {/* Per-category breakdown */}
          <motion.div variants={fadeUp} className="card card-hover p-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Where it comes from</h2>
            <p className="text-xs text-slate-400 mb-4">Ranked by estimated emissions, not by spend</p>
            <div className="space-y-3">
              {report.perCategory.map(c => {
                const cat = getCategoryById(c.category)
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {cat.icon} {cat.name}
                        <span className="text-xs text-slate-400 ml-1.5">· {c.factor} kg/{sym}1k</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {fmtKg(c.kg)} <span className="text-xs font-normal text-slate-400">({Math.round(c.pct)}%)</span>
                      </span>
                    </div>
                    <ProgressBar pct={c.pct} color={cat.color} />
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="text-[11px] text-slate-400 text-center px-6">
            Estimates use spend-based emission factors (kg CO₂e per {sym}1,000 by category) and are indicative, not audited.
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const color = scoreColor(score)
  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-white/10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke={color}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-xs font-semibold text-slate-400">Grade {grade}</span>
      </div>
    </div>
  )
}
