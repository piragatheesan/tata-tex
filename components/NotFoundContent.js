import Link from 'next/link';
import styles from './NotFoundContent.module.css';

export default function NotFoundContent() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title" data-not-found>
      <div className={styles.art} aria-hidden="true">
        <svg viewBox="0 0 1000 350" fill="none">
          <defs>
            <linearGradient
              id="not-found-navy"
              x1="120"
              y1="30"
              x2="800"
              y2="320"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#1c3765" />
              <stop offset="1" stopColor="#152a50" />
            </linearGradient>
          </defs>
          <g fill="url(#not-found-navy)" fillRule="evenodd">
            <path d="M190 30h65v196h39v51h-39v58h-61v-58H56v-51L190 30Zm4 88-74 108h74V118Z" />
            <path d="M458 25c88 0 128 58 128 157S546 340 458 340s-128-59-128-158S370 25 458 25Zm0 57c-46 0-65 34-65 100s19 101 65 101 65-35 65-101-19-100-65-100Z" />
            <path d="M752 30h65v196h39v51h-39v58h-61v-58H618v-51L752 30Zm4 88-74 108h74V118Z" />
          </g>
          <g stroke="#a22d4a" strokeWidth="2" strokeDasharray="8 8">
            <path d="M221 45v274M70 252h209M783 45v274M633 252h209" />
            <ellipse cx="458" cy="182" rx="97" ry="129" />
          </g>
          <path
            d="M525 296c70 80 112-61 177-7s102 58 119 12-47-86 11-111 80 28 107-34"
            stroke="#741c39"
            strokeWidth="2"
          />
          <path
            d="m940 155 34-63c7-12 13-9 6 4l-40 59Z"
            fill="#c8cbd0"
            stroke="#727780"
            strokeWidth="1.5"
          />
          <path d="m974 96-10 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h1 id="not-found-title">This page is out of uniform.</h1>
      <p>The page you’re looking for may have moved or no longer exists.</p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/">
          Back to home
        </Link>
        <Link className={styles.secondary} href="/products">
          Browse products
        </Link>
      </div>
      <p className={styles.help}>
        Need help? <Link href="/contact">Contact us</Link>
      </p>
    </section>
  );
}
