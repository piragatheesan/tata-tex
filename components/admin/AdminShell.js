'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import styles from './Admin.module.css';

export default function AdminShell({ children, user, logout }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef(null);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const dismiss = (event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [open]);
  const links = [
    ['/admin', 'Dashboard', 'home'],
    ['/admin/products', 'Products', 'box'],
    ['/admin/categories', 'Categories', 'tag'],
    ['/admin/enquiries', 'Enquiries', 'chat'],
    ...(user.role === 'administrator' ? [['/admin/users', 'Staff', 'users']] : []),
    ['/admin/settings', 'Settings', 'settings'],
  ];
  return (
    <div className={`admin-shell ${styles.shell}`}>
      <header className={styles.mobileHeader}>
        <Link href="/admin" aria-label="Tata Tex dashboard">
          <img src="/logo-mark.png" width="48" height="48" alt="Tata Tex" />
        </Link>
        <button
          ref={toggle}
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="admin-navigation"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </header>
      <aside id="admin-navigation" className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <Link href="/admin" className={styles.logo} aria-label="Tata Tex dashboard">
          <img src="/logo-mark.png" width="88" height="88" alt="Tata Tex" />
        </Link>
        <nav aria-label="Administration">
          {links.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                (href === '/admin' ? pathname === href : pathname.startsWith(href))
                  ? 'page'
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              <Icon name={icon} />
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="external" />
            View website
          </Link>
          <form action={logout}>
            <button type="submit">
              <Icon name="logout" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
