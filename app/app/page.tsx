'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { streamGenerate } from '@/lib/sse';
import { SPEC_VERSION, StreamEvent } from '@/types/spec';

type Org = { id: string; name: string };
type Line = { t: number; text: string };

function summarize(e: StreamEvent): string {
  switch (e.type) {
    case 'status': return `status: ${e.stage}`;
    case 'plan': return `plan: "${e.title}" (${e.panelCount} panels)`;
    case 'panel': return `panel ${e.panel.id}: ${e.panel.label} [${e.rows.length} rows]`;
    case 'done': return `done in ${e.latencyMs} ms (attempts ${e.attempts})`;
    case 'warning': return `warning: ${e.message}`;
    case 'error': return `error: ${e.message}`;
  }
}

export default function AppPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState('');
  const [question, setQuestion] = useState(
    'Show monthly sales for each branch over the last 6 months, and my best-selling category',
  );
  const [log, setLog] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace('/login');

      const { data: m, error: e1 } = await supabase
        .from('members')
        .select('org_id, organizations(name)');
      if (e1 || !m?.length) return setError(e1?.message ?? 'No organization found');
      const list = (m as any[]).map((x) => ({
        id: x.org_id as string,
        name: (x.organizations?.name ?? x.org_id) as string,
      }));
      setOrgs(list);
      setOrgId(list[0].id);

      try {
        const s = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/semantic`).then((r) => r.json());
        if (s.specVersion !== SPEC_VERSION)
          setError(`Version mismatch: backend ${s.specVersion}, frontend ${SPEC_VERSION}`);
      } catch {
        setError('Cannot reach the API');
      }
    })();
  }, [router]);

  async function run() {
    setLog([]);
    setError('');
    setRunning(true);
    const ac = new AbortController();
    abortRef.current = ac;
    const t0 = Date.now();
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace('/login');
      await streamGenerate({
        question,
        token: data.session.access_token,
        orgId,
        signal: ac.signal,
        onEvent: (e) => setLog((l) => [...l, { t: Date.now() - t0, text: summarize(e) }]),
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">GenDash: stream test</h1>

      <select value={orgId} onChange={(e) => setOrgId(e.target.value)}
        className="rounded bg-neutral-900 border border-neutral-700 p-2">
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>

      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} maxLength={300}
        className="w-full rounded bg-neutral-900 border border-neutral-700 p-2" />

      <div className="flex gap-2">
        <button onClick={run} disabled={running || !orgId} className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50">
          {running ? 'Working…' : 'Generate'}
        </button>
        {running && (
          <button onClick={() => abortRef.current?.abort()} className="rounded border border-neutral-600 px-4 py-2">
            Cancel
          </button>
        )}
      </div>

      {error && <p className="rounded bg-red-950 border border-red-800 p-2 text-sm text-red-300">{error}</p>}

      <ul className="font-mono text-sm space-y-1">
        {log.map((l, i) => (
          <li key={i}><span className="text-neutral-500">+{l.t}ms</span> {l.text}</li>
        ))}
      </ul>
    </main>
  );
}