'use client';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Row, SpecPanel } from '@/types/spec';
import { SERIES_COLORS, toChartData } from '@/lib/chartData';
import { compact, formatValue } from '@/lib/format';

export function LineChartPanel({ panel, rows }: { panel: SpecPanel; rows: Row[] }) {
  const { data, keys } = toChartData(rows, panel.partialLastPeriod);
  return (
    <div role="img" aria-label={panel.label} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="dim" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
          <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} width={48}
            tickFormatter={(v) => compact(Number(v))} />
          <Tooltip
            contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            formatter={(v : unknown) => formatValue(v, panel.format, panel.currency)}
          />
          {keys.length > 1 && <Legend />}
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} strokeWidth={2} dot={{ r: 3 }}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}