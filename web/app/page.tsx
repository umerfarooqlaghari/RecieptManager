import Image from 'next/image';
import Link from 'next/link';
import { MobileNav } from './components/MobileNav';
import {
  IconChart,
  IconCheck,
  IconChevronRight,
  IconCloud,
  IconMail,
  IconMobile,
  IconServer,
  IconShield,
  IconZap,
  ServiceIcon,
  type ServiceIconName,
} from './components/Icons';

const CONTACT_EMAIL = 'info@alpha-devs.cloud';
const ALPHA_DEVS_URL = 'https://www.alpha-devs.cloud';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '/support/', label: 'Support' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/terms/', label: 'Terms' },
];

const checklist = [
  'AI receipt scanning',
  'Cloud sync and backup',
  'Category-based reports',
  'Excel export',
  'Secure authentication',
  'Cross-platform access',
];

const services: {
  icon: ServiceIconName;
  title: string;
  body: string;
  highlight?: boolean;
}[] = [
  {
    icon: 'lock',
    title: 'Secure Storage',
    body: 'Receipt images stored in a private AWS bucket with time-limited signed URLs. No public exposure.',
  },
  {
    icon: 'scan',
    title: 'Intelligent Capture',
    body: 'Automated extraction of merchant, date, line items, tax, and totals from receipt photographs.',
  },
  {
    icon: 'chart',
    title: 'Analytics & Reporting',
    body: 'Monthly trends, category breakdowns, and configurable filters for operational visibility.',
  },
  {
    icon: 'export',
    title: 'Data Export',
    body: 'Generate Excel reports from filtered datasets for accounting, audit, and reconciliation workflows.',
  },
  {
    icon: 'cloud',
    title: 'Cloud Synchronization',
    body: 'Real-time sync via Supabase with row-level security and authenticated access controls.',
  },
  {
    icon: 'layers',
    title: 'Premium Capabilities',
    body: 'Advanced analytics, unlimited scanning, and priority support for professional users.',
    highlight: true,
  },
];

const stats = [
  { value: '14', label: 'Day trial period' },
  { value: '5', label: 'Default categories' },
  { value: '99.9%', label: 'Cloud uptime target' },
  { value: '256-bit', label: 'Encrypted transit' },
];

const aboutItems = [
  {
    Icon: IconShield,
    title: 'Security by design',
    body: 'Authentication, authorization, and data isolation enforced at the database layer through Supabase RLS.',
  },
  {
    Icon: IconZap,
    title: 'Automated processing',
    body: 'Receipt ingestion pipeline converts unstructured images into structured expense records in seconds.',
  },
  {
    Icon: IconServer,
    title: 'Production infrastructure',
    body: 'Built on AWS and Google Cloud services with monitoring-ready architecture for reliable operations.',
  },
];

