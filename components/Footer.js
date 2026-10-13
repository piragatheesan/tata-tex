import Link from 'next/link';
import { site } from '../lib/site';

export default function Footer() {
  return (
    <footer className="site-f">
      <div className="w">
        <div><b>TATA TEX</b><br />Since {site.since}</div>
        <div className="fmid">
          <ul className="pipes"><li>{site.address}</li><li>{site.phone}</li><li>{site.email}</li></ul>
          <nav aria-label="Footer">
            <ul className="pipes up">
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </div>
        <div className="fcopy">© {new Date().getFullYear()} {site.name}</div>
      </div>
    </footer>
  );
}
