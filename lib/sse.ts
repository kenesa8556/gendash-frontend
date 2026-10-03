import { StreamEvent } from '@/types/spec';

export async function streamGenerate(opts: {
  question: string;
  token: string;
  orgId: string;
  signal?: AbortSignal;
  onEvent: (e: StreamEvent) => void;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'x-org-id': opts.orgId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: opts.question }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const type = /event: (.*)/.exec(block)?.[1];
      const data = /data: (.*)/.exec(block)?.[1];
      if (type && data) opts.onEvent({ type, ...JSON.parse(data) } as StreamEvent);
    }
  }
}