export default function HomePage() {
  return (
    <div className="site">
      <div className="hex-bg" aria-hidden />

      <header className="nav-bar">
        <div className="container nav-inner">
          <a href="#home" className="logo">
            <span className="logo-icon">
              <Image src="/logo.png" alt="" width={36} height={36} />
            </span>
            <span className="logo-text">Expense Manager</span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>
          <div className="nav-actions">
            <a href="#download" className="btn btn-purple btn-sm nav-cta-desktop">Download app</a>
            <MobileNav links={navLinks} />
          </div>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="tag">
                <span className="tag-line" aria-hidden />
                Professional expense management
              </p>
              <h1>
                Receipt capture, expense tracking,
                <span className="hero-break"> </span>
                and reporting — unified.
              </h1>
              <p className="hero-desc">
                Expense Manager helps individuals and teams digitize receipts, categorize spending,
                and produce export-ready reports from a single mobile application.
              </p>
              <div className="hero-actions">
                <a href="#download" className="btn btn-purple">Request access</a>
                <a href="#about" className="btn btn-outline">View capabilities</a>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-visual-bg" aria-hidden />
              <div className="hero-phone-card">
                <div className="phone-screen">
                  <div className="phone-label">Monthly spending</div>
                  <div className="phone-amount">$2,480.50</div>
                  <div className="phone-row">
                    <span className="pill">Scan</span>
                    <span className="pill">Reports</span>
                  </div>
                  <ul className="phone-list">
                    <li><span>Office Supplies Co.</span><strong>$42.18</strong></li>
                    <li><span>Metro Transit</span><strong>$58.00</strong></li>
                    <li><span>Downtown Café</span><strong>$6.50</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="container hero-strip">
            <div className="strip-card strip-newsletter">
              <h3>Product updates</h3>
              <p>Receive release notes and platform announcements.</p>
              <form className="strip-form" action={`mailto:${CONTACT_EMAIL}`}>
                <input type="email" name="email" placeholder="Work email address" aria-label="Email address" required />
                <button type="submit" className="btn btn-white">Subscribe</button>
              </form>
            </div>
            <div className="strip-card strip-checklist">
              <ul>
                {checklist.map(item => (
                  <li key={item}>
                    <span className="check-icon" aria-hidden><IconCheck size={14} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="strip-card strip-help">
              <h3>Support</h3>
              <p>Assistance with onboarding, billing, exports, and technical inquiries.</p>
              <a href="#contact" className="link-arrow">
                Contact support
                <IconChevronRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="section about">
          <div className="container about-grid">
            <div className="about-visual">
              <div className="about-card about-card-a">
                <div className="about-card-inner purple-block">
                  <span className="about-svg"><IconMobile size={32} /></span>
                  <p>Native mobile experience for field and office use</p>
                </div>
              </div>
              <div className="about-card about-card-b">
                <div className="about-card-inner light-block">
                  <span className="about-svg"><IconChart size={32} /></span>
                  <p>Executive dashboards and category-level insight</p>
                </div>
              </div>
              <div className="about-badge">
                <strong>Enterprise</strong>
                <span>ready stack</span>
              </div>
            </div>
            <div className="about-copy">
              <p className="section-label">About the platform</p>
              <h2>Purpose-built for accurate expense operations</h2>
              <p className="about-intro">
                Expense Manager combines document capture, structured data storage, and reporting
                in one workflow — reducing manual entry and improving financial traceability.
              </p>
              <div className="about-list">
                {aboutItems.map(({ Icon, title, body }) => (
                  <article key={title} className="about-item">
                    <span className="about-icon-wrap" aria-hidden>
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="container stats-row">
            {stats.map(s => (
              <div key={s.label} className="stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="section services">
          <div className="container services-head">
            <p className="section-label center">Capabilities</p>
            <h2>Secure, scalable expense management services</h2>
            <p className="services-sub">
              End-to-end tooling for capture, storage, analysis, and export — designed for compliance-conscious teams.
            </p>
          </div>
          <div className="container services-grid">
            {services.map(s => (
              <article key={s.title} className={`service-card${s.highlight ? ' highlight' : ''}`}>
                <span className="service-icon-wrap" aria-hidden>
                  <ServiceIcon name={s.icon} size={22} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                {!s.highlight && (
                  <a href="#download" className="link-arrow">
                    Learn more
                    <IconChevronRight size={16} />
                  </a>
                )}
                {s.highlight && (
                  <a href="#download" className="btn btn-white btn-sm">View plans</a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="download" className="section cta-banner">
          <div className="container cta-inner">
            <div>
              <h2>Deploy Expense Manager for your organization</h2>
              <p>Available on iOS via TestFlight. Android release scheduled for a subsequent phase.</p>
            </div>
            <a href="#contact" className="btn btn-purple btn-lg">Get started</a>
          </div>
        </section>

        <section id="contact" className="section contact">
          <div className="container contact-inner">
            <span className="contact-icon" aria-hidden><IconMail size={28} /></span>
            <h2>Contact</h2>
            <p>
              For sales, support, and partnership inquiries, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner" style={{ flexWrap: 'wrap', gap: '24px' }}>
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">
                <Image src="/logo.png" alt="" width={28} height={28} />
              </span>
              <span>Expense Manager</span>
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} Expense Manager. All rights reserved.</p>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.9rem' }}>
            <Link href="/privacy/" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>
            <Link href="/terms/" style={{ color: 'var(--text-muted)' }}>Terms of Use (EULA)</Link>
            <Link href="/support/" style={{ color: 'var(--text-muted)' }}>Support</Link>
            <Link href="/delete-account/" style={{ color: 'var(--text-muted)' }}>Account Deletion</Link>
          </div>

          <p className="footer-credit">
            Developed by{' '}
            <a href={ALPHA_DEVS_URL} target="_blank" rel="noopener noreferrer">
              Alpha Devs
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
