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
  '@/components/admin/SubmitButton': component(({ children }) =>
    React.createElement('button', { type: 'submit' }, children),
  ),
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
test('dashboard keeps real product cards visible when every product is published', async () => {
  const Dashboard = load('app/admin/(panel)/page.js', {
    ...mocks,
    '@/lib/queries': {
      ...mocks['@/lib/queries'],
      getProducts: async () => [{ id: 2, name: 'Published shirt', published: true }],
    },
  });
  const html = renderToStaticMarkup(await Dashboard({ searchParams: Promise.resolve({}) }));
  assert.match(html, /Your products/);
  assert.match(html, /Published shirt/);
  assert.match(html, /\/admin\/products\/2/);
  assert.doesNotMatch(html, /Products to review/);
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

test('product editor provides a Bootstrap preview and deletion only for saved products', () => {
  const ProductForm = load('components/admin/ProductForm.js', {
    ...mocks,
    '@/lib/actions': { saveProduct: '/test-save' },
    '@/lib/ui': require('../lib/ui.js'),
    './ProductEditor.module.css': mocks['@/components/admin/Admin.module.css'],
    './DeleteProductButton': component(() => React.createElement('button', null, 'Delete product')),
  });
  const fresh = renderToStaticMarkup(React.createElement(ProductForm, { categories: [] }));
  assert.match(fresh, /col-12 col-lg-6/);
  assert.match(fresh, /Live preview/);
  assert.match(fresh, /Contact for Price/);
  assert.doesNotMatch(fresh, /Delete product/);
  const existing = renderToStaticMarkup(
    React.createElement(ProductForm, {
      categories: [{ id: 1, name: 'School uniforms' }],
      product: {
        id: 4,
        name: 'School shirt',
        code: 'TT-4',
        category_id: 1,
        price_display: 'contact',
        price: 1200,
        availability: 'available',
        published: true,
      },
    }),
  );
  assert.match(existing, /Delete product/);
  const preview = existing.slice(existing.indexOf('<aside'));
  assert.match(preview, /School shirt/);
  assert.match(preview, /School uniforms/);
  assert.match(preview, /Contact for Price/);
  assert.doesNotMatch(preview, /1,200|1200/);
});

test('administrator email settings mask the saved SMTP password', async () => {
  const previous = process.env.SMTP_PASS;
  process.env.SMTP_PASS = 'private-smtp-test-value';
  try {
    const Settings = load('app/admin/(panel)/settings/page.js', {
      ...mocks,
      '@/lib/auth': { requireUser: async () => ({ username: 'admin', role: 'administrator' }) },
    });
    const html = renderToStaticMarkup(await Settings());
    assert.match(html, /Saved securely \(hidden\)/);
    assert.doesNotMatch(html, /private-smtp-test-value|SMTP_PASS=/);
    assert.match(html, /card-body/);
  } finally {
    if (previous === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = previous;
  }
});

test('destructive submit buttons cancel safely and show a pending state', () => {
  const previous = globalThis.window;
  globalThis.window = { confirm: () => false };
  try {
    const Button = load('components/admin/SubmitButton.js', {
      'react-dom': { useFormStatus: () => ({ pending: false }) },
    });
    const element = Button({ children: 'Delete', confirmMessage: 'Delete this item?' });
    let cancelled = false;
    element.props.onClick({
      preventDefault: () => {
        cancelled = true;
      },
    });
    assert.equal(cancelled, true);
    const Pending = load('components/admin/SubmitButton.js', {
      'react-dom': { useFormStatus: () => ({ pending: true }) },
    });
    const pending = Pending({ children: 'Delete', pendingLabel: 'Deleting…' });
    assert.equal(pending.props.disabled, true);
    assert.equal(pending.props.children, 'Deleting…');
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
