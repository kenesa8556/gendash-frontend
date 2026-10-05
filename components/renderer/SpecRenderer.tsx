import { Row, SpecPanel } from '@/types/spec';
import { KpiCard } from '@/components/catalog/KpiCard';
import { LineChartPanel } from '@/components/catalog/LineChartPanel';
import { BarChartPanel } from '@/components/catalog/BarChartPanel';
import { DataTable } from '@/components/catalog/DataTable';
import { PanelFrame } from './PanelFrame';

function Message({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}

function body(panel: SpecPanel, rows: Row[]) {
  if (panel.state === 'empty') return <Message text={panel.note ?? 'No data matches this question.'} />;
  switch (panel.kind) {
    case 'kpi': return <KpiCard panel={panel} rows={rows} />;
    case 'line': return <LineChartPanel panel={panel} rows={rows} />;
    case 'bar': return <BarChartPanel panel={panel} rows={rows} />;
    case 'table': return <DataTable panel={panel} rows={rows} />;
    default: return <Message text="This panel type is not supported." />;
  }
}

export function SpecRenderer({ panel, rows, onShowData }: {
  panel: SpecPanel; rows: Row[]; onShowData?: () => void;
}) {
  return <PanelFrame panel={panel} onShowData={onShowData}>{body(panel, rows)}</PanelFrame>;
}