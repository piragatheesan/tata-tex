import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
const { NextRequest, NextResponse } = createRequire(import.meta.url)('next/server');

test('session refresh forwards new cookies alongside the response cookies', async () => {
  const context = vm.createContext({
    Headers,
    process: {
      env: {
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-public',
      },
    },
  });
  const stubs = {
    '@supabase/ssr': {
      createServerClient: (_url, _key, options) => ({
        auth: {
          getClaims: async () => {
            options.cookies.setAll([
              { name: 'session', value: 'refreshed', options: { path: '/' } },
            ]);
            return { data: { claims: {} }, error: null };
          },
        },
      }),
    },
    'next/server': { NextResponse },
    'node:crypto': { randomBytes },
  };
  const module = new vm.SourceTextModule(fs.readFileSync('proxy.js', 'utf8'), { context });
  await module.link(async (name) => {
    const values = stubs[name];
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const key of Object.keys(values)) this.setExport(key, values[key]);
      },
      { context },
    );
  });
  await module.evaluate();
  const request = new NextRequest('http://localhost/admin/settings', {
    headers: { cookie: 'session=old' },
  });
  const response = await module.namespace.proxy(request);
  assert.match(response.headers.get('x-middleware-request-cookie'), /session=refreshed/);
  assert.equal(response.cookies.get('session').value, 'refreshed');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
