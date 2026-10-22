import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts } from '../lib/catalogue.mjs';

const products = [
  {
    id: 1,
    name: 'Lab coat',
    code: 'TT-2',
    category_slug: 'hospital',
    category_name: 'Hospital uniforms',
    availability: 'available',
    price_display: 'public',
    price: 200,
  },
  {
    id: 2,
    name: 'Scrubs',
    code: 'TT-10',
    category_slug: 'hospital',
    category_name: 'Hospital uniforms',
    availability: 'enquire',
    price_display: 'contact',
    price: 50,
  },
  {
    id: 3,
    name: 'Apron',
    code: 'TT-3',
    category_slug: 'hotel',
    category_name: 'Hotel uniforms',
    availability: 'available',
    price_display: 'public',
    price: 100,
  },
];
const defaults = {
  category: '',
  query: '',
  availability: [],
  minimum: '',
  maximum: '',
  includeUnpriced: true,
  sort: 'default',
};
const ids = (overrides) =>
  filterProducts(products, { ...defaults, ...overrides }).map((product) => product.id);
test('unpriced checkbox works without price bounds', () =>
  assert.deepEqual(ids({ includeUnpriced: false }), [1, 3]));
test('price range includes unpriced products only when requested', () => {
  assert.deepEqual(ids({ minimum: '150', maximum: '250' }), [1, 2]);
  assert.deepEqual(ids({ minimum: '150', maximum: '250', includeUnpriced: false }), [1]);
});
test('internal prices never affect ordering', () => {
  assert.deepEqual(ids({ sort: 'price_asc' }), [3, 1, 2]);
  assert.deepEqual(ids({ sort: 'price_desc' }), [1, 3, 2]);
});
test('search supports category, product code and case-insensitive name', () => {
  assert.deepEqual(ids({ query: 'HOSPITAL' }), [1, 2]);
  assert.deepEqual(ids({ query: 'TT-10' }), [2]);
  assert.deepEqual(ids({ query: ' COAT ' }), [1]);
});
test('category and availability compose', () =>
  assert.deepEqual(ids({ category: 'hospital', availability: ['available'] }), [1]));
test('sorting codes is numeric and preserves source order', () => {
  assert.deepEqual(ids({ sort: 'code' }), [1, 3, 2]);
  assert.deepEqual(
    products.map((product) => product.id),
    [1, 2, 3],
  );
});
test('inverted bounds cannot match a priced product', () =>
  assert.deepEqual(ids({ minimum: '300', maximum: '100', includeUnpriced: false }), []));
