import Image from 'next/image';
import Link from 'next/link';

export function SubpageHeader() {
  return (
    <header className="nav-bar">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">
            <Image src="/logo.png" alt="Expense Manager Logo" width={32} height={32} />
          </span>
          <span>Expense Manager</span>
        </Link>

        <nav className="nav-links" aria-label="Main Navigation">
          <Link href="/">Home</Link>
          <Link href="/privacy/">Privacy Policy</Link>
          <Link href="/terms/">Terms of Use</Link>
          <Link href="/support/">Support</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/" className="btn btn-purple btn-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SubpageFooter() {
  return (
    <footer className="footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', background: '#fff', padding: '40px 0' }}>
      <div className="container footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div className="footer-brand">
          <div className="logo">
            <span className="logo-icon">
              <Image src="/logo.png" alt="Expense Manager" width={28} height={28} />
            </span>
            <span>Expense Manager</span>
          </div>
          <p className="footer-copy" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>© {new Date().getFullYear()} Expense Manager. All rights reserved.</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <Link href="/privacy/">Privacy Policy</Link>
          <Link href="/terms/">Terms of Use (EULA)</Link>
          <Link href="/support/">Support</Link>
          <Link href="/delete-account/">Account Deletion</Link>
        </div>
      </div>
    </footer>
  );
}
