import type { Metadata } from 'next';
import Link from 'next/link';
import { SubpageHeader, SubpageFooter } from '../components/SubpageHeader';

export const metadata: Metadata = {
  title: 'Terms of Use (EULA) — Expense Manager',
  description: 'Terms of Service, End User License Agreement, and Auto-Renewable Subscription terms for Expense Manager.',
};

export default function TermsOfServicePage() {
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
              Terms of Use &amp; EULA
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
              Effective Date: {lastUpdated}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'var(--text)', lineHeight: 1.75 }}>
            <section>
              <p>
                Welcome to <strong>Expense Manager</strong>. These Terms of Use (&quot;Terms&quot;) and End User License Agreement (&quot;EULA&quot;) govern your access to and use of the Expense Manager mobile application, backend services, and website operated by Alpha Devs.
              </p>
              <p style={{ marginTop: '8px' }}>
                By downloading, accessing, or using Expense Manager, you agree to be bound by these Terms and our <Link href="/privacy/" style={{ color: 'var(--purple)', fontWeight: 600 }}>Privacy Policy</Link>. If you do not agree, please do not use the application.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                1. Auto-Renewing Subscriptions &amp; Billing (App Store Terms)
              </h2>
              <div style={{ background: 'var(--purple-light)', borderLeft: '4px solid var(--purple)', padding: '16px 20px', borderRadius: '8px', margin: '10px 0' }}>
                <strong>Apple In-App Purchase Disclosures (Guideline 3.1.2):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Free Trial:</strong> New accounts receive an automatic 14-day free trial granting full access to receipt scanning and analytics.</li>
                  <li><strong>Subscription Options:</strong>
                    <ul>
                      <li>Monthly Plan: $3.99 per month</li>
                      <li>Yearly Plan: $34.99 per year</li>
                      <li>Lifetime Access: $79.99 one-time purchase</li>
                    </ul>
                  </li>
                  <li><strong>Payment:</strong> Payment will be charged to your Apple ID account at confirmation of purchase.</li>
                  <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current billing period.</li>
                  <li><strong>Renewal Charges:</strong> Your account will be charged for renewal within 24 hours prior to the end of the current period at the rate of the selected plan.</li>
                  <li><strong>Managing Subscriptions:</strong> You can manage or cancel your subscriptions at any time in your <strong>Apple ID Account Settings</strong> after purchase (App Store &gt; Profile &gt; Subscriptions).</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                2. Standard Apple EULA Incorporation
              </h2>
              <p>
                In addition to these terms, our application operates subject to Apple&apos;s standard Licensed Application End User License Agreement (EULA). You can review Apple&apos;s Standard EULA at:{' '}
                <a
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--purple)', wordBreak: 'break-all', fontWeight: 600 }}
                >
                  https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
                </a>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                3. User License &amp; Permitted Use
              </h2>
              <p>
                We grant you a non-exclusive, non-transferable, revocable license to install and use the application on devices you own or control, strictly for personal or internal business expense management.
              </p>
              <p style={{ marginTop: '8px' }}>You agree not to:</p>
              <ul style={{ paddingLeft: '24px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Decompile, reverse-engineer, or disassemble any part of the application.</li>
                <li>Attempt to bypass rate limits, trial windows, or authentication controls.</li>
                <li>Upload fraudulent, abusive, or malicious documents to our scanning pipeline.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                4. AI Receipt Processing &amp; OCR Accuracy
              </h2>
              <p>
                Our AI scanning features utilize generative machine learning to transcribe receipt photographs. While our systems achieve high accuracy, lighting conditions, paper creases, or damaged receipts may occasionally cause transcription anomalies. Users are encouraged to review extracted figures before submitting official accounting reports.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                5. Termination &amp; Account Deletion
              </h2>
              <p>
                You may terminate your agreement at any time by deleting your account through the application settings or by submitting an inquiry via our{' '}
                <Link href="/delete-account/" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                  Account Deletion Portal
                </Link>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                6. Disclaimer &amp; Limitation of Liability
              </h2>
              <p>
                Expense Manager is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Alpha Devs disclaims all warranties, express or implied, including fitness for a particular accounting or tax preparation purpose. In no event shall Alpha Devs be liable for any indirect, incidental, or consequential damages resulting from the use of this service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--purple-dark)' }}>
                7. Contact Information
              </h2>
              <p>
                For questions regarding these Terms or licensing, please contact:
              </p>
              <p style={{ marginTop: '8px' }}>
                <strong>Support Email:</strong>{' '}
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
