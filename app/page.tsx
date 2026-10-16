import Link from 'next/link';
import { Database, MessageSquare, ShieldCheck, Upload } from 'lucide-react';
import { AuthButtons } from '@/components/landing/AuthButtons';

const STEPS = [
  { icon: Upload, title: '1. Upload your sales', text: 'Drop in your Excel or CSV sales sheet. We help you match your columns, and tell you about any rows we could not read.' },
  { icon: MessageSquare, title: '2. Ask in plain words', text: 'Type a question like "monthly sales for each branch, and my best-selling category". Charts and tables appear in seconds.' },
  { icon: Database, title: '3. Check any number', text: 'Click Show data on any chart to see the exact query and the rows behind it. Nothing is a black box.' },
];

export default function Landing() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <div className="min-h-screen">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>

      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-4">
        <Link href="/" className="text-lg font-semibold">GenDash</Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          <a href="#how" className="hidden text-muted hover:text-text sm:inline">How it works</a>
          <a href="#trust" className="hidden text-muted hover:text-text sm:inline">Why you can trust it</a>
          <AuthButtons />
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-5">
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
              Ask your sales data a question. Get a dashboard you can check.
            </h1>
            <p className="text-lg text-muted">
              Upload your sales sheet, ask in plain English, and see charts built in seconds.
              Every number links to the exact query behind it.
            </p>
            <AuthButtons size="lg" />
            <p className="text-sm text-muted">Free while in beta. Made for small shops.</p>
          </div>

          <div aria-label="Example of a question and its answer" className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <p className="text-xs text-muted">Example (illustration, not real data)</p>
            <p className="rounded border border-border bg-bg p-3 text-sm">
              Monthly revenue for each branch over the last 6 months
            </p>
            <div className="rounded border border-border bg-bg p-3">
              <p className="mb-3 text-sm font-medium">Revenue by Month and Branch · last 6 months</p>
              <div className="flex h-24 items-end gap-2" aria-hidden="true">
                {[40, 55, 48, 70, 82, 60].map((h, i) => (
                  <div key={i} className="flex flex-1 items-end gap-0.5">
                    <div className="w-full rounded-t bg-s1" style={{ height: `${h}%` }} />
                    <div className="w-full rounded-t bg-s2" style={{ height: `${Math.round(h * 0.7)}%` }} />
                  </div>
                ))}
              </div>
              <p className="mt-3 inline-block rounded border border-border px-2 py-0.5 text-xs text-muted">Show data</p>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl space-y-6 px-4 py-12">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-2 rounded-lg border border-border bg-surface p-4">
                <Icon size={20} aria-hidden="true" className="text-accent" />
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="trust" className="mx-auto max-w-5xl space-y-4 px-4 py-12">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck aria-hidden="true" className="text-accent" /> Why you can trust the numbers
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            <li className="space-y-1 rounded-lg border border-border bg-surface p-4">
              <h3 className="font-medium">The AI never writes numbers</h3>
              <p className="text-sm text-muted">
                It only decides what to show. Every figure is calculated by the database from your own rows.
              </p>
            </li>
            <li className="space-y-1 rounded-lg border border-border bg-surface p-4">
              <h3 className="font-medium">Everything can be checked</h3>
              <p className="text-sm text-muted">
                Each chart shows the query and the rows it came from. If something looks off, you can see why.
              </p>
            </li>
            <li className="space-y-1 rounded-lg border border-border bg-surface p-4">
              <h3 className="font-medium">Your rows stay private</h3>
              <p className="text-sm text-muted">
                Your sales rows are never sent to the AI. It sees only your question and the names of your branches,
                categories and items. Each shop&apos;s data is separated from every other shop.
              </p>
            </li>
          </ul>
          <p className="text-sm text-muted">
            We also run an automated test suite that compares dashboard numbers against the database.
          </p>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm text-muted">
        <span>© GenDash</span>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/privacy" className="hover:text-text">Privacy</Link>
          <Link href="/terms" className="hover:text-text">Terms</Link>
          {contact && <a href={`mailto:${contact}`} className="hover:text-text">Contact</a>}
        </nav>
      </footer>
    </div>
  );
}