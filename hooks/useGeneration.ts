'use client';
import { useCallback, useReducer, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { streamGenerate } from '@/lib/sse';
import { Row, SpecPanel, StreamEvent } from '@/types/spec';

export type Status = 'idle' | 'planning' | 'streaming' | 'done' | 'error' | 'cancelled';
type PanelData = { panel: SpecPanel; rows: Row[] };
export interface GenState {
  status: Status;
  title: string;
  panelCount: number;
  panels: PanelData[];
  runId: string;
  error: string;
  warning: string;
  latencyMs?: number;
}

const initial: GenState = {
  status: 'idle', title: '', panelCount: 0, panels: [], runId: '', error: '', warning: '',
};

type Action =
  | { type: 'start' }
  | { type: 'cancel' }
  | { type: 'fail'; message: string }
  | { type: 'load'; title: string; panels: PanelData[] }
  | { type: 'event'; e: StreamEvent };

function reducer(s: GenState, a: Action): GenState {
  switch (a.type) {
    case 'start': return { ...initial, status: 'planning' };
    case 'cancel': return { ...s, status: 'cancelled' };
    case 'fail': return { ...s, status: 'error', error: a.message };
    case 'load':
      return { ...initial, status: 'done', title: a.title, panelCount: a.panels.length, panels: a.panels };
    case 'event': {
      const e = a.e;
      switch (e.type) {
        case 'plan':
          return { ...s, status: 'streaming', title: e.title, panelCount: e.panelCount, runId: e.runId };
        case 'panel':
          return {
            ...s,
            panels: [...s.panels, { panel: e.panel, rows: e.rows }].sort((x, y) =>
              x.panel.id.localeCompare(y.panel.id)),
          };
        case 'done': return { ...s, status: 'done', latencyMs: e.latencyMs };
        case 'warning': return { ...s, warning: e.message };
        case 'error': return { ...s, status: 'error', error: e.message };
        default: return s;
      }
    }
    default: return s;
  }
}

async function getToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) throw Object.assign(new Error('expired'), { status: 401 });
    return data.session.access_token;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw Object.assign(new Error('expired'), { status: 401 });
  return data.session.access_token;
}

export function useGeneration() {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (question: string, orgId: string, dashboardId?: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    dispatch({ type: 'start' });

    const attempt = async (force: boolean) =>
      streamGenerate({
        question,
        dashboardId,
        token: await getToken(force),
        orgId,
        signal: ac.signal,
        onEvent: (e) => dispatch({ type: 'event', e }),
      });

    try {
      try {
        await attempt(false);
      } catch (e: any) {
        if (e.status === 401) await attempt(true); // stale token: refresh once and retry
        else throw e;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      dispatch({
        type: 'fail',
        message:
          e.status === 401
            ? 'Your session expired. Please sign out and sign in again.'
            : e.message ?? 'Something went wrong.',
      });
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'cancel' });
  }, []);

  const load = useCallback((title: string, panels: PanelData[]) => {
    abortRef.current?.abort();
    dispatch({ type: 'load', title, panels });
  }, []);

  return { state, run, cancel, load };
}