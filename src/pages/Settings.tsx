import { useState } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
]

export default function Settings() {
  const { settings, updateSettings } = useStore()
  const [name, setName] = useState(settings.name)
  const [currency, setCurrency] = useState(settings.currency)
  const [monthlyIncome, setMonthlyIncome] = useState(settings.monthlyIncome.toString())
  const [apiKey, setApiKey] = useState(settings.aiApiKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const cur = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
    updateSettings({ name, currency, currencySymbol: cur.symbol, monthlyIncome: parseFloat(monthlyIncome) || 0, aiApiKey: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-700">Profile</h2>
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
      </div>

      {/* Currency */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-700">Currency</h2>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`p-3 rounded-xl border text-sm text-left transition-all ${currency === c.code ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <span className="text-lg font-bold">{c.symbol}</span>
              <p className="font-medium mt-0.5">{c.code}</p>
              <p className="text-xs text-slate-400">{c.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Settings */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-700">AI Settings</h2>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Get your API key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-sky-500 hover:underline">console.anthropic.com</a>. The key is stored locally only.
          </p>
        </div>
        <div className="bg-sky-50 rounded-xl p-3 text-sm text-sky-700">
          <strong>With AI enabled:</strong> Natural language expense input, smart auto-categorization, personalized insights, anomaly detection, budget recommendations, and AI-generated financial reports.
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} className={`btn-primary flex items-center gap-2 ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
        <Save size={16} />
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
