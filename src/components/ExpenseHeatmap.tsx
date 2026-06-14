import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useStore } from '../store/useStore'
import { formatCurrencyFull } from '../lib/utils'

const WEEKS = 18 // ~4 months of history
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

interface Day {
  date: Date
  amount: number
  future: boolean
}

/** Spend intensity bucket 0–4 relative to the busiest day in range. */
function level(amount: number, max: number): number {
  if (amount <= 0) return 0
  const r = amount / max
  if (r > 0.66) return 4
  if (r > 0.33) return 3
  if (r > 0.12) return 2
  return 1
}

const LEVEL_BG = [
  'rgba(139,92,246,0.28)',
  'rgba(139,92,246,0.45)',
  'rgba(139,92,246,0.65)',
  'rgba(139,92,246,0.9)',
]

export function ExpenseHeatmap() {
  const { transactions, settings } = useStore()
  const sym = settings.currencySymbol

  const { weeks, max, monthCols } = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      if (t.type !== 'expense') return
      const key = t.date.slice(0, 10)
      map[key] = (map[key] ?? 0) + t.amount
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // End the grid on the Saturday of the current week so columns stay aligned.
    const end = new Date(today)
    end.setDate(end.getDate() + (6 - end.getDay()))
    const start = new Date(end)
    start.setDate(start.getDate() - (WEEKS * 7 - 1))

    const days: Day[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = format(d, 'yyyy-MM-dd')
      days.push({ date: new Date(d), amount: map[key] ?? 0, future: d > today })
    }

    const max = Math.max(1, ...days.map(d => d.amount))

    const weeks: Day[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    // Month label appears above the first column where a new month begins.
    const monthCols: { col: number; label: string }[] = []
    let lastMonth = -1
    weeks.forEach((week, col) => {
      const firstDay = week[0].date
      const month = firstDay.getMonth()
      if (month !== lastMonth) {
        monthCols.push({ col, label: format(firstDay, 'MMM') })
        lastMonth = month
      }
    })

    return { weeks, max, monthCols }
  }, [transactions])

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* Month labels */}
          <div className="flex gap-1 ml-9 h-4">
            {weeks.map((_, col) => {
              const m = monthCols.find(mc => mc.col === col)
              return (
                <div key={col} className="w-3.5 text-[10px] text-slate-400 dark:text-slate-500 relative">
                  {m && <span className="absolute left-0 whitespace-nowrap">{m.label}</span>}
                </div>
              )
            })}
          </div>

          {/* Grid: weekday labels + 7×WEEKS cells */}
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 w-8 pr-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="h-3.5 text-[10px] text-slate-400 dark:text-slate-500 leading-[14px] text-right">
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-1">
                {week.map((day, row) => {
                  const lvl = level(day.amount, max)
                  const idx = col * 7 + row
                  return (
                    <motion.div
                      key={row}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: day.future ? 0.25 : 1, scale: 1 }}
                      transition={{ delay: Math.min(idx * 0.0015, 0.5), duration: 0.25 }}
                      title={
                        day.future
                          ? format(day.date, 'EEE, dd MMM')
                          : `${format(day.date, 'EEE, dd MMM yyyy')} · ${formatCurrencyFull(day.amount, sym)}`
                      }
                      className={`w-3.5 h-3.5 rounded-[3px] border border-black/[0.03] dark:border-white/[0.04] ${
                        lvl === 0 ? 'bg-slate-100 dark:bg-white/[0.05]' : ''
                      }`}
                      style={lvl === 0 ? undefined : { backgroundColor: LEVEL_BG[lvl - 1] }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        <span className="w-3.5 h-3.5 rounded-[3px] bg-slate-100 dark:bg-white/[0.05]" />
        {LEVEL_BG.map((bg, i) => (
          <span key={i} className="w-3.5 h-3.5 rounded-[3px]" style={{ backgroundColor: bg }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
