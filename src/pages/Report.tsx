import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Printer, Wand2, Loader2, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatCurrencyFull } from '../lib/utils'
import { staggerContainer, fadeUp } from '../lib/motion'
import { useToast } from '../components/Toast'
import { ProgressBar } from '../components/ProgressBar'
import { buildReport, ReportPeriod } from '../lib/report'
import { computeHealthScore } from '../lib/insights'

export default function Report() {
  const { transactions, budgets, settings } = useStore()
  const { toast } = useToast()
  const base = settings.currency
  const sym = settings.currencySymbol
  const fmt = (n: number) => formatCurrencyFull(Math.round(n), sym)

  const now = new Date()
  const [periodKind, setPeriodKind] = useState<'month' | 'year'>('month')

  const period: ReportPeriod = periodKind === 'month'
    ? { kind: 'month', year: now.getFullYear(), month: now.getMonth() }
    : { kind: 'year', year: now.getFullYear() }

  const data = useMemo(() => buildReport(transactions, base, period), [transactions, base, periodKind])
  const health = useMemo(() => computeHealthScore(transactions, budgets, base), [transactions, budgets, base])

  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(false)

  const generateNarrative = async () => {
    if (!settings.aiApiKey) {
      toast('Add a Claude API key in Settings for the AI narrative', 'info')
      return
    }
    setLoading(true)
    setNarrative('')
    const ctx = [
      `Period: ${data.label}.`,
      `Income: ${fmt(data.income)}. Expenses: ${fmt(data.expenses)}. Net: ${fmt(data.net)}. Savings rate: ${Math.round(data.savingsRatePct)}%.`,
      `Financial health score: ${health.score}/100 (${health.label}).`,
      `Top spending categories: ${data.topCategories.map(c => `${c.name} ${fmt(c.amount)} (${Math.round(c.pct)}%)`).join(', ')}.`,
      data.topMerchants.length ? `Top merchants: ${data.topMerchants.map(m => `${m.name} ${fmt(m.amount)}`).join(', ')}.` : '',
    ].filter(Boolean).join('\n')
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
          max_tokens: 600,
          system: `You are SpendWise's financial analyst writing the narrative section of a financial report for ${settings.name}. Given the period's figures, write 2 short paragraphs: (1) an overview of how the period went, (2) the standout spending pattern plus one concrete, actionable suggestion. Warm but professional. Use ${sym} for money. No markdown headers, no bullet lists.`,
          messages: [{ role: 'user', content: ctx }],
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const json = await res.json()
      setNarrative(json.content?.[0]?.text ?? 'Could not generate a narrative.')
    } catch {
      toast('Could not reach Claude — check your API key', 'error')
    }
    setLoading(false)
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-4xl mx-auto space-y-6"
    >
      {/* Header + controls (not printed) */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-glow">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI Report</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">A shareable financial report with an AI narrative</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-0.5">
            {(['month', 'year'] as const).map(k => (
              <button
                key={k}
                onClick={() => setPeriodKind(k)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodKind === k
                    ? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {k === 'month' ? 'This month' : 'This year'}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={generateNarrative} disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            AI Narrative
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => window.print()}
            className="btn-ghost flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10"
          >
            <Printer size={15} /> PDF
          </motion.button>
        </div>
      </motion.div>

      {/* The report sheet (printed) */}
      <motion.div variants={fadeUp} className="card print-sheet p-8">
        {/* Report header */}
        <div className="flex items-start justify-between border-b border-slate-200/70 dark:border-white/10 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
              <span className="font-bold text-lg text-slate-800 dark:text-slate-100">SpendWise</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Financial Report</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.label} · prepared for {settings.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Health score</p>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{health.score}</p>
            <p className="text-xs text-slate-400">{health.grade} · {health.label}</p>
          </div>
        </div>

        {/* AI narrative */}
        {narrative ? (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-violet-500/[0.07] to-indigo-500/[0.07] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-violet-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-violet-500">Summary</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{narrative}</p>
          </div>
        ) : (
          <p className="mb-6 text-sm text-slate-400 italic no-print">
            Tip: click “AI Narrative” to add a written summary to this report (needs a Claude API key).
          </p>
        )}

        {/* Key figures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          <Figure label="Income" value={fmt(data.income)} tone="emerald" />
          <Figure label="Expenses" value={fmt(data.expenses)} tone="rose" />
          <Figure label="Net" value={fmt(data.net)} tone={data.net >= 0 ? 'emerald' : 'rose'} />
          <Figure label="Savings rate" value={`${Math.round(data.savingsRatePct)}%`} tone="violet" />
        </div>

        {/* Top categories */}
        <Section title="Top spending categories">
          {data.topCategories.length === 0 ? (
            <p className="text-sm text-slate-400">No expenses in this period.</p>
          ) : (
            <div className="space-y-2.5">
              {data.topCategories.map(c => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{c.icon} {c.name}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                      {fmt(c.amount)} <span className="text-xs text-slate-400">({Math.round(c.pct)}%)</span>
                    </span>
                  </div>
                  <ProgressBar pct={c.pct} gradient="bg-gradient-to-r from-violet-500 to-indigo-500" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Top merchants */}
        {data.topMerchants.length > 0 && (
          <Section title="Top merchants">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {data.topMerchants.map(m => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300 truncate">{m.name}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 tabular-nums">{fmt(m.amount)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Health breakdown */}
        <Section title="Financial health breakdown">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {health.components.map(c => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.label}</span>
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{c.score}/{c.max}</span>
                </div>
                <ProgressBar pct={(c.score / c.max) * 100} gradient="bg-gradient-to-r from-violet-500 to-indigo-500" />
              </div>
            ))}
          </div>
        </Section>

        <p className="text-[11px] text-slate-400 mt-7 pt-4 border-t border-slate-200/70 dark:border-white/10">
          Generated by SpendWise · {data.txCount} transactions in {data.label} · {new Date().toLocaleDateString('en-IN')}
        </p>
      </motion.div>
    </motion.div>
  )
}

function Figure({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'rose' | 'violet' }) {
  const color = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    violet: 'text-violet-600 dark:text-violet-400',
  }[tone]
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{title}</h3>
      {children}
    </div>
  )
}
