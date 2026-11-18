export function parseMoney(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,%\s]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '—') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: number, opts?: { signed?: boolean }): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
  if (opts?.signed) {
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
  }
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function daysLeftInPeriod(endDate: string, now = new Date()): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.ceil((endDay.getTime() - startOfToday.getTime()) / 86_400_000);
  return diff;
}

export function clampPercent(actual: number, budget: number): number {
  if (budget <= 0) {
    return actual > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((actual / budget) * 100));
}
