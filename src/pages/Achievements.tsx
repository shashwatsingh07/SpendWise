import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Star, Award } from 'lucide-react'
import { useStore } from '../store/useStore'
import { staggerContainer, fadeUp } from '../lib/motion'
import { ProgressBar } from '../components/ProgressBar'
import {
  computeStreaks, computeXP, computeBadges, Badge,
} from '../lib/gamification'

export default function Achievements() {
  const { transactions, budgets, goals, accounts, getNetWorth, getMonthlyIncome, getMonthlyExpenses } = useStore()

  const now = new Date()
  const streaks = useMemo(() => computeStreaks(transactions), [transactions])
  const level = useMemo(
    () => computeXP(transactions, budgets, goals, accounts, streaks.longest),
    [transactions, budgets, goals, accounts, streaks.longest],
  )

  const savingsRatePct = useMemo(() => {
    const inc = getMonthlyIncome(now.getFullYear(), now.getMonth())
    const exp = getMonthlyExpenses(now.getFullYear(), now.getMonth())
    return inc > 0 ? ((inc - exp) / inc) * 100 : 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions])

  const badges = useMemo(
    () => computeBadges({
      txns: transactions, budgets, goals, accounts, streaks,
      savingsRatePct, netWorth: getNetWorth().net,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, budgets, goals, accounts, streaks, savingsRatePct],
  )

  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-glow">
          <Trophy size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Achievements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Streaks, XP &amp; badges for staying on top of your money
          </p>
        </div>
      </motion.div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Level / XP */}
        <motion.div variants={fadeUp} className="card card-hover p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-violet-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Level {level.level}</h2>
          </div>
          <p className="text-lg font-bold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
            {level.title}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-3 tabular-nums">
            {Math.round(level.xp).toLocaleString('en-IN')} XP total
          </p>
          <ProgressBar pct={level.pctToNext} gradient="bg-gradient-to-r from-violet-500 to-indigo-500" />
          <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
            {level.xpIntoLevel} / {level.xpForNextLevel} XP to level {level.level + 1}
          </p>
        </motion.div>

        {/* Current streak */}
        <motion.div variants={fadeUp} className="card card-hover p-5 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 self-start mb-2">
            <Flame size={16} className="text-orange-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Streak</h2>
          </div>
          <span className="text-4xl">{streaks.current > 0 ? '🔥' : '💤'}</span>
          <p className="text-3xl font-bold text-orange-500 tabular-nums mt-1">{streaks.current}</p>
          <p className="text-xs text-slate-400">
            day{streaks.current === 1 ? '' : 's'} in a row
            {!streaks.loggedToday && streaks.current > 0 && ' · log today to keep it!'}
          </p>
        </motion.div>

        {/* Longest streak + badge count */}
        <motion.div variants={fadeUp} className="card card-hover p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Records</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Longest streak</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tabular-nums">{streaks.longest} 🔥</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Badges earned</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {earned.length}<span className="text-sm text-slate-400">/{badges.length}</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Earned badges */}
      <motion.div variants={fadeUp}>
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Earned <span className="text-slate-400 font-normal">({earned.length})</span>
        </h2>
        {earned.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No badges yet — log a transaction to earn your first one! 👣
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {earned.map(b => <BadgeCard key={b.id} badge={b} />)}
          </div>
        )}
      </motion.div>

      {/* Locked badges */}
      {locked.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
            In Progress <span className="text-slate-400 font-normal">({locked.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {locked.map(b => <BadgeCard key={b.id} badge={b} />)}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  const pct = badge.target > 0 ? (badge.current / badge.target) * 100 : 0
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`card p-4 text-center ${badge.earned ? '' : 'opacity-80'}`}
    >
      <div
        className={`text-3xl mb-2 ${badge.earned ? '' : 'grayscale opacity-50'}`}
      >
        {badge.emoji}
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{badge.name}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2 leading-snug">{badge.description}</p>
      {badge.earned ? (
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          ✓ Unlocked
        </span>
      ) : (
        <>
          <ProgressBar pct={pct} gradient="bg-gradient-to-r from-amber-400 to-orange-500" />
          <p className="text-[10px] text-slate-400 mt-1 tabular-nums">{badge.current} / {badge.target}</p>
        </>
      )}
    </motion.div>
  )
}
