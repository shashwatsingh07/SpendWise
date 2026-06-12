/**
 * merchantMemory — remembers which category a merchant was filed under,
 * so repeat imports auto-categorise. Stored in localStorage (separate key
 * from the main store so it survives even if data is reset).
 *
 * Also ships a seed list of common Indian merchants -> category so the very
 * first import is already mostly categorised.
 */

const STORE_KEY = 'spendwise-merchant-memory'

// Seed: keyword (lowercase) -> categoryId. Matched as substrings.
const SEED: Record<string, string> = {
  swiggy: 'food',
  zomato: 'food',
  'eatfit': 'food',
  dominos: 'food',
  mcdonald: 'food',
  kfc: 'food',
  starbucks: 'food',
  blinkit: 'food',
  zepto: 'food',
  bigbasket: 'food',
  grofers: 'food',
  uber: 'transport',
  ola: 'transport',
  rapido: 'transport',
  irctc: 'transport',
  redbus: 'transport',
  'indian oil': 'transport',
  hpcl: 'transport',
  bpcl: 'transport',
  amazon: 'shopping',
  flipkart: 'shopping',
  myntra: 'shopping',
  ajio: 'shopping',
  meesho: 'shopping',
  nykaa: 'shopping',
  netflix: 'subscriptions',
  spotify: 'subscriptions',
  'prime video': 'subscriptions',
  hotstar: 'subscriptions',
  jiocinema: 'subscriptions',
  youtube: 'subscriptions',
  bookmyshow: 'entertainment',
  pvr: 'entertainment',
  inox: 'entertainment',
  apollo: 'health',
  pharmeasy: 'health',
  '1mg': 'health',
  netmeds: 'health',
  cult: 'fitness',
  'cure.fit': 'fitness',
  airtel: 'bills',
  jio: 'bills',
  vodafone: 'bills',
  'vi ': 'bills',
  bescom: 'bills',
  'tata power': 'bills',
  electricity: 'bills',
  rent: 'housing',
  udemy: 'education',
  coursera: 'education',
  unacademy: 'education',
  byjus: 'education',
  makemytrip: 'travel',
  goibibo: 'travel',
  oyo: 'travel',
  airbnb: 'travel',
  indigo: 'travel',
  vistara: 'travel',
}

type Memory = Record<string, string>

function load(): Memory {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as Memory) : {}
  } catch {
    return {}
  }
}

function save(mem: Memory) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(mem))
  } catch {
    /* ignore quota errors */
  }
}

/** Normalise a raw merchant string into a stable lookup key. */
export function normaliseMerchant(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b(upi|imps|neft|pos|ach|txn|ref|paytm|gpay|phonepe)\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Guess a category for a merchant. Order: exact learned key -> learned
 * substring -> seed substring -> 'other_exp'.
 */
export function guessCategory(merchant: string): string {
  const key = normaliseMerchant(merchant)
  if (!key) return 'other_exp'

  const mem = load()
  if (mem[key]) return mem[key]

  for (const [k, cat] of Object.entries(mem)) {
    if (key.includes(k) || k.includes(key)) return cat
  }
  const hay = merchant.toLowerCase()
  for (const [k, cat] of Object.entries(SEED)) {
    if (hay.includes(k)) return cat
  }
  return 'other_exp'
}

/** Learn merchant -> category from a confirmed transaction. */
export function rememberMerchant(merchant: string, category: string) {
  const key = normaliseMerchant(merchant)
  if (!key || category === 'other_exp') return
  const mem = load()
  mem[key] = category
  save(mem)
}

/** Learn from a whole batch at once (called after a confirmed import). */
export function rememberBatch(pairs: { merchant: string; category: string }[]) {
  const mem = load()
  for (const { merchant, category } of pairs) {
    const key = normaliseMerchant(merchant)
    if (key && category !== 'other_exp') mem[key] = category
  }
  save(mem)
}
