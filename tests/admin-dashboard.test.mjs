import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const component = (fn) => ({ __esModule: true, default: fn });
function load(file, mocks) {
  const { code } = require('next/dist/compiled/babel/core').transformSync(
    fs.readFileSync(file, 'utf8'),
    {
      filename: file,
      babelrc: false,
      configFile: false,
      presets: [[require('next/dist/compiled/babel/preset-react'), { runtime: 'automatic' }]],
      plugins: [require('next/dist/compiled/babel/plugin-transform-modules-commonjs')],
    },
  );
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => mocks[name] || require(name),
    module,
    module.exports,
  );
  return module.exports.default;
}
const mocks = {
  'next/link': component(({ children, ...props }) => React.createElement('a', props, children)),
  '@/lib/auth': { requireUser: async () => ({ username: 'staff', role: 'staff' }) },
  '@/components/admin/Banner': component(() => null),
  '@/components/admin/Icon': component(() => null),
  '@/components/admin/Admin.module.css': {
    __esModule: true,
    default: new Proxy({}, { get: (_, key) => key }),
  },
  '@/components/ProductCard': { ProductImage: () => null },
  '@/lib/queries': {
    getDashboardStats: async () => ({
      products: 48,
      categories: 6,
      enquiries: 8,
      awaitingReply: 5,
    }),
    getEnquiries: async () => [
      {
        id: 1,
        name: 'Customer',
        product: 'Uniform',
        status: 'Responded',
        created_at: '2026-10-24T00:00:00Z',
      },
    ],
    getProducts: async () => [
      { id: 1, name: 'Draft shirt', published: false },
      { id: 2, name: 'Published shirt', published: true },
    ],
  },
};
test('dashboard shows real statuses and reviews only unpublished products', async () => {
  const Dashboard = load('app/admin/(panel)/page.js', mocks);
  const html = renderToStaticMarkup(await Dashboard({ searchParams: Promise.resolve({}) }));
  assert.match(html, /Recent enquiries/);
  assert.match(html, /Responded/);
  assert.match(html, /Draft shirt/);
  assert.doesNotMatch(html, /Published shirt/);
  assert.match(html, /Not enabled/);
  assert.match(html, /\/admin\/settings/);
});
test('staff settings expose no SMTP credentials or configuration form', async () => {
  const previous = process.env.SMTP_PASS;
  process.env.SMTP_PASS = 'secret-test-value';
  try {
    const Settings = load('app/admin/(panel)/settings/page.js', mocks);
    const html = renderToStaticMarkup(await Settings());
    assert.match(html, /Contact your administrator/);
    assert.doesNotMatch(html, /secret-test-value|SMTP_PASS|<form/);
  } finally {
    if (previous === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = previous;
  }
});
