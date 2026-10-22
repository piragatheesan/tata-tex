import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { logout } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  const u = await requireUser();
  return (
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="Admin">
        <b>Tata Tex admin</b>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/enquiries">Enquiries</Link>
        <Link href="/admin/users">{u.role === 'administrator' ? 'Users' : 'My account'}</Link>
        <span className="grow" />
        <span>
          {u.username} ({u.role})
        </span>
        <Link href="/" target="_blank">
          View site
        </Link>
        <form action={logout}>
          <button className="link-button" type="submit">
            Log out
          </button>
        </form>
      </nav>
      <div className="container section">{children}</div>
    </div>
  );
}
