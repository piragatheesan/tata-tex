import Link from 'next/link';
import { site } from '@/lib/site';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <Link href="/" aria-label="Tata Tex home">
            <img src="/logo-mark.png" alt="Tata Tex logo" width="44" height="44" />
          </Link>
          <p>
            Uniforms for schools,
            <br />
            workplaces and teams.
          </p>
          <Link className={styles.quote} href="/contact?type=quote">
            Get a Quote <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <section className={styles.section} aria-label="Visit us">
          <h3>Visit us</h3>
          <address>
            40, Bankshall Street
            <br />
            Colombo 11, Sri Lanka
          </address>
          <a
            className={styles.directions}
            href="https://maps.google.com/?q=40+Bankshall+Street+Colombo+11"
            target="_blank"
            rel="noreferrer"
          >
            Get directions <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section className={styles.section} aria-label="Contact and opening hours">
          <h3>Contact</h3>
          <div className={styles.contacts}>
            <a href="tel:+94771151858">077 115 1858</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
          <div className={styles.hoursGroup}>
            <h3>Opening hours</h3>
            <div className={styles.hours}>
              <svg
                className={styles.clock}
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l4 3" />
              </svg>
              <div className={styles.hoursText}>
                Monday–Saturday<strong>9:00 am–6:00 pm</strong>
              </div>
            </div>
          </div>
        </section>
        <nav className={styles.nav} aria-label="Footer navigation">
          <h3>Explore</h3>
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <small>© {new Date().getFullYear()} Tata Tex. All rights reserved.</small>
        <small>Colombo, Sri Lanka</small>
      </div>
    </footer>
  );
}
