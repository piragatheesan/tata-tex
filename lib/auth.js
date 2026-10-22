import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient, unwrap } from './supabase/admin';
import { createSessionClient } from './supabase/server';
import { requestAddress } from './rate-limit.mjs';

export async function getUser() {
  const supabase = await createSessionClient();
  // Validate with Supabase Auth, rather than trusting user data in a cookie.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const profile = unwrap(
    await createAdminClient()
      .from('profiles')
      .select('id, username, role, created_at')
      .eq('id', user.id)
      .maybeSingle(),
  );
  if (!profile || !['administrator', 'staff'].includes(profile.role)) return null;
  return { ...profile, email: user.email };
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/admin/login');
  return user;
}
export async function requireAdminRole() {
  const user = await requireUser();
  if (user.role !== 'administrator')
    redirect('/admin?error=' + encodeURIComponent('Only administrators can do that.'));
  return user;
}
export const clientIp = async () => requestAddress(await headers());
