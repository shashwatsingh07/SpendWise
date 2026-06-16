import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getCategoryById } from '../data/categories'
import { convertCurrency, currencySymbol } from '../data/currencies'
import { formatCurrencyFull, formatDate } from '../lib/utils'
import { staggerContainer, fadeUp, scaleIn } from '../lib/motion'

export default function Tax() {
  const { transactions, settings } = useStore()
  const sym = settings.currencySymbol

  // All tax-deductible expenses, newest first.
  const deductible = useMemo(
    () =>
      transactions
        .filter(t => t.type === 'expense' && t.taxDeductible)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions],
  )

  const years = useMemo(() => {
    const set = new Set(deductible.map(t => new Date(t.date).getFullYear()))
    set.add(new Date().getFullYear())
    return [...set].sort((a, b) => b - a)
  }, [deductible])

  const [year, setYear] = useState(() => new Date().getFullYear())

  const { rows, byCategory, total, maxCat } = useMemo(() => {
    const rows = deductible.filter(t => new Date(t.date).getFullYear() === year)
    const map: Record<string, { total: number; count: number }> = {}
    let total = 0
    rows.forEach(t => {
      const base = convertCurrency(t.amount, t.currency, settings.currency)
      total += base
      const e = (map[t.category] ??= { total: 0, count: 0 })
      e.total += base
      e.count++
    })
    const byCategory = Object.entries(map)
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.total - a.total)
    const maxCat = Math.max(1, ...byCategory.map(c => c.total))
    return { rows, byCategory, total, maxCat }
  }, [deductible, year, settings.currency])

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={24} className="text-violet-500" />
            Tax Summary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Expenses you marked tax-deductible, totalled for the year
          </p>
        </div>
        <select
          className="input w-auto py-2 pr-8"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </motion.div>

      {deductible.length === 0 ? (
        <motion.div variants={fadeUp} className="card p-16 text-center text-slate-400">
          <Receipt size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No deductible expenses yet</p>
          <p className="text-sm mt-1">Tick “Tax deductible” when adding or editing an expense to see it summarised here.</p>
        </motion.div>
      ) : (
        <>
          {/* Headline */}
          <motion.div variants={scaleIn} className="card card-hover p-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileText size={16} className="text-violet-500" /> Total deductible · {year}
            </p>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-2 tabular-nums">
              {formatCurrencyFull(Math.round(total), sym)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {rows.length} expense{rows.length === 1 ? '' : 's'} across {byCategory.length} categor{byCategory.length === 1 ? 'y' : 'ies'}
            </p>
          </motion.div>

          {rows.length === 0 ? (
            <motion.div variants={fadeUp} className="card p-12 text-center text-slate-400">
              <p className="text-sm">No deductible expenses for {year}.</p>
            </motion.div>
          ) : (
            <>
              {/* By category */}
              <motion.div variants={fadeUp}>
                <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">By category</h2>
                <div className="card p-5 space-y-3">
                  {byCategory.map(c => {
                    const cat = getCategoryById(c.cat)
                    return (
                      <div key={c.cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <span>{cat.icon}</span> {cat.name}
                            <span className="text-xs text-slate-400">· {c.count}</span>
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                            {formatCurrencyFull(Math.round(c.total), sym)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.total / maxCat) * 100}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{ background: cat.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Itemised list */}
              <motion.div variants={fadeUp}>
                <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Deductible expenses</h2>
                <div className="card divide-y divide-slate-100/70 dark:divide-white/[0.06] overflow-hidden">
                  {rows.map(t => {
                    const cat = getCategoryById(t.category)
                    return (
                      <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${cat.color}22` }}>
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{t.merchant || cat.name}</p>
                          <p className="text-xs text-slate-400">{cat.name} · {formatDate(t.date)}{t.note ? ` · ${t.note}` : ''}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                          {formatCurrencyFull(t.amount, currencySymbol(t.currency))}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
    </motion.div>
  )
}
