'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGeneration } from '@/hooks/useGeneration';
import { SPEC_VERSION } from '@/types/spec';
import { SpecRenderer } from '@/components/renderer/SpecRenderer';
import { PanelSkeleton } from '@/components/renderer/PanelFrame';
import { ProvenanceDrawer } from '@/components/provenance/ProvenanceDrawer';

type Org = { id: string; name: string };

const EXAMPLES = [
  'Show monthly sales for each branch over the last 6 months, and my best-selling category',
  'Total revenue',
  'Compare revenue by category as a bar chart',
  'List items by units sold as a table',
];

export default function AppPage() {
  const router = useRouter();
  const { state, run, cancel } = useGeneration();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState('');
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [setupError, setSetupError] = useState('');
  const [trail, setTrail] = useState<{ queryId: string; label: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace('/login');
      const { data: m, error } = await supabase
        .from('members').select('org_id, organizations(name)');
      if (error || !m?.length) return setSetupError(error?.message ?? 'No organization found');
      const list = (m as any[]).map((x) => ({
        id: x.org_id as string,
        name: (x.organizations?.name ?? x.org_id) as string,
      }));
      setOrgs(list);
      setOrgId(list[0].id);
      try {
        const s = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/semantic`).then((r) => r.json());
        if (s.specVersion !== SPEC_VERSION)
          setSetupError(`Version mismatch: backend ${s.specVersion}, frontend ${SPEC_VERSION}`);
      } catch {
        setSetupError('Cannot reach the API');
      }
    })();
  }, [router]);

  const busy = state.status === 'planning' || state.status === 'streaming';
  const pending = busy ? Math.max(state.status === 'planning' ? 2 : state.panelCount - state.panels.length, 0) : 0;
  const error = setupError || state.error;

  return (
    <main className="min-h-screen max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">GenDash</h1>
        <div className="flex items-center gap-2">
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} aria-label="Organization"
            className="rounded border border-border bg-surface px-2 py-1.5 text-sm">
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button aria-label="Sign out"
            onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}
            className="rounded border border-border p-2 hover:bg-surface"><LogOut size={16} /></button>
        </div>
      </header>

      <section className="space-y-3">
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} maxLength={300}
          aria-label="Your question" placeholder="Ask a question about your sales…"
          className="w-full rounded-lg border border-border bg-surface p-3 focus:outline-none focus:border-accent" />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => run(question, orgId)} disabled={busy || !orgId || !question.trim()}
            className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? 'Working…' : 'Generate'}
          </button>
          {busy && (
            <button onClick={cancel}
              className="rounded border border-border px-3 py-2 flex items-center gap-1 hover:bg-surface">
              <X size={16} /> Cancel
            </button>
          )}
          <div className="flex flex-wrap gap-2 ml-auto">
            {EXAMPLES.slice(1).map((ex) => (
              <button key={ex} onClick={() => setQuestion(ex)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-text hover:bg-surface">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</p>
      )}
      {state.warning && <p className="rounded border border-warn/50 bg-warn/10 p-3 text-sm text-warn">{state.warning}</p>}
      {state.status === 'cancelled' && <p className="text-sm text-muted">Cancelled.</p>}

      {(state.title || busy) && (
        <section className="space-y-4" aria-live="polite">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">
              {state.title || 'Planning your dashboard…'}
            </h2>
            {state.status === 'done' && state.latencyMs && (
              <span className="text-xs text-muted">{(state.latencyMs / 1000).toFixed(1)} s</span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {state.panels.map(({ panel, rows }) => (
              <div key={panel.id} className={panel.kind === 'line' || panel.kind === 'table' ? 'md:col-span-2' : ''}>
                <SpecRenderer panel={panel} rows={rows}
                    onShowData={() => setTrail({ queryId: panel.queryId, label: panel.label })} />
              </div>
            ))}
            {Array.from({ length: pending }).map((_, i) => <PanelSkeleton key={`s${i}`} />)}
          </div>
        </section>
      )}
            {trail && (
        <ProvenanceDrawer queryId={trail.queryId} orgId={orgId} label={trail.label} onClose={() => setTrail(null)} />
      )}
    </main>
  );
}