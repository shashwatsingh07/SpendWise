# SpendWise — Project Context

> Hand this file to any developer or AI assistant to get full context on the project.
> Last updated: 2026-06-13

---

## What Is SpendWise

A personal finance tracker built for India. INR-first, UPI/GPay/SMS-aware. Core goal: **zero manual entry** — import from bank statements, SMS, or eventually live bank feeds. Competes with Walnut, ET Money, Money Manager but targets deeper Indian-context automation.

Owner: Shashwat Singh (shashwats813@gmail.com)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| State | Zustand (persisted to localStorage via `zustand/middleware`) |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Animation | Framer Motion |
| PDF parsing | pdfjs-dist |
| Build | Vite |
| IDs | uuid v4 |

No backend yet. Everything runs in the browser. Data persists in `localStorage` under key `spendwise-store`.

---

## File Structure

```
src/
├── App.tsx                    # Routes + Layout wrapper
├── main.tsx                   # Entry point
├── index.css                  # Tailwind base
├── vite-env.d.ts
│
├── types/
│   └── index.ts               # All shared types (see below)
│
├── store/
│   └── useStore.ts            # Zustand store — single source of truth
│
├── data/
│   ├── categories.ts          # DEFAULT_CATEGORIES array (id, name, icon, color, type)
│   ├── sampleData.ts          # Sample transactions/budgets/goals for first load
│   └── sampleSms.ts           # [P2] Demo bank/UPI SMS for browser testing
│
├── lib/
│   ├── aiParser.ts            # Statement parser (heuristic + Claude AI path)
│   ├── fileReader.ts          # File → text extraction (CSV, TXT, PDF via pdfjs)
│   ├── merchantMemory.ts      # Learns merchant→category mappings; guessCategory()
│   ├── bankPatterns.ts        # [P2] Bank/UPI SMS → ParsedTransaction (parseSmsMessages)
│   ├── upiMapper.ts           # [P2] VPA → merchant name + learned VPA map
│   ├── smsBridge.ts           # [P2] Capacitor SMS-inbox bridge (web-safe no-op)
│   └── utils.ts               # formatCurrency, formatDateShort, getLast6Months, etc.
│
├── hooks/
│   └── useSmsSync.ts          # [P2] Read SMS → parse → dedupe → confirm/dismiss
│
├── pages/
│   ├── Dashboard.tsx          # Overview: income/expense cards, area chart, recent txns, budget alerts
│   ├── Transactions.tsx       # Full transaction list with filter/search/edit/delete
│   ├── Import.tsx             # Upload/paste/dropzone → parse → preview → confirm
│   ├── Analytics.tsx          # Category breakdown, trends
│   ├── Budgets.tsx            # Budget CRUD + usage progress bars
│   ├── Goals.tsx              # Savings goals CRUD + progress
│   ├── AIAssistant.tsx        # Chat interface for AI-powered insights
│   └── Settings.tsx           # Currency, name, Claude API key, dark mode
│
└── components/
    ├── Layout.tsx             # Sidebar nav + page shell (mounts SmsImportBanner)
    ├── ImportPreview.tsx      # Confirm-before-import table (select/deselect rows)
    ├── SmsImportBanner.tsx    # [P2] "X new transactions found" banner → ImportPreview
    └── TransactionModal.tsx   # Add/edit transaction modal
```

`[P2]` = Phase 2 (SMS auto-import). Root also has `capacitor.config.ts` for the
Android wrapper. See `ANDROID.md` for building the APK.

---

## Core Types (`src/types/index.ts`)

```ts
Transaction {
  id, type ('expense'|'income'), amount, currency, category, merchant?,
  note?, date (ISO), tags[], mood?, isRecurring, recurringInterval?,
  receiptUrl?, taxDeductible, splitWith?, importSource?, createdAt
}

ParsedTransaction {               // Staging row before user confirms import
  id, date, amount, type, category, merchant, note?, rawText?,
  confidence (0–1), selected, duplicate
}

ImportSource = 'manual' | 'csv' | 'pdf' | 'paste' | 'sms' | 'bank'

Budget { id, category, limit, period ('monthly'|'weekly'), alertAt (%) }

SavingsGoal { id, name, icon, targetAmount, currentAmount, targetDate, color, createdAt }

AppSettings { currency, currencySymbol, darkMode, aiApiKey, monthlyIncome, name }
```

---

## Zustand Store (`src/store/useStore.ts`)

