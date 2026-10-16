import Link from 'next/link';

export function LegalLayout({ title, updated, children }: {
  title: string; updated: string; children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <Link href="/" className="text-sm text-muted hover:text-text">← GenDash</Link>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-xs text-muted">Last updated {updated}</p>
      <div className="space-y-3 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-medium [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}