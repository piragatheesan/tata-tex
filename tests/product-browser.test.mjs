import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { filterProducts } from '../lib/catalogue.mjs';

const require = createRequire(import.meta.url);
const { transformSync } = require('next/dist/compiled/babel/core');
const source = fs.readFileSync('components/ProductBrowser.js', 'utf8');
const compiled = transformSync(source, {
  filename: 'ProductBrowser.js',
  babelrc: false,
  configFile: false,
  presets: [[require('next/dist/compiled/babel/preset-react'), { runtime: 'automatic' }]],
  plugins: [require('next/dist/compiled/babel/plugin-transform-modules-commonjs')],
}).code;
const loaded = { exports: {} };
const loadDependency = (specifier) => {
  if (specifier === '@/lib/catalogue.mjs') return { filterProducts };
  if (specifier === './ProductCard')
    return { __esModule: true, default: ({ p }) => React.createElement('article', null, p.name) };
  return require(specifier);
};
new Function('require', 'module', 'exports', compiled)(loadDependency, loaded, loaded.exports);
const ProductBrowser = loaded.exports.default;
const categories = [{ id: 1, slug: 'hospital', name: 'Hospital uniforms', count: 1 }];
const products = [
  {
    id: 1,
    name: 'Lab coat',
    code: 'TT-001',
    category_slug: 'hospital',
    price_display: 'contact',
    availability: 'enquire',
  },
];
const initial = {
  category: '',
  q: '',
  avail: [],
  sort: 'default',
  min: '',
  max: '',
  unpriced: true,
};

test('catalogue renders category buttons with populated categories', () => {
  const html = renderToStaticMarkup(
    React.createElement(ProductBrowser, { categories, products, initial, bounds: { n: 0 } }),
  );
  assert.match(html, /Hospital uniforms/);
  assert.match(html, /Lab coat/);
});
test('selected category renders its active button without undefined identifiers', () => {
  const html = renderToStaticMarkup(
    React.createElement(ProductBrowser, {
      categories,
      products,
      initial: { ...initial, category: 'hospital' },
      bounds: { n: 0 },
    }),
  );
  assert.match(html, /class="on" aria-pressed="true"/);
  assert.match(html, /<h1>Hospital uniforms<\/h1>/);
});