Key actions:
- `addTransaction(t)` — add one
- `bulkAddTransactions(ts[])` — add many, stores their IDs in `lastImportIds`
- `undoLastImport()` — removes all transactions from the last bulk import
- `isDuplicate(amount, date, merchant?)` — same day + same amount (+ merchant if known)
- `updateTransaction / deleteTransaction`
- `addBudget / updateBudget / deleteBudget`
- `addGoal / updateGoal / deleteGoal`
- `updateSettings`
- Computed: `getMonthlyExpenses(y, m)`, `getMonthlyIncome(y, m)`, `getCategorySpend(catId, y, m)`, `getBudgetUsage(budgetId)`

Persisted keys: `transactions`, `budgets`, `categories`, `goals`, `settings`, `lastImportIds`

---

## Import Pipeline (`src/lib/aiParser.ts`)

Two-path parser triggered from `Import.tsx`:

1. **Heuristic** (`parseHeuristic`) — pure JS, no network.
   - Detects CSV delimiter (`,` `\t` `;` `|`)
   - Maps header columns: date, description, amount, debit, credit
   - Falls back to `parseLoose()` for unstructured PDF-extracted text (finds date + money per line)
   - Date parsing: ISO → dd/mm/yyyy (Indian default) → dd-Mon-yyyy

2. **AI** (`parseWithAI`) — hits Claude Haiku API if user has set an API key in Settings.
   - Sends up to 12 000 chars of raw text
   - Gets back clean JSON rows with merchant names decoded ("SWGY*1234" → "Swiggy")
   - Falls back to heuristic on failure

Entry point: `parseStatement(text, { apiKey?, preferAI? })` → `{ rows: ParsedTransaction[], usedAI: boolean }`

`fileReader.ts` handles file → text: CSV/TXT = plain text read, PDF = pdfjs text extraction.

`merchantMemory.ts` maintains a learned map of merchant keywords → category IDs (`guessCategory(merchant)`), and `rememberBatch()` updates the map after a confirmed import.

### SMS path (Phase 2)

`bankPatterns.parseSmsMessages(SmsMessage[])` is a **second, independent entry
point** (parallel to `parseStatement`) tuned for one-line bank/UPI SMS rather
than multi-row statements. It returns the same `ParsedTransaction[]`, so the
whole downstream flow (`ImportPreview`, dedupe, `bulkAddTransactions`) is reused
unchanged. `useSmsSync` orchestrates read → parse → dedupe → confirm. See
`ANDROID.md`.

Extra localStorage keys (separate from the main store, like merchantMemory):
`spendwise-upi-map` (learned VPA → name), `spendwise-sms-processed`
(fingerprints of handled rows), `spendwise-sms-lastsync` (last scan time).

---

## What's Done ✅

### Phase 1 — PDF/CSV Upload + AI Parsing (COMPLETE — 2026-06-13)

- `Import.tsx`: drag-and-drop / file picker / paste mode; upload → parsing spinner → preview → confirm
- `ImportPreview.tsx`: table with per-row select toggle, duplicate badge, confidence indicator, undo button
- `aiParser.ts`: full heuristic + AI dual-path parser
- `merchantMemory.ts`: learns merchant→category from confirmed imports
- `fileReader.ts`: CSV + PDF text extraction
- Store: `bulkAddTransactions`, `undoLastImport`, `isDuplicate`, `lastImportIds`
- Types: `ImportSource`, `ParsedTransaction` fully wired
- Bug fixes: dd/mm/yyyy date order (Indian), `parseLoose()` fallback for PDF text, `importSource` tracks actual file type
- Bundle: Vite `manualChunks` → main chunk ~154 kB

### Core App (COMPLETE)

- Dashboard with 6-month area chart, budget alerts, recent transactions, savings goals
- Full Transactions page: list, search, filter by category/type/date, edit modal, delete
- Budgets page: CRUD, usage % progress bars, alert threshold
- Goals page: CRUD, progress bars, target date
- AI Assistant page: chat UI shell (ready to wire up)
- Settings: name, currency, Claude API key, dark mode toggle
- Persistent state (localStorage), sample data on first load

---

## What's Next ⏳

### Phase 2 — SMS Auto-Import (Android) (LOGIC + UI COMPLETE — 2026-06-13)

Goal: On app open, scan device SMS for bank/UPI messages, show "X new transactions found" banner, one-tap import.

