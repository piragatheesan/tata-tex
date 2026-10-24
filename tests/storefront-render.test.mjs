import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function loadComponent(file, mocks) {
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
const component = (fn) => ({ __esModule: true, default: fn });
const product = {
  id: 1,
  slug: 'scrub',
  name: 'Scrub Set',
  code: 'HC-1',
  category_slug: 'healthcare',
};
const Gallery = loadComponent('components/ProductGallery.js', {
  '@/lib/product-images': {
    productImages: { scrub: [{ src: '/one.webp' }, { src: '/two.webp' }] },
  },
  './ProductCard': { ProductImage: () => React.createElement('span', null, 'No photo') },
});
test('gallery renders uploaded photo first and retains bundled alternatives', () => {
  const html = renderToStaticMarkup(
    React.createElement(Gallery, { product: { ...product, image: 'new.webp' } }),
  );
  assert.ok(html.indexOf('/uploads/new.webp') < html.indexOf('/one.webp'));
  assert.match(html, /Show photo 3/);
});
test('single-photo gallery does not show duplicate view or next controls', () => {
  const html = renderToStaticMarkup(
    React.createElement(Gallery, { product: { ...product, slug: 'other', image: 'one.webp' } }),
  );
  assert.doesNotMatch(html, /Next photo|gallery-secondary/);
  assert.match(html, /Zoom product photo/);
});
test('missing photos render a safe fallback', () => {
  const html = renderToStaticMarkup(
    React.createElement(Gallery, { product: { ...product, slug: 'missing' } }),
  );
  assert.match(html, /No photo/);
});
test('product cards show uniform details and a clear detail action', () => {
  const ProductCard = loadComponent('components/ProductCard.js', {
    'next/link': component(({ children, ...props }) => React.createElement('a', props, children)),
    '@/lib/ui': {
      swatch: () => '#fff',
      priceLabel: () => 'Contact for price',
      AVAILABILITY: { available: 'Available' },
    },
    '@/lib/product-images': { productImages: {} },
  });
  const html = renderToStaticMarkup(
    React.createElement(ProductCard, {
      p: { ...product, category_name: 'Healthcare', availability: 'available' },
    }),
  );
  assert.match(html, /HC-1 · Healthcare/);
  assert.match(html, /View Uniform Details/);
  assert.match(html, /Scrub Set/);
});
test('homepage renders without product slug and links to actual categories', async () => {
  const Home = loadComponent('app/(site)/page.js', {
    'next/link': component(({ children, ...props }) => React.createElement('a', props, children)),
    '@/lib/queries': {
      getCategories: async () => [{ id: 1, slug: 'healthcare', name: 'Healthcare' }],
      getProducts: async () => [product],
    },
    '@/lib/ui': { swatch: () => '#fff' },
    '@/lib/product-images': { categoryImages: {}, homeImages: [{}, {}, { src: '/hero.webp' }] },
    '@/lib/home-content': { getHomeSlides: async () => [] },
    '@/components/HomeHero': component(() =>
      React.createElement('h1', null, 'Uniforms for Every Role.'),
    ),
    '@/components/ProductCard': component(({ p }) => React.createElement('article', null, p.name)),
  });
  const html = renderToStaticMarkup(await Home());
  assert.match(html, /Uniforms for/);
  assert.match(html, /products\?category=healthcare/);
  assert.match(html, /Scrub Set/);
  assert.doesNotMatch(html, /Since 1983/);
  assert.match(html, /Retail &amp; wholesale/);
  assert.match(html, /Looking for the right uniform/);
  assert.match(html, /contact\?type=quote/);
});
test('enquiry dialog keeps the selected product and hides form until opened', () => {
  const Enquiry = loadComponent('components/EnquiryDialog.js', {
    './EnquiryForm': component(({ product }) =>
      React.createElement('form', { 'data-product': product.code }),
    ),
  });
  const html = renderToStaticMarkup(React.createElement(Enquiry, { product }));
  assert.match(html, /data-product="HC-1"/);
  assert.match(html, /<dialog/);
  assert.doesNotMatch(html, /<dialog[^>]*\sopen/);
});
