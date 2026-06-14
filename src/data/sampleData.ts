import { Transaction, Budget, SavingsGoal } from '../types'

const now = new Date()
const month = now.getMonth()
const year = now.getFullYear()

const d = (daysAgo: number) => {
  const date = new Date(year, month, now.getDate() - daysAgo)
  return date.toISOString()
}

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'income', amount: 75000, currency: 'INR', category: 'salary', merchant: 'Employer', note: 'Monthly salary', date: d(2), tags: [], isRecurring: true, recurringInterval: 'monthly', taxDeductible: false, createdAt: d(2) },
  { id: 't2', type: 'expense', amount: 1200, currency: 'INR', category: 'food', merchant: 'Swiggy', note: 'Biryani', date: d(0), tags: ['#takeout'], mood: 'happy', isRecurring: false, taxDeductible: false, createdAt: d(0) },
  { id: 't3', type: 'expense', amount: 499, currency: 'INR', category: 'subscriptions', merchant: 'Netflix', note: '', date: d(1), tags: ['#streaming'], isRecurring: true, recurringInterval: 'monthly', taxDeductible: false, createdAt: d(1) },
  { id: 't4', type: 'expense', amount: 350, currency: 'INR', category: 'transport', merchant: 'Ola', note: 'Office commute', date: d(1), tags: [], mood: 'neutral', isRecurring: false, taxDeductible: true, createdAt: d(1) },
  { id: 't5', type: 'expense', amount: 3200, currency: 'INR', category: 'shopping', merchant: 'Amazon', note: 'Books and stationery', date: d(3), tags: ['#work'], isRecurring: false, taxDeductible: true, createdAt: d(3) },
  { id: 't6', type: 'expense', amount: 800, currency: 'INR', category: 'food', merchant: 'Starbucks', note: 'Team coffee', date: d(4), tags: ['#coffee'], mood: 'happy', isRecurring: false, taxDeductible: false, splitWith: ['Aarav', 'Priya'], splitSettled: false, createdAt: d(4) },
  { id: 't7', type: 'expense', amount: 1500, currency: 'INR', category: 'fitness', merchant: 'Cult.fit', note: 'Monthly membership', date: d(5), tags: [], isRecurring: true, recurringInterval: 'monthly', taxDeductible: false, createdAt: d(5) },
  { id: 't8', type: 'expense', amount: 25000, currency: 'INR', category: 'housing', merchant: 'Landlord', note: 'Rent', date: d(5), tags: [], isRecurring: true, recurringInterval: 'monthly', taxDeductible: false, createdAt: d(5) },
  { id: 't9', type: 'income', amount: 12000, currency: 'INR', category: 'freelance', merchant: 'Client A', note: 'UI design project', date: d(6), tags: ['#design'], isRecurring: false, taxDeductible: false, createdAt: d(6) },
  { id: 't10', type: 'expense', amount: 600, currency: 'INR', category: 'entertainment', merchant: 'PVR', note: 'Movie with friends', date: d(7), tags: ['#weekend'], mood: 'happy', isRecurring: false, taxDeductible: false, splitWith: ['Rohan'], splitSettled: true, createdAt: d(7) },
  { id: 't11', type: 'expense', amount: 2100, currency: 'INR', category: 'health', merchant: 'Pharmacy', note: 'Monthly medicines', date: d(8), tags: [], mood: 'stressed', isRecurring: false, taxDeductible: false, createdAt: d(8) },
  { id: 't12', type: 'expense', amount: 199, currency: 'INR', category: 'subscriptions', merchant: 'Spotify', note: '', date: d(9), tags: [], isRecurring: true, recurringInterval: 'monthly', taxDeductible: false, createdAt: d(9) },
  { id: 't13', type: 'expense', amount: 450, currency: 'INR', category: 'food', merchant: 'Zomato', note: 'Lunch', date: d(10), tags: [], mood: 'neutral', isRecurring: false, taxDeductible: false, createdAt: d(10) },
  { id: 't14', type: 'expense', amount: 1800, currency: 'INR', category: 'bills', merchant: 'Electricity Board', note: 'Electricity bill', date: d(11), tags: [], isRecurring: true, recurringInterval: 'monthly', taxDeductible: false, createdAt: d(11) },
  { id: 't15', type: 'expense', amount: 5500, currency: 'INR', category: 'education', merchant: 'Udemy', note: 'React + TypeScript course', date: d(12), tags: ['#learning', '#work'], isRecurring: false, taxDeductible: true, createdAt: d(12) },
]

export const SAMPLE_BUDGETS: Budget[] = [
  { id: 'b1', category: 'food', limit: 8000, period: 'monthly', alertAt: 80 },
  { id: 'b2', category: 'transport', limit: 3000, period: 'monthly', alertAt: 80 },
  { id: 'b3', category: 'entertainment', limit: 2000, period: 'monthly', alertAt: 75 },
  { id: 'b4', category: 'shopping', limit: 5000, period: 'monthly', alertAt: 80 },
  { id: 'b5', category: 'subscriptions', limit: 1500, period: 'monthly', alertAt: 100 },
]

export const SAMPLE_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'New MacBook', icon: '💻', targetAmount: 150000, currentAmount: 45000, targetDate: new Date(year, month + 6, 1).toISOString(), color: '#3b82f6', createdAt: d(30) },
  { id: 'g2', name: 'Goa Trip', icon: '🏖️', targetAmount: 30000, currentAmount: 18000, targetDate: new Date(year, month + 2, 1).toISOString(), color: '#f97316', createdAt: d(20) },
  { id: 'g3', name: 'Emergency Fund', icon: '🛡️', targetAmount: 200000, currentAmount: 80000, targetDate: new Date(year + 1, month, 1).toISOString(), color: '#22c55e', createdAt: d(60) },
]
