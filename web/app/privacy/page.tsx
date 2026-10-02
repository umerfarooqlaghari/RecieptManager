import type { Metadata } from 'next';
import Link from 'next/link';
import { SubpageHeader, SubpageFooter } from '../components/SubpageHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy — Expense Manager',
  description: 'Learn how Expense Manager collects, encrypts, and protects your personal and financial expense data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 3, 2026';

  return (
    <div className="site">
      <div className="hex-bg" />
      <SubpageHeader />

      <main style={{ padding: '60px 0 100px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal & Compliance
            </span>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '8px', color: 'var(--text)' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
              Effective Date: {lastUpdated}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'var(--text)', lineHeight: 1.75 }}>
            <section>
              <p>
                At <strong>Expense Manager</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), protecting your privacy and securing your personal and financial information is our highest priority. This Privacy Policy explains how our application captures, processes, stores, and protects your data in accordance with the Apple App Store Review Guidelines, GDPR, and applicable privacy laws.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                1. Information We Collect
              </h2>
              <p>We only collect information strictly necessary to provide intelligent expense tracking and automated receipt management:</p>
              <ul style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Account Information:</strong> Your email address, name, optional phone number, profile photo, and password credentials (securely hashed and managed by our authentication provider).
                </li>
                <li>
                  <strong>Receipt &amp; Expense Data:</strong> Photographs of receipts you capture or upload, extracted merchant names, line items, transaction dates, tax totals, currencies, and spending categories.
                </li>
                <li>
                  <strong>Device &amp; Telemetry Data:</strong> Minimal diagnostic information (such as operating system version and application build) used strictly to diagnose crashes and ensure compatibility.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                2. How We Use Your Information
              </h2>
              <p>Your data is processed exclusively for the following operational purposes:</p>
              <ul style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>To extract merchant names, line items, and totals from your uploaded receipts using advanced optical character recognition (OCR) and machine learning models.</li>
                <li>To organize, categorize, and present your spending analytics and generate Excel export reports.</li>
                <li>To send transactional authentication codes (one-time passwords / OTP) and instant receipt scan confirmations via email.</li>
                <li>To verify and maintain your active subscription entitlements across your devices.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                3. Third-Party Service Providers
              </h2>
              <p>
                To provide our cloud services, we partner with industry-leading infrastructure providers under strict data-protection agreements:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Amazon Web Services (AWS):</strong> Receipts and profile images are stored in private, encrypted S3 buckets with time-limited signed URLs. Automated emails are transmitted securely via AWS Simple Email Service (SES).
                </li>
                <li>
                  <strong>Supabase:</strong> Provides authenticated user sessions and encrypted PostgreSQL database hosting with strict Row-Level Security (RLS) enforcement.
                </li>
                <li>
                  <strong>Google Gemini AI:</strong> Used to analyze receipt image contents and extract structured expense fields. Receipt buffers are processed ephemerally and are not used to train public machine learning models.
                </li>
                <li>
                  <strong>RevenueCat &amp; Apple StoreKit:</strong> Manages in-app subscriptions and purchase receipts securely without exposing credit card details to our servers.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                4. Data Protection &amp; Zero Tracking Commitment
              </h2>
              <div style={{ background: 'var(--purple-light)', borderLeft: '4px solid var(--purple)', padding: '16px 20px', borderRadius: '8px', margin: '10px 0' }}>
                <strong>No Sale of Data &amp; No Third-Party Advertising:</strong> We do not sell, rent, monetize, or disclose your personal data, transaction records, or receipt photographs to third-party ad networks, data brokers, or marketing platforms. We do not participate in cross-app tracking.
              </div>
              <p style={{ marginTop: '10px' }}>
                All network communications are strictly encrypted in transit using Transport Layer Security (TLS 1.3), and all uploaded files are encrypted at rest using 256-bit AES encryption.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                5. User Rights &amp; Data Deletion
              </h2>
              <p>
                In compliance with Apple App Store Review Guideline 5.1.1(v) and global privacy standards, you maintain absolute control over your information:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Data Export:</strong> You can export your full transaction history and itemized lists into Excel (.xlsx) format at any time directly within the application.
                </li>
                <li>
                  <strong>In-App Account Deletion:</strong> You can permanently delete your account and all associated receipts, expenses, and profile records directly within the mobile app via <em>Profile &rarr; Delete Account</em>.
                </li>
                <li>
                  <strong>Web Deletion Request:</strong> If you cannot access the app, you may request complete account erasure via our <Link href="/delete-account/" style={{ color: 'var(--purple)', fontWeight: 600 }}>Account Deletion Portal</Link> or by emailing us directly.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                6. Children&apos;s Privacy
              </h2>
              <p>
                Expense Manager is designed for general audiences and business professionals. We do not knowingly collect or solicit personal information from individuals under the age of 13 (or 16 in certain jurisdictions).
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                7. Contact Us
              </h2>
              <p>
                If you have questions, feedback, or data privacy requests concerning this Privacy Policy, please contact our Data Protection team:
              </p>
              <p style={{ marginTop: '8px' }}>
                <strong>Email:</strong>{' '}
                <a href="mailto:info@alpha-devs.cloud" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                  info@alpha-devs.cloud
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
