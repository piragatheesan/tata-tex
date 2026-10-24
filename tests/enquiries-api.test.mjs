import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
let allowed = true;
let saved = [];
const stubs = {
  '@/lib/rate-limit.mjs': { requestAddress: () => 'test' },
  'next/server': { NextResponse: Response },
  nodemailer: { default: { createTransport: () => ({ sendMail: async () => ({}) }) } },
  '@/lib/security-rate-limit': { consumeRateLimit: async () => allowed },
  '@/lib/supabase/admin': {
    createAdminClient: () => ({
      from: () => ({
        insert: (value) => {
          saved.push(value);
          return { select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) };
        },
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
    }),
    unwrap: ({ data, error }) => {
      if (error) throw error;
      return data;
    },
  },
};
const context = vm.createContext({ process: { env: {} }, Buffer, console });
const module = new vm.SourceTextModule(fs.readFileSync('app/api/enquiries/route.js', 'utf8'), {
  context,
});
await module.link(async (name) => {
  const values = stubs[name];
  if (!values) throw Error('Unexpected import ' + name);
  return new vm.SyntheticModule(
    Object.keys(values),
    function () {
      for (const key of Object.keys(values)) this.setExport(key, values[key]);
    },
    { context },
  );
});
await module.evaluate();
const post = module.namespace.POST;
const send = (body) =>
  post(
    new Request('http://localhost/api/enquiries', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
const valid = { name: 'Customer', contact: 'customer@example.com', message: 'Uniform enquiry' };
test('valid enquiry is stored with bounded public fields', async () => {
  saved = [];
  const response = await send({ ...valid, company: ' x '.repeat(1000), extra: 'ignored' });
  assert.equal(response.status, 201);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].company.length, 120);
  assert.equal(saved[0].extra, undefined);
});
test('malformed, oversized and incomplete submissions do not save records', async () => {
  saved = [];
  assert.equal((await send('{')).status, 400);
  assert.equal((await send('x'.repeat(17000))).status, 400);
  assert.equal((await send({ name: 'Customer' })).status, 422);
  assert.equal(saved.length, 0);
});
test('honeypot and denied quotas do not save enquiries', async () => {
  saved = [];
  assert.equal((await send({ ...valid, hp: 'bot' })).status, 201);
  assert.equal(saved.length, 0);
  allowed = false;
  try {
    assert.equal((await send(valid)).status, 429);
    assert.equal(saved.length, 0);
  } finally {
    allowed = true;
  }
});
