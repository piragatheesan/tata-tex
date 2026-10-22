import { createClient } from '@supabase/supabase-js';
import nextEnvironment from '@next/env';
nextEnvironment.loadEnvConfig(process.cwd());

export function scriptClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function check(result) {
  if (result.error) throw result.error;
  return result.data;
}
