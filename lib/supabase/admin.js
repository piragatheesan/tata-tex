import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Never import this client into a browser component. It bypasses RLS. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey)
    throw new Error('Configure Supabase in .env.local. See docs/SUPABASE_SETUP.md.');
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}
