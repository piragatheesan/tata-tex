import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

function contentSecurityPolicy(nonce) {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    `connect-src 'self' ${supabaseOrigin}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ');
}

/** Refresh staff sessions before rendering; public pages do not need Auth cookies. */
export async function proxy(request) {
  const requestHeaders = new Headers(request.headers);
  const nonce = randomBytes(16).toString('base64');
  const policy = process.env.NODE_ENV === 'production' ? contentSecurityPolicy(nonce) : null;
  if (policy) {
    // Next.js reads this request CSP to apply the nonce to its generated scripts.
    requestHeaders.set('Content-Security-Policy', policy);
    requestHeaders.set('x-nonce', nonce);
  }
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = next();

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            values.forEach(({ name, value }) => request.cookies.set(name, value));
            response = next();
            values.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      });
      await supabase.auth.getClaims();
      response.headers.set('Cache-Control', 'private, no-store');
    }
  }
  if (policy) response.headers.set('Content-Security-Policy', policy);
  return response;
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
