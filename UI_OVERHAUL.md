# UI Overhaul — Progress Tracker

> **Goal:** Dark-first premium redesign with full framer-motion animations.
> **Branch:** `feat/ui-overhaul` (merge each chunk to `main` when happy).
> **Approach:** small, self-contained commits — every commit keeps the app
> build-green and working, so progress is safe and resumable at any point.

**Aesthetic:** Dark-first premium — deep-navy hero theme, neon-accent data viz,
glass cards with depth, motion everywhere. Light mode stays as a secondary theme.

**How to resume:** check the boxes below, find the first unchecked item, and
continue. Each chunk = one commit. Run `npm run build` before committing.

---

## Chunks

- [x] **1. Dark mode wiring** — apply `dark` class from settings, default to dark
      (`src/App.tsx`, `src/store/useStore.ts`)
- [x] **2. Premium theme** — deep-navy palette, aurora background, frosted glass
      cards with depth, glow shadows, gradient-text + shimmer utilities
      (`tailwind.config.js`, `src/index.css`)
- [x] **3. Motion primitives** — shared framer-motion variants/easings
      (`src/lib/motion.ts`) + `AnimatedNumber` count-up component
      (`src/components/AnimatedNumber.tsx`)
- [ ] **4. Charts** — fix pie collapse (ResponsiveContainer sizing), neon
      gradients, glass tooltips, draw-on animation (`src/pages/Analytics.tsx`,
      `src/pages/Dashboard.tsx`)
- [x] **5. Sidebar + shell** — animated active pill (`layoutId`), nav hover
      motion, page-content cross-fade via `useOutlet` (`src/components/Layout.tsx`)
      <br>⚠️ Note: after adding framer-motion, clear Vite cache once
      (`rm -rf node_modules/.vite`) if the dev server shows stale-module errors.
- [ ] **6. Dashboard** — count-up cards (extend existing), staggered entrances,
      animated progress, hover lifts (`src/pages/Dashboard.tsx`)
- [ ] **7. Transactions** — staggered rows, layout animation on filter/search,
      hover reveal (`src/pages/Transactions.tsx`)
- [ ] **8. Budgets + Goals** — animated progress rings/bars, card motion
      (`src/pages/Budgets.tsx`, `src/pages/Goals.tsx`)
- [ ] **9. Import + SMS banner** — animated banner, dropzone states, success
      moment (`src/pages/Import.tsx`, `src/components/SmsImportBanner.tsx`,
      `src/components/ImportPreview.tsx`)
- [ ] **10. AI Assistant + Settings** — message motion, polished controls
      (`src/pages/AIAssistant.tsx`, `src/pages/Settings.tsx`)
- [ ] **11. Modals + polish** — spring modal entrances, skeleton loaders, toasts,
      empty states (`src/components/TransactionModal.tsx`, shared)

---

## Notes / decisions
- Default `darkMode: true` only affects fresh installs; existing users keep their
  saved choice (toggle in Settings still works).
- All motion must respect the existing `prefers-reduced-motion` guard in
  `src/index.css`.
- `framer-motion` (v12) is already a dependency.