**Done (fully testable in the browser via demo SMS, `import.meta.env.DEV` only):**
- `bankPatterns.ts` — single robust extractor across SBI/HDFC/ICICI/Axis/Kotak/Paytm/PhonePe/GPay: debit/credit classification, amount, date (falls back to SMS received time), merchant/VPA, sender→bank label, account tail. Filters OTP / balance / promo noise. Verified 7/7 on the sample set.
- `upiMapper.ts` — VPA → merchant (`swiggy@okhdfcbank` → Swiggy), learns confirmed VPAs, PSP-handle decoding (ybl→PhonePe, oksbi→SBI …).
- `smsBridge.ts` — talks to a registered `SmsInbox` Capacitor plugin; web-safe (returns []/false, never throws). Permission helpers included.
- `useSmsSync.ts` — read → parse → drop already-processed + existing-duplicate → expose `pending` + `confirm`/`dismiss`. Imports with `importSource: 'sms'`, teaches merchant + VPA memory. Processed-fingerprint tracking stops a row resurfacing.
- `SmsImportBanner.tsx` — app-wide banner (mounted in Layout) → reuses `ImportPreview` in a modal.
- `capacitor.config.ts` added; `READ_SMS` flow wired through `smsBridge`.

**Remaining (needs Android Studio / SDK on the dev machine — can't be done from the web build):**
1. `npx cap add android`, install an SMS-reader plugin, register it as `SmsInbox`, add `READ_SMS` to `AndroidManifest.xml`. See `ANDROID.md`.
2. Build + sideload the APK; test against real device SMS.

Add-on (DONE): **UPI ID mapper** — `upiMapper.ts`, learns `@oksbi` etc. → real merchant name.

### Phase 3 — Account Aggregator / Live Bank Feed

- Integrate Setu AA or Finvu (both RBI-licensed, free sandbox)
- Node/Express backend (Railway or Render) to hold AA client secret
- Bank OAuth consent UI
- Webhook → store transactions in real time
- Add-ons: salary day detection, recurring transaction auto-detection (field `isRecurring` already in type), export to Excel/PDF

### Phase 4 — AI Enrichment Layer

- Decode cryptic bank descriptions ("NEFT/CR/SWGY*12345" → Swiggy / Food)
- Spend pattern alerts ("3× more on UPI this month vs last")
- Duplicate detection (same amount + merchant within 24h)
- Wire up AIAssistant.tsx to real Claude API for Q&A ("how much did I spend on food in May?")
- Add-ons: receipt photo OCR (Claude vision), voice entry (Web Speech API), weekly digest notification, net worth tracker (FD/MF/gold/crypto), tax slab estimator (old vs new regime, 80C / HRA)

### Phase 5 — Advanced / Later

- WhatsApp bot: "spent 450 on Swiggy" → adds transaction (Twilio)
- Split bill tracker: paid for group, tracks who owes you
- Peer benchmark: anonymised "you spend 40% more on food than similar users"
- Android home-screen quick-add widget (Capacitor plugin)

---

## Unique Differentiators vs Walnut / ET Money / Money Manager

1. **Indian-first SMS parser** — real bank regex, not generic
2. **AI statement parsing** — drag a PDF, get clean transactions (not just CSV import)
3. **Merchant memory** — learns your patterns across imports
4. **Tax-aware** — `taxDeductible` flag, 80C/HRA estimator planned
5. **Mood tagging** — emotional context on spending (happy / stressed / impulsive)
6. **Split bill tracking** — `splitWith[]` field already in Transaction type
7. **UPI ID mapper** — decodes `@oksbi` handles to real names
8. **Account Aggregator** — RBI-licensed live feed, not screen scraping

---

## Running Locally

```bash
cd SpendWise
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/
```

To enable AI parsing: go to Settings → paste a Claude API key (claude-haiku-4-5 is used).

---

## Key Decisions & Notes

- **No backend yet** — all state in localStorage. Phase 3 adds the first backend.
- **INR default** — `currency: 'INR'`, `currencySymbol: '₹'` in settings, changeable.
- **Date format** — always stored as ISO string internally; parsed as dd/mm/yyyy from Indian bank statements.
- **Duplicate logic** — same day + same amount (+ merchant if present). Conservative: flags possible dupes for user review, doesn't auto-skip.
- **Import undo** — one level only. `lastImportIds` is overwritten on each import.
- **Category IDs** — string slugs (e.g. `food`, `transport`, `other_exp`, `other_inc`). See `src/data/categories.ts` for full list.
