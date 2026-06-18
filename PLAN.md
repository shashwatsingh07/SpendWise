# SpendWise — Complete Feature Plan & Build Roadmap

## What We're Building
A full-featured, AI-powered expense tracker that goes far beyond "add expense, see chart." SpendWise will feel like a personal finance co-pilot — proactive, intelligent, and genuinely useful.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React + TypeScript | Type safety, component reuse |
| Styling | Tailwind CSS + shadcn/ui | Fast, beautiful, consistent UI |
| Charts | Recharts | Lightweight, composable |
| State | Zustand | Simple global state, no boilerplate |
| Storage | localStorage → IndexedDB | Offline-first, no backend needed initially |
| AI | Claude API (claude-haiku-4-5) | Fast, cheap, smart for finance tasks |
| OCR | Tesseract.js | Client-side receipt scanning |
| Auth | (Phase 2) Supabase | Easy auth + cloud sync |
| Export | jsPDF + SheetJS | PDF/Excel exports |

---

## Feature Breakdown by Phase

### Phase 1 — Core (Week 1–2)
**The basics, done beautifully.**

- [ ] **Dashboard** — Net balance, monthly spend, income vs expense card
- [ ] **Add Expense** — Amount, category, date, note, payment method
- [ ] **Add Income** — Salary, freelance, other income sources
- [ ] **Categories** — 15 default categories with icons & colors (editable)
- [ ] **Transaction List** — Search, filter by date/category/type, sort
- [ ] **Edit & Delete** — Full CRUD on all transactions
- [ ] **Monthly Budget** — Set per-category budget limits
- [ ] **Budget Progress Bars** — Visual % used per category
- [ ] **Basic Charts** — Pie chart (by category), bar chart (monthly trend), line chart (balance over time)
- [ ] **Responsive Design** — Works on mobile and desktop

---

### Phase 2 — Smart Features (Week 3)
**Features that make users say "wow."**

