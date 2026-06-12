export type TransactionType = 'expense' | 'income'

export type Mood = 'happy' | 'neutral' | 'stressed' | 'impulsive'

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type ImportSource = 'manual' | 'csv' | 'pdf' | 'paste' | 'sms' | 'bank'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  category: string
  merchant?: string
  note?: string
  date: string // ISO string
  tags: string[]
  mood?: Mood
  isRecurring: boolean
  recurringInterval?: RecurringInterval
  receiptUrl?: string
  taxDeductible: boolean
  splitWith?: string[]
  importSource?: ImportSource
  createdAt: string
}

// A row parsed from a statement, awaiting user confirmation before import
export interface ParsedTransaction {
  id: string // temp id for the preview list
  date: string // ISO string
  amount: number
  type: TransactionType
  category: string
  merchant: string
  note?: string
  rawText?: string // original line, for debugging / user reference
  confidence: number // 0-1, how sure the parser is
  selected: boolean // user toggle to include in import
  duplicate: boolean // matches an existing transaction
}

export interface Budget {
  id: string
  category: string
  limit: number
  period: 'monthly' | 'weekly'
  alertAt: number // percentage 0-100
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income' | 'both'
}

export interface SavingsGoal {
  id: string
  name: string
  icon: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  color: string
  createdAt: string
}

export interface AppSettings {
  currency: string
  currencySymbol: string
  darkMode: boolean
  aiApiKey: string
  monthlyIncome: number
  name: string
}

// Summary helpers
export interface MonthlySummary {
  month: string // YYYY-MM
  income: number
  expenses: number
  balance: number
}

export interface CategorySummary {
  category: string
  amount: number
  count: number
  percentage: number
  color: string
  icon: string
}
