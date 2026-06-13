import { ParsedTransaction } from '../types'
import { DEFAULT_CATEGORIES } from '../data/categories'
import { useStore } from '../store/useStore'
import { formatCurrencyFull } from '../lib/utils'
import { Check, AlertTriangle, Trash2, Sparkles } from 'lucide-react'

interface Props {
  rows: ParsedTransaction[]
  usedAI: boolean
  onChange: (rows: ParsedTransaction[]) => void
  onConfirm: () => void
  onCancel: () => void
}

export function ImportPreview({ rows, usedAI, onChange, onConfirm, onCancel }: Props) {
  const { settings } = useStore()
  const sym = settings.currencySymbol

  const selectedRows = rows.filter(r => r.selected)
  const selectedTotal = selectedRows.reduce(
    (s, r) => s + (r.type === 'expense' ? -r.amount : r.amount),
    0
  )
  const dupCount = rows.filter(r => r.duplicate).length

  const update = (id: string, patch: Partial<ParsedTransaction>) =>
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)))

  const remove = (id: string) => onChange(rows.filter(r => r.id !== id))

  const toggleAll = (val: boolean) =>
    onChange(rows.map(r => ({ ...r, selected: val })))

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{rows.length}</span>
          <span className="text-slate-500 dark:text-slate-400">transactions found</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-violet-600 dark:text-violet-300 tabular-nums">{selectedRows.length}</span>
          <span className="text-slate-500 dark:text-slate-400">selected</span>
        </div>
        {dupCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-3 py-1 rounded-full">
            <AlertTriangle size={13} />
            {dupCount} possible duplicate{dupCount > 1 ? 's' : ''}
          </div>
        )}
        {usedAI && (
          <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 px-3 py-1 rounded-full">
            <Sparkles size={12} /> AI-parsed
          </div>
        )}
        <div className="ml-auto text-sm">
          <span className="text-slate-500 dark:text-slate-400 mr-2">Net:</span>
          <span className={`font-semibold tabular-nums ${selectedTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {selectedTotal >= 0 ? '+' : '-'}{formatCurrencyFull(Math.abs(selectedTotal), sym)}
          </span>
        </div>
      </div>

      {/* Bulk toggles */}
      <div className="flex items-center gap-3 text-xs">
        <button onClick={() => toggleAll(true)} className="text-violet-600 dark:text-violet-300 hover:underline">Select all</button>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <button onClick={() => toggleAll(false)} className="text-slate-500 dark:text-slate-400 hover:underline">Deselect all</button>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <button
          onClick={() => onChange(rows.map(r => r.duplicate ? { ...r, selected: false } : r))}
          className="text-amber-600 dark:text-amber-300 hover:underline"
        >
          Skip duplicates
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="max-h-[52vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur border-b border-slate-100 dark:border-white/10 text-left text-xs text-slate-400">
              <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3">Date</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const cats = DEFAULT_CATEGORIES.filter(c =>
                  r.type === 'income' ? c.type !== 'expense' : c.type !== 'income'
                )
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-slate-50 dark:border-white/[0.06] last:border-0 transition-colors ${
                      r.selected ? '' : 'opacity-40'
                    } ${r.duplicate ? 'bg-amber-50/40 dark:bg-amber-500/10' : 'hover:bg-slate-50/60 dark:hover:bg-white/5'}`}
                  >
                    <td className="p-3">
                      <button
                        onClick={() => update(r.id, { selected: !r.selected })}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          r.selected
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-300 dark:border-white/20'
                        }`}
                      >
                        {r.selected && <Check size={13} />}
                      </button>
                    </td>
                    <td className="p-3">
                      <input
                        type="date"
                        value={r.date.slice(0, 10)}
                        onChange={e => update(r.id, { date: new Date(e.target.value).toISOString() })}
                        className="bg-transparent text-slate-600 dark:text-slate-300 text-xs focus:outline-none [color-scheme:dark]"
                      />
                    </td>
                    <td className="p-3 max-w-[220px]">
                      <input
                        value={r.merchant}
                        onChange={e => update(r.id, { merchant: e.target.value })}
                        className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-violet-300 rounded px-1"
                      />
                      {r.duplicate && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-300">already in your records</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={r.category}
                        onChange={e => update(r.id, { category: e.target.value })}
                        className="bg-transparent text-slate-600 dark:text-slate-300 dark:[&>option]:bg-slate-800 text-xs focus:outline-none cursor-pointer"
                      >
                        {cats.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`tabular-nums ${r.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {r.type === 'expense' ? '-' : '+'}{formatCurrencyFull(r.amount, sym)}
                      </span>
                      <button
                        onClick={() => update(r.id, { type: r.type === 'expense' ? 'income' : 'expense' })}
                        className="block ml-auto text-[10px] text-slate-400 hover:text-violet-600 dark:hover:text-violet-300"
                      >
                        {r.type === 'expense' ? 'mark income' : 'mark expense'}
                      </button>
                    </td>
                    <td className="p-3">
                      <button onClick={() => remove(r.id)} className="text-slate-300 dark:text-slate-600 hover:text-rose-500">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button
          onClick={onConfirm}
          disabled={selectedRows.length === 0}
          className="btn-primary disabled:opacity-50 flex items-center gap-2"
        >
          <Check size={16} />
          Import {selectedRows.length} transaction{selectedRows.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  )
}
