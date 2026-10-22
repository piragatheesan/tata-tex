'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const links = [
  ['/', 'Home'],
  ['/products', 'Products'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];
export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef(null);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    function dismiss(event) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [open]);
  return (
    <>
      <nav
        id="main-nav"
        className={'main-nav' + (open ? ' open' : '')}
        aria-label="Main navigation"
      >
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={
              (href === '/' ? pathname === '/' : pathname.startsWith(href)) ? 'page' : undefined
            }
          >
            {label}
          </Link>
        ))}
        <Link className="nav-m-cta" href="/contact?type=quote" onClick={() => setOpen(false)}>
          Get a Quote
        </Link>
      </nav>
      <div className="nav-actions">
        <Link className="btn-pill" href="/contact?type=quote">
          Get a Quote
        </Link>
      </div>
      <button
        ref={toggle}
        className="burger"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
    </>
  );
}
