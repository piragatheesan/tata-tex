import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Exercise real database/actions in an isolated store; mock only Next request context.
const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tatatex-review-'));
process.env.DATA_DIR = dataDirectory;
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password-only';
process.env.SESSION_SECRET = 'local-regression-secret';
process.env.SMTP_HOST = '';
const cookieValues = new Map();
const cookieStore = {
  get: (key) => (cookieValues.has(key) ? { value: cookieValues.get(key) } : undefined),
  set: (key, value) => cookieValues.set(key, value),
  delete: (key) => cookieValues.delete(key),
};
const redirect = (location) => {
  throw new Error(`REDIRECT:${location}`);
};
const context = vm.createContext({ process, Buffer, console, Request, Response, FormData, Date });
const modules = new Map();
async function loadModule(specifier, parent = path.resolve('test-entry.js')) {
  const filename = specifier.startsWith('@/')
    ? path.resolve(specifier.slice(2))
    : specifier.startsWith('.')
      ? path.resolve(path.dirname(parent), specifier)
      : specifier;
  const resolved =
    path.isAbsolute(filename) && !path.extname(filename) ? filename + '.js' : filename;
  if (modules.has(resolved)) return modules.get(resolved);
  let module;
  if (path.isAbsolute(resolved)) {
    module = new vm.SourceTextModule(fs.readFileSync(resolved, 'utf8'), {
      context,
      identifier: resolved,
    });
    modules.set(resolved, module);
    await module.link((child) => loadModule(child, resolved));
  } else {
    const exports =
      resolved === 'next/headers'
        ? { cookies: async () => cookieStore, headers: async () => new Headers() }
        : resolved === 'next/navigation'
          ? { redirect }
          : resolved === 'next/server'
            ? { NextResponse: Response }
            : await import(resolved);
    module = new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      },
      { context, identifier: resolved },
    );
    modules.set(resolved, module);
  }
  return module;
}
async function source(filename) {
  const module = await loadModule('@/' + filename);
  if (module.status !== 'evaluated') await module.evaluate();
  return module.namespace;
}
const database = await source('lib/db.js');
const queries = await source('lib/queries.js');
const auth = await source('lib/auth.js');
const actions = await source('lib/actions.js');
const api = await source('app/api/enquiries/route.js');
const db = database.getDb();

test('passwords are hashed; cookies authenticate and reject tampering', async () => {
  const hash = auth.hashPassword('valid-password');
  assert.equal(auth.verifyPassword('valid-password', hash), true);
  assert.equal(auth.verifyPassword('wrong-password', hash), false);
  await auth.setSession(1);
  assert.equal((await auth.getUser()).username, 'test-admin');
  const valid = cookieValues.get('tt_session');
  cookieValues.set('tt_session', valid + 'tampered');
  assert.equal(await auth.getUser(), null);
  cookieValues.set('tt_session', valid);
});
test('password change invalidates older sessions', async () => {
  await auth.setSession(1);
  const previousCookie = cookieValues.get('tt_session');
  const form = new FormData();
  form.set('current', 'test-password-only');
  form.set('next', 'changed-password-only');
  await assert.rejects(actions.changePassword(form), /REDIRECT:.*Password/);
  const refreshedCookie = cookieValues.get('tt_session');
  assert.ok(await auth.getUser());
  cookieValues.set('tt_session', previousCookie);
  assert.equal(await auth.getUser(), null);
  cookieValues.set('tt_session', refreshedCookie);
});
test('hidden categories never contribute to public prices or products', () => {
  const product = queries.getProducts()[0];
  db.prepare("update products set price=500, price_display='public' where id=?").run(product.id);
  assert.equal(queries.getPriceBounds().n, 1);
  db.prepare('update categories set published=0 where id=?').run(product.category_id);
  assert.equal(queries.getPriceBounds().n, 0);
  assert.equal(queries.getProductBySlug(product.slug), undefined);
  db.prepare('update categories set published=1 where id=?').run(product.category_id);
});
test('failed duplicate-code save preserves the old image', async () => {
  const [first, second] = queries.getProducts();
  const filename = '0123456789abcdef01234567.jpg';
  fs.mkdirSync(path.join(dataDirectory, 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(dataDirectory, 'uploads', filename), 'existing-photo');
  db.prepare('update products set image=? where id=?').run(filename, first.id);
  const form = new FormData();
  for (const [key, value] of Object.entries({
    id: first.id,
    name: first.name,
    code: second.code,
    category_id: first.category_id,
    price_display: 'contact',
    availability: 'enquire',
    remove_image: 'on',
  }))
    form.set(key, String(value));
  await assert.rejects(actions.saveProduct(form), /REDIRECT:.*error=/);
  assert.equal(
    fs.readFileSync(path.join(dataDirectory, 'uploads', filename), 'utf8'),
    'existing-photo',
  );
  assert.equal(queries.getProductById(first.id).image, filename);
});
test('API rejects malformed input and stores a valid enquiry', async () => {
  const request = (body) =>
    new Request('http://localhost/api/enquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  assert.equal((await api.POST(request(null))).status, 400);
  assert.equal((await api.POST(request({ name: 'Visitor' }))).status, 422);
  const response = await api.POST(
    request({
      name: 'Test visitor',
      contact: 'test@example.com',
      message: 'Test order',
      type: 'General enquiry',
    }),
  );
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(
    db.prepare('select name from enquiries where id=?').get(result.id).name,
    'Test visitor',
  );
  assert.equal((await api.POST(request({ name: 'a'.repeat(18000) }))).status, 400);
});
test.after(() => {
  db.close();
  fs.rmSync(dataDirectory, { recursive: true, force: true });
});
