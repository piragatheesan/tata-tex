'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { swatch } from '@/lib/ui';

const Chevron = () => (
  <svg className="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Main menu: desktop links with a Products dropdown, Enquire button on the right,
// and a hamburger menu with the same links on phones.
export default function NavMenu({ categories = [] }) {
  const [open, setOpen] = useState(false); // phone menu
  const [drop, setDrop] = useState(false); // Products dropdown (desktop) / accordion (phone)
  const pathname = usePathname();
  const is = (href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));
  const dropRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setDrop(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setDrop(false); } };
    const onClick = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false); };
    addEventListener('keydown', onKey);
    addEventListener('click', onClick);
    return () => { removeEventListener('keydown', onKey); removeEventListener('click', onClick); };
  }, []);

  const canHover = () => typeof matchMedia !== 'undefined' && matchMedia('(hover:hover) and (min-width:801px)').matches;

  return (
    <>
      <nav id="main-nav" className={'mnav' + (open ? ' open' : '')} aria-label="Main">
        <Link href="/" aria-current={is('/') ? 'page' : undefined}>Home</Link>
        <div
          className="has-drop"
          ref={dropRef}
          onMouseEnter={() => canHover() && setDrop(true)}
          onMouseLeave={() => canHover() && setDrop(false)}
        >
          <button type="button" className={'nav-btn' + (is('/products') ? ' active' : '')} aria-current={is('/products') ? 'page' : undefined} aria-expanded={drop} aria-haspopup="true" onClick={() => setDrop(!drop)}>
            Products <Chevron />
          </button>
          {drop ? (
            <div className="drop">
              <div className="drop-card">
                <div className="drop-grid">
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/products?category=${c.slug}`} className="drop-item">
                      <span className="drop-sw" style={{ background: swatch(c.id) }} />
                      <span><b>{c.name}</b><small>{c.count} items</small></span>
                    </Link>
                  ))}
                </div>
                <div className="drop-foot">
                  <Link href="/products">Browse all products →</Link>
                  <Link href="/contact?type=quote">Request a wholesale quotation →</Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <Link href="/about" aria-current={is('/about') ? 'page' : undefined}>About</Link>
        <Link href="/contact" aria-current={is('/contact') ? 'page' : undefined}>Contact</Link>
        <Link className="nav-m-cta" href="/contact">Enquire</Link>
      </nav>

      <div className="nav-actions">
        <Link className="txt-link" href="/contact?type=quote">Request a quote</Link>
        <Link className="btn-pill" href="/contact">Enquire →</Link>
      </div>

      <button
        className="burger"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        <span /><span /><span />
      </button>
    </>
  );
}
