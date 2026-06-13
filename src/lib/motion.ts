/**
 * Shared framer-motion variants & easings for the UI overhaul.
 * Import these instead of redefining transitions per component.
 */
import type { Variants, Transition } from 'framer-motion'

// Signature ease — a soft, premium "ease-out-quint"
export const EASE = [0.16, 1, 0.3, 1] as const

export const spring: Transition = { type: 'spring', stiffness: 320, damping: 30 }
export const springSoft: Transition = { type: 'spring', stiffness: 200, damping: 26 }

/** Parent: cascades its children in. Pair with `fadeUp` on each child. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
}

/** Child: fade + rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

/** Child: fade + scale (cards, tiles). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
}

/** Modal content entrance. */
export const modalPop: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
}

/** Route/page content transition. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}
