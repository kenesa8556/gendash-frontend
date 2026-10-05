export function formatValue(v: unknown, format: 'currency' | 'number'): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const s = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  return format === 'currency' ? `${s} ETB` : s;
}

export function compact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}