'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setErr('Password must be at least 8 characters.');
    setBusy(true);
    setErr('');
    setInfo('');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) router.push('/app');
    else setInfo('Check your email to confirm your account, then sign in.');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <input className="w-full rounded bg-bg border border-border p-2" placeholder="Email" type="email"
          autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded bg-bg border border-border p-2" placeholder="Password (8+ characters)"
          type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        {info && <p role="status" className="text-sm text-muted">{info}</p>}
        <button disabled={busy || !email || !password} className="w-full rounded bg-accent p-2 text-white disabled:opacity-50">
          {busy ? 'Creating…' : 'Sign up'}
        </button>
        <p className="text-xs text-muted">
          By signing up you agree to the <Link href="/terms" className="text-accent">Terms</Link> and the{' '}
          <Link href="/privacy" className="text-accent">Privacy page</Link>.
        </p>
        <p className="text-sm text-muted">
          Already have an account? <Link href="/login" className="text-accent">Sign in</Link>
        </p>
      </form>
    </main>
  );
}