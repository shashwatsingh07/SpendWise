# SpendWise 💸

> Zero-manual-entry personal finance tracker built for India — GPay, Paytm, UPI, and all major banks.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)

---

## What is SpendWise?

SpendWise is a privacy-first expense tracker that works the way Indian users actually spend — via UPI, GPay, Paytm, and bank statements. The goal: **pay and forget** — your transactions show up automatically with zero manual entry.

---

## Features

### ✅ Phase 1 — Smart Statement Import (Done)
- Upload bank statements as **CSV, TXT, or PDF** (drag-and-drop or paste)
- **AI-powered parser** using Claude API — handles messy PDF text, no-header formats
- **Heuristic fallback** — works without an API key for clean CSV exports
- Correctly parses **Indian date formats** (dd/mm/yyyy), ₹ amounts, debit/credit hints
- **Merchant memory** — remembers which category you filed a merchant under; auto-categorises on next import
- **Duplicate detection** — flags transactions already in your records
- **Undo import** — one-click rollback of the last import batch
- Seed list of 50+ Indian merchants pre-categorised (Swiggy, Zomato, Ola, IRCTC, Zepto, etc.)
- Supports HDFC, SBI, ICICI, Axis, GPay, Paytm statement formats

### ✅ Phase 2 — SMS Auto-Import (Logic + UI Done)
- On app open, scans bank/UPI SMS and surfaces an **"X new transactions found"** banner → one-tap review & import
- **Robust SMS parser** across SBI, HDFC, ICICI, Axis, Kotak, Paytm, PhonePe & GPay — extracts amount, date, merchant and debit/credit direction
- Ignores the noise — **OTPs, balance enquiries, and promo messages** are filtered out (a message must carry both an amount *and* a debit/credit verb)
- **UPI ID mapper** — decodes VPAs like `swiggy@okhdfcbank` → *Swiggy*, and learns your VPAs over time
- Reuses the Phase 1 **review-before-import** flow, duplicate detection, and merchant memory
- **Won't re-import** the same SMS twice (fingerprint dedupe)
- Native bridge is **web-safe** — runs as a demo in the browser, real inbox inside the Android app
- ⏳ *Remaining:* packaging the signed Android APK — see **[ANDROID.md](ANDROID.md)**

### 🏠 Core App
- **Dashboard** — 6-month spend chart, budget alerts, savings goal progress, recent transactions
- **Transactions** — full list with search, filter, mood tracking
- **Analytics** — category pie chart, monthly income/expense bars, mood analysis
- **Budgets** — per-category limits with alert thresholds
- **Goals** — savings goals with progress tracking
- **AI Assistant** — ask questions about your spending (requires Claude API key)
- **Dark mode** + INR/multi-currency support

### 🔜 Coming Soon
- **Phase 3** — Live bank feed via Setu / Finvu Account Aggregator (RBI-licensed)
- **Phase 4** — AI enrichment: decode cryptic descriptions, spend pattern alerts, receipt OCR
- **Phase 5** — WhatsApp bot, split bill tracker, tax slab estimator, net worth tracker

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (persisted to localStorage) |
| Charts | Recharts |
| PDF parsing | pdfjs-dist v4 |
| AI parsing | Claude API (optional) |
| Build | Vite 5 (code-split: main 166kB) |
| Mobile | Capacitor (Android) — see [ANDROID.md](ANDROID.md) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Optional: Enable AI Parsing

For smarter PDF statement parsing (messy formats, scanned statements), add a Claude API key in **Settings → AI API Key**. Works with any Anthropic API key.

---

## Project Structure

```
src/
├── components/
│   ├── ImportPreview.tsx    # Confirm table before bulk import
│   ├── SmsImportBanner.tsx  # [P2] "X new transactions found" banner
│   ├── Layout.tsx           # Nav + app shell
│   └── TransactionModal.tsx
├── lib/
│   ├── aiParser.ts          # Heuristic + Claude AI statement parser
│   ├── fileReader.ts        # CSV/TXT/PDF → plain text
│   ├── merchantMemory.ts    # Merchant → category learning (localStorage)
│   ├── bankPatterns.ts      # [P2] Bank/UPI SMS → transactions
│   ├── upiMapper.ts         # [P2] VPA → merchant name + learning
│   ├── smsBridge.ts         # [P2] Capacitor SMS bridge (web-safe)
│   └── utils.ts
├── hooks/
│   └── useSmsSync.ts        # [P2] read → parse → dedupe → import
├── pages/
│   ├── Dashboard.tsx
│   ├── Import.tsx           # Upload/parse/confirm flow
│   ├── Transactions.tsx
│   ├── Analytics.tsx
│   ├── Budgets.tsx
│   ├── Goals.tsx
│   ├── AIAssistant.tsx
│   └── Settings.tsx
├── store/
│   └── useStore.ts          # Zustand store (transactions, budgets, goals, settings)
├── types/
│   └── index.ts
└── data/
    ├── categories.ts
    ├── sampleData.ts
    └── sampleSms.ts         # [P2] Demo SMS for browser testing
```

> `[P2]` = Phase 2 (SMS auto-import). Native build config lives in
> `capacitor.config.ts`; see **[ANDROID.md](ANDROID.md)**.

---

## Roadmap

```
✅ Phase 1  — PDF/CSV import + AI parser
✅ Phase 2  — SMS auto-import + UPI mapper (logic + UI; APK packaging pending)
⏳ Phase 3  — Live bank feed (Account Aggregator)
⏳ Phase 4  — AI enrichment + receipt OCR
⏳ Phase 5  — WhatsApp bot, split bills, tax estimator
```

---

## License

MIT
