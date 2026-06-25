import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Eye, EyeOff, Moon, Sun, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { CURRENCIES } from '../data/currencies'
import { staggerContainer, fadeUp } from '../lib/motion'

export default function Settings() {
  const { settings, updateSettings, clearAllData } = useStore()
  const { toast } = useToast()
  const [name, setName] = useState(settings.name)
  const [currency, setCurrency] = useState(settings.currency)
  const [monthlyIncome, setMonthlyIncome] = useState(settings.monthlyIncome.toString())
  const [apiKey, setApiKey] = useState(settings.aiApiKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return }
    clearAllData()
    setConfirmClear(false)
    toast('All data cleared — start fresh')
  }

  const handleSave = () => {
    const cur = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
    updateSettings({ name, currency, currencySymbol: cur.symbol, monthlyIncome: parseFloat(monthlyIncome) || 0, aiApiKey: apiKey })
    setSaved(true)
    toast('Settings saved')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6 max-w-2xl mx-auto space-y-6">
      <motion.h1 variants={fadeUp} className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</motion.h1>

      {/* Appearance */}
      <motion.div variants={fadeUp} className="card card-hover p-6 space-y-4">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white">
              {settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark mode</p>
              <p className="text-xs text-slate-400">{settings.darkMode ? 'Premium dark theme' : 'Light theme'}</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`relative w-12 h-7 rounded-full transition-colors ${settings.darkMode ? 'bg-violet-600' : 'bg-slate-300'}`}
            aria-label="Toggle dark mode"
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${settings.darkMode ? 'right-1' : 'left-1'}`}
            />
          </button>
        </div>
      </motion.div>

      {/* Profile */}
      <motion.div variants={fadeUp} className="card card-hover p-6 space-y-4">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="label">Monthly Income ({CURRENCIES.find(c => c.code === currency)?.symbol})</label>
            <input type="number" className="input" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="75000" />
          </div>
        </div>
      </motion.div>

      {/* Currency */}
      <motion.div variants={fadeUp} className="card card-hover p-6 space-y-4">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">Currency</h2>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`p-3 rounded-xl border text-sm text-left transition-all ${currency === c.code ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/15 dark:text-violet-200' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'}`}
            >
              <span className="text-lg font-bold">{c.symbol}</span>
              <p className="font-medium mt-0.5">{c.code}</p>
              <p className="text-xs text-slate-400">{c.name}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Settings */}
      <motion.div variants={fadeUp} className="card card-hover p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">AI Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Connect your Claude API key to enable full AI features</p>
        </div>
        <div>
          <label className="label">Claude API Key</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Get your API key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-violet-500 hover:underline">console.anthropic.com</a>. The key is stored locally only.
          </p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-sm text-violet-700 dark:text-violet-200">
          <strong>With AI enabled:</strong> Natural language expense input, smart auto-categorization, personalized insights, anomaly detection, budget recommendations, and AI-generated financial reports.
        </div>
      </motion.div>

      {/* Save button */}
      <motion.button variants={fadeUp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSave} className={`btn-primary flex items-center gap-2 ${saved ? '!bg-emerald-500' : ''}`}>
        <Save size={16} />
        {saved ? 'Saved!' : 'Save Settings'}
      </motion.button>

      {/* Data / danger zone */}
      <motion.div variants={fadeUp} className="card p-6 space-y-4 border border-rose-200 dark:border-rose-500/30">
        <div>
          <h2 className="font-semibold text-rose-600 dark:text-rose-300">Data</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            The app ships with sample data so you can explore it. Clear it to start tracking your own finances from scratch. This deletes all transactions, budgets, goals and accounts — it can't be undone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${confirmClear ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20'}`}
          >
            <Trash2 size={16} />
            {confirmClear ? 'Yes, delete everything' : 'Clear all data'}
          </button>
          {confirmClear && (
            <button onClick={() => setConfirmClear(false)} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
