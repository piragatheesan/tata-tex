import Link from 'next/link';
import { site } from '../lib/site';
import { getCategories } from '@/lib/queries';
import NavMenu from './NavMenu';

export default function Header() {
  const categories = getCategories().map(({ id, slug, name, count }) => ({ id, slug, name, count }));
  return (
    <>
      <div className="topbar"><div className="w">{site.phone} | {site.email}</div></div>
      <header className="site-h">
        <div className="w hd">
          <Link href="/" className="lg"><img src="/logo.png" alt="" /><span>TATA TEX</span></Link>
          <NavMenu categories={categories} />
        </div>
      </header>
    </>
  );
}