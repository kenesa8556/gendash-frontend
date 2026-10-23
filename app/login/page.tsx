'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
    else router.push('/app');
  }

  const input =
    'w-full rounded bg-bg border border-border p-2 text-text placeholder:text-muted';

  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-surface p-6"
      >
        <h1 className="text-xl font-semibold">GenDash</h1>
        <input
          className={input}
          type="email"
          autoComplete="email"
          aria-label="Email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={input}
          type="password"
          autoComplete="current-password"
          aria-label="Password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-sm text-danger">{err}</p>}
        <button
          disabled={busy}
          className="w-full rounded bg-accent p-2 font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-sm text-muted">
          New here?{' '}
          <Link href="/signup" className="text-accent">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}