import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Wallet, TrendingUp, TrendingDown, Landmark } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { ACCOUNT_TYPES, getAccountType } from '../data/accounts'
import { formatCurrencyFull } from '../lib/utils'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { ProgressBar } from '../components/ProgressBar'
import { staggerContainer, fadeUp, scaleIn } from '../lib/motion'
import { Account, AccountKind } from '../types'

export default function NetWorth() {
  const { accounts, addAccount, updateAccount, deleteAccount, getNetWorth, settings } = useStore()
  const { toast } = useToast()
  const sym = settings.currencySymbol

  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [formKind, setFormKind] = useState<AccountKind>('asset')

  const { assets, liabilities, net } = getNetWorth()
  const assetAccounts = accounts.filter(a => a.kind === 'asset')
  const liabilityAccounts = accounts.filter(a => a.kind === 'liability')
  // Assets' share of the total balance sheet — a quick health signal.
  const assetShare = assets + liabilities > 0 ? (assets / (assets + liabilities)) * 100 : 100

  const openAdd = (kind: AccountKind) => {
    setEditAccount(null)
    setFormKind(kind)
    setShowForm(true)
  }
  const openEdit = (a: Account) => {
    setEditAccount(a)
    setFormKind(a.kind)
    setShowForm(true)
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-5xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Landmark size={24} className="text-violet-500" />
            Net Worth
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Everything you own, minus what you owe</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => openAdd('asset')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Account
        </motion.button>
      </motion.div>

      {/* Hero net worth */}
      <motion.div variants={scaleIn} className="card card-hover p-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Wallet size={16} className="text-violet-500" /> Total Net Worth
        </p>
        <AnimatedNumber
          value={net}
          format={v => `${v < 0 ? '-' : ''}${formatCurrencyFull(Math.abs(Math.round(v)), sym)}`}
          className={`block text-4xl font-bold mt-2 tabular-nums ${net >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-500 dark:text-rose-400'}`}
        />
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Assets {Math.round(assetShare)}%</span>
            <span>Liabilities {Math.round(100 - assetShare)}%</span>
          </div>
          <ProgressBar pct={assetShare} gradient="bg-gradient-to-r from-emerald-400 to-teal-500" height="h-2.5" />
        </div>
      </motion.div>

      {/* Totals */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4">
        <motion.div variants={scaleIn} className="card card-hover p-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={18} /> <span className="text-sm font-medium">Total Assets</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 tabular-nums">{formatCurrencyFull(assets, sym)}</p>
          <p className="text-xs text-slate-400 mt-1">{assetAccounts.length} account{assetAccounts.length === 1 ? '' : 's'}</p>
        </motion.div>
        <motion.div variants={scaleIn} className="card card-hover p-5">
          <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
            <TrendingDown size={18} /> <span className="text-sm font-medium">Total Liabilities</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 tabular-nums">{formatCurrencyFull(liabilities, sym)}</p>
          <p className="text-xs text-slate-400 mt-1">{liabilityAccounts.length} account{liabilityAccounts.length === 1 ? '' : 's'}</p>
        </motion.div>
      </motion.div>

      {/* Lists */}
      <div className="grid grid-cols-2 gap-4">
        <AccountColumn
          title="Assets"
          accounts={assetAccounts}
          total={assets}
          sym={sym}
          accent="emerald"
          onAdd={() => openAdd('asset')}
          onEdit={openEdit}
          onDelete={(a) => { deleteAccount(a.id); toast('Account removed', 'info') }}
        />
        <AccountColumn
          title="Liabilities"
          accounts={liabilityAccounts}
          total={liabilities}
          sym={sym}
          accent="rose"
          onAdd={() => openAdd('liability')}
          onEdit={openEdit}
          onDelete={(a) => { deleteAccount(a.id); toast('Account removed', 'info') }}
        />
      </div>

      {showForm && (
        <AccountForm
          account={editAccount}
          kind={formKind}
          onKindChange={setFormKind}
          onSave={(data) => {
            if (editAccount) { updateAccount(editAccount.id, data); toast('Account updated') }
            else { addAccount(data); toast('Account added') }
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </motion.div>
  )
}

function AccountColumn({ title, accounts, total, sym, accent, onAdd, onEdit, onDelete }: {
  title: string
  accounts: Account[]
  total: number
  sym: string
  accent: 'emerald' | 'rose'
  onAdd: () => void
  onEdit: (a: Account) => void
  onDelete: (a: Account) => void
}) {
  // Full class strings so Tailwind's JIT can see them (no dynamic interpolation).
  const accentText = accent === 'emerald'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400'
  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
        <button onClick={onAdd} className="text-xs text-violet-500 hover:text-violet-400 font-medium flex items-center gap-1">
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="card divide-y divide-slate-100/70 dark:divide-white/[0.06] overflow-hidden">
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No {title.toLowerCase()} yet</p>
        ) : (
          accounts.map(a => {
            const pct = total > 0 ? Math.round((a.balance / total) * 100) : 0
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-slate-100 dark:bg-white/[0.06]">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.name}</p>
                  <p className="text-xs text-slate-400">{getAccountType(a.category).name} · {pct}%</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${accentText}`}>
                  {formatCurrencyFull(a.balance, sym)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(a)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onDelete(a)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg text-slate-400 hover:text-rose-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

function AccountForm({ account, kind, onKindChange, onSave, onClose }: {
  account: Account | null
  kind: AccountKind
  onKindChange: (k: AccountKind) => void
  onSave: (data: Omit<Account, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const types = ACCOUNT_TYPES.filter(t => t.kind === kind)
  const [name, setName] = useState(account?.name ?? '')
  const [category, setCategory] = useState(account?.category ?? types[0].id)
  const [balance, setBalance] = useState(account?.balance?.toString() ?? '')

  const handleKind = (k: AccountKind) => {
    onKindChange(k)
    setCategory(ACCOUNT_TYPES.filter(t => t.kind === k)[0].id)
  }

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
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">{account ? 'Edit' : 'Add'} Account</h2>

        {/* Kind toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 gap-1 mb-4">
          {(['asset', 'liability'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => handleKind(k)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                kind === k
                  ? k === 'asset'
                    ? 'bg-white dark:bg-white/10 text-emerald-500 dark:text-emerald-400 shadow-sm'
                    : 'bg-white dark:bg-white/10 text-rose-500 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {k === 'asset' ? 'Asset' : 'Liability'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="e.g. HDFC Savings" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {types.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{kind === 'asset' ? 'Current value' : 'Amount owed'}</label>
            <input type="number" className="input" placeholder="0" value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
          <button
            onClick={() => onSave({ name: name.trim(), kind, category, balance: Math.abs(parseFloat(balance)) || 0, icon: getAccountType(category).icon })}
            disabled={!name.trim() || !balance}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            Save Account
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
