'use client';

import { useState } from 'react';

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="nav-mobile">
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(v => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={close} />
      )}

      <nav
        id="mobile-nav-panel"
        className={`nav-panel${open ? ' open' : ''}`}
        aria-label="Mobile"
      >
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a href="#download" className="btn btn-purple btn-sm nav-panel-cta" onClick={close}>
          Download app
        </a>
      </nav>
    </div>
  );
}
