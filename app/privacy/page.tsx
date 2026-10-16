import { LegalLayout } from '@/components/landing/LegalLayout';

export const metadata = { title: 'Privacy · GenDash' };

export default function Privacy() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'the contact address on the home page';
  return (
    <LegalLayout title="Privacy" updated="October 2026">
      <p>GenDash is a free beta tool that turns questions about your sales into dashboards. This page explains, in plain words, what happens to your data.</p>

      <h2>What we store</h2>
      <ul>
        <li>Your account email. Your password is handled by our sign-in provider and we never see it.</li>
        <li>Your shop name and currency, and the people you invite to it.</li>
        <li>The sales rows you upload.</li>
        <li>The questions you type and the dashboards you save.</li>
        <li>A record of the query and result rows behind each dashboard, so you can check any number.</li>
      </ul>

      <h2>What the AI sees</h2>
      <p>To turn your question into a dashboard plan, we send an AI model (Google Gemini) your question and the names of your branches, categories and items. <strong>We do not send your sales rows, amounts or dates to the AI.</strong> The numbers are calculated by our database.</p>

      <h2>Who else handles your data</h2>
      <ul>
        <li>Supabase stores accounts and data.</li>
        <li>Google processes questions through the Gemini API, under Google&apos;s API terms.</li>
        <li>Our hosting providers run the website and server.</li>
      </ul>

      <h2>Who can see your data</h2>
      <p>Only the members of your shop can see its data. The person who runs GenDash can technically access the database for maintenance and support, and will not look at your data for any other reason.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Shop owners can delete any import, and its sales rows, from the Data page.</li>
        <li>To delete your shop or account completely, email {contact}.</li>
      </ul>

      <h2>Cookies and tracking</h2>
      <p>We keep your sign-in session in your browser so you stay signed in. We do not use advertising or tracking cookies.</p>

      <h2>Children</h2>
      <p>GenDash is not meant for children under 16.</p>

      <h2>Changes</h2>
      <p>If this page changes in an important way, we will say so on the home page.</p>
    </LegalLayout>
  );
}