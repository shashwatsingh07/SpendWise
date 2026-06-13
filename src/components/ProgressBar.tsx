/** Animated progress fill — grows from 0 to pct% on mount. Shared across pages. */
import { motion } from 'framer-motion'
import { EASE } from '../lib/motion'

interface Props {
  pct: number
  gradient?: string // tailwind gradient classes (e.g. from getProgressGradient)
  color?: string // solid hex → gradient is derived
  height?: string // tailwind height class
  delay?: number
}

export function ProgressBar({ pct, gradient, color, height = 'h-1.5', delay = 0.25 }: Props) {
  return (
    <div className={`${height} bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden`}>
      <motion.div
        className={`h-full rounded-full ${gradient ?? ''}`}
        style={color ? { background: `linear-gradient(90deg, ${color}, ${color}aa)` } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      />
    </div>
  )
}
