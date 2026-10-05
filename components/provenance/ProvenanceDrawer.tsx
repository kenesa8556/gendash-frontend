'use client';
import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { getQuery, QueryTrail } from '@/lib/api';

const cell = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('en-US') : String(v));

export function ProvenanceDrawer({ queryId, orgId, label, onClose }: {
  queryId: string; orgId: string; label: string; onClose: () => void;
}) {
  const [trail, setTrail] = useState<QueryTrail | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // the data trail is saved just after the dashboard finishes, so retry a 404 briefly
      for (let i = 0; i < 3; i++) {
        try {
          const t = await getQuery(queryId, orgId);
          if (alive) setTrail(t);
          return;
        } catch (e: any) {
          if (e.status !== 404 || i === 2) { if (alive) setError(e.message); return; }
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    })();
    return () => { alive = false; };
  }, [queryId, orgId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copy() {
    if (!trail) return;
    await navigator.clipboard.writeText(trail.sql_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const cols = Object.keys(trail?.rows[0] ?? {});

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Data behind this panel"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface p-4 space-y-5">
        <header className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted">Where these numbers come from</p>
            <h2 className="text-sm font-medium">{label}</h2>
          </div>
          <button autoFocus aria-label="Close" onClick={onClose}
            className="rounded border border-border p-1.5 hover:bg-surface-2"><X size={16} /></button>
        </header>

        {!trail && !error && <p className="text-sm text-muted">Loading the data trail…</p>}
        {error && (
          <p role="alert" className="rounded border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</p>
        )}

        {trail && (
          <>
            <section>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-xs text-muted">SQL query</h3>
                <button onClick={copy} className="flex items-center gap-1 text-xs text-muted hover:text-text">
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-bg p-3 font-mono text-xs">{trail.sql_text}</pre>
            </section>

            <section>
              <h3 className="mb-1 text-xs text-muted">Parameters</h3>
              <ul className="font-mono text-xs space-y-0.5">
                {trail.params.map((p, i) => <li key={i}>{'$' + (i + 1)} = {JSON.stringify(p)}</li>)}
              </ul>
            </section>

            <section>
              <h3 className="mb-1 text-xs text-muted">{trail.row_count} rows returned</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      {cols.map((c) => <th key={c} className="py-1 pr-3 font-medium">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {trail.rows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {cols.map((c) => <td key={c} className="py-1 pr-3 tabular-nums">{cell(r[c])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-xs text-muted">Executed {new Date(trail.executed_at).toLocaleString()}</p>
          </>
        )}
      </aside>
    </div>
  );
}