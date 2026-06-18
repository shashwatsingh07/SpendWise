/**
 * gamification — streaks, XP, levels & badges.
 *
 * Pure, deterministic JS in the Phase 3 tradition: everything is derived from
 * the data already in the store (transactions / budgets / goals / accounts), so
 * there is nothing extra to persist and no network involved.
 */

import { Transaction, Budget, SavingsGoal, Account } from '../types'

// ---------- streaks ----------

const MS_DAY = 86_400_000

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export interface Streaks {
  current: number // consecutive logging days ending today or yesterday
  longest: number // best run ever
  loggedToday: boolean
}

/**
 * A "logging day" is any calendar day with at least one transaction. The current
 * streak stays alive as long as it includes today or yesterday (so you don't
 * lose it the instant midnight passes before you log).
 */
export function computeStreaks(txns: Transaction[], now = new Date()): Streaks {
  const days = new Set(txns.map(t => dayKey(new Date(t.date))))
  const todayKey = dayKey(now)
  const yesterdayKey = dayKey(new Date(now.getTime() - MS_DAY))
  const loggedToday = days.has(todayKey)

  // walk backwards from today (or yesterday if nothing logged today yet)
  let current = 0
  if (loggedToday || days.has(yesterdayKey)) {
    const start = loggedToday ? new Date(now) : new Date(now.getTime() - MS_DAY)
    const cursor = new Date(start)
    while (days.has(dayKey(cursor))) {
      current++
      cursor.setDate(cursor.getDate() - 1)
    }
  }

  // longest run across all logged days
  const sorted = [...days]
    .map(k => {
      const [y, m, d] = k.split('-').map(Number)
      return new Date(y, m, d).getTime()
    })
    .sort((a, b) => a - b)
  let longest = 0
  let run = 0
  let prev = NaN
  for (const t of sorted) {
    run = !isNaN(prev) && t - prev === MS_DAY ? run + 1 : 1
    if (run > longest) longest = run
    prev = t
  }

  return { current, longest: Math.max(longest, current), loggedToday }
}

// ---------- XP & levels ----------

const XP = {
  perTransaction: 12,
  perBudget: 40,
  perGoal: 60,
  perAccount: 25,
  perStreakDay: 15, // applied to longest streak
}

export interface LevelInfo {
  xp: number
  level: number
  title: string
  xpIntoLevel: number
  xpForNextLevel: number
  pctToNext: number
}

const LEVEL_TITLES = [
  'Coin Collector', 'Budget Rookie', 'Money Mindful', 'Savvy Saver',
  'Finance Pro', 'Wealth Builder', 'Money Master', 'Fortune Sage',
]

/** Cumulative XP needed to *reach* level L (L starts at 1). Gentle curve. */
function xpForLevel(level: number) {
  // 0, 150, 400, 750, 1200, 1750, ... — 100*L + 50*L*(L-1)/... kept simple:
  return Math.round(75 * (level - 1) * level)
}

export function computeXP(
  txns: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  accounts: Account[],
  longestStreak: number,
): LevelInfo {
  const xp =
    txns.length * XP.perTransaction +
    budgets.length * XP.perBudget +
    goals.length * XP.perGoal +
    accounts.length * XP.perAccount +
    longestStreak * XP.perStreakDay

  let level = 1
  while (xpForLevel(level + 1) <= xp) level++

  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const xpIntoLevel = xp - base
  const xpForNextLevel = next - base
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]

  return {
    xp,
    level,
    title,
    xpIntoLevel,
    xpForNextLevel,
    pctToNext: xpForNextLevel > 0 ? (xpIntoLevel / xpForNextLevel) * 100 : 100,
  }
}

// ---------- badges ----------

export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  earned: boolean
  current: number
  target: number
}

export interface BadgeContext {
  txns: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  accounts: Account[]
  streaks: Streaks
  savingsRatePct: number // this month
  netWorth: number
}

export function computeBadges(ctx: BadgeContext): Badge[] {
  const { txns, budgets, goals, accounts, streaks, savingsRatePct, netWorth } = ctx

  const distinctCats = new Set(txns.filter(t => t.type === 'expense').map(t => t.category)).size
  const deductibleCount = txns.filter(t => t.taxDeductible).length
  const taggedCount = txns.filter(t => t.tags && t.tags.length > 0).length
  const moodCount = txns.filter(t => t.mood).length
  const monthGoalProgress = goals.some(g => g.targetAmount > 0 && g.currentAmount >= g.targetAmount)

  const defs: Badge[] = [
    badge('first-step', 'First Step', 'Log your first transaction', '👣', txns.length, 1),
    badge('getting-started', 'Getting Started', 'Log 10 transactions', '📝', txns.length, 10),
    badge('centurion', 'Centurion', 'Log 100 transactions', '💯', txns.length, 100),
    badge('budgeter', 'Budgeter', 'Set your first budget', '📊', budgets.length, 1),
    badge('goal-setter', 'Goal Setter', 'Create a savings goal', '🎯', goals.length, 1),
    badge('goal-crusher', 'Goal Crusher', 'Fully fund a savings goal', '🏁', monthGoalProgress ? 1 : 0, 1),
    badge('week-warrior', 'Week Warrior', 'Keep a 7-day logging streak', '🔥', streaks.longest, 7),
    badge('month-master', 'Month Master', 'Keep a 30-day logging streak', '🏆', streaks.longest, 30),
    badge('saver', 'Saver', 'Save 20%+ of income this month', '🐷', Math.round(savingsRatePct), 20),
    badge('big-saver', 'Big Saver', 'Save 40%+ of income this month', '💎', Math.round(savingsRatePct), 40),
    badge('diversified', 'Diversified', 'Spend across 5 categories', '🧭', distinctCats, 5),
    badge('net-positive', 'Net Positive', 'Reach a positive net worth', '🏦', netWorth > 0 ? 1 : 0, 1),
    badge('tax-aware', 'Tax Aware', 'Tag 3 deductible expenses', '🧾', deductibleCount, 3),
    badge('organiser', 'Organiser', 'Tag 5 transactions', '🏷️', taggedCount, 5),
    badge('self-aware', 'Self-Aware', 'Log mood on 5 expenses', '🧠', moodCount, 5),
    badge('connected', 'Connected', 'Add 2 accounts', '🔗', accounts.length, 2),
  ]

  return defs
}

function badge(
  id: string, name: string, description: string, emoji: string,
  current: number, target: number,
): Badge {
  return { id, name, description, emoji, current: Math.min(current, target), target, earned: current >= target }
}
