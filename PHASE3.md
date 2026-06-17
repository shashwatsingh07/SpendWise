# Phase 3 — AI Integration (Progress Tracker)

> **Goal:** the intelligence layer — financial health, forecasting, insights and
> recommendations that make SpendWise feel like a co-pilot.
> **Approach:** a deterministic analytics engine that runs **offline with no API
> key** (mirroring Phase 2), with an **AI narrative layer** that switches on when
> the user adds a Claude key. The maths never depends on the network.
> **How to resume:** find the first unchecked item and continue.

---

## Chunks

- [x] **1. Analytics engine** — `src/lib/insights.ts`, pure/deterministic and
      base-currency aware: financial **health score** (0–100, weighted: savings
      rate, spend ratio, budget adherence, consistency), **month-over-month
      insights**, **anomaly detection** (90-day baseline, mean+2σ), **run-rate
      forecasting** (per-category projected vs budget), **50/30/20 budget
      recommendations** (needs/wants classifier), and **what-if scenarios**.
- [x] **2. Natural-language quick-add** — `src/lib/nlParser.ts` upgrades the
      modal's regex stub into a real parser (amount + `k/l/cr` suffixes, currency
      symbols/codes, income detection, relative dates like "yesterday", merchant
      extraction, category via merchant memory) with an optional Claude pass.
      Wired into `TransactionModal` ("AI Quick Add").
- [x] **3. Insights page** — new `/insights` route + nav: animated health-score
      ring with component breakdown, month-end forecast with overspend alerts,
      key-insight cards, unusual-transaction list, 50/30/20 budget bars, and an
      interactive what-if simulator. Optional **"AI Summary"** narrative via
      Claude when a key is set.
- [x] **4. Dashboard integration** — the old static "AI Insight" banner is now
      driven by the engine (top computed insight) and shows the live health score
      + grade, linking into `/insights`.

> **Already present from earlier phases:** AI Chat assistant
> (`src/pages/AIAssistant.tsx`, real Claude + demo fallback) and AI statement
> parsing (`src/lib/aiParser.ts`) + heuristic auto-categorisation
> (`src/lib/merchantMemory.ts`).

---

## ✅ Phase 3 complete — all 4 chunks done

---

## Notes / decisions
- Same "works without a key, better with one" contract as Phase 2: every number
  on the Insights page and Dashboard is computed locally; Claude only writes prose
  on top of those numbers.
- Health score weights: savings rate 35, spend ratio 25, budget adherence 25,
  consistency 15. Needs = housing/bills/health/transport/education; everything
  else is wants (used by 50/30/20 + health).
- Anomalies need ≥4 samples in a category over 90 days before flagging, to avoid
  false positives on sparse data.
- All AI calls use `claude-haiku-4-5` and degrade gracefully on failure.
