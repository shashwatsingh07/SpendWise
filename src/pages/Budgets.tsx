import { useState } from 'react'
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getCategoryById, DEFAULT_CATEGORIES } from '../data/categories'
import { formatCurrencyFull, getProgressGradient } from '../lib/utils'
import { Budget } from '../types'
import { cn } from '../lib/utils'
import { v4 as uuid } from 'uuid'

export default function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget, getCategorySpend, settings } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const sym = settings.currencySymbol

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + getCategorySpend(b.category, y, m), 0)

  return (
    <div className="page-enter p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Budgets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatCurrencyFull(totalSpent, sym)} spent of {formatCurrencyFull(totalBudgeted, sym)} budgeted
          </p>
        </div>
        <button onClick={() => { setEditBudget(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Budget
        </button>
      </div>

      {/* Overall progress */}
      <div className="card p-5 stagger-in" style={{ animationDelay: '50ms' }}>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">Total Monthly Budget</span>
          <span className="text-slate-500 dark:text-slate-400">{Math.round(totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0)}% used</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressGradient(totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0)}`}
            style={{ width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>Spent: {formatCurrencyFull(totalSpent, sym)}</span>
          <span>Remaining: {formatCurrencyFull(Math.max(totalBudgeted - totalSpent, 0), sym)}</span>
        </div>
      </div>

      {/* Budget cards */}
      <div className="grid grid-cols-2 gap-4">
        {budgets.map((b, i) => {
          const cat = getCategoryById(b.category)
          const spent = getCategorySpend(b.category, y, m)
          const pct = Math.min(b.limit > 0 ? (spent / b.limit) * 100 : 0, 100)
          const remaining = Math.max(b.limit - spent, 0)
          const isAlert = pct >= b.alertAt

          return (
            <div
              key={b.id}
              className={cn('card p-5 stagger-in transition-transform hover:scale-[1.02]', isAlert && 'border-amber-300/40 bg-amber-50/40 dark:bg-amber-500/10')}
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{cat.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{b.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isAlert && <AlertCircle size={15} className="text-amber-500" />}
                  <button onClick={() => { setEditBudget(b); setShowForm(true) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteBudget(b.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{formatCurrencyFull(spent, sym)} spent</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrencyFull(b.limit, sym)}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressGradient(pct)}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={pct >= 100 ? 'text-red-500 font-medium' : 'text-slate-400'}>
                    {pct >= 100 ? 'Budget exceeded!' : `${Math.round(pct)}% used`}
                  </span>
                  <span className="text-slate-400">{formatCurrencyFull(remaining, sym)} left</span>
                </div>
              </div>
            </div>
          )
        })}

        {budgets.length === 0 && (
          <div className="col-span-2 card p-12 text-center text-slate-400">
            <p className="font-medium">No budgets set</p>
            <p className="text-sm mt-1">Add a budget to track your spending</p>
          </div>
        )}
      </div>

      {showForm && (
        <BudgetForm
          budget={editBudget}
          onSave={(data) => {
            if (editBudget) updateBudget(editBudget.id, data)
            else addBudget(data)
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
          existingCategories={budgets.map(b => b.category)}
        />
      )}
    </div>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-violet-500/20 w-full max-w-sm p-6 animate-modal">
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
          <div className="grid grid-cols-2 gap-3">
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
      </div>
    </div>
  )
}
