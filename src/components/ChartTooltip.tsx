/**
 * GlassTooltip — a dark frosted tooltip shared across all Recharts charts,
 * replacing the default white box (which is unreadable on the dark theme).
 */
import { formatCurrencyFull } from '../lib/utils'

interface Props {
  active?: boolean
  payload?: any[]
  label?: string | number
  sym?: string
}

export function GlassTooltip({ active, payload, label, sym = '₹' }: Props) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs shadow-glass backdrop-blur-xl">
      {label !== undefined && label !== '' && (
        <p className="mb-1 font-medium text-slate-400">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color || p.payload?.color || p.fill }}
            />
            <span className="text-slate-300">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-white">
              {formatCurrencyFull(p.value, sym)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
