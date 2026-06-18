# Phase 4 — Unique Differentiators (Progress Tracker)

> **Goal:** the features competitors don't have — gamification, environmental
> impact, long-term wealth projection and a one-click AI report.
> **Approach:** same contract as Phases 2–3 — every number is computed
> **offline** by a pure engine in `src/lib/`; Claude only writes prose on top
> (the AI Report narrative) when a key is set.
> **How to resume:** find the first unchecked item and continue.

---

## Chunks

- [x] **1. Gamification** — `src/lib/gamification.ts` (pure): logging **streaks**
      (current + longest, grace day so you don't lose it at midnight), an **XP /
      level** model derived from activity (transactions, budgets, goals, accounts,
      streak) with titled levels, and **16 badges** with live progress. New
      `/achievements` page shows level + XP bar, current/longest streak, and
      earned vs in-progress badge grids.
- [x] **2. Carbon Footprint** — `src/lib/carbon.ts` (pure): spend-based CO₂e
      estimation using per-category emission factors (kg per ₹1,000), monthly
      total, **eco-score** (0–100 + grade), trees-to-offset, a relatable
      "km driven" equivalent, and a month-over-month trend. New `/carbon` page
      with a score ring and emissions-ranked category breakdown.
- [x] **3. Wealth Projection** — `src/lib/wealth.ts` (pure): future value of an
      initial balance + fixed monthly contribution, compounded monthly. New
      `/wealth` page with editable assumptions (starting balance, monthly, return
      %, horizon — pre-filled from net worth + this month's savings) and a
      Recharts area chart of value vs contributions.
- [x] **4. AI Report Generator** — `src/lib/report.ts` (pure period aggregation)
      + new `/report` page: a print-styled "Financial Report" sheet (figures,
      health-score breakdown, top categories & merchants) for **this month** or
      **this year**, exportable to **PDF via the browser** (print CSS in
      `index.css`, no new deps), with an optional **Claude-written narrative**.

> **Already present from earlier phases:** **Mood Tracker** (modal + Dashboard +
> Analytics mood chart), **Expense Heatmap Calendar** (`ExpenseHeatmap` in
> Analytics), **Smart Import** (`src/pages/Import.tsx` — paste/SMS/CSV/PDF →
> `aiParser`), **Merchant Intelligence** (`src/lib/merchantMemory.ts`), and full
> **Dark Mode**.

---

## ✅ Phase 4 complete — all buildable chunks done

---

## Notes / decisions
- **Leaderboard deferred.** The opt-in anonymous comparison needs a shared
  backend, which conflicts with SpendWise's offline-first / localStorage design.
  Revisit after the deployment roadmap's Step 3 (auth + cloud sync). See `PLAN.md`.
- Carbon factors are **indicative, not audited** — illustrative consumption-based
  averages calibrated to ₹1,000 of spend, so non-INR bases still rank sensibly.
- Wealth projection excludes tax and inflation and assumes a constant return;
  labelled "for illustration only — not financial advice" on the page.
- AI Report exports through the browser's native print-to-PDF (`window.print()`)
  rather than bundling jsPDF — keeps the dependency footprint flat. App chrome and
  controls are dropped via a `@media print` block + `.no-print` / `.print-sheet`.
- New nav routes: `/wealth`, `/carbon`, `/achievements`, `/report`. The sidebar
  nav is now scrollable to fit all items.
- All AI calls use `claude-haiku-4-5` and degrade gracefully when no key is set.
