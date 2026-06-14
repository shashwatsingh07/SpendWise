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
- [ ] **3. Tags** — tag overview + filter UX (tags already stored on
      transactions); per-tag totals on a tag detail / Analytics surface.
- [ ] **4. Multi-Currency** — log in any currency, convert to base for totals
      (static rate table + editable rates in Settings).
- [ ] **5. Split Expense** — track who owes what on a transaction
      (`splitWith` already on the model); settle-up view.
- [ ] **6. Bill Reminders** — upcoming-bill list derived from recurring items,
      due-soon highlighting on the dashboard.

---

## Notes / decisions
- Reuse shared motion variants (`src/lib/motion.ts`), `card`/`btn-*` utilities,
  the `useToast()` system, and `ProgressBar` where relevant.
- Monthly normalization: daily ×30, weekly ×4.345, monthly ×1, yearly ÷12.
- All new pages respect dark-first theme + `prefers-reduced-motion`.
