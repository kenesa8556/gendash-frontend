'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Loader2, LogOut, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGeneration } from '@/hooks/useGeneration';
import {
  DashboardSummary, deleteDashboard, listDashboards, loadDashboard, saveDashboard,
} from '@/lib/api';
import { SPEC_VERSION } from '@/types/spec';
import { SpecRenderer } from '@/components/renderer/SpecRenderer';
import { PanelSkeleton } from '@/components/renderer/PanelFrame';
import { ProvenanceDrawer } from '@/components/provenance/ProvenanceDrawer';

type Org = { id: string; name: string };
type Current = { id: string; title: string; version: number };

const EXAMPLES = [
  'Show monthly sales for each branch over the last 6 months, and my best-selling category',
  'Total revenue',
  'Compare revenue by category as a bar chart',
  'List items by units sold as a table',
];

export default function AppPage() {
  const router = useRouter();
  const { state, run, cancel, load } = useGeneration();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState('');
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [setupError, setSetupError] = useState('');
  const [trail, setTrail] = useState<{ queryId: string; label: string } | null>(null);
  const [saved, setSaved] = useState<DashboardSummary[]>([]);
  const [current, setCurrent] = useState<Current | null>(null);
  const [refine, setRefine] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const pendingRefresh = useRef(false);

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
      const savedOrg = localStorage.getItem('gendash.org');
      setOrgId(list.find((o) => o.id === savedOrg)?.id ?? list[0].id);
      try {
        const s = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/semantic`).then((r) => r.json());
        if (s.specVersion !== SPEC_VERSION)
          setSetupError(`Version mismatch: backend ${s.specVersion}, frontend ${SPEC_VERSION}`);
      } catch {
        setSetupError('Cannot reach the API');
      }
    })();
  }, [router]);

  const refreshList = useCallback(async (org: string) => {
    try {
      const l = await listDashboards(org);
      setSaved(l);
      return l;
    } catch (e: any) {
      setNotice(e.message);
    }
  }, []);

  useEffect(() => {
    if (!orgId) return;
    setCurrent(null);
    refreshList(orgId);
  }, [orgId, refreshList]);

  // after a refine finishes, the server saves the new version a moment later
  useEffect(() => {
    if (state.status !== 'done' || !pendingRefresh.current) return;
    pendingRefresh.current = false;
    const t = setTimeout(async () => {
      const l = await refreshList(orgId);
      setCurrent((c) => {
        const m = l?.find((d) => d.id === c?.id);
        return c && m ? { ...c, version: m.version } : c;
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [state.status, orgId, refreshList]);

  const busy = state.status === 'planning' || state.status === 'streaming';
  const pending = busy
    ? Math.max(state.status === 'planning' ? 2 : state.panelCount - state.panels.length, 0)
    : 0;
  const error = setupError || state.error;

  function generate() {
    setCurrent(null);
    setNotice('');
    run(question, orgId);
  }

  function doRefine() {
    if (!current || !refine.trim()) return;
    pendingRefresh.current = true;
    setNotice('');
    run(refine.trim(), orgId, current.id);
    setRefine('');
  }

  async function save() {
    setSaving(true);
    setNotice('');
    try {
      const d = await saveDashboard(state.runId, orgId);
      setCurrent({ id: d.id, title: d.title, version: d.version });
      await refreshList(orgId);
      setNotice('Saved.');
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function open(id: string) {
    setNotice('');
    try {
      const d = await loadDashboard(id, orgId);
      load(d.spec.title ?? d.title, d.spec.panels.map((p) => ({ panel: p, rows: d.data[p.queryId] ?? [] })));
      setCurrent({ id: d.id, title: d.title, version: d.version });
    } catch (e: any) {
      setNotice(e.message);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this dashboard?')) return;
    try {
      await deleteDashboard(id, orgId);
      if (current?.id === id) setCurrent(null);
      await refreshList(orgId);
    } catch (e: any) {
      setNotice(e.message);
    }
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">GenDash</h1>
        <div className="flex items-center gap-2">
          <select value={orgId} aria-label="Organization"
            onChange={(e) => { setOrgId(e.target.value); localStorage.setItem('gendash.org', e.target.value); }}
            className="rounded border border-border bg-surface px-2 py-1.5 text-sm">
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button aria-label="Sign out"
            onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}
            className="rounded border border-border p-2 hover:bg-surface"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <aside aria-label="Saved dashboards" className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Saved dashboards</h2>
          {saved.length === 0 && <p className="text-xs text-muted">Nothing saved yet.</p>}
          <ul className="space-y-1">
            {saved.map((d) => (
              <li key={d.id}
                className={`flex items-center gap-1 rounded border p-2 text-sm ${
                  current?.id === d.id ? 'border-accent bg-surface' : 'border-border'}`}>
                <button onClick={() => open(d.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate">{d.title}</span>
                  <span className="text-xs text-muted">v{d.version}</span>
                </button>
                <button aria-label={`Delete ${d.title}`} onClick={() => remove(d.id)}
                  className="rounded p-1 text-muted hover:text-danger"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-6 min-w-0">
          <section className="space-y-3">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} maxLength={300}
              aria-label="Your question" placeholder="Ask a question about your sales…"
              className="w-full rounded-lg border border-border bg-surface p-3 focus:outline-none focus:border-accent" />
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={generate} disabled={busy || !orgId || !question.trim()}
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
          {state.warning && (
            <p className="rounded border border-warn/50 bg-warn/10 p-3 text-sm text-warn">{state.warning}</p>
          )}
          {notice && <p role="status" className="text-sm text-muted">{notice}</p>}
          {state.status === 'cancelled' && <p className="text-sm text-muted">Cancelled.</p>}

          {(state.title || busy) && (
            <section className="space-y-4" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium">
                  {state.title || 'Planning your dashboard…'}
                  {current && <span className="ml-2 text-xs text-muted">saved · v{current.version}</span>}
                </h2>
                <div className="flex items-center gap-3">
                  {state.status === 'done' && state.latencyMs && (
                    <span className="text-xs text-muted">{(state.latencyMs / 1000).toFixed(1)} s</span>
                  )}
                  {state.status === 'done' && state.runId && !current && (
                    <button onClick={save} disabled={saving}
                      className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-50">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />} Save
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {state.panels.map(({ panel, rows }) => (
                  <div key={panel.id}
                    className={panel.kind === 'line' || panel.kind === 'table' ? 'md:col-span-2' : ''}>
                    <SpecRenderer panel={panel} rows={rows}
                      onShowData={() => setTrail({ queryId: panel.queryId, label: panel.label })} />
                  </div>
                ))}
                {Array.from({ length: pending }).map((_, i) => <PanelSkeleton key={`s${i}`} />)}
              </div>

              {current && !busy && (
                <div className="flex gap-2">
                  <input value={refine} onChange={(e) => setRefine(e.target.value)} maxLength={300}
                    onKeyDown={(e) => { if (e.key === 'Enter') doRefine(); }}
                    aria-label="Refine this dashboard" placeholder='Refine it, e.g. "only dresses"'
                    className="flex-1 rounded-lg border border-border bg-surface p-2 focus:outline-none focus:border-accent" />
                  <button onClick={doRefine} disabled={!refine.trim()}
                    className="rounded border border-border px-4 py-2 hover:bg-surface disabled:opacity-50">
                    Refine
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {trail && (
        <ProvenanceDrawer queryId={trail.queryId} orgId={orgId} label={trail.label}
          onClose={() => setTrail(null)} />
      )}
    </main>
  );
}