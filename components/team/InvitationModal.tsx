'use client';
import { useEffect, useRef, useState } from 'react';
import { Invitation } from '@/lib/api';

export function InvitationModal({ invitation, onAccept, onDecline, onLater }: {
  invitation: Invitation;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onLater: () => void;
}) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [err, setErr] = useState('');
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { acceptRef.current?.focus(); }, [invitation.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onLater(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onLater]);

  async function run(kind: 'accept' | 'decline', fn: () => Promise<void>) {
    setBusy(kind);
    setErr('');
    try { await fn(); } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="invite-title"
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-6">
        <h2 id="invite-title" className="text-lg font-semibold">You have been invited</h2>
        <p className="text-sm">
          <span className="font-medium">{invitation.invitedBy || 'Someone'}</span> invited you to join{' '}
          <span className="font-medium">{invitation.orgName}</span> as a {invitation.role}.
        </p>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex flex-wrap gap-2">
          <button ref={acceptRef} disabled={!!busy} onClick={() => run('accept', onAccept)}
            className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">
            {busy === 'accept' ? 'Joining…' : 'Accept'}
          </button>
          <button disabled={!!busy} onClick={() => run('decline', onDecline)}
            className="rounded border border-border px-4 py-2 hover:bg-surface-2 disabled:opacity-50">
            {busy === 'decline' ? 'Declining…' : 'Decline'}
          </button>
          <button disabled={!!busy} onClick={onLater}
            className="ml-auto rounded px-3 py-2 text-sm text-muted hover:text-text disabled:opacity-50">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}