import { Category } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#a855f7', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899', type: 'expense' },
  { id: 'health', name: 'Health', icon: '💊', color: '#22c55e', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: '⚡', color: '#eab308', type: 'expense' },
  { id: 'housing', name: 'Housing & Rent', icon: '🏠', color: '#14b8a6', type: 'expense' },
  { id: 'education', name: 'Education', icon: '📚', color: '#6366f1', type: 'expense' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: '#84cc16', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#06b6d4', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', color: '#8b5cf6', type: 'expense' },
  { id: 'personal', name: 'Personal Care', icon: '💆', color: '#f43f5e', type: 'expense' },
  { id: 'gifts', name: 'Gifts & Donations', icon: '🎁', color: '#d946ef', type: 'expense' },
  { id: 'pets', name: 'Pets', icon: '🐾', color: '#fb923c', type: 'expense' },
  { id: 'other_exp', name: 'Other', icon: '📦', color: '#64748b', type: 'expense' },
  // Income categories
  { id: 'salary', name: 'Salary', icon: '💼', color: '#22c55e', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#10b981', type: 'income' },
  { id: 'investment', name: 'Investments', icon: '📈', color: '#06b6d4', type: 'income' },
  { id: 'gift_inc', name: 'Gift Received', icon: '🎀', color: '#a78bfa', type: 'income' },
  { id: 'other_inc', name: 'Other Income', icon: '💰', color: '#34d399', type: 'income' },
]

export const getCategoryById = (id: string): Category =>
  DEFAULT_CATEGORIES.find(c => c.id === id) ?? {
    id, name: id, icon: '📦', color: '#64748b', type: 'expense'
  }
