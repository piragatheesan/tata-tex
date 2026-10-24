import { requireUser } from '@/lib/auth';
import { logout } from '@/lib/actions';
import AdminShell from '@/components/admin/AdminShell';
export const dynamic = 'force-dynamic';
export default async function PanelLayout({ children }) {
  const user = await requireUser();
  return (
    <AdminShell user={{ username: user.username, role: user.role }} logout={logout}>
      {children}
    </AdminShell>
  );
}
