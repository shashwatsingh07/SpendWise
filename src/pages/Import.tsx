import { useState, useRef } from 'react'
import { UploadCloud, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle, ClipboardPaste, Undo2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { readFileAsText } from '../lib/fileReader'
import { parseStatement } from '../lib/aiParser'
import { rememberBatch } from '../lib/merchantMemory'
import { ImportPreview } from '../components/ImportPreview'
import { ParsedTransaction } from '../types'

type Stage = 'upload' | 'parsing' | 'preview' | 'done'

export default function Import() {
  const { settings, bulkAddTransactions, isDuplicate, undoLastImport } = useStore()
  const [stage, setStage] = useState<Stage>('upload')
  const [rows, setRows] = useState<ParsedTransaction[]>([])
  const [usedAI, setUsedAI] = useState(false)
  const [fileType, setFileType] = useState<'csv' | 'pdf' | 'paste'>('csv')
  const [error, setError] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [undone, setUndone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const handleText = async (text: string) => {
    if (!text.trim()) { setError('That file looks empty.'); return }
    setStage('parsing')
    setError('')
    try {
      const { rows: parsed, usedAI } = await parseStatement(text, { apiKey: settings.aiApiKey })
      if (parsed.length === 0) {
        setError('Could not find any transactions. Try a CSV export, or paste the text manually.')
        setStage('upload')
        return
      }
      // flag duplicates against existing data
      const flagged = parsed.map(r => ({
        ...r,
        duplicate: isDuplicate(r.amount, r.date, r.merchant),
      }))
      setRows(flagged)
      setUsedAI(usedAI)
      setStage('preview')
    } catch (e) {
      setError('Something went wrong while reading the file. Try CSV or paste mode.')
      setStage('upload')
    }
  }

  const handleFile = async (file: File) => {
    setError('')
    setFileType(file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv')
    try {
      const text = await readFileAsText(file)
      await handleText(text)
    } catch {
      setError('Could not read that file. Supported: CSV, TXT, PDF.')
      setStage('upload')
    }
  }

  const confirmImport = () => {
    const selected = rows.filter(r => r.selected)
    const count = bulkAddTransactions(
      selected.map(r => ({
        type: r.type,
        amount: r.amount,
        currency: settings.currency,
        category: r.category,
        merchant: r.merchant,
        note: r.note,
        date: r.date,
        tags: [],
        isRecurring: false,
        taxDeductible: false,
        importSource: fileType,
      }))
    )
    // teach merchant memory from confirmed expense rows
    rememberBatch(
      selected
        .filter(r => r.type === 'expense')
        .map(r => ({ merchant: r.merchant, category: r.category }))
    )
    setImportedCount(count)
    setStage('done')
  }

  const reset = () => {
    setRows([])
    setError('')
    setPasteText('')
    setPasteMode(false)
    setUndone(false)
    setStage('upload')
  }

  const undo = () => {
    undoLastImport()
    setUndone(true)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UploadCloud size={24} className="text-violet-600" />
          Import Statement
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a bank / GPay / Paytm statement (CSV, TXT or PDF) and SpendWise will
          extract and categorise your transactions{settings.aiApiKey ? ' with AI' : ''}.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-xl">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Upload stage */}
      {stage === 'upload' && !pasteMode && (
        <>
          <div
            onClick={() => fileInput.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
            className={`card cursor-pointer border-2 border-dashed transition-all p-12 text-center ${
              dragOver ? 'border-violet-400 bg-violet-50/50 scale-[1.01]' : 'border-slate-200 hover:border-violet-300'
            }`}
          >
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.txt,.pdf,text/csv,text/plain,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4">
              <UploadCloud size={26} className="text-white" />
            </div>
            <p className="font-medium text-slate-700">Drop your statement here, or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">CSV, TXT or PDF — up to a few thousand transactions</p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button onClick={() => setPasteMode(true)} className="btn-ghost flex items-center gap-2">
              <ClipboardPaste size={15} /> Paste text instead
            </button>
          </div>

          {/* AI status hint */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            {settings.aiApiKey ? (
              <><Sparkles size={13} className="text-violet-500" /> AI parsing enabled — handles messy PDF statements</>
            ) : (
              <><AlertCircle size={13} className="text-amber-500" /> Add a Claude API key in Settings for smarter PDF parsing. CSV works without it.</>
            )}
          </div>
        </>
      )}

      {/* Paste stage */}
      {stage === 'upload' && pasteMode && (
        <div className="card p-5">
          <label className="label">Paste your statement rows (CSV or copied table)</label>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={'Date, Description, Amount\n12/06/2026, Swiggy order, 450\n11/06/2026, Salary, -75000'}
            className="input font-mono text-xs h-48 resize-none"
          />
          <div className="flex items-center justify-end gap-3 mt-4">
            <button onClick={reset} className="btn-ghost">Back</button>
            <button onClick={() => { setFileType('paste'); handleText(pasteText) }} disabled={!pasteText.trim()} className="btn-primary disabled:opacity-50">
              Parse
            </button>
          </div>
        </div>
      )}

      {/* Parsing stage */}
      {stage === 'parsing' && (
        <div className="card p-12 text-center">
          <Loader2 size={32} className="mx-auto text-violet-600 animate-spin mb-4" />
          <p className="font-medium text-slate-700">
            {settings.aiApiKey ? 'AI is reading your statement…' : 'Reading your statement…'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Extracting dates, amounts and merchants</p>
        </div>
      )}

      {/* Preview stage */}
      {stage === 'preview' && (
        <ImportPreview
          rows={rows}
          usedAI={usedAI}
          onChange={setRows}
          onConfirm={confirmImport}
          onCancel={reset}
        />
      )}

      {/* Done stage */}
      {stage === 'done' && !undone && (
        <div className="card p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-4" />
          <p className="font-semibold text-slate-800 text-lg">{importedCount} transactions imported!</p>
          <p className="text-sm text-slate-500 mt-1">
            They're now in your transactions and dashboard. SpendWise also remembered these
            merchants, so your next import will auto-categorise them.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={undo} className="btn-ghost flex items-center gap-2 text-rose-600">
              <Undo2 size={15} /> Undo this import
            </button>
            <button onClick={reset} className="btn-primary flex items-center gap-2">
              <FileText size={15} /> Import another
            </button>
          </div>
        </div>
      )}

      {/* Undone confirmation */}
      {stage === 'done' && undone && (
        <div className="card p-12 text-center">
          <Undo2 size={36} className="mx-auto text-slate-400 mb-4" />
          <p className="font-semibold text-slate-800 text-lg">Import undone</p>
          <p className="text-sm text-slate-500 mt-1">
            Those {importedCount} transactions were removed. Your records are back to how they were.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={reset} className="btn-primary flex items-center gap-2">
              <FileText size={15} /> Import again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
