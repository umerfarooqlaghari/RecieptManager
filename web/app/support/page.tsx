import type { Metadata } from 'next';
import Link from 'next/link';
import { SubpageHeader, SubpageFooter } from '../components/SubpageHeader';

export const metadata: Metadata = {
  title: 'Customer Support & Help Center — Expense Manager',
  description: 'Get help with receipt scanning, subscription management, cloud sync, and account inquiries.',
};

export default function SupportPage() {
  const faqs = [
    {
      q: 'How does AI Receipt Scanning work?',
      a: 'When you photograph a receipt, our optical scanning engine securely processes the image using Google Gemini AI models to identify the merchant, transaction date, line items, tax, and total amount. The receipt photo is securely archived in private AWS S3 storage with encrypted access.',
    },
    {
      q: 'How do I restore my existing subscription?',
      a: 'If you reinstalled the app or upgraded your iPhone, open the app, navigate to Profile or the Paywall screen, and tap "Restore Purchases". RevenueCat will automatically verify your Apple ID entitlements and reactivate your premium capabilities.',
    },
    {
      q: 'How do I cancel or modify my subscription?',
      a: 'Subscriptions are managed directly by Apple. Open the iOS "Settings" app on your device, tap your Apple ID profile at the top, select "Subscriptions", choose "Expense Manager", and tap "Cancel Subscription". You will retain premium access until the end of your billing cycle.',
    },
    {
      q: 'How can I export my receipts for tax preparation or accounting?',
      a: 'Navigate to the Analytics or Reports section in the mobile app, select your desired date range or category filters, and tap "Export to Excel". A formatted .xlsx document will be generated and can be saved to Files or shared via email/AirDrop.',
    },
    {
      q: 'How do I permanently delete my account and data?',
      a: 'You can delete your account inside the mobile app by going to Profile > Delete Account. Alternatively, submit a deletion request via our Account Deletion portal or email info@alpha-devs.cloud.',
    },
  ];

  return (
    <div className="site">
      <div className="hex-bg" />
      <SubpageHeader />

      <main style={{ padding: '60px 0 100px' }}>
        <div className="container" style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          {/* Hero Banner */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              App Store Support Center
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--text)' }}>
              How can we help you?
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '10px', maxWidth: '600px', margin: '10px auto 0' }}>
              Have questions about your account, subscriptions, or receipt scanning? We are here to help.
            </p>
          </div>

          {/* Quick Contact Card */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '36px', boxShadow: 'var(--shadow-card)', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
              Direct Support Channels
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Our dedicated engineering and support team responds to inquiries within 24 business hours:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase' }}>Email Support</span>
                <p style={{ marginTop: '6px', fontWeight: 700, fontSize: '1.05rem' }}>
                  <a href="mailto:info@alpha-devs.cloud" style={{ color: 'var(--purple)' }}>info@alpha-devs.cloud</a>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>For billing, technical issues, and feedback</p>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase' }}>Compliance & Privacy</span>
                <p style={{ marginTop: '6px', fontWeight: 700, fontSize: '1.05rem' }}>
                  <Link href="/delete-account/" style={{ color: 'var(--purple)' }}>Data Deletion Portal</Link>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>Request personal data purge &amp; erasure</p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '36px', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text)' }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: i === faqs.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: i === faqs.length - 1 ? 0 : '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                    {faq.q}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontSize: '0.95rem' }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <SubpageFooter />
    </div>
  );
}
