import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { filterProducts } from '../lib/catalogue.mjs';

const rows = [
  {
    id: 1,
    name: 'Coat',
    code: 'TT-1',
    slug: 'coat',
    price: 400,
    price_display: 'contact',
    published: true,
    availability: 'enquire',
    categories: { name: 'Hospital', slug: 'hospital', published: true, display_order: 0 },
  },
  {
    id: 2,
    name: 'Scrubs',
    code: 'TT-2',
    slug: 'scrubs',
    price: 200,
    price_display: 'public',
    published: true,
    availability: 'available',
    categories: { name: 'Hospital', slug: 'hospital', published: true, display_order: 0 },
  },
  {
    id: 3,
    name: 'Hidden',
    code: 'TT-3',
    slug: 'hidden',
    price: 900,
    price_display: 'public',
    published: true,
    availability: 'available',
    categories: { name: 'Hidden', slug: 'hidden', published: false, display_order: 1 },
  },
];
let authorized = true;
let mutationFails = false;
const deletedImages = [];
let lastRange;
function query(table) {
  const filters = [];
  let mode = 'select',
    one = false;
  const builder = {
    select() {
      return this;
    },
    order() {
      return this;
    },
    range(start, end) {
      lastRange = [start, end];
      return this;
    },
    limit() {
      return this;
    },
    eq(key, value) {
      filters.push([key, value]);
      return this;
    },
    update() {
      mode = 'update';
      return this;
    },
    insert() {
      mode = 'insert';
      return this;
    },
    single() {
      one = true;
      return this;
    },
    maybeSingle() {
      one = true;
      return this;
    },
    then(resolve, reject) {
      if (mode !== 'select' && mutationFails)
        return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } }).then(
          resolve,
          reject,
        );
      const data = (
        table === 'products' ? rows.map((row) => ({ ...row, image: 'old-photo.jpg' })) : []
      ).filter((row) => filters.every(([key, value]) => row[key] === value));
      return Promise.resolve({ data: one ? data[0] || { id: 1 } : data, error: null }).then(
        resolve,
        reject,
      );
    },
  };
  return builder;
}
const stubs = {
  'server-only': {},
  './supabase/admin': {
    createAdminClient: () => ({ from: query }),
    unwrap: (result) => {
      if (result.error) throw result.error;
      return result.data;
    },
  },
  './auth': {
    requireUser: async () => {
      if (!authorized) throw new Error('Unauthorized');
      return { id: 'user-1' };
    },
    requireAdminRole: async () => {
      if (!authorized) throw new Error('Unauthorized');
      return { id: 'user-1' };
    },
    clientIp: async () => 'local',
  },
  './security-rate-limit': {
    consumeRateLimit: async () => true,
    clearRateLimit: async () => {},
  },
  './catalogue.mjs': { filterProducts },
  './supabase/server': { createSessionClient: async () => ({}) },
  './storage': {
    uploadImage: async () => 'new-photo.jpg',
    removeImage: async (filename) => deletedImages.push(filename),
  },
  './ui': { slugify: (value) => value.toLowerCase(), STATUSES: ['New', 'Closed'] },
  'next/navigation': {
    redirect: (location) => {
      throw new Error('REDIRECT:' + location);
    },
  },
  'next/cache': { revalidatePath: () => {} },
};
const context = vm.createContext({ process, Buffer, console, FormData, Date });
async function load(filename) {
  const module = new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), { context });
  await module.link(async (specifier) => {
    const exports = stubs[specifier] || (await import(specifier));
    return new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      },
      { context },
    );
  });
  await module.evaluate();
  return module.namespace;
}
const queries = await load('lib/queries.js');
const actions = await load('lib/actions.js');
test('public catalogue excludes hidden categories and strips internal prices', async () => {
  const products = await queries.getProducts();
  assert.deepEqual(
    Array.from(products, (product) => product.id),
    [1, 2],
  );
  assert.equal(products[0].price, null);
  const bounds = await queries.getPriceBounds();
  assert.equal(bounds.n, 1);
  assert.equal(bounds.min, 200);
  assert.equal(bounds.max, 200);
});
test('private catalogue reads authenticate before accessing data', async () => {
  authorized = false;
  await assert.rejects(queries.getProducts({ all: true }), /Unauthorized/);
  await assert.rejects(queries.getProductById(1), /Unauthorized/);
  authorized = true;
});
test('failed Supabase save cleans only the new image, preserving the original', async () => {
  mutationFails = true;
  deletedImages.length = 0;
  const form = new FormData();
  for (const [key, value] of Object.entries({
    id: 1,
    name: 'Coat',
    code: 'TT-1',
    price_display: 'contact',
    availability: 'enquire',
  }))
    form.set(key, String(value));
  form.set('image', new Blob(['new-image'], { type: 'image/jpeg' }), 'new.jpg');
  await assert.rejects(actions.saveProduct(form), /REDIRECT:.*error=/);
  assert.deepEqual(deletedImages, ['new-photo.jpg']);
  mutationFails = false;
});

test('invalid admin product IDs return not-found without a database lookup', async () => {
  for (const id of [NaN, -1, 0, 1.5, Infinity])
    assert.equal(await queries.getProductById(id), null);
});

test('enquiry pagination reads the requested range', async () => {
  await queries.getEnquiries({ limit: 51, offset: 50 });
  assert.deepEqual(lastRange, [50, 100]);
});

test('saving enquiries retains local filters and rejects external redirect destinations', async () => {
  const form = new FormData();
  form.set('id', '1');
  form.set('status', 'New');
  form.set('back', '/admin/enquiries?page=1&status=New');
  await assert.rejects(
    actions.updateEnquiry(form),
    /REDIRECT:\/admin\/enquiries\?page=1&status=New&ok=/,
  );
  form.set('back', 'https://example.com');
  await assert.rejects(actions.updateEnquiry(form), /REDIRECT:\/admin\/enquiries\?ok=/);
});
