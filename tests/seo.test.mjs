import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const siteUrl = 'https://tatatex.lk';
let publicProducts = [{ slug: 'lab-coat' }];
async function load(file) {
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), { context });
  await module.link(async (name) => {
    const values =
      name === '@/lib/site'
        ? { siteUrl }
        : name === '@/lib/queries'
          ? { getProducts: async () => publicProducts }
          : null;
    assert.ok(values, `Unexpected import: ${name}`);
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [key, value] of Object.entries(values)) this.setExport(key, value);
      },
      { context },
    );
  });
  await module.evaluate();
  return module.namespace.default;
}

test('sitemap includes public pages and follows product publishing changes', async () => {
  const sitemap = await load('app/sitemap.js');
  assert.deepEqual(
    Array.from(await sitemap(), (entry) => entry.url),
    [
      siteUrl,
      `${siteUrl}/products`,
      `${siteUrl}/about`,
      `${siteUrl}/contact`,
      `${siteUrl}/products/lab-coat`,
    ],
  );
  publicProducts = [];
  assert.equal((await sitemap()).length, 4);
});

test('robots permits public crawling, excludes private routes and advertises the sitemap', async () => {
  const robots = (await load('app/robots.js'))();
  assert.equal(robots.rules.userAgent, '*');
  assert.equal(robots.rules.allow, '/');
  assert.deepEqual(Array.from(robots.rules.disallow), ['/admin', '/api/']);
  assert.equal(robots.sitemap, `${siteUrl}/sitemap.xml`);
});

test('www redirect is permanent and limited to the alternate hostname', async () => {
  const redirects = await require('../next.config.js').redirects();
  assert.deepEqual(redirects, [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.tatatex.lk' }],
      destination: 'https://tatatex.lk/:path*',
      permanent: true,
    },
  ]);
});
