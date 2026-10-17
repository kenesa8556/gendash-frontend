import { SpecPanel } from '@/types/spec';
import { Database } from 'lucide-react';

export function PanelFrame({ panel, children, onShowData }: {
  panel: SpecPanel; children: React.ReactNode; onShowData?: () => void;
}) {
  return (
    <section aria-label={panel.label}
      className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
     <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-sm font-medium">{panel.label}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {panel.partialLastPeriod && (
            <span className="rounded bg-warn/20 px-2 py-0.5 text-xs text-warn">partial month</span>
          )}
          {onShowData && panel.state !== 'empty' && (
            <button onClick={onShowData}
              className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-surface-2 hover:text-text">
              <Database size={12} /> Show data
            </button>
          )}
        </div>
      </header>
      {children}
      {panel.note && panel.state !== 'empty' && <p className="text-xs text-muted">{panel.note}</p>}
    </section>
  );

}



export function PanelSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 animate-pulse space-y-3">
      <div className="h-4 w-2/3 rounded bg-surface-2" />
      <div className="h-40 rounded bg-surface-2" />
    </div>
  );
}