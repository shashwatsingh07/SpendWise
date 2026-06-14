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
  splitWith?: string[] // names of people the expense is split with (equal split)
  splitSettled?: boolean // whether others have paid you back their share
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

export type AccountKind = 'asset' | 'liability'

// An asset (cash, bank, investments, property…) or liability (loan, card…)
// used by the Net Worth tracker.
export interface Account {
  id: string
  name: string
  kind: AccountKind
  category: string // matches an ACCOUNT_TYPES id
  balance: number // current value / amount owed (always stored positive)
  icon: string
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

// A raw SMS read off the device (Phase 2 — Android SMS auto-import)
export interface SmsMessage {
  id?: string
  sender?: string // e.g. "VK-HDFCBK", "AD-SBIINB"
  body: string
  date: number // epoch ms when the SMS was received
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
