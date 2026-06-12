import { useState } from 'react'
import { Plus, Trash2, Edit2, Target } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatCurrencyFull, formatDate } from '../lib/utils'
import { SavingsGoal } from '../types'

const GOAL_ICONS = ['💻', '🏖️', '🏠', '🚗', '🛡️', '💍', '✈️', '📱', '🎓', '💰', '🎯', '🏋️']
const GOAL_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899']

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, settings } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const sym = settings.currencySymbol

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)

  return (
    <div className="page-enter p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Savings Goals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatCurrencyFull(totalSaved, sym)} saved of {formatCurrencyFull(totalTarget, sym)} across {goals.length} goals
          </p>
        </div>
        <button onClick={() => { setEditGoal(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm mt-1">Set a savings goal to stay motivated</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal, i) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const remaining = goal.targetAmount - goal.currentAmount
            const daysLeft = Math.max(Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000), 0)
            return (
              <div key={goal.id} className="card p-5 stagger-in transition-transform hover:scale-[1.02]" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${goal.color}20` }}>
                      {goal.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{goal.name}</p>
                      <p className="text-xs text-slate-400">
                        Target: {formatDate(goal.targetDate)} · {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditGoal(goal); setShowForm(true) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold" style={{ color: goal.color }}>
                      {formatCurrencyFull(goal.currentAmount, sym)}
                    </span>
                    <span className="text-slate-400">{formatCurrencyFull(goal.targetAmount, sym)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="font-semibold" style={{ color: goal.color }}>{Math.round(pct)}% complete</span>
                    <span className="text-slate-400">{formatCurrencyFull(remaining, sym)} to go</span>
                  </div>
                </div>

                {pct >= 100 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-500/15 rounded-xl px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 font-medium text-center">
                    🎉 Goal achieved!
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-300">
                    Save <strong>{formatCurrencyFull(daysLeft > 0 ? Math.ceil(remaining / (daysLeft / 30)) : remaining, sym)}/month</strong> to reach this goal on time
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editGoal}
          onSave={(data) => {
            if (editGoal) updateGoal(editGoal.id, data)
            else addGoal(data)
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function GoalForm({ goal, onSave, onClose }: {
  goal: SavingsGoal | null
  onSave: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(goal?.name ?? '')
  const [icon, setIcon] = useState(goal?.icon ?? '🎯')
  const [color, setColor] = useState(goal?.color ?? '#3b82f6')
  const [target, setTarget] = useState(goal?.targetAmount?.toString() ?? '')
  const [current, setCurrent] = useState(goal?.currentAmount?.toString() ?? '0')
  const [date, setDate] = useState(goal?.targetDate ? goal.targetDate.split('T')[0] : '')

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-violet-500/20 w-full max-w-sm p-6 animate-modal">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">{goal ? 'Edit' : 'New'} Goal</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Goal Name</label>
            <input className="input" placeholder="e.g. New MacBook" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className="label">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} className={`w-9 h-9 rounded-xl text-xl transition-all ${icon === ic ? 'ring-2 ring-violet-400 bg-violet-50 dark:bg-violet-500/20 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{ic}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target Amount (₹)</label>
              <input type="number" className="input" placeholder="100000" value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div>
              <label className="label">Already Saved (₹)</label>
              <input type="number" className="input" placeholder="0" value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Target Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
          <button
            onClick={() => onSave({ name, icon, color, targetAmount: parseFloat(target), currentAmount: parseFloat(current) || 0, targetDate: new Date(date).toISOString() })}
            disabled={!name || !target || !date}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>
  )
}
