'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Upload } from 'lucide-react';
import { ImportPreview, ImportReport, previewImport, runImport } from '@/lib/api';

type Field = 'date' | 'amount' | 'qty' | 'branch' | 'category' | 'item';
type Step = 'upload' | 'match' | 'review' | 'done';
const MAX_BYTES = 5 * 1024 * 1024;
const FIELDS: { key: Field; label: string; required?: boolean; hint: string }[] = [
  { key: 'date', label: 'Date', required: true, hint: 'When the sale happened' },
  { key: 'amount', label: 'Amount', required: true, hint: 'Money received for the sale' },
  { key: 'qty', label: 'Quantity', hint: 'Optional, defaults to 1' },
  { key: 'branch', label: 'Branch', hint: 'Optional' },
  { key: 'category', label: 'Category', hint: 'Optional' },
  { key: 'item', label: 'Item', hint: 'Optional' },
];

export function ImportWizard({ orgId, hasData, onDone }: { orgId: string; hasData: boolean; onDone: () => void }) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [dateOrder, setDateOrder] = useState<'dmy' | 'mdy'>('dmy');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(f: File | undefined) {
    if (!f) return;
    setErr('');
    if (/\.xlsx?$/i.test(f.name))
      return setErr('Excel files are coming soon. For now, open your sheet in Excel, choose File → Save As → CSV, and upload that.');
    if (!/\.csv$/i.test(f.name)) return setErr('Please choose a .csv file.');
    if (f.size > MAX_BYTES) return setErr('That file is larger than 5 MB.');
    setBusy(true);
    try {
      const p = await previewImport(orgId, f);
      setFile(f);
      setPreview(p);
      setMapping(p.mapping);
      setDateOrder(p.dateOrder);
      setStep('match');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const used = Object.values(mapping).filter((v): v is number => v != null);
  const duplicate = new Set(used).size !== used.length;
  const ready = mapping.date != null && mapping.amount != null && !duplicate;

  async function go(dryRun: boolean) {
    setBusy(true);
    setErr('');
    try {
      const r = await runImport(orgId, file!, mapping, { mode: hasData ? mode : 'append', dateOrder, dryRun });
      setReport(r);
      if (dryRun) setStep('review');
      else {
        setStep('done');
        onDone();
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep('upload'); setFile(null); setPreview(null); setReport(null); setErr(''); setMode('append');
  }

  const steps = ['Upload', 'Match columns', 'Review', 'Done'];
  const idx = ['upload', 'match', 'review', 'done'].indexOf(step);

  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <ol className="flex flex-wrap gap-3 text-xs text-muted" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} className={i === idx ? 'font-medium text-text' : ''}>{i + 1}. {s}</li>
        ))}
      </ol>

      {err && <p role="alert" className="rounded border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{err}</p>}

      {step === 'upload' && (
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center hover:bg-surface-2">
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            <span className="text-sm">Choose your sales file (.csv, up to 5 MB)</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" disabled={busy}
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <p className="text-xs text-muted">
            Needs at least a date and an amount for each sale. Branch, category, item and quantity are optional.
            Using Excel? Choose File → Save As → CSV first.
          </p>
        </div>
      )}

      {step === 'match' && preview && (
        <div className="space-y-4">
          <p className="text-sm">
            <span className="font-medium">{preview.filename}</span>: {preview.totalRows} rows found. Check that each item
            points at the right column in your file.
          </p>
          <div className="space-y-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-28">{f.label}{f.required && <span className="text-danger"> *</span>}</span>
                <select value={mapping[f.key] ?? ''} aria-label={`Column for ${f.label}`}
                  onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === '' ? null : Number(e.target.value) })}
                  className="rounded border border-border bg-bg px-2 py-1">
                  <option value="">{f.required ? 'Choose a column…' : '(not in my file)'}</option>
                  {preview.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
                <span className="text-xs text-muted">{f.hint}</span>
              </label>
            ))}
            <label className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-28">Date format</span>
              <select value={dateOrder} onChange={(e) => setDateOrder(e.target.value as 'dmy' | 'mdy')}
                className="rounded border border-border bg-bg px-2 py-1">
                <option value="dmy">Day / Month / Year (03/09/2026 = 3 September)</option>
                <option value="mdy">Month / Day / Year (03/09/2026 = 9 March)</option>
              </select>
              <span className="text-xs text-muted">Only matters for dates written with slashes</span>
            </label>
          </div>
          {duplicate && <p role="alert" className="text-sm text-danger">Each column can be used only once.</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  {preview.headers.map((h, i) => <th key={i} className="py-1 pr-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.sample.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {preview.headers.map((_, c) => <td key={c} className="py-1 pr-3">{r[c]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="rounded border border-border px-4 py-2 hover:bg-surface-2">Choose another file</button>
            <button disabled={!ready || busy} onClick={() => go(true)}
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">
              {busy ? 'Checking…' : 'Check my data'}
            </button>
          </div>
        </div>
      )}

      {step === 'review' && report && (
        <div className="space-y-4">
          <p className="text-sm">
            <span className="font-medium">{report.rowsValid}</span> rows are ready to import
            {report.rowsSkipped > 0 && <>, <span className="font-medium text-warn">{report.rowsSkipped}</span> will be skipped</>}.
            {report.dateRange && <> Sales from {report.dateRange.from} to {report.dateRange.to}.</>}
          </p>
          {report.rowsSkipped > 0 && (
            <div className="space-y-1 text-sm">
              <p className="text-muted">Why rows are skipped:</p>
              <ul className="list-disc pl-5">
                {Object.entries(report.reasons).map(([r, n]) => <li key={r}>{n} × {r}</li>)}
              </ul>
              <p className="text-xs text-muted">
                First problems (line numbers match your file, the header is line 1):{' '}
                {report.issues.slice(0, 8).map((i) => `line ${i.line}`).join(', ')}
              </p>
            </div>
          )}
          {report.sample.length > 0 && (
            <div className="overflow-x-auto">
              <p className="mb-1 text-xs text-muted">How the first rows will look:</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    {Object.keys(report.sample[0]).map((k) => <th key={k} className="py-1 pr-3 font-medium">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.sample.map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Object.values(r).map((v, c) => <td key={c} className="py-1 pr-3">{String(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hasData && (
            <fieldset className="space-y-1 text-sm">
              <legend className="mb-1 text-muted">This shop already has data. What should happen?</legend>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} /> Add these rows to the existing data
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                Replace everything with this file <span className="text-danger">(deletes the current data)</span>
              </label>
            </fieldset>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep('match')} className="rounded border border-border px-4 py-2 hover:bg-surface-2">Back</button>
            <button disabled={busy || report.rowsValid === 0} onClick={() => go(false)}
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">
              {busy ? 'Importing…' : `Import ${report.rowsValid} rows`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && report && (
        <div className="space-y-3">
          <p className="text-sm">Imported <span className="font-medium">{report.rowsValid}</span> rows. You can now ask questions about them.</p>
          <div className="flex gap-2">
            <Link href="/app" className="rounded bg-accent px-4 py-2 text-white">Ask a question</Link>
            <button onClick={reset} className="rounded border border-border px-4 py-2 hover:bg-surface-2">Upload another file</button>
          </div>
        </div>
      )}
    </section>
  );
}