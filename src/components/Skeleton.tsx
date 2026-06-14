import { cn } from '../lib/utils'

/**
 * Shimmer skeleton block. Pairs the `.shimmer` sweep (Tailwind `animate-shimmer`)
 * over a muted base so it reads as a loading placeholder in both themes.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-lg bg-slate-200/70 dark:bg-white/[0.06]',
        className,
      )}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}
