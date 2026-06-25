import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Bot, User, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react'
import { useStore } from '../store/useStore'
import { convertCurrency } from '../data/currencies'
import { Skeleton } from '../components/Skeleton'
import { getCategoryById } from '../data/categories'
import { formatCurrencyFull } from '../lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

const QUICK_PROMPTS = [
  'How much did I spend this month?',
  'What\'s my biggest expense category?',
  'Am I on track with my budget?',
  'Give me savings tips',
  'Analyze my spending patterns',
  'What can I cut to save more?',
]

export default function AIAssistant() {
  const store = useStore()
  const { transactions, budgets, goals, settings } = store
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi ${settings.name}! 👋 I'm your AI finance assistant. I can analyze your spending, give you insights, and help you save more. What would you like to know?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getFinancialContext = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()

    const toBase = (t: { amount: number; currency: string }) => convertCurrency(t.amount, t.currency, settings.currency)
    const monthlyExpenses = transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getFullYear() === y && d.getMonth() === m })
      .reduce((s, t) => s + toBase(t), 0)
    const monthlyIncome = transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'income' && d.getFullYear() === y && d.getMonth() === m })
      .reduce((s, t) => s + toBase(t), 0)

    // Category breakdown
    const categoryMap: Record<string, number> = {}
    transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getFullYear() === y && d.getMonth() === m })
      .forEach(t => { categoryMap[t.category] = (categoryMap[t.category] ?? 0) + toBase(t) })
    const topCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => `${getCategoryById(cat).name}: ${formatCurrencyFull(amt, settings.currencySymbol)}`)
      .join(', ')

    // Budget status
    const budgetStatus = budgets.map(b => {
      const spent = store.getCategorySpend(b.category, y, m)
      const pct = Math.round((spent / b.limit) * 100)
      return `${getCategoryById(b.category).name}: ${pct}% used (${formatCurrencyFull(spent, settings.currencySymbol)} of ${formatCurrencyFull(b.limit, settings.currencySymbol)})`
    }).join('; ')

    return `
User: ${settings.name}
Currency: ${settings.currency} (${settings.currencySymbol})
This month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })}):
- Total income: ${formatCurrencyFull(monthlyIncome, settings.currencySymbol)}
- Total expenses: ${formatCurrencyFull(monthlyExpenses, settings.currencySymbol)}
- Net balance: ${formatCurrencyFull(monthlyIncome - monthlyExpenses, settings.currencySymbol)}
- Savings rate: ${monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0}%
- Top spending categories: ${topCategories || 'none'}
- Budget status: ${budgetStatus || 'no budgets set'}
- Total savings goals: ${goals.length}, total saved: ${formatCurrencyFull(goals.reduce((s, g) => s + g.currentAmount, 0), settings.currencySymbol)} of ${formatCurrencyFull(goals.reduce((s, g) => s + g.targetAmount, 0), settings.currencySymbol)} targeted
- Total transactions this month: ${transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === y && d.getMonth() === m }).length}
    `.trim()
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const loadingMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', loading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setLoading(true)

    try {
      // If user has set an API key, use real Claude API
      if (settings.aiApiKey) {
        const context = getFinancialContext()
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.aiApiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 500,
            system: `You are a helpful personal finance assistant for SpendWise. Here is the user's current financial data:\n\n${context}\n\nProvide concise, actionable financial advice. Be friendly and specific with numbers. Use ${settings.currencySymbol} for amounts.`,
            messages: [
              ...messages.filter(m => !m.loading && m.id !== '0').map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: text },
            ],
          }),
        })
        const data = await response.json()
        const reply = data.content?.[0]?.text ?? 'Sorry, I could not process that.'
        setMessages(prev => prev.map(m => m.loading ? { ...m, content: reply, loading: false } : m))
      } else {
        // Demo mode: smart rule-based responses
        const reply = generateDemoResponse(text, getFinancialContext(), settings.currencySymbol)
        await new Promise(r => setTimeout(r, 800))
        setMessages(prev => prev.map(m => m.loading ? { ...m, content: reply, loading: false } : m))
      }
    } catch {
      setMessages(prev => prev.map(m => m.loading ? { ...m, content: '⚠️ Could not connect to AI. Please check your API key in Settings.', loading: false } : m))
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100">AI Finance Assistant</h1>
            <p className="text-xs text-slate-400">
              {settings.aiApiKey ? 'Connected to Claude' : 'Demo mode — add API key in Settings for full AI'}
            </p>
          </div>
          {!settings.aiApiKey && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-3 py-1.5 rounded-full">
              <AlertCircle size={12} />
              Demo mode
            </div>
          )}
        </div>
      </div>

      {/* Insights bar */}
      <div className="px-6 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex gap-4 overflow-x-auto pb-1">
          <InsightChip icon={<TrendingDown size={13} />} text="Spending this month" color="violet" onClick={() => sendMessage('How much did I spend this month?')} />
          <InsightChip icon={<AlertCircle size={13} />} text="Budget alerts" color="amber" onClick={() => sendMessage('Which budgets am I close to exceeding?')} />
          <InsightChip icon={<Lightbulb size={13} />} text="Savings tips" color="emerald" onClick={() => sendMessage('Give me personalized savings tips')} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={15} className="text-white" />
              </div>
            )}
            <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-violet-500/20' : 'bg-white dark:bg-white/[0.05] border border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'}`}>
              {msg.loading ? (
                <div className="flex flex-col gap-2 py-0.5 w-44">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <User size={15} className="text-slate-500 dark:text-slate-300" />
              </div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-6 py-3 border-t border-slate-50 dark:border-white/[0.06]">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="whitespace-nowrap text-xs px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-violet-50 dark:hover:bg-violet-500/15 hover:text-violet-700 dark:hover:text-violet-300 text-slate-600 dark:text-slate-300 rounded-full transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] backdrop-blur">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Ask anything about your finances..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={15} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function InsightChip({ icon, text, color, onClick }: { icon: React.ReactNode; text: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25',
    amber: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25',
    emerald: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25',
  }
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${colors[color]}`}>
      {icon}{text}
    </button>
  )
}

function generateDemoResponse(query: string, context: string, sym: string): string {
  const q = query.toLowerCase()
  if (q.includes('how much') && (q.includes('spend') || q.includes('spent'))) {
    const match = context.match(/Total expenses: (.+)\n/)
    const expenses = match?.[1] ?? 'unknown'
    return `📊 Based on your data:\n\n**This month's total expenses: ${expenses}**\n\nYour top spending categories are Food & Dining, Subscriptions, and Transport. The biggest single expense this month was likely your rent at ${sym}25,000.\n\nWant a detailed breakdown by category?`
  }
  if (q.includes('budget')) {
    return `📋 **Budget Status:**\n\n• Food & Dining: ~75% used — getting close!\n• Subscriptions: 99% used (Netflix + Spotify)\n• Transport: 48% used — on track\n\n💡 Tip: You're close to your Food budget. Try cooking at home a few days this week to stay within limit.`
  }
  if (q.includes('saving') || q.includes('save') || q.includes('tip')) {
    return `💡 **Personalized Savings Tips:**\n\n1. **Cut subscriptions** — You're spending ${sym}698/month on streaming. Consider sharing or rotating.\n\n2. **Food delivery** — Swiggy/Zomato orders are adding up. Cooking 3x/week could save ~${sym}2,000/month.\n\n3. **Automate savings** — Move ${sym}5,000 to savings on payday before you can spend it.\n\n4. **50/30/20 rule** — With your income, aim for ${sym}37,500 on needs, ${sym}22,500 on wants, and ${sym}15,000 in savings.`
  }
  if (q.includes('pattern') || q.includes('analyz')) {
    return `🔍 **Spending Pattern Analysis:**\n\n📅 **Peak spending days:** Weekends (especially Sundays)\n😰 **Mood correlation:** Your 'stressed' purchases average 2.3x your normal spending\n🔄 **Recurring costs:** ${sym}2,897/month in subscriptions & memberships\n📈 **Trend:** Food spending has increased 15% vs last month\n\n**Biggest opportunity:** Reducing impulsive purchases (tagged 😬) could save ~${sym}3,500/month.`
  }
  if (q.includes('biggest') || q.includes('category')) {
    return `🏆 **Your Top Spending Categories This Month:**\n\n1. 🏠 Housing/Rent — ${sym}25,000 (biggest fixed cost)\n2. 🍔 Food & Dining — ${sym}2,450\n3. 📚 Education — ${sym}5,500\n4. 🛍️ Shopping — ${sym}3,200\n5. 💊 Health — ${sym}2,100\n\nFood is your most controllable variable expense. Want tips on reducing it?`
  }
  return `I can help you with:\n\n• **Spending analysis** — how much you spent and where\n• **Budget tracking** — which budgets are at risk\n• **Savings advice** — personalized tips based on your patterns\n• **Goal progress** — how you're doing on savings goals\n\nFor full AI capabilities with natural language understanding, add your Claude API key in Settings → AI Settings.\n\nWhat would you like to know?`
}
