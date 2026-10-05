'use client';
import { useCallback, useReducer, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { streamGenerate } from '@/lib/sse';
import { Row, SpecPanel, StreamEvent } from '@/types/spec';

export type Status = 'idle' | 'planning' | 'streaming' | 'done' | 'error' | 'cancelled';
export interface GenState {
  status: Status;
  title: string;
  panelCount: number;
  panels: { panel: SpecPanel; rows: Row[] }[];
  error: string;
  warning: string;
  latencyMs?: number;
}

const initial: GenState = {
  status: 'idle', title: '', panelCount: 0, panels: [], error: '', warning: '',
};

type Action =
  | { type: 'start' }
  | { type: 'cancel' }
  | { type: 'fail'; message: string }
  | { type: 'event'; e: StreamEvent };

function reducer(s: GenState, a: Action): GenState {
  switch (a.type) {
    case 'start': return { ...initial, status: 'planning' };
    case 'cancel': return { ...s, status: 'cancelled' };
    case 'fail': return { ...s, status: 'error', error: a.message };
    case 'event': {
      const e = a.e;
      switch (e.type) {
        case 'plan':
          return { ...s, status: 'streaming', title: e.title, panelCount: e.panelCount };
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

export function useGeneration() {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (question: string, orgId: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    dispatch({ type: 'start' });
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Please sign in again.');
      await streamGenerate({
        question,
        token: data.session.access_token,
        orgId,
        signal: ac.signal,
        onEvent: (e) => dispatch({ type: 'event', e }),
      });
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      dispatch({ type: 'fail', message: e.message ?? 'Something went wrong.' });
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'cancel' });
  }, []);

  return { state, run, cancel };
}