export const SUPPORTED_CURRENCIES = [
  'MYR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'THB', 'IDR', 'PHP', 'INR',
  'AUD', 'NZD', 'CAD', 'HKD', 'CNY', 'KRW', 'CHF', 'MXN', 'ZAR', 'TRY',
]

interface RatesResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

let cache: { fetchedAt: number; rates: Record<string, number> } | null = null
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

async function getRatesFromMYR(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.rates
  const res = await fetch('https://api.frankfurter.app/latest?from=MYR')
  if (!res.ok) throw new Error(`Currency API error: ${res.status}`)
  const data: RatesResponse = await res.json()
  const rates = { ...data.rates, MYR: 1 }
  cache = { fetchedAt: Date.now(), rates }
  return rates
}

export async function convertFromMYR(amountMYR: number, toCurrency: string): Promise<number> {
  if (toCurrency === 'MYR') return amountMYR
  try {
    const rates = await getRatesFromMYR()
    const rate = rates[toCurrency]
    if (!rate) return amountMYR
    return amountMYR * rate
  } catch {
    return amountMYR // fall back to MYR value if the live rate lookup fails
  }
}

export async function convertToMYR(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'MYR') return amount
  try {
    const rates = await getRatesFromMYR()
    const rate = rates[fromCurrency]
    if (!rate) return amount
    return amount / rate
  } catch {
    return amount
  }
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}
