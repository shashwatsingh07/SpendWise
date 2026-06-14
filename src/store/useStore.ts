import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Transaction, Budget, Category, SavingsGoal, AppSettings, Account } from '../types'
import { DEFAULT_CATEGORIES } from '../data/categories'
import { SAMPLE_TRANSACTIONS, SAMPLE_BUDGETS, SAMPLE_GOALS } from '../data/sampleData'
import { SAMPLE_ACCOUNTS } from '../data/accounts'
import { v4 as uuid } from 'uuid'

interface StoreState {
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  goals: SavingsGoal[]
  accounts: Account[]
  settings: AppSettings

  // Import undo: ids added by the most recent bulk import
  lastImportIds: string[]

  // Transaction actions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void
  bulkAddTransactions: (ts: Omit<Transaction, 'id' | 'createdAt'>[]) => number
  undoLastImport: () => number
  updateTransaction: (id: string, t: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  isDuplicate: (amount: number, date: string, merchant?: string) => boolean

  // Budget actions
  addBudget: (b: Omit<Budget, 'id'>) => void
  updateBudget: (id: string, b: Partial<Budget>) => void
  deleteBudget: (id: string) => void

  // Goals actions
  addGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, g: Partial<SavingsGoal>) => void
  deleteGoal: (id: string) => void

  // Account actions (net worth)
  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => void
  updateAccount: (id: string, a: Partial<Account>) => void
  deleteAccount: (id: string) => void
  getNetWorth: () => { assets: number; liabilities: number; net: number }

  // Settings
  updateSettings: (s: Partial<AppSettings>) => void

  // Computed helpers (not persisted)
  getMonthlyExpenses: (year: number, month: number) => number
  getMonthlyIncome: (year: number, month: number) => number
  getCategorySpend: (categoryId: string, year: number, month: number) => number
  getBudgetUsage: (budgetId: string) => number
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      transactions: SAMPLE_TRANSACTIONS,
      budgets: SAMPLE_BUDGETS,
      categories: DEFAULT_CATEGORIES,
      goals: SAMPLE_GOALS,
      accounts: SAMPLE_ACCOUNTS,
      lastImportIds: [],
      settings: {
        currency: 'INR',
        currencySymbol: '₹',
        darkMode: true,
        aiApiKey: '',
        monthlyIncome: 75000,
        name: 'Shashwat',
      },

      addTransaction: (t) =>
        set(s => ({
          transactions: [
            { ...t, id: uuid(), createdAt: new Date().toISOString() },
            ...s.transactions,
          ],
        })),

      bulkAddTransactions: (ts) => {
        const now = new Date().toISOString()
        const newOnes = ts.map(t => ({ ...t, id: uuid(), createdAt: now }))
        set(s => ({
          transactions: [...newOnes, ...s.transactions],
          lastImportIds: newOnes.map(t => t.id),
        }))
        return newOnes.length
      },

      undoLastImport: () => {
        const { lastImportIds } = get()
        if (lastImportIds.length === 0) return 0
        const ids = new Set(lastImportIds)
        set(s => ({
          transactions: s.transactions.filter(tx => !ids.has(tx.id)),
          lastImportIds: [],
        }))
        return ids.size
      },

      updateTransaction: (id, t) =>
        set(s => ({
          transactions: s.transactions.map(tx => (tx.id === id ? { ...tx, ...t } : tx)),
        })),

      deleteTransaction: (id) =>
        set(s => ({ transactions: s.transactions.filter(tx => tx.id !== id) })),

      // Same amount + same calendar day (+ merchant if known) = likely duplicate
      isDuplicate: (amount, date, merchant) => {
        const { transactions } = get()
        const day = date.slice(0, 10)
        return transactions.some(tx => {
          if (Math.abs(tx.amount - amount) > 0.01) return false
          if (tx.date.slice(0, 10) !== day) return false
          if (merchant && tx.merchant) {
            return tx.merchant.toLowerCase().trim() === merchant.toLowerCase().trim()
          }
          return true
        })
      },

      addBudget: (b) =>
        set(s => ({ budgets: [...s.budgets, { ...b, id: uuid() }] })),

      updateBudget: (id, b) =>
        set(s => ({ budgets: s.budgets.map(bud => (bud.id === id ? { ...bud, ...b } : bud)) })),

      deleteBudget: (id) =>
        set(s => ({ budgets: s.budgets.filter(b => b.id !== id) })),

      addGoal: (g) =>
        set(s => ({ goals: [...s.goals, { ...g, id: uuid(), createdAt: new Date().toISOString() }] })),

      updateGoal: (id, g) =>
        set(s => ({ goals: s.goals.map(goal => (goal.id === id ? { ...goal, ...g } : goal)) })),

      deleteGoal: (id) =>
        set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      addAccount: (a) =>
        set(s => ({ accounts: [...s.accounts, { ...a, id: uuid(), createdAt: new Date().toISOString() }] })),

      updateAccount: (id, a) =>
        set(s => ({ accounts: s.accounts.map(acc => (acc.id === id ? { ...acc, ...a } : acc)) })),

      deleteAccount: (id) =>
        set(s => ({ accounts: s.accounts.filter(acc => acc.id !== id) })),

      getNetWorth: () => {
        const { accounts } = get()
        const assets = accounts.filter(a => a.kind === 'asset').reduce((s, a) => s + a.balance, 0)
        const liabilities = accounts.filter(a => a.kind === 'liability').reduce((s, a) => s + a.balance, 0)
        return { assets, liabilities, net: assets - liabilities }
      },

      updateSettings: (s) =>
        set(state => ({ settings: { ...state.settings, ...s } })),

      getMonthlyExpenses: (year, month) => {
        const { transactions } = get()
        return transactions
          .filter(t => {
            const d = new Date(t.date)
            return t.type === 'expense' && d.getFullYear() === year && d.getMonth() === month
          })
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getMonthlyIncome: (year, month) => {
        const { transactions } = get()
        return transactions
          .filter(t => {
            const d = new Date(t.date)
            return t.type === 'income' && d.getFullYear() === year && d.getMonth() === month
          })
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getCategorySpend: (categoryId, year, month) => {
        const { transactions } = get()
        return transactions
          .filter(t => {
            const d = new Date(t.date)
            return (
              t.category === categoryId &&
              t.type === 'expense' &&
              d.getFullYear() === year &&
              d.getMonth() === month
            )
          })
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getBudgetUsage: (budgetId) => {
        const { budgets, getCategorySpend } = get()
        const budget = budgets.find(b => b.id === budgetId)
        if (!budget) return 0
        const now = new Date()
        const spent = getCategorySpend(budget.category, now.getFullYear(), now.getMonth())
        return budget.limit > 0 ? (spent / budget.limit) * 100 : 0
      },
    }),
    {
      name: 'spendwise-store',
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        categories: state.categories,
        goals: state.goals,
        accounts: state.accounts,
        settings: state.settings,
        lastImportIds: state.lastImportIds,
      }),
    }
  )
)
