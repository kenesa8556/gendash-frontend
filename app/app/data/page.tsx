'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteImport, getDataStatus, getMe, ImportRecord, listImports, loadSampleData } from '@/lib/api';
import { ImportWizard } from '@/components/import/ImportWizard';

export default function DataPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [rows, setRows] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const hasData = (rows ?? 0) > 0;

  const refresh = useCallback(async (org: string) => {
    const [l, s] = await Promise.all([listImports(org), getDataStatus(org)]);
    setImports(l);
    setRows(s.rows);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace('/login');
      try {
        const me = await getMe();
        const saved = localStorage.getItem('gendash.org');
        const m = me.memberships.find((x) => x.orgId === saved) ?? me.memberships[0];
        if (!m) return router.replace('/app');
        setOrgId(m.orgId);
        setOrgName(m.name);
        setIsOwner(m.role === 'owner');
        await refresh(m.orgId);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [router, refresh]);

  async function useSample() {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const r = await loadSampleData(orgId);
      setMsg(`Loaded ${r.rowsImported} sample sales. Go back and ask a question.`);
      await refresh(orgId);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this import and all the sales it added? Saved dashboards will lose their data trail.')) return;
    setBusy(true);
    setErr('');
    try {
      await deleteImport(orgId, id);
      await refresh(orgId);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <header className="space-y-1">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={14} /> Back to dashboards
        </Link>
        <h1 className="text-xl font-semibold">Data{orgName ? ` · ${orgName}` : ''}</h1>
        <p className="text-sm text-muted">
          {rows === null ? 'Loading…' : hasData ? `${rows.toLocaleString()} sales in this shop.` : 'This shop has no sales data yet.'}
        </p>
      </header>

      {err && <p role="alert" className="rounded border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{err}</p>}
      {msg && <p role="status" className="rounded border border-border bg-surface p-3 text-sm">{msg}</p>}

      {!isOwner && rows !== null && (
        <p className="rounded border border-border bg-surface p-3 text-sm text-muted">
          Only the shop owners can add or delete data.
        </p>
      )}

      {isOwner && rows !== null && (
        <>
          {!hasData && (
            <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="font-medium">Just want to try it?</h2>
              <p className="text-sm text-muted">Load 6 months of made-up sales for a small clothing shop. You can delete them later.</p>
              <button onClick={useSample} disabled={busy}
                className="flex items-center gap-2 rounded border border-border px-4 py-2 hover:bg-surface-2 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />} Use sample data
              </button>
            </section>
          )}
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted">{hasData ? 'Add more data' : 'Upload your own sales'}</h2>
            <ImportWizard orgId={orgId} hasData={hasData} onDone={() => refresh(orgId)} />
          </section>
        </>
      )}

      {imports.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Import history</h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {imports.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="min-w-0 flex-1 break-words">
                  {i.filename}
                  <span className="ml-2 text-xs text-muted">
                    {i.rows_imported} rows{i.rows_skipped > 0 ? `, ${i.rows_skipped} skipped` : ''} · {i.mode} · {new Date(i.created_at).toLocaleString()}
                  </span>
                </span>
                {isOwner && (
                  <button aria-label={`Delete ${i.filename}`} disabled={busy} onClick={() => remove(i.id)}
                    className="rounded p-1 text-muted hover:text-danger disabled:opacity-50"><Trash2 size={14} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}