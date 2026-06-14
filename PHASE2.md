# Phase 2 — Smart Features (Progress Tracker)

> **Goal:** Features that make SpendWise feel like a co-pilot, built on the
> existing localStorage/Zustand data layer (no API key required).
> **Approach:** small, self-contained commits — each chunk keeps the app
> build-green and working, mirroring the UI-overhaul workflow.
> **How to resume:** find the first unchecked item and continue.

---

## Chunks

- [x] **1. Recurring & Subscriptions** — new `/recurring` page over existing
      `isRecurring` transactions: monthly-normalized cost, yearly projection,
      next-renewal estimate, subscriptions vs other-recurring split, totals.
      Nav + route. (`src/pages/Recurring.tsx`, `Layout.tsx`, `App.tsx`)
- [x] **2. Net Worth Tracker** — new `accounts` store slice (assets +
      liabilities) + `/net-worth` page: animated net-worth total, asset/liability
      ratio bar, totals, per-column add/edit/delete with kind-aware form.
      (`src/data/accounts.ts`, `src/pages/NetWorth.tsx`, store, nav, route)
- [x] **3. Tags** — `/tags` overview page (per-tag base-converted totals,
      counts, income, share bar) linking into Transactions; Transactions now
      honors a `?tag=` param with a clearable chip + clickable row tag chips.
- [x] **4. Multi-Currency** — `src/data/currencies.ts` static-rate table +
      `convertCurrency`. Per-transaction currency selector in the modal; every
      aggregation (store helpers, Dashboard, Analytics, Recurring, heatmap, AI
      context, Transactions net) converts to base; rows show original currency.
- [x] **5. Split Expense** — `splitWith` + new `splitSettled` on the model;
      modal "Split with" field with live per-person share preview; `/splits`
      page with owed-to-you total, per-person settle-up, and settle toggle.
- [x] **6. Bill Reminders** — `src/lib/recurring.ts` shared `nextRenewal` +
      `upcomingBills`; "Upcoming bills (next 14 days)" section on Recurring with
      due-soon highlighting, and a conditional "bills due in 3 days" nudge on the
      Dashboard linking to /recurring.

---

## ✅ Phase 2 complete — all 6 chunks done

---

## Notes / decisions
- Reuse shared motion variants (`src/lib/motion.ts`), `card`/`btn-*` utilities,
  the `useToast()` system, and `ProgressBar` where relevant.
- Monthly normalization: daily ×30, weekly ×4.345, monthly ×1, yearly ÷12.
- All new pages respect dark-first theme + `prefers-reduced-motion`.
