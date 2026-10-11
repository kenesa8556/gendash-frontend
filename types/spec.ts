export const SPEC_VERSION = 1;

export type PanelKind = 'kpi' | 'line' | 'bar' | 'table';
export type Row = Record<string, unknown>;

export interface SpecPanel {
  id: string;
  kind: PanelKind;
  currency?: string;
  label: string;
  queryId: string;
  format: 'currency' | 'number';
  state: 'ok' | 'empty' | 'fallback';
  partialLastPeriod: boolean;
  note?: string;
}

export type StreamEvent =
  | { type: 'status'; stage: string }
  | { type: 'plan'; runId: string; title: string; panelCount: number }
  | { type: 'panel'; panel: SpecPanel; rows: Row[] }
  | { type: 'done'; runId: string; attempts: number; latencyMs: number }
  | { type: 'warning'; message: string }
  | { type: 'error'; message: string };