import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Tag as TagIcon, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { convertCurrency } from '../data/currencies'
import { formatCurrencyFull } from '../lib/utils'
import { staggerContainer, fadeUp, scaleIn } from '../lib/motion'

interface TagStat {
  tag: string
  count: number
  spent: number
  received: number
}

export default function Tags() {
  const { transactions, settings } = useStore()
  const sym = settings.currencySymbol

  const { tags, maxSpent } = useMemo(() => {
    const map: Record<string, TagStat> = {}
    transactions.forEach(t => {
      const base = convertCurrency(t.amount, t.currency, settings.currency)
      t.tags.forEach(raw => {
        const tag = raw.trim()
        if (!tag) return
        const e = (map[tag] ??= { tag, count: 0, spent: 0, received: 0 })
        e.count++
        if (t.type === 'expense') e.spent += base
        else e.received += base
      })
    })
    const tags = Object.values(map).sort((a, b) => b.spent - a.spent || b.count - a.count)
    const maxSpent = Math.max(1, ...tags.map(t => t.spent))
    return { tags, maxSpent }
  }, [transactions, settings.currency])

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TagIcon size={24} className="text-violet-500" />
          Tags
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Spending grouped by the tags you add to transactions
        </p>
      </motion.div>

      {tags.length === 0 ? (
        <motion.div variants={fadeUp} className="card p-16 text-center text-slate-400">
          <TagIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tags yet</p>
          <p className="text-sm mt-1">Add tags like <span className="font-mono">#work</span> or <span className="font-mono">#vacation</span> to a transaction to see them here.</p>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4">
          {tags.map(t => (
            <motion.div key={t.tag} variants={scaleIn}>
              <Link
                to={`/transactions?tag=${encodeURIComponent(t.tag)}`}
                className="card card-hover p-5 block group"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 px-2.5 py-1 rounded-full">
                    <TagIcon size={12} /> {t.tag.replace(/^#/, '')}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-3 tabular-nums">
                  {formatCurrencyFull(Math.round(t.spent), sym)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.count} transaction{t.count === 1 ? '' : 's'}
                  {t.received > 0 && ` · +${formatCurrencyFull(Math.round(t.received), sym)} income`}
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.spent / maxSpent) * 100}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
