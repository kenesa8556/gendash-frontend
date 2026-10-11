import { Row, SpecPanel } from '@/types/spec';
import { formatValue } from '@/lib/format';

const head = (k: string) =>
  k === 'dim' ? 'Group' : k === 'series' ? 'Series' : k.charAt(0).toUpperCase() + k.slice(1);

export function DataTable({ panel, rows }: { panel: SpecPanel; rows: Row[] }) {
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border">
            {cols.map((c) => <th key={c} className="py-2 pr-4 font-medium">{head(c)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50">
              {cols.map((c) => (
                <td key={c} className="py-2 pr-4 tabular-nums">
                  {typeof r[c] === 'number' ? formatValue(r[c], panel.format, panel.currency) : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}