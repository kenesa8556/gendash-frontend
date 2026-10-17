'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getMe, listMembers, listSentInvitations, Member, removeMember, revokeInvitation,
  SentInvitation, sendInvitation, setMemberRole,
} from '@/lib/api';

export default function TeamPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<'owner' | 'member'>('member');
  const [myId, setMyId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [sent, setSent] = useState<SentInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = role === 'owner';

  const refresh = useCallback(async (org: string, owner: boolean) => {
    const [m, s] = await Promise.all([
      listMembers(org),
      owner ? listSentInvitations(org) : Promise.resolve([] as SentInvitation[]),
    ]);
    setMembers(m);
    setSent(s);
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
        setRole(m.role);
        setMyId(me.user.id);
        await refresh(m.orgId, m.role === 'owner');
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [router, refresh]);

  async function act(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await fn();
      if (ok) setMsg(ok);
      await refresh(orgId, isOwner);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    await act(
      () => sendInvitation(orgId, addr),
      'Invitation sent. Ask them to sign in with that email address and they will see it.',
    );
    setEmail('');
  }

  async function leave() {
    if (!window.confirm('Leave this shop?')) return;
    setBusy(true);
    setErr('');
    try {
      await removeMember(orgId, myId);
      router.replace('/app');
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <header className="space-y-1">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={14} /> Back to dashboards
        </Link>
        <h1 className="text-xl font-semibold">Team{orgName ? ` · ${orgName}` : ''}</h1>
        <p className="text-sm text-muted">You are {isOwner ? 'an owner' : 'a member'} of this shop.</p>
      </header>

      {err && <p role="alert" className="rounded border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{err}</p>}
      {msg && <p role="status" className="rounded border border-border bg-surface p-3 text-sm">{msg}</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Members</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {members.map((m) => {
            const me = m.user_id === myId;
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="min-w-0 flex-1 basis-48 break-all">{m.email}{me && <span className="ml-2 text-xs text-muted">(you)</span>}</span>
                {isOwner && !me ? (
                  <select value={m.role} disabled={busy} aria-label={`Role of ${m.email}`}
                    onChange={(e) => act(() => setMemberRole(orgId, m.user_id, e.target.value as 'owner' | 'member'))}
                    className="rounded border border-border bg-surface px-2 py-1">
                    <option value="member">member</option>
                    <option value="owner">owner</option>
                  </select>
                ) : (
                  <span className="rounded bg-surface-2 px-2 py-0.5 text-xs">{m.role}</span>
                )}
                {isOwner && !me && (
                  <button disabled={busy}
                    onClick={() => window.confirm(`Remove ${m.email}?`) && act(() => removeMember(orgId, m.user_id), 'Member removed.')}
                    className="text-xs text-muted hover:text-danger disabled:opacity-50">Remove</button>
                )}
                {me && (
                  <button disabled={busy} onClick={leave} className="text-xs text-muted hover:text-danger disabled:opacity-50">
                    Leave
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isOwner && (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted">Invite someone</h2>
            <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120}
                placeholder="their email address" aria-label="Email address to invite"
                className="flex-1 rounded border border-border min-w-0 w-full bg-surface p-2 focus:outline-none focus:border-accent" />
              <button disabled={busy || !email.trim()} className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">
                Invite
              </button>
            </form>
            <p className="text-xs text-muted">
              They will see your invitation the next time they sign in with that email address.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted">Invitations</h2>
            {sent.length === 0 && <p className="text-sm text-muted">No pending or declined invitations.</p>}
            <ul className="divide-y divide-border rounded-lg border border-border">
              {sent.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1 basis-48 break-all">{s.email}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'pending' ? 'bg-warn/20 text-warn' : 'bg-surface-2'}`}>
                    {s.status}
                  </span>
                  {s.status === 'pending' ? (
                    <button disabled={busy} onClick={() => act(() => revokeInvitation(orgId, s.id), 'Invitation cancelled.')}
                      className="text-xs text-muted hover:text-danger disabled:opacity-50">Cancel</button>
                  ) : (
                    <button disabled={busy} onClick={() => act(() => sendInvitation(orgId, s.email), 'Invited again.')}
                      className="text-xs text-muted hover:text-text disabled:opacity-50">Invite again</button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}