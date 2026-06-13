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
- [x] **4. Charts** — FIXED pie collapse (sized wrapper + donut), neon gradient
      bars/line/area, shared GlassTooltip, draw-on animation, dark grids + dark
      text (`src/components/ChartTooltip.tsx`, `src/pages/Analytics.tsx`,
      `src/pages/Dashboard.tsx`)
- [x] **5. Sidebar + shell** — animated active pill (`layoutId`), nav hover
      motion, page-content cross-fade via `useOutlet` (`src/components/Layout.tsx`)
      <br>⚠️ Note: after adding framer-motion, clear Vite cache once
      (`rm -rf node_modules/.vite`) if the dev server shows stale-module errors.
- [x] **6. Dashboard** — staggered motion entrances, AnimatedNumber count-up
      cards with hover lift + sheen, animated ProgressBar (budget + goals),
      stagger on recent transactions (`src/pages/Dashboard.tsx`)
- [x] **7. Transactions** — staggered rows, layout/AnimatePresence reflow on
      filter+sort, dark-tuned badges/actions (`src/pages/Transactions.tsx`)
- [x] **8. Budgets + Goals** — shared animated `ProgressBar` (also used by
      Dashboard), card stagger + hover, spring modals, dark-tuned colours
      (`src/components/ProgressBar.tsx`, `src/pages/Budgets.tsx`,
      `src/pages/Goals.tsx`, `src/pages/Dashboard.tsx`)
- [x] **9. Import + SMS banner** — dark ImportPreview, animated stage
      transitions (AnimatePresence), dropzone hover, success pop; banner
      slide-in + spring modal w/ click-outside (`src/pages/Import.tsx`,
      `src/components/SmsImportBanner.tsx`, `src/components/ImportPreview.tsx`)
- [x] **10. AI Assistant + Settings** — AI rebranded sky→violet, dark message
      bubbles w/ spring motion; Settings dark-themed + new Appearance card with
      working dark-mode toggle (`src/pages/AIAssistant.tsx`, `src/pages/Settings.tsx`)
- [x] **11. Modals + polish** — TransactionModal upgraded to consistent spring
      modal + click-outside + dark tuning (`src/components/TransactionModal.tsx`).
      All modals now share the same spring/backdrop pattern.

---

## ✅ Overhaul complete — all 11 chunks done

Optional future polish (not blocking): skeleton shimmer loaders, toast system,
import-success confetti, expense heatmap. The `.shimmer` utility already exists
if you want to add skeletons later.

---

## Notes / decisions
- Default `darkMode: true` only affects fresh installs; existing users keep their
  saved choice (toggle in Settings still works).
- All motion must respect the existing `prefers-reduced-motion` guard in
  `src/index.css`.
- `framer-motion` (v12) is already a dependency.
