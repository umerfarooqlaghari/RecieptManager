import type { Metadata } from 'next';
import Link from 'next/link';
import { SubpageHeader, SubpageFooter } from '../components/SubpageHeader';

export const metadata: Metadata = {
  title: 'Delete Account & Data Erasure — Expense Manager',
  description: 'Instructions and web portal for permanently deleting your Expense Manager account and all associated receipt data.',
};

export default function DeleteAccountPage() {
  return (
    <div className="site">
      <div className="hex-bg" />
      <SubpageHeader />

      <main style={{ padding: '60px 0 100px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Privacy & User Rights
            </span>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '8px', color: 'var(--text)' }}>
              Account &amp; Data Deletion
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
              Compliance with Apple App Store Review Guideline 5.1.1(v) &amp; GDPR Right to Erasure
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'var(--text)', lineHeight: 1.75 }}>
            <section>
              <p>
                At <strong>Expense Manager</strong>, you have the absolute right to delete your account, personal details, transaction records, and all uploaded receipt photographs at any time.
              </p>
            </section>

            <section style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                Option 1: In-App Instant Deletion (Fastest)
              </h2>
              <p>You can immediately delete your account directly inside the iOS mobile application:</p>
              <ol style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Open the <strong>Expense Manager</strong> app on your iPhone or iPad.</li>
                <li>Tap the <strong>Profile</strong> tab in the navigation bar.</li>
                <li>Scroll down and tap <strong>Delete Account</strong> (marked in red).</li>
                <li>Confirm the security prompt. Your account and all associated data are instantly purged.</li>
              </ol>
            </section>

            <section style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                Option 2: Web Deletion Request
              </h2>
              <p>
                If you have uninstalled the app or cannot access your device, you can request manual data deletion by submitting an email to our data privacy team:
              </p>
              <div style={{ marginTop: '14px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <p><strong>To:</strong> <a href="mailto:info@alpha-devs.cloud?subject=Account%20Deletion%20Request" style={{ color: 'var(--purple)', fontWeight: 600 }}>info@alpha-devs.cloud</a></p>
                <p><strong>Subject:</strong> <code>Account Deletion Request - [Your Registered Email]</code></p>
                <p style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Please send the request from the email address associated with your Expense Manager account. Requests are processed within 48 business hours.
                </p>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>
                What Data is Deleted?
              </h2>
              <p>Upon account deletion, the following items are permanently erased from our production servers:</p>
              <ul style={{ paddingLeft: '24px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Your user authentication profile, name, email, and password hash.</li>
                <li>All uploaded receipt photographs and profile pictures stored in AWS S3.</li>
                <li>All categorized expenses, itemized products, and dates stored in PostgreSQL.</li>
                <li>Associated notification tokens and temporary verification OTP hashes.</li>
              </ul>
            </section>

            <section style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Need help? Contact our support desk at{' '}
                <a href="mailto:info@alpha-devs.cloud" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                  info@alpha-devs.cloud
                </a>{' '}
                or visit our <Link href="/support/" style={{ color: 'var(--purple)', fontWeight: 600 }}>Support Center</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
