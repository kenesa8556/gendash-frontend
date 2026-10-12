'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createOrganization } from '@/lib/api';

const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'KES', 'NGN', 'GHS', 'ZAR', 'UGX', 'TZS'];

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const o = await createOrganization(name, currency);
      localStorage.setItem('gendash.org', o.orgId);
      router.replace('/app');
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Create your shop</h1>
        <p className="text-sm text-muted">This is where your sales data and dashboards will live.</p>
        <input className="w-full rounded bg-bg border border-border p-2" placeholder="Shop name" maxLength={60}
          value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block text-sm text-muted">
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded bg-bg border border-border p-2 text-text">
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <button disabled={busy || name.trim().length < 2}
          className="w-full rounded bg-accent p-2 text-white disabled:opacity-50">
          {busy ? 'Creating…' : 'Create shop'}
        </button>
      </form>
    </main>
  );
}