/** Coerce PostgREST NUMERIC (often a string) to a finite number. */
export function toAmount(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

export function formatMoney(value: unknown, decimals = 2): string {
  return toAmount(value).toFixed(decimals);
}
