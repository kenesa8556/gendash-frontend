'use client';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Row, SpecPanel } from '@/types/spec';
import { SERIES_COLORS, toChartData } from '@/lib/chartData';
import { compact, formatValue } from '@/lib/format';

export function BarChartPanel({ panel, rows }: { panel: SpecPanel; rows: Row[] }) {
  const { data, keys } = toChartData(rows, panel.partialLastPeriod);
  return (
    <div role="img" aria-label={panel.label} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="dim" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
          <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} width={48}
            tickFormatter={(v) => compact(Number(v))} />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-2)' }}
            contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            formatter={(v) => formatValue(v, panel.format,panel.currency)}
          />
          {keys.length > 1 && <Legend />}
          {keys.map((k, i) => (
            <Bar key={k} dataKey={k} radius={[3, 3, 0, 0]}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}