- [ ] **Receipt Scanner** — Upload photo → Tesseract.js OCR → auto-fill amount, merchant, date
- [ ] **Recurring Expenses** — Mark transactions as daily/weekly/monthly, auto-remind
- [ ] **Subscription Tracker** — Dedicated view of all subscriptions with renewal dates & total monthly cost
- [ ] **Split Expense** — Split any expense across people, track who owes what
- [ ] **Multi-Currency** — Log in any currency, auto-convert to base currency
- [ ] **Tags** — Free-form tags on any transaction (e.g., #vacation, #work)
- [ ] **Notes & Attachments** — Attach receipt images to transactions
- [ ] **Bill Reminders** — Set reminders for upcoming bills (push notification)
- [ ] **Net Worth Tracker** — Assets + liabilities = net worth over time
- [ ] **Savings Goals** — Create goals (e.g., "MacBook — ₹80,000"), track progress
- [ ] **Tax Category Tagging** — Mark expenses as deductible, generate tax summary

---

### Phase 3 — AI Integration (Week 4)
**The intelligence layer — what makes SpendWise unique.**

- [x] **AI Chat (Finance Assistant)** — Natural language: "How much did I spend on food last month?" → instant answer
- [x] **Natural Language Input** — "Spent 500 on coffee this morning" → auto-parsed into transaction
- [x] **Smart Auto-Categorization** — AI reads merchant/note → suggests category (learns from corrections)
- [x] **Spending Insights** — Weekly AI-generated analysis: "You overspent on dining by 40% vs last month"
- [x] **Anomaly Detection** — "This ₹12,000 Amazon charge is 3x your usual. Unusual?"
- [x] **Budget Recommendations** — "Based on your income, here's an optimal budget split (50/30/20 rule)"
- [x] **Predictive Forecasting** — "At this rate, you'll overspend on entertainment by ₹2,300 this month"
- [x] **What-If Scenarios** — "If you cut Swiggy by 50%, you'd save ₹1,800/month"
- [x] **Savings Coach** — AI suggests where to cut based on your goals
- [x] **Financial Health Score** — 0–100 score based on savings rate, budget adherence, debt ratio

---

### Phase 4 — Unique Differentiators (Week 5)
**Nobody else has these.**

- [x] **Mood Tracker** — Log how you felt when spending (stressed, happy, bored) → AI finds patterns ("You overspend when stressed")
- [x] **Carbon Footprint Score** — Each category gets an eco-score; track your spending's environmental impact
- [x] **Gamification** — Streaks (log 7 days in a row), badges (First Budget, Saver of the Month), XP points
- [ ] **Leaderboard** (opt-in) — Anonymous comparison: "You spend 20% less on food than people with similar income" — *deferred: needs a backend; conflicts with the offline-first design (revisit after Step 3 cloud sync)*
- [x] **Wealth Projection** — "If you save ₹10k/month at 8% returns, you'll have ₹X in 10 years"
- [x] **AI Report Generator** — One-click PDF: monthly/yearly financial report with AI narrative
- [x] **Expense Heatmap Calendar** — Calendar view where each day is colored by spend intensity
- [x] **Smart Import** — Paste bank SMS / email statement → AI parses all transactions at once
- [x] **Merchant Intelligence** — App remembers your frequent merchants, auto-fills details
- [x] **Dark Mode + Themes** — Full dark mode + accent color picker

---

## App Structure (Pages/Routes)

```
/                   → Dashboard (overview, quick-add)
/transactions       → Full transaction list with filters
/add                → Add expense/income form
/budgets            → Budget manager
/analytics          → Charts & trends
/goals              → Savings goals
/subscriptions      → Subscription tracker
/split              → Split expense manager
/ai-chat            → AI finance assistant
/settings           → Currency, categories, export, profile
/insights           → AI-generated weekly insights
```

---

## Data Models

```typescript
// Transaction
{
  id: string
  type: 'expense' | 'income'
  amount: number
  currency: string
  category: string
  subcategory?: string
  merchant?: string
  note?: string
  date: Date
  tags: string[]
  mood?: 'happy' | 'neutral' | 'stressed' | 'impulsive'
  isRecurring: boolean
  recurringInterval?: 'daily' | 'weekly' | 'monthly'
  receiptUrl?: string
  taxDeductible?: boolean
  splitWith?: string[]
}

// Budget
{
  id: string
  category: string
  limit: number
  period: 'monthly' | 'weekly'
  alertAt: number  // percentage (e.g. 80 = alert at 80%)
}

// SavingsGoal
{
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  icon: string
}
```

---

## AI Integration Points (Claude API)

| Feature | Prompt Strategy | Speed |
|---|---|---|
| Auto-categorize | "Given merchant: '{name}', classify into: [categories]" | ~200ms |
| NL input parse | "Parse: '{text}' into {amount, category, date, note}" | ~300ms |
| Weekly insights | Batch last 30 transactions → generate 3 key insights | ~1s |
| Anomaly detection | Compare new transaction to last 90 days avg per category | ~500ms |
| Chat assistant | Full conversation with transaction context injected | ~1s |
| Budget recommendations | Income + 3-month spend history → suggest limits | ~1s |
| Report narrative | Transaction summary → write financial narrative | ~2s |

---

## Build Order (Step by Step)

1. **Project setup** — Vite + React + TypeScript + Tailwind + shadcn
2. **Data layer** — Zustand store + localStorage persistence
3. **Dashboard page** — Summary cards + quick add button
4. **Transaction CRUD** — Add/Edit/Delete/List
5. **Categories & Budgets** — Setup + progress UI
6. **Charts page** — Recharts integration
7. **Claude API setup** — API key config, base hook
8. **Auto-categorize AI** — First AI feature (instant value)
9. **NL input AI** — "Add expense by typing naturally"
10. **AI Chat page** — Finance assistant
11. **Weekly insights AI** — Background-generated insights
12. **Receipt scanner** — Tesseract.js integration
13. **Recurring + Subscriptions** — Recurring logic
14. **Savings goals** — Goal tracking UI
15. **Mood tracker** — Emotion tagging
16. **Gamification** — Streaks + badges
17. **Export (PDF/CSV)** — jsPDF + SheetJS
18. **Carbon footprint** — Eco-score per category
19. **Dark mode + themes** — Final polish
20. **PWA setup** — Installable on mobile

---

## What Makes SpendWise Different from Competitors

| Feature | SpendWise | Walnut | Money Manager | YNAB |
|---|---|---|---|---|
| AI Chat Assistant | ✅ | ❌ | ❌ | ❌ |
| NL expense input | ✅ | ❌ | ❌ | ❌ |
| Mood tracking | ✅ | ❌ | ❌ | ❌ |
| Carbon footprint | ✅ | ❌ | ❌ | ❌ |
| AI anomaly alerts | ✅ | ❌ | ❌ | ❌ |
| What-if scenarios | ✅ | ❌ | ❌ | ⚠️ |
| Gamification | ✅ | ❌ | ❌ | ❌ |
| Receipt OCR | ✅ | ✅ | ✅ | ❌ |
| AI report PDF | ✅ | ❌ | ❌ | ❌ |
| Offline-first | ✅ | ❌ | ✅ | ❌ |
| Free & open | ✅ | ❌ | ⚠️ | ❌ |

---

## What We'll Build First (Next Session)

→ **Project setup + Dashboard + Transaction CRUD** (Phase 1 foundation)

This gives us a working app immediately, then we layer AI on top.

---

## Deployment & Distribution Roadmap (planned — not started)

> Agreed build order for getting SpendWise live + multi-device. Each step lists
> what the agent codes vs. what the owner (Shashwat) must provide. **Status: planned.**

### Step 1 — Web deploy (Vercel) ⏳
Static Vite SPA → live shareable URL, free. Do this first.
- Build: `vercel.json` / project config, confirm `npm run build` output, env wiring
- **Owner provides:** Vercel (or Netlify) account connected to the GitHub repo

### Step 2 — PWA (installable + offline) ⏳
Make the web app installable on phones/desktop without any app store.
- Build: web manifest, icons, service worker (e.g. `vite-plugin-pwa`), offline caching
- **Owner provides:** nothing (app icon art optional)

### Step 3 — Auth + cloud sync (multi-device backup) ⏳
Backend so data backs up and syncs across devices. Recommended: **Supabase**
(Postgres + auth + row-level security + realtime; matches the Tech Stack table above).
- Build: DB schema (transactions, budgets, goals, accounts, settings) with row-level
  security; login/signup UI; sync layer over the Zustand store with offline fallback;
  one-time migration of existing localStorage data into the cloud on first login
- **Owner provides:** Supabase account + project; Project URL + anon key (→ `.env`);
  choice of auth method (email/password, magic link, or Google); if Google sign-in,
  Google Cloud OAuth credentials
- **Decision:** keep "users bring their own Claude API key" (free for owner) vs. a
  funded shared key via a backend proxy (owner pays per use)

### Step 4 — Android app ⏳
Capacitor is configured but **not installed** and there is no `android/` project yet.
- Build: `npm i @capacitor/*`, `npx cap add android`, SMS plugin wiring, build scripts
- **Owner provides:** Android Studio + Android SDK on the local machine
- **Decision — sideload vs Play Store:**
  - *Sideload (personal):* nothing extra; SMS auto-import keeps working
  - *Play Store:* $25 one-time dev account, privacy policy, store assets (icon,
    screenshots, description), and **rework/remove SMS auto-import** (Google restricts
    `READ_SMS`) — CSV/PDF/manual import remains. See [ANDROID.md](ANDROID.md).

### Open product decisions (set these before Step 3)
1. Personal single-user, or public multi-user product?
2. Local-only, or cloud sync? (cloud = Step 3)
3. AI key: bring-your-own vs. funded proxy?
4. Android: sideload or Play Store? (decides the SMS feature's fate)

> Feature phases still open after deployment work: **Phase 4 (differentiators)**
> from the breakdown above. UI overhaul + Phase 2 (smart features) + Phase 3 (AI
> integration) are complete — see `UI_OVERHAUL.md`, `PHASE2.md`, and `PHASE3.md`.
