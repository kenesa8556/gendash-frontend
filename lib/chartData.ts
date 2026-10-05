import { Row } from '@/types/spec';

export const SERIES_COLORS = [
  'var(--color-s1)', 'var(--color-s2)', 'var(--color-s3)',
  'var(--color-s4)', 'var(--color-s5)', 'var(--color-s6)',
];

type Point = Record<string, string | number>;

export function toChartData(rows: Row[], partialLast = false) {
  if (!rows.length) return { data: [] as Point[], keys: [] as string[] };
  const hasSeries = 'series' in rows[0];
  const valueKeys = Object.keys(rows[0]).filter((k) => k !== 'dim' && k !== 'series');

  let data: Point[];
  let keys: string[];
  if (!hasSeries) {
    keys = valueKeys;
    data = rows.map((r) => ({
      dim: String(r.dim),
      ...Object.fromEntries(valueKeys.map((k) => [k, Number(r[k])])),
    }));
  } else {
    const vk = valueKeys[0];
    keys = [];
    const map = new Map<string, Point>();
    for (const r of rows) {
      const s = String(r.series);
      if (!keys.includes(s)) keys.push(s);
      const d = map.get(String(r.dim)) ?? { dim: String(r.dim) };
      d[s] = Number(r[vk]);
      map.set(String(r.dim), d);
    }
    data = [...map.values()];
  }
  if (partialLast && data.length) data[data.length - 1].dim += ' (partial)';
  return { data, keys };
}