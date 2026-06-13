import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Wallet, Settings, Sparkles, Plus, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { TransactionModal } from './TransactionModal'
import { SmsImportBanner } from './SmsImportBanner'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/import', icon: UploadCloud, label: 'Import' },
  { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Layout() {
  const [addOpen, setAddOpen] = useState(false)
  const { settings } = useStore()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — dark glass */}
      <aside className="w-56 shrink-0 flex flex-col py-5 px-3 gap-1
                        bg-gradient-to-b from-slate-900 to-slate-800
                        backdrop-blur border-r border-white/10 text-slate-300">
        {/* Logo */}
        <div className="px-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm
                            bg-gradient-to-br from-violet-500 to-indigo-600 shadow-glow">
              S
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-300 to-indigo-200 bg-clip-text text-transparent">
              SpendWise
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-10">Hi, {settings.name}!</p>
        </div>

        {/* Nav items — left-border slide + background fill */}
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <span
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium overflow-hidden transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-violet-500/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
              >
                {/* Left accent bar: slides/grows on hover, full height when active */}
                <span
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full',
                    'bg-gradient-to-b from-violet-400 to-indigo-400 transition-all duration-300',
                    isActive ? 'h-6' : 'h-0 group-hover:h-4'
                  )}
                />
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </span>
            )}
          </NavLink>
        ))}

        {/* Quick add button — gradient */}
        <div className="mt-auto px-1">
          <button
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white
                       bg-gradient-to-r from-violet-600 to-indigo-600
                       hover:from-violet-500 hover:to-indigo-500
                       shadow-lg shadow-violet-500/30
                       transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <SmsImportBanner />
        <Outlet />
      </main>

      {/* Transaction modal */}
      {addOpen && <TransactionModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}
