import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from './Toast'
import { DEFAULT_CATEGORIES } from '../data/categories'
import { CURRENCIES } from '../data/currencies'
import { Transaction, Mood } from '../types'
import { cn } from '../lib/utils'

interface Props {
  onClose: () => void
  transaction?: Transaction // if editing
}

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
  { value: 'impulsive', emoji: '😬', label: 'Impulsive' },
]

export function TransactionModal({ onClose, transaction }: Props) {
  const { addTransaction, updateTransaction, settings } = useStore()
  const { toast } = useToast()

  const [type, setType] = useState<'expense' | 'income'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [currency, setCurrency] = useState(transaction?.currency ?? settings.currency)
  const [category, setCategory] = useState(transaction?.category ?? 'food')
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [date, setDate] = useState(
    transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [mood, setMood] = useState<Mood | undefined>(transaction?.mood)
  const [tags, setTags] = useState(transaction?.tags?.join(', ') ?? '')
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring ?? false)
  const [taxDeductible, setTaxDeductible] = useState(transaction?.taxDeductible ?? false)
  const [aiLoading, setAiLoading] = useState(false)
  const [nlInput, setNlInput] = useState('')

  const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both')
  const incomeCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'income' || c.type === 'both')
  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories

  const handleNLParse = async () => {
    if (!nlInput.trim()) return
    setAiLoading(true)
    // Demo: simple regex parse for now; replace with Claude API call
    const amtMatch = nlInput.match(/(\d+(?:\.\d+)?)/)?.[1]
    if (amtMatch) setAmount(amtMatch)
    // Simple keyword matching for category
    const lower = nlInput.toLowerCase()
    if (lower.includes('food') || lower.includes('swiggy') || lower.includes('zomato') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('coffee')) setCategory('food')
    else if (lower.includes('uber') || lower.includes('ola') || lower.includes('cab') || lower.includes('petrol')) setCategory('transport')
    else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('subscription')) setCategory('subscriptions')
    else if (lower.includes('movie') || lower.includes('game')) setCategory('entertainment')
    if (lower.includes('salary') || lower.includes('income')) setType('income')
    setAiLoading(false)
    setNlInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      type,
      amount: parseFloat(amount),
      currency,
      category,
      merchant,
      note,
      date: new Date(date).toISOString(),
      tags: tagArr,
      mood,
      isRecurring,
      taxDeductible,
    }
    if (transaction) {
      updateTransaction(transaction.id, data)
      toast('Transaction updated')
    } else {
      addTransaction(data)
      toast('Transaction added')
    }
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 dark:border dark:border-white/10 rounded-3xl shadow-2xl shadow-violet-500/20 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">{transaction ? 'Edit' : 'Add'} Transaction</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* AI Natural Language Input */}
          <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-300/30 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-violet-500" />
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">AI Quick Add</span>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/80 dark:bg-slate-800/80 border border-violet-200 dark:border-violet-500/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 dark:text-slate-100"
                placeholder='e.g. "spent 500 on Swiggy lunch"'
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNLParse()}
              />
              <button
                type="button"
                onClick={handleNLParse}
                disabled={aiLoading}
                className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm hover:from-violet-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : '→'}
              </button>
            </div>
          </div>

          {/* Type toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 gap-1">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory(t === 'expense' ? 'food' : 'salary') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  type === t
                    ? t === 'expense'
                      ? 'bg-white dark:bg-white/10 text-rose-500 dark:text-rose-400 shadow-sm'
                      : 'bg-white dark:bg-white/10 text-emerald-500 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {t === 'expense' ? '↑ Expense' : '↓ Income'}
              </button>
            ))}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
                <select
                  className="input w-20 px-2"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  title="Currency"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
              {currentCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    category === cat.id
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                      : 'border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 hover:border-violet-300'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Merchant + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Merchant</label>
              <input className="input" placeholder="e.g. Swiggy" value={merchant} onChange={e => setMerchant(e.target.value)} />
            </div>
            <div>
              <label className="label">Note</label>
              <input className="input" placeholder="Optional note" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" placeholder="#work, #lunch" value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          {/* Mood */}
          {type === 'expense' && (
            <div>
              <label className="label">Mood when spending</label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(mood === m.value ? undefined : m.value)}
                    title={m.label}
                    className={cn(
                      'w-9 h-9 rounded-xl text-lg transition-all',
                      mood === m.value ? 'ring-2 ring-violet-400 bg-violet-50 dark:bg-violet-500/20 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">Recurring</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxDeductible}
                onChange={e => setTaxDeductible(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">Tax deductible</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {transaction ? 'Update' : 'Add'} Transaction
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
