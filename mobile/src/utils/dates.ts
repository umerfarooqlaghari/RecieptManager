/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthRange(year: number, monthIndex: number): { from: string; to: string } {
  return {
    from: toLocalDateString(new Date(year, monthIndex, 1)),
    to: toLocalDateString(new Date(year, monthIndex + 1, 0)),
  };
}
