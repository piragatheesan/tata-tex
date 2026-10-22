import Link from 'next/link';
import NavMenu from './NavMenu';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-content">
        <Link href="/" className="brand" aria-label="Tata Tex home">
          <img src="/logo-mark.png" alt="Tata Tex logo" width="64" height="64" />
        </Link>
        <NavMenu />
      </div>
    </header>
  );
}
