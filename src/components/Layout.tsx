import { NavLink, useOutlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Wallet, Settings, Sparkles, Plus, UploadCloud, Repeat, Landmark, Tag, Users, Receipt, Lightbulb, Trophy, Leaf, TrendingUp, FileText, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TransactionModal } from './TransactionModal'
import { SmsImportBanner } from './SmsImportBanner'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'
import { pageTransition } from '../lib/motion'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/recurring', icon: Repeat, label: 'Recurring' },
  { to: '/splits', icon: Users, label: 'Splits' },
  { to: '/net-worth', icon: Landmark, label: 'Net Worth' },
  { to: '/tax', icon: Receipt, label: 'Tax' },
  { to: '/import', icon: UploadCloud, label: 'Import' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/wealth', icon: TrendingUp, label: 'Wealth' },
  { to: '/carbon', icon: Leaf, label: 'Carbon' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/report', icon: FileText, label: 'AI Report' },
  { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Layout() {
  const [addOpen, setAddOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useStore()
  const outlet = useOutlet()
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile top bar — only below lg */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4
                         bg-slate-900/95 backdrop-blur border-b border-white/10 text-slate-100 no-print">
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs
                          bg-gradient-to-br from-violet-500 to-indigo-600 shadow-glow">S</div>
          <span className="font-bold bg-gradient-to-r from-violet-300 to-indigo-200 bg-clip-text text-transparent">SpendWise</span>
        </div>
      </header>

      {/* Backdrop when drawer open (mobile) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm no-print"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — dark glass. Static on desktop, slide-in drawer on mobile. */}
      <aside className={cn(
        'w-64 lg:w-56 shrink-0 flex flex-col py-5 px-3 gap-1',
        'bg-gradient-to-b from-slate-900 to-slate-800',
        'dark:from-slate-900/95 dark:to-slate-950/95 dark:backdrop-blur-xl',
        'backdrop-blur border-r border-white/10 text-slate-300',
        'fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="px-3 mb-5">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm
                         bg-gradient-to-br from-violet-500 to-indigo-600 shadow-glow"
            >
              S
            </motion.div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-300 to-indigo-200 bg-clip-text text-transparent">
              SpendWise
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-10">Hi, {settings.name}!</p>
        </div>

        {/* Nav items — shared-layout active pill slides between items */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto -mr-1 pr-1 min-h-0">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}>
              {({ isActive }) => (
                <motion.span
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium overflow-hidden',
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {/* Active background pill — animates position across items */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-white/10 shadow-lg shadow-violet-500/10
                                 ring-1 ring-white/10"
                    />
                  )}
                  {/* Left accent bar */}
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full',
                      'bg-gradient-to-b from-violet-400 to-indigo-400 transition-all duration-300',
                      isActive ? 'h-6' : 'h-0 group-hover:h-4'
                    )}
                  />
                  <Icon size={18} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick add button — gradient */}
        <div className="mt-auto px-1">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white
                       bg-gradient-to-r from-violet-600 to-indigo-600
                       hover:from-violet-500 hover:to-indigo-500
                       shadow-lg shadow-violet-500/30"
          >
            <Plus size={16} />
            Add Transaction
          </motion.button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="no-print">
          <SmsImportBanner />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Transaction modal */}
      {addOpen && <TransactionModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}
