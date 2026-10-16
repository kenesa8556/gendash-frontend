'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export function AuthButtons({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  const pad = size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm';

  if (signedIn)
    return <Link href="/app" className={`rounded bg-accent text-white ${pad}`}>Open GenDash</Link>;
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className={`rounded border border-border hover:bg-surface ${pad}`}>Sign in</Link>
      <Link href="/signup" className={`rounded bg-accent text-white ${pad}`}>Get started free</Link>
    </div>
  );
}