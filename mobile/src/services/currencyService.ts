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

/**
 * Loads dynamic list of currencies from open API with cache & popular fallback
 */
export async function fetchCurrencies(): Promise<Currency[]> {
  try {
    // Check cached currencies
    const cached = await AsyncStorage.getItem(STORAGE_CURRENCIES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
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
