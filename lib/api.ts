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
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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
export interface Me { user: { id: string; email: string }; memberships: Membership[]; invitations: Invitation[] }

export const getMe = (): Promise<Me> => authFetch('/me', null);
export const createOrganization = (name: string, currency: string): Promise<{ orgId: string; name: string; currency: string; role: string }> =>
  authFetch('/organizations', null, { method: 'POST', body: JSON.stringify({ name, currency }) });


export interface Invitation { id: string; role: string; orgName: string; invitedBy: string; createdAt: string }
export interface Member { user_id: string; email: string; role: 'owner' | 'member'; joined_at: string }
export interface SentInvitation { id: string; email: string; role: string; status: string; created_at: string }

export const listMembers = (orgId: string): Promise<Member[]> => authFetch('/members', orgId);
export const listSentInvitations = (orgId: string): Promise<SentInvitation[]> => authFetch('/invitations', orgId);
export const sendInvitation = (orgId: string, email: string) =>
  authFetch('/invitations', orgId, { method: 'POST', body: JSON.stringify({ email }) });
export const revokeInvitation = (orgId: string, id: string) =>
  authFetch(`/invitations/${id}`, orgId, { method: 'DELETE' });
export const setMemberRole = (orgId: string, userId: string, role: 'owner' | 'member') =>
  authFetch(`/members/${userId}`, orgId, { method: 'PUT', body: JSON.stringify({ role }) });
export const removeMember = (orgId: string, userId: string) =>
  authFetch(`/members/${userId}`, orgId, { method: 'DELETE' });
export const respondInvitation = (id: string, accept: boolean): Promise<{ accepted: boolean; orgId?: string }> =>
  authFetch(`/invitations/${id}/respond`, null, { method: 'POST', body: JSON.stringify({ accept }) });

export interface ImportPreview {
  filename: string; headers: string[]; totalRows: number; sample: string[][];
  mapping: Record<string, number | null>; missingRequired: string[];
  dateOrder: 'dmy' | 'mdy'; dateOrderAmbiguous: boolean;
  sheets?: string[]; sheet?: string;
}
export interface ImportReport {
  dryRun?: boolean; rowsTotal: number; rowsValid: number; rowsSkipped: number;
  reasons: Record<string, number>; issues: { line: number; reason: string; text: string }[];
  dateRange: { from: string; to: string } | null; sample: Record<string, unknown>[]; importId?: string;
}
export interface ImportRecord {
  id: string; filename: string; rows_imported: number; rows_skipped: number; mode: string; created_at: string;
}

export const previewImport = (orgId: string, file: File, sheet?: string): Promise<ImportPreview> => {
  const f = new FormData();
  f.append('file', file);
  if (sheet) f.append('sheet', sheet);
  return authFetch('/imports/preview', orgId, { method: 'POST', body: f });
};

export const runImport = (
  orgId: string, file: File, mapping: Record<string, number | null>,
  o: { mode: 'append' | 'replace'; dateOrder: 'dmy' | 'mdy'; dryRun: boolean; sheet?: string },
): Promise<ImportReport> => {
  const f = new FormData();
  f.append('file', file);
  f.append('mapping', JSON.stringify(mapping));
  f.append('mode', o.mode);
  f.append('dateOrder', o.dateOrder);
  if (o.sheet) f.append('sheet', o.sheet);
  if (o.dryRun) f.append('dryRun', 'true');
  return authFetch('/imports', orgId, { method: 'POST', body: f });
};
export const listImports = (orgId: string): Promise<ImportRecord[]> => authFetch('/imports', orgId);
export const getDataStatus = (orgId: string): Promise<{ rows: number }> => authFetch('/imports/status', orgId);
export const deleteImport = (orgId: string, id: string) =>
  authFetch(`/imports/${id}`, orgId, { method: 'DELETE' });
export const loadSampleData = (orgId: string): Promise<{ importId: string; rowsImported: number }> =>
  authFetch('/imports/sample', orgId, { method: 'POST' });