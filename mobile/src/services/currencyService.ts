import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const STORAGE_CURRENCY_KEY = '@user_currency_preference';
const STORAGE_CURRENCIES_CACHE_KEY = '@currencies_list_cache';

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

const POPULAR_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'SG$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

/**
 * Returns symbol for given currency code
 */
export function getCurrencySymbol(code?: string): string {
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
 * Returns human-readable currency name
 */
export function getCurrencyName(code?: string): string {
  if (!code) return 'US Dollar';
  const upper = code.toUpperCase().trim();
  const pop = POPULAR_CURRENCIES.find(c => c.code === upper);
  if (pop) return pop.name;
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(upper) || upper;
  } catch {
    return upper;
  }
}

const STORAGE_RATES_CACHE_KEY = '@currencies_rates_cache';
let memoryRates: Record<string, number> | null = null;

/**
 * Loads dynamic list of currencies from open API with cache & popular fallback
 */
export async function fetchCurrencies(): Promise<Currency[]> {
  try {
    // Check cached currencies & rates
    const [cachedList, cachedRates] = await Promise.all([
      AsyncStorage.getItem(STORAGE_CURRENCIES_CACHE_KEY),
      AsyncStorage.getItem(STORAGE_RATES_CACHE_KEY),
    ]);

    if (cachedRates) {
      try {
        memoryRates = JSON.parse(cachedRates);
      } catch {}
    }

    if (cachedList) {
      const parsed = JSON.parse(cachedList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Return cached and refresh in background
        refreshCurrenciesInBackground();
        return parsed;
      }
    }
  } catch {}

  return await fetchAndCacheCurrencies();
}

async function fetchAndCacheCurrencies(): Promise<Currency[]> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.rates) {
      memoryRates = data.rates;
      await AsyncStorage.setItem(STORAGE_RATES_CACHE_KEY, JSON.stringify(data.rates)).catch(() => {});

      const codes = Object.keys(data.rates);
      const list: Currency[] = codes.map(code => ({
        code: code.toUpperCase(),
        name: getCurrencyName(code),
        symbol: getCurrencySymbol(code),
      })).sort((a, b) => {
        // Popular currencies at top
        const aPop = POPULAR_CURRENCIES.findIndex(p => p.code === a.code);
        const bPop = POPULAR_CURRENCIES.findIndex(p => p.code === b.code);
        if (aPop !== -1 && bPop !== -1) return aPop - bPop;
        if (aPop !== -1) return -1;
        if (bPop !== -1) return 1;
        return a.code.localeCompare(b.code);
      });

      await AsyncStorage.setItem(STORAGE_CURRENCIES_CACHE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err: any) {
    console.warn('[Currency] Failed to fetch open currencies API, using popular list:', err.message);
  }

  return POPULAR_CURRENCIES;
}

function refreshCurrenciesInBackground() {
  fetchAndCacheCurrencies().catch(() => {});
}

/**
 * Converts an amount from one currency to another using local rates
 */
export function convertCurrencyLocally(amount: number, fromCurrency?: string, toCurrency?: string): number {
  if (!amount || isNaN(amount)) return 0;
  const from = (fromCurrency || 'USD').toUpperCase().trim();
  const to = (toCurrency || 'USD').toUpperCase().trim();
  if (from === to) return amount;
  if (!memoryRates) return amount;

  const rateFrom = memoryRates[from] || 1;
  const rateTo = memoryRates[to] || 1;

  // 1 USD = rateFrom [FROM], so 1 [FROM] = 1 / rateFrom USD
  // 1 USD = rateTo [TO], so 1 [FROM] = rateTo / rateFrom [TO]
  const converted = amount * (rateTo / rateFrom);
  return Math.round(converted * 100) / 100;
}

/**
 * Check if the user has explicitly set a currency preference
 */
export async function hasUserSetCurrency(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_CURRENCY_KEY);
    return !!(saved && saved.trim());
  } catch {
    return false;
  }
}

/**
 * Get user currency preference
 */
export async function getUserCurrency(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_CURRENCY_KEY);
    if (saved && saved.trim()) return saved.trim().toUpperCase();
  } catch {}
  return 'USD';
}

/**
 * Save user currency preference
 */
export async function setUserCurrency(code: string): Promise<void> {
  try {
    const upper = (code || 'USD').toUpperCase().trim();
    await AsyncStorage.setItem(STORAGE_CURRENCY_KEY, upper);
  } catch (err: any) {
    console.warn('[Currency] Failed to save currency preference:', err.message);
  }
}
