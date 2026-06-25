import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, AlertTriangle, TrendingUp, Gauge, Lightbulb, Wand2, Loader2, Calculator,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { getCategoryById, DEFAULT_CATEGORIES } from '../data/categories'
import { formatCurrencyFull } from '../lib/utils'
import { staggerContainer, fadeUp } from '../lib/motion'
import { ProgressBar } from '../components/ProgressBar'
import { useToast } from '../components/Toast'
import {
  computeHealthScore, computeInsights, detectAnomalies, forecastMonth,
  recommendBudget, whatIf,
} from '../lib/insights'

const TONE_RING: Record<string, string> = {
  positive: 'border-emerald-300/50 dark:border-emerald-400/30 bg-emerald-50/50 dark:bg-emerald-500/[0.08]',
  warning: 'border-amber-300/50 dark:border-amber-400/30 bg-amber-50/50 dark:bg-amber-500/[0.08]',
  neutral: 'border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/[0.03]',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 55) return '#f59e0b'
  return '#f43f5e'
}

export default function Insights() {
  const { transactions, budgets, settings } = useStore()
  const { toast } = useToast()
  const base = settings.currency
  const sym = settings.currencySymbol
  const fmt = (n: number) => formatCurrencyFull(Math.round(n), sym)

  const health = useMemo(() => computeHealthScore(transactions, budgets, base), [transactions, budgets, base])
  const insights = useMemo(() => computeInsights(transactions, base), [transactions, base])
  const anomalies = useMemo(() => detectAnomalies(transactions, base), [transactions, base])
  const forecast = useMemo(() => forecastMonth(transactions, budgets, base), [transactions, budgets, base])
  const rec = useMemo(
    () => recommendBudget(transactions, base, settings.monthlyIncome),
    [transactions, base, settings.monthlyIncome],
  )

  const overspends = forecast.perCategory.filter(c => c.overBy && c.overBy > 0)

  // What-if simulator
  const expenseCats = DEFAULT_CATEGORIES.filter(c => c.type !== 'income')
  const [wiCat, setWiCat] = useState('food')
  const [wiPct, setWiPct] = useState(30)
  const wi = useMemo(() => whatIf(transactions, base, wiCat, wiPct), [transactions, base, wiCat, wiPct])

  // Optional AI narrative
  const [narrative, setNarrative] = useState('')
  const [narrLoading, setNarrLoading] = useState(false)

  const generateNarrative = async () => {
    if (!settings.aiApiKey) {
      toast('Add a Claude API key in Settings for AI narrative', 'info')
      return
    }
    setNarrLoading(true)
    setNarrative('')
    const ctx = [
      `Health score: ${health.score}/100 (${health.label}).`,
      ...health.components.map(c => `- ${c.label}: ${c.score}/${c.max} — ${c.detail}`),
      `Projected month-end spend: ${fmt(forecast.projectedTotal)} (spent ${fmt(forecast.spentSoFar)} in ${forecast.daysElapsed}/${forecast.daysInMonth} days).`,
      overspends.length
        ? `On track to overspend: ${overspends.map(o => `${getCategoryById(o.category).name} by ${fmt(o.overBy!)}`).join(', ')}.`
        : 'No budgets projected to be exceeded.',
      `Top insights: ${insights.slice(0, 3).map(i => i.title).join('; ')}.`,
    ].join('\n')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.aiApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 400,
          system: `You are SpendWise's financial coach. Given the user's computed financial data, write a warm, specific 3-4 sentence summary with one concrete suggestion. Use ${sym} for money. Address ${settings.name} directly. No markdown headers.`,
          messages: [{ role: 'user', content: ctx }],
        }),
      })
      const data = await res.json()
      setNarrative(data.content?.[0]?.text ?? 'Could not generate a summary.')
    } catch {
      toast('Could not reach Claude — check your API key', 'error')
    }
    setNarrLoading(false)
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Insights</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your financial health, forecasts & smart recommendations
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={generateNarrative}
          disabled={narrLoading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {narrLoading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          AI Summary
        </motion.button>
      </motion.div>

      {/* AI narrative */}
      {narrative && (
        <motion.div variants={fadeUp} className="card p-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-400/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
              <Sparkles size={15} className="text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{narrative}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Health score */}
        <motion.div variants={fadeUp} className="card card-hover p-5 flex flex-col items-center">
          <div className="flex items-center gap-2 self-start mb-4">
            <Gauge size={16} className="text-violet-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Financial Health</h2>
          </div>
          <ScoreRing score={health.score} grade={health.grade} />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{health.label}</p>
          <div className="w-full mt-4 space-y-3">
            {health.components.map(c => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.label}</span>
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{c.score}/{c.max}</span>
                </div>
                <ProgressBar pct={(c.score / c.max) * 100} gradient="bg-gradient-to-r from-violet-500 to-indigo-500" />
                <p className="text-[11px] text-slate-400 mt-1">{c.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Forecast */}
        <motion.div variants={fadeUp} className="col-span-2 card card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-violet-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Month-End Forecast</h2>
            <span className="ml-auto text-xs text-slate-400">Day {forecast.daysElapsed} of {forecast.daysInMonth}</span>
          </div>
          <div className="flex items-end gap-6 mb-5">
            <div>
              <p className="text-xs text-slate-400">Spent so far</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(forecast.spentSoFar)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Projected total</p>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{fmt(forecast.projectedTotal)}</p>
            </div>
          </div>
          {overspends.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">⚠️ Projected to exceed budget:</p>
              {overspends.slice(0, 4).map(o => {
                const c = getCategoryById(o.category)
                const pct = o.budget ? Math.min((o.projected / o.budget) * 100, 140) : 100
                return (
                  <div key={o.category}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{c.icon} {c.name}</span>
                      <span className="text-xs text-rose-500 tabular-nums text-right">
                        {fmt(o.projected)} / {fmt(o.budget!)} · over by {fmt(o.overBy!)}
                      </span>
                    </div>
                    <ProgressBar pct={pct} gradient="bg-gradient-to-r from-amber-400 to-rose-500" />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ✅ At your current pace, you're on track to stay within all budgets this month.
            </p>
          )}
        </motion.div>
      </div>

      {/* Key insights */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-violet-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Key Insights</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {insights.map(i => (
            <div key={i.id} className={`card p-4 border ${TONE_RING[i.tone]}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">{i.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{i.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{i.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <motion.div variants={fadeUp} className="card card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Unusual Transactions</h2>
          </div>
          <div className="space-y-2">
            {anomalies.map((a, idx) => {
              const c = getCategoryById(a.category)
              return (
                <div key={a.txId ?? idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-500/[0.07]">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${c.color}18` }}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.merchant}</p>
                    <p className="text-xs text-slate-400">{c.name} · {a.multiple.toFixed(1)}× your usual</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{fmt(a.amount)}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Budget recommendation 50/30/20 */}
        <motion.div variants={fadeUp} className="card card-hover p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">50 / 30 / 20 Budget</h2>
          <p className="text-xs text-slate-400 mb-4">Based on {fmt(rec.monthlyIncome)} monthly income</p>
          <div className="space-y-4">
            <RecRow label="Needs (50%)" current={rec.currentNeeds} target={rec.needs} fmt={fmt} color="#3b82f6" />
            <RecRow label="Wants (30%)" current={rec.currentWants} target={rec.wants} fmt={fmt} color="#a855f7" />
            <RecRow label="Savings (20%)" current={rec.currentSavings} target={rec.savings} fmt={fmt} color="#10b981" savings />
          </div>
        </motion.div>

        {/* What-if simulator */}
        <motion.div variants={fadeUp} className="card card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={16} className="text-violet-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">What-If Simulator</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            If I cut{' '}
            <select
              value={wiCat}
              onChange={e => setWiCat(e.target.value)}
              className="input inline-block w-auto py-1 px-2 text-sm"
            >
              {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>{' '}
            by <span className="font-semibold text-violet-600 dark:text-violet-400">{wiPct}%</span>
          </p>
          <input
            type="range" min={5} max={100} step={5} value={wiPct}
            onChange={e => setWiPct(Number(e.target.value))}
            className="w-full accent-violet-500 mb-4"
          />
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 text-center">
            <p className="text-xs text-slate-400">Current avg (3 mo): {fmt(wi.currentMonthly)}/mo</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
              +{fmt(wi.monthlySaving)}<span className="text-sm font-medium text-slate-400">/mo</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              = <span className="font-semibold">{fmt(wi.yearlySaving)}</span> saved per year
            </p>
          </div>
        </motion.div>
      </div>
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

function RecRow({ label, current, target, fmt, color, savings }: {
  label: string
  current: number
  target: number
  fmt: (n: number) => string
  color: string
  savings?: boolean
}) {
  const pct = target > 0 ? (current / target) * 100 : 0
  // for savings, more is better; for spend categories, under target is good
  const good = savings ? current >= target : current <= target
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
        <span className={`text-xs tabular-nums ${good ? 'text-emerald-500' : 'text-rose-500'}`}>
          {fmt(Math.max(current, 0))} / {fmt(target)}
        </span>
      </div>
      <ProgressBar pct={Math.min(Math.abs(pct), 100)} color={color} />
    </div>
  )
}
