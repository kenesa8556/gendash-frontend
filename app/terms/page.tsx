import { LegalLayout } from '@/components/landing/LegalLayout';

export const metadata = { title: 'Terms · GenDash' };

export default function Terms() {
  return (
    <LegalLayout title="Terms of use" updated="October 2026">
      <p>By creating an account you agree to these terms. GenDash is a free beta service.</p>

      <h2>The service</h2>
      <ul>
        <li>It is provided as is, with no guarantee that it is always available or free of mistakes.</li>
        <li>The AI can misunderstand a question. Dashboards say what they show, and every chart has a Show data button. Check important numbers before you rely on them.</li>
        <li>We may change, limit or stop the service, and we may set limits such as daily questions and file sizes.</li>
      </ul>

      <h2>Your data</h2>
      <ul>
        <li>Your data stays yours. You allow us to store and process it only to run the service for you.</li>
        <li>Only upload data you are allowed to use. Do not upload personal data about your customers, such as names, phone numbers or addresses. GenDash does not need it.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not break the law, attack or overload the service, or try to reach another shop&apos;s data.</li>
        <li>We may suspend accounts that do.</li>
      </ul>

      <h2>Liability</h2>
      <p>To the extent the law allows, we are not responsible for decisions you make or losses that come from using the service.</p>

      <h2>Changes</h2>
      <p>We may update these terms. If you keep using GenDash after a change, you accept the new version.</p>
    </LegalLayout>
  );
}