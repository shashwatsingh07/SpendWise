import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#a78bfa', '#22d3ee', '#34d399', '#fb7185', '#f59e0b', '#e879f9']

/**
 * One-shot confetti burst. Render it conditionally (e.g. on a success screen);
 * it animates once and then sits idle. Skipped entirely under reduced-motion.
 */
export function Confetti({ count = 44 }: { count?: number }) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600, // horizontal drift
        rot: Math.random() * 720 - 360,
        delay: Math.random() * 0.25,
        duration: 1.6 + Math.random() * 1.2,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
      })),
    [count],
  )

  if (reduced) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <div className="absolute left-1/2 top-24 -translate-x-1/2">
        {pieces.map(p => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: 520, opacity: 0, rotate: p.rot }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size * (p.round ? 1 : 1.6),
              backgroundColor: p.color,
              borderRadius: p.round ? '9999px' : '2px',
            }}
          />
        ))}
      </div>
    </div>
  )
}
