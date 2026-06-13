import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Trash2, Edit2, Plus, Tag, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getCategoryById, DEFAULT_CATEGORIES } from '../data/categories'
import { formatCurrencyFull, formatDate, getMoodEmoji } from '../lib/utils'
import { TransactionModal } from '../components/TransactionModal'
import { Transaction } from '../types'
import { cn } from '../lib/utils'
import { staggerContainer, fadeUp, EASE } from '../lib/motion'

export default function Transactions() {
  const { transactions, deleteTransaction, settings } = useStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [addOpen, setAddOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return [...transactions]
      .filter(t => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            t.merchant?.toLowerCase().includes(q) ||
            t.note?.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
          )
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime()
        return b.amount - a.amount
      })
  }, [transactions, search, typeFilter, categoryFilter, sortBy])

  const totalFiltered = filtered.reduce((sum, t) => (t.type === 'expense' ? sum - t.amount : sum + t.amount), 0)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} transactions · Net: <span className={totalFiltered >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-500 dark:text-rose-400 font-medium'}>{totalFiltered >= 0 ? '+' : ''}{formatCurrencyFull(totalFiltered, settings.currencySymbol)}</span></p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Transaction
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search merchant, note, tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 gap-1">
            {(['all', 'expense', 'income'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                  typeFilter === t
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-slate-400" />
            <select
              className="input py-2 w-auto pr-8"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all', categoryFilter === 'all' ? 'border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:border-violet-300')}
          >
            All categories
          </button>
          {DEFAULT_CATEGORIES.slice(0, 10).map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id === categoryFilter ? 'all' : cat.id)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1', categoryFilter === cat.id ? 'border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:border-violet-300')}
            >
              {cat.icon} {cat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transaction list */}
      <motion.div layout variants={fadeUp} className="card divide-y divide-slate-100/70 dark:divide-white/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Filter size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((tx, i) => {
              const cat = getCategoryById(tx.category)
              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.022, 0.4), duration: 0.3, ease: EASE } }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  className="flex items-center gap-4 px-5 py-3.5 border-l-2 border-transparent
                             hover:border-violet-500 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${cat.color}22` }}
                  >
                    {cat.icon}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tx.merchant || cat.name}</p>
                      {tx.isRecurring && (
                        <span className="text-xs bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 px-1.5 py-0.5 rounded font-medium">↻</span>
                      )}
                      {tx.taxDeductible && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">Tax</span>
                      )}
                      {tx.tags.map(tag => (
                        <span key={tag} className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Tag size={10} />{tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat.name} · {formatDate(tx.date)}
                      {tx.note && ` · ${tx.note}`}
                    </p>
                  </div>

                  {/* Mood */}
                  {tx.mood && <span className="text-lg">{getMoodEmoji(tx.mood)}</span>}

                  {/* Amount */}
                  <span className={`text-sm font-bold tabular-nums ${tx.type === 'expense' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrencyFull(tx.amount, settings.currencySymbol)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTx(tx)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-300"
                    >
                      <Edit2 size={14} />
                    </button>
                    {deleteConfirm === tx.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { deleteTransaction(tx.id); setDeleteConfirm(null) }}
                          className="px-2 py-1 bg-rose-500 text-white rounded-lg text-xs font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 rounded-lg text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(tx.id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition-colors text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {addOpen && <TransactionModal onClose={() => setAddOpen(false)} />}
      {editTx && <TransactionModal transaction={editTx} onClose={() => setEditTx(null)} />}
    </motion.div>
  )
}
