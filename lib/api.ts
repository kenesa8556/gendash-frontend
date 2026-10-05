import { supabase } from './supabase';
import { Row } from '@/types/spec';

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
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in again.');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queries/${id}`, {
    headers: { Authorization: `Bearer ${data.session.access_token}`, 'x-org-id': orgId },
  });
  if (!res.ok) {
    const msg = res.status === 404
      ? 'The data trail is not available yet. Try again in a moment.'
      : `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return res.json();
}