// Static exchange rates for offline multi-currency support. `rate` is the number
// of units of the currency per 1 USD. Conversion goes via USD. Rates are
// approximate and can be refined later (e.g. user-editable in Settings).
export interface Currency {
  code: string
  symbol: string
  name: string
  rate: number
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 157 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
]

export const getCurrency = (code: string): Currency =>
  CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]

export const currencySymbol = (code: string): string => getCurrency(code).symbol

/** Convert an amount from one currency to another via USD. */
export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount
  return (amount / getCurrency(from).rate) * getCurrency(to).rate
}
