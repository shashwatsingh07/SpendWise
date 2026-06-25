import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { useStore } from './store/useStore'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Recurring from './pages/Recurring'
import NetWorth from './pages/NetWorth'
import Tags from './pages/Tags'
import Splits from './pages/Splits'
import Tax from './pages/Tax'
import AIAssistant from './pages/AIAssistant'
import Insights from './pages/Insights'
import Import from './pages/Import'
import Achievements from './pages/Achievements'
import Carbon from './pages/Carbon'
import Wealth from './pages/Wealth'
import Report from './pages/Report'
import Settings from './pages/Settings'

/** Apply the `dark` class to <html> whenever the persisted setting changes. */
function useThemeClass() {
  const darkMode = useStore(s => s.settings.darkMode)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])
}

export default function App() {
  useThemeClass()
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="goals" element={<Goals />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="net-worth" element={<NetWorth />} />
            <Route path="tags" element={<Tags />} />
            <Route path="splits" element={<Splits />} />
            <Route path="tax" element={<Tax />} />
            <Route path="ai" element={<AIAssistant />} />
            <Route path="insights" element={<Insights />} />
            <Route path="import" element={<Import />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="carbon" element={<Carbon />} />
            <Route path="wealth" element={<Wealth />} />
            <Route path="report" element={<Report />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <SpeedInsights />
    </ToastProvider>
  )
}
