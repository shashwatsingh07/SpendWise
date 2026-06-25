import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { getCategoryById, DEFAULT_CATEGORIES } from '../data/categories'
import { formatCurrencyFull, getProgressGradient } from '../lib/utils'
import { ProgressBar } from '../components/ProgressBar'
import { staggerContainer, fadeUp, scaleIn } from '../lib/motion'
import { Budget } from '../types'

export default function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget, getCategorySpend, settings } = useStore()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const sym = settings.currencySymbol

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + getCategorySpend(b.category, y, m), 0)
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Budgets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatCurrencyFull(totalSpent, sym)} spent of {formatCurrencyFull(totalBudgeted, sym)} budgeted
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { setEditBudget(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Budget
        </motion.button>
      </motion.div>

      {/* Overall progress */}
      <motion.div variants={fadeUp} className="card card-hover p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">Total Monthly Budget</span>
          <span className="text-slate-500 dark:text-slate-400 tabular-nums">{Math.round(overallPct)}% used</span>
        </div>
        <ProgressBar pct={overallPct} gradient={getProgressGradient(overallPct)} height="h-3" />
        <div className="flex justify-between text-xs text-slate-400 mt-1.5 tabular-nums">
          <span>Spent: {formatCurrencyFull(totalSpent, sym)}</span>
          <span>Remaining: {formatCurrencyFull(Math.max(totalBudgeted - totalSpent, 0), sym)}</span>
        </div>
      </motion.div>

      {/* Budget cards */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {budgets.map(b => {
          const cat = getCategoryById(b.category)
          const spent = getCategorySpend(b.category, y, m)
          const pct = Math.min(b.limit > 0 ? (spent / b.limit) * 100 : 0, 100)
          const remaining = Math.max(b.limit - spent, 0)
          const isAlert = pct >= b.alertAt

          return (
            <motion.div
              key={b.id}
              variants={scaleIn}
              whileHover={{ y: -3 }}
              className={`card card-hover p-5 ${isAlert ? 'border-amber-300/40 dark:border-amber-400/30 bg-amber-50/40 dark:bg-amber-500/[0.07]' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}22` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{cat.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{b.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isAlert && <AlertCircle size={15} className="text-amber-500" />}
                  <button onClick={() => { setEditBudget(b); setShowForm(true) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => { deleteBudget(b.id); toast('Budget removed', 'info') }} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg text-slate-400 hover:text-rose-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm tabular-nums">
                  <span className="text-slate-600 dark:text-slate-300">{formatCurrencyFull(spent, sym)} spent</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrencyFull(b.limit, sym)}</span>
                </div>
                <ProgressBar pct={pct} gradient={getProgressGradient(pct)} height="h-2" />
                <div className="flex justify-between text-xs tabular-nums">
                  <span className={pct >= 100 ? 'text-rose-500 dark:text-rose-400 font-medium' : 'text-slate-400'}>
                    {pct >= 100 ? 'Budget exceeded!' : `${Math.round(pct)}% used`}
                  </span>
                  <span className="text-slate-400">{formatCurrencyFull(remaining, sym)} left</span>
                </div>
              </div>
            </motion.div>
          )
        })}

        {budgets.length === 0 && (
          <div className="col-span-2 card p-12 text-center text-slate-400">
            <p className="font-medium">No budgets set</p>
            <p className="text-sm mt-1">Add a budget to track your spending</p>
          </div>
        )}
      </motion.div>

      {showForm && (
        <BudgetForm
          budget={editBudget}
          onSave={(data) => {
            if (editBudget) { updateBudget(editBudget.id, data); toast('Budget updated') }
            else { addBudget(data); toast('Budget created') }
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
          existingCategories={budgets.map(b => b.category)}
        />
      )}
    </motion.div>
  )
}

function BudgetForm({ budget, onSave, onClose, existingCategories }: {
  budget: Budget | null
  onSave: (data: Omit<Budget, 'id'>) => void
  onClose: () => void
  existingCategories: string[]
}) {
  const [category, setCategory] = useState(budget?.category ?? '')
  const [limit, setLimit] = useState(budget?.limit?.toString() ?? '')
  const [period, setPeriod] = useState<'monthly' | 'weekly'>(budget?.period ?? 'monthly')
  const [alertAt, setAlertAt] = useState(budget?.alertAt?.toString() ?? '80')

  const available = DEFAULT_CATEGORIES.filter(c => c.type === 'expense' && (c.id === budget?.category || !existingCategories.includes(c.id)))

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 dark:border dark:border-white/10 rounded-3xl shadow-2xl shadow-violet-500/20 w-full max-w-sm p-6"
      >
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">{budget ? 'Edit' : 'Add'} Budget</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {available.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Budget Limit (₹)</label>
            <input type="number" className="input" placeholder="5000" value={limit} onChange={e => setLimit(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Period</label>
              <select className="input" value={period} onChange={e => setPeriod(e.target.value as 'monthly' | 'weekly')}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="label">Alert at (%)</label>
              <input type="number" className="input" placeholder="80" value={alertAt} onChange={e => setAlertAt(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
          <button
            onClick={() => onSave({ category, limit: parseFloat(limit), period, alertAt: parseFloat(alertAt) })}
            disabled={!category || !limit}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            Save Budget
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
