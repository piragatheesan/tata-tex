import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSessionClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error('Configure the Supabase URL and publishable key in .env.local.');
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server Components cannot set cookies; proxy.js refreshes them. */
        }
      },
    },
  });
}
