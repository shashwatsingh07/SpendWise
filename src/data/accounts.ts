import { Account, AccountKind } from '../types'

export interface AccountType {
  id: string
  name: string
  icon: string
  kind: AccountKind
}

export const ACCOUNT_TYPES: AccountType[] = [
  // Assets
  { id: 'cash', name: 'Cash', icon: '💵', kind: 'asset' },
  { id: 'bank', name: 'Bank Account', icon: '🏦', kind: 'asset' },
  { id: 'investment', name: 'Investments', icon: '📈', kind: 'asset' },
  { id: 'property', name: 'Property', icon: '🏠', kind: 'asset' },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗', kind: 'asset' },
  { id: 'other_asset', name: 'Other Asset', icon: '📦', kind: 'asset' },
  // Liabilities
  { id: 'credit_card', name: 'Credit Card', icon: '💳', kind: 'liability' },
  { id: 'loan', name: 'Loan', icon: '🏷️', kind: 'liability' },
  { id: 'mortgage', name: 'Mortgage', icon: '🏚️', kind: 'liability' },
  { id: 'other_liability', name: 'Other Debt', icon: '📉', kind: 'liability' },
]

export const getAccountType = (id: string): AccountType =>
  ACCOUNT_TYPES.find(t => t.id === id) ?? { id, name: id, icon: '📦', kind: 'asset' }

const now = new Date().toISOString()

export const SAMPLE_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'HDFC Savings', kind: 'asset', category: 'bank', balance: 185000, icon: '🏦', createdAt: now },
  { id: 'a2', name: 'Cash Wallet', kind: 'asset', category: 'cash', balance: 8500, icon: '💵', createdAt: now },
  { id: 'a3', name: 'Index Funds', kind: 'asset', category: 'investment', balance: 320000, icon: '📈', createdAt: now },
  { id: 'a4', name: 'Gold', kind: 'asset', category: 'other_asset', balance: 95000, icon: '📦', createdAt: now },
  { id: 'a5', name: 'Credit Card', kind: 'liability', category: 'credit_card', balance: 23400, icon: '💳', createdAt: now },
  { id: 'a6', name: 'Car Loan', kind: 'liability', category: 'loan', balance: 210000, icon: '🏷️', createdAt: now },
]
