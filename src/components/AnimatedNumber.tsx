/**
 * AnimatedNumber — counts up from 0 to `value` on mount / when value changes,
 * formatting each frame. Smoother than a RAF hook and reusable across cards.
 */
import { useEffect } from 'react'
import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { EASE } from '../lib/motion'

interface Props {
  value: number
  format?: (v: number) => string
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, format = v => `${Math.round(v)}`, duration = 1, className }: Props) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, v => format(v))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: EASE })
    return controls.stop
  }, [value, duration, mv])

  return <motion.span className={className}>{text}</motion.span>
}
