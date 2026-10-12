import { supabase } from './supabase';
import { Row, SpecPanel } from '@/types/spec';

async function authFetch(path: string, orgId: string | null, init: RequestInit = {}): Promise<any> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw Object.assign(new Error('Please sign in again.'), { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
        headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(orgId ? { 'x-org-id': orgId } : {}),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return res.json();
}

export interface QueryTrail {
  id: string;
  panel_id: string;
  sql_text: string;
  params: unknown[];
  row_count: number;
  rows: Row[];
  executed_at: string;
}

export async function getQuery(id: string, orgId: string): Promise<QueryTrail> {
  try {
    return await authFetch(`/queries/${id}`, orgId);
  } catch (e: any) {
    if (e.status === 404) e.message = 'The data trail is not available yet. Try again in a moment.';
    throw e;
  }
}

export interface DashboardSummary { id: string; title: string; version: number; updated_at: string }
export interface DashboardFull {
  id: string;
  title: string;
  version: number;
  spec: { title: string; panels: SpecPanel[] };
  data: Record<string, Row[]>;
}

export const listDashboards = (orgId: string): Promise<DashboardSummary[]> =>
  authFetch('/dashboards', orgId);
export const loadDashboard = (id: string, orgId: string): Promise<DashboardFull> =>
  authFetch(`/dashboards/${id}`, orgId);
export const deleteDashboard = (id: string, orgId: string) =>
  authFetch(`/dashboards/${id}`, orgId, { method: 'DELETE' });

// the run is saved just after the stream ends, so retry a 404 briefly
export async function saveDashboard(runId: string, orgId: string, title?: string) {
  for (let i = 0; ; i++) {
    try {
      return (await authFetch('/dashboards', orgId, {
        method: 'POST',
        body: JSON.stringify({ runId, title }),
      })) as { id: string; title: string; version: number };
    } catch (e: any) {
      if (e.status !== 404 || i >= 2) throw e;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
}
export interface Membership { orgId: string; role: 'owner' | 'member'; name: string; currency: string }
export interface Me { user: { id: string; email: string }; memberships: Membership[]; invitations: unknown[] }

export const getMe = (): Promise<Me> => authFetch('/me', null);
export const createOrganization = (name: string, currency: string): Promise<{ orgId: string; name: string; currency: string; role: string }> =>
  authFetch('/organizations', null, { method: 'POST', body: JSON.stringify({ name, currency }) });