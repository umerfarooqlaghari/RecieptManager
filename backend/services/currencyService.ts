/**
 * Currency Service
 * Fetches open-source exchange rates and handles conversions.
 * Source: Open Exchange Rate API (https://open.er-api.com/v6/latest/USD)
 */

interface CachedRates {
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

let ratesCache: CachedRates | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Common currency display symbols fallback
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  PKR: 'Rs',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  AED: 'AED',
  SAR: 'SAR',
  SGD: 'SG$',
  HKD: 'HK$',
  NZD: 'NZ$',
  BRL: 'R$',
  MXN: 'MX$',
  RUB: '₽',
  KRW: '₩',
  TRY: '₺',
  ZAR: 'R',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  VND: '₫',
  ILS: '₪',
  EGP: 'E£',
};

/**
 * Returns symbol for given currency code
 */
export function getCurrencySymbol(code: string): string {
  if (!code) return '$';
  const upper = code.toUpperCase().trim();
  if (CURRENCY_SYMBOLS[upper]) return CURRENCY_SYMBOLS[upper];
  try {
    const parts = new Intl.NumberFormat('en', { style: 'currency', currency: upper }).formatToParts(0);
    const sym = parts.find(p => p.type === 'currency')?.value;
    return sym || upper;
  } catch {
    return upper;
  }
}

/**
 * Returns full name for given currency code
 */
export function getCurrencyName(code: string): string {
  if (!code) return 'US Dollar';
  const upper = code.toUpperCase().trim();
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(upper) || upper;
  } catch {
    return upper;
  }
}

/**
 * Fetches latest exchange rates with 1-hour in-memory cache
 */
export async function getRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && (now - ratesCache.timestamp) < CACHE_TTL_MS) {
    return ratesCache.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.rates) {
      ratesCache = {
        timestamp: now,
        base: 'USD',
        rates: data.rates,
      };
      console.log(`[Currency] Loaded ${Object.keys(data.rates).length} exchange rates from open.er-api.com`);
      return data.rates;
    }
    throw new Error('Invalid rate payload');
  } catch (err: any) {
    console.warn('[Currency] Failed to fetch live exchange rates:', err.message);
    if (ratesCache) return ratesCache.rates;
    // Minimal fallback
    return { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.36, AUD: 1.52, JPY: 153.0, CHF: 0.88, PKR: 278.0, INR: 84.0 };
  }
}

/**
 * Returns full list of supported currencies with name and symbol
 */
export async function getSupportedCurrencies(): Promise<{ code: string; name: string; symbol: string }[]> {
  const rates = await getRates();
  return Object.keys(rates).sort().map(code => ({
    code,
    name: getCurrencyName(code),
    symbol: getCurrencySymbol(code),
  }));
}

/**
 * Converts an amount from one currency to another using open rates
 */
export async function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): Promise<{ convertedAmount: number; rate: number }> {
  const from = (fromCode || 'USD').toUpperCase().trim();
  const to = (toCode || 'USD').toUpperCase().trim();

  if (from === to || !amount || isNaN(amount)) {
    return { convertedAmount: Number(amount) || 0, rate: 1 };
  }

  const rates = await getRates();
  const fromRate = rates[from]; // rate relative to USD
  const toRate = rates[to];     // rate relative to USD

  if (!fromRate || !toRate) {
    console.warn(`[Currency] Unknown currency in conversion: ${from} -> ${to}`);
    return { convertedAmount: amount, rate: 1 };
  }

  // fromCurrency -> USD -> toCurrency
  // e.g. amountInUSD = amount / fromRate; converted = amountInUSD * toRate;
  const rate = toRate / fromRate;
  const convertedAmount = Math.round((amount * rate) * 100) / 100;

  return { convertedAmount, rate };
}
