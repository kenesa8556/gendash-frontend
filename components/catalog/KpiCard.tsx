import { Row, SpecPanel } from '@/types/spec';
import { formatValue } from '@/lib/format';

export function KpiCard({ panel, rows }: { panel: SpecPanel; rows: Row[] }) {
  const entries = Object.entries(rows[0] ?? {});
  return (
    <div className="flex flex-wrap gap-6">
      {entries.map(([k, v]) => (
        <div key={k}>
          <p className="text-3xl font-semibold tabular-nums">{formatValue(v, panel.format)}</p>
          <p className="text-xs text-muted mt-1 capitalize">{k}</p>
        </div>
      ))}
    </div>
  );
}