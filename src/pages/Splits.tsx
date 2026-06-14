import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, Check, Undo2, HandCoins } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { getCategoryById } from '../data/categories'
import { currencySymbol, convertCurrency } from '../data/currencies'
import { formatCurrencyFull, formatDate } from '../lib/utils'
import { staggerContainer, fadeUp, scaleIn } from '../lib/motion'

export default function Splits() {
  const { transactions, updateTransaction, settings } = useStore()
  const { toast } = useToast()
  const sym = settings.currencySymbol

  const { splits, perPerson, totalOwed } = useMemo(() => {
    const splits = transactions
      .filter(t => t.splitWith && t.splitWith.length > 0)
      .map(t => {
        const people = t.splitWith!
        const ways = people.length + 1
        const share = t.amount / ways // in the transaction's own currency
        const baseShare = convertCurrency(share, t.currency, settings.currency)
        return { tx: t, people, share, baseOwed: baseShare * people.length }
      })
      .sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime())

    // Per-person settle-up across UNSETTLED splits (base currency).
    const perPerson: Record<string, number> = {}
    splits.forEach(s => {
      if (s.tx.splitSettled) return
      const baseShare = convertCurrency(s.share, s.tx.currency, settings.currency)
      s.people.forEach(p => { perPerson[p] = (perPerson[p] ?? 0) + baseShare })
    })

    const totalOwed = Object.values(perPerson).reduce((a, b) => a + b, 0)
    return { splits, perPerson, totalOwed }
  }, [transactions, settings.currency])

  const people = Object.entries(perPerson).sort((a, b) => b[1] - a[1])

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users size={24} className="text-violet-500" />
          Split Expenses
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track who owes you what, and settle up</p>
      </motion.div>

      {splits.length === 0 ? (
        <motion.div variants={fadeUp} className="card p-16 text-center text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No split expenses yet</p>
          <p className="text-sm mt-1">Add names in the “Split with” field when logging an expense to track shares here.</p>
        </motion.div>
      ) : (
        <>
          {/* Owed summary */}
          <motion.div variants={scaleIn} className="card card-hover p-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <HandCoins size={16} className="text-emerald-500" /> Owed to you
            </p>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
              {formatCurrencyFull(Math.round(totalOwed), sym)}
            </p>
            {people.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {people.map(([name, amt]) => (
                  <span key={name} className="inline-flex items-center gap-2 text-sm bg-slate-100 dark:bg-white/[0.06] rounded-full pl-1 pr-3 py-1">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs flex items-center justify-center font-medium">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{name}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrencyFull(Math.round(amt), sym)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mt-2">All settled up 🎉</p>
            )}
          </motion.div>

          {/* Split list */}
          <motion.div variants={fadeUp}>
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">All splits</h2>
            <div className="card divide-y divide-slate-100/70 dark:divide-white/[0.06] overflow-hidden">
              {splits.map(s => {
                const cat = getCategoryById(s.tx.category)
                const txSym = currencySymbol(s.tx.currency)
                return (
                  <div key={s.tx.id} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${s.tx.splitSettled ? 'opacity-60' : 'hover:bg-violet-50/60 dark:hover:bg-violet-500/10'}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cat.color}22` }}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {s.tx.merchant || cat.name}
                        <span className="text-xs font-normal text-slate-400"> · {formatCurrencyFull(s.tx.amount, txSym)} / {s.people.length + 1}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {formatDate(s.tx.date)} · with {s.people.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      {s.tx.splitSettled ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <Check size={13} /> Settled
                        </span>
                      ) : (
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrencyFull(Math.round(s.baseOwed), sym)}
                          <span className="block text-[10px] font-normal text-slate-400">owed to you</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        updateTransaction(s.tx.id, { splitSettled: !s.tx.splitSettled })
                        toast(s.tx.splitSettled ? 'Marked as unsettled' : 'Marked as settled')
                      }}
                      title={s.tx.splitSettled ? 'Mark unsettled' : 'Mark settled'}
                      className={`p-2 rounded-lg transition-colors ${
                        s.tx.splitSettled
                          ? 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                          : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/15'
                      }`}
                    >
                      {s.tx.splitSettled ? <Undo2 size={16} /> : <Check size={16} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
