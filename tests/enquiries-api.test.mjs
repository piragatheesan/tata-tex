import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
let allowed = true;
let saved = [];
let sent = [];
let updates = [];
let failedRecipient;
let saveError = false;
const env = {};
test.beforeEach(() => {
  sent = [];
  updates = [];
  failedRecipient = undefined;
  saveError = false;
  for (const key of Object.keys(env)) delete env[key];
});
const stubs = {
  '@/lib/rate-limit.mjs': { requestAddress: () => 'test' },
  'next/server': { NextResponse: Response },
  nodemailer: {
    default: {
      createTransport: () => ({
        sendMail: async (mail) => {
          sent.push(mail);
          if (mail.to === failedRecipient) throw new Error('SMTP unavailable');
          return {};
        },
      }),
    },
  },
  '@/lib/security-rate-limit': { consumeRateLimit: async () => allowed },
  '@/lib/supabase/admin': {
    createAdminClient: () => ({
      from: () => ({
        insert: (value) => {
          saved.push(value);
          return {
            select: () => ({
              single: async () => ({
                data: { id: 1 },
                error: saveError ? new Error('Save failed') : null,
              }),
            }),
          };
        },
        update: (value) => ({
          eq: async (key, id) => {
            updates.push({ value, key, id });
            return { data: null, error: null };
          },
        }),
      }),
    }),
    unwrap: ({ data, error }) => {
      if (error) throw error;
      return data;
    },
  },
};
const context = vm.createContext({ process: { env }, Buffer, console });
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

const configureEmail = () =>
  Object.assign(env, {
    SMTP_HOST: 'smtp.example.com',
    SMTP_USER: 'smtp-user@example.com',
    MAIL_FROM: 'Tata Tex <enquiries@example.com>',
    MAIL_TO: 'team@example.com',
  });

test('sends separate team and customer emails using the configured sender', async () => {
  configureEmail();
  const response = await send({ ...valid, contact: ' customer@example.com ', product: 'Uniforms' });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: 1, message: 'Enquiry received' });
  assert.equal(sent.length, 2);
  const team = sent.find((mail) => mail.to === env.MAIL_TO);
  const customer = sent.find((mail) => mail.to === valid.contact);
  assert.equal(team.from, env.MAIL_FROM);
  assert.equal(team.replyTo, valid.contact);
  assert.match(team.text, /New website enquiry #1/);
  assert.equal(customer.from, env.MAIL_FROM);
  assert.equal(customer.replyTo, env.MAIL_TO);
  assert.match(customer.subject, /confirmation #1/);
  assert.match(customer.text, /Hello Customer/);
  assert.match(customer.text, /Product: Uniforms/);
  assert.match(customer.text, /Uniform enquiry/);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].value.emailed, true);
});

test('phone numbers and invalid email contacts only notify the team', async () => {
  configureEmail();
  for (const contact of [
    '0771234567',
    'customer@example',
    'customer@example.com\r\nBcc: other@example.com',
  ]) {
    sent = [];
    assert.equal((await send({ ...valid, contact })).status, 201);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, env.MAIL_TO);
    assert.equal(sent[0].replyTo, undefined);
  }
});

test('either email can fail without blocking the other or failing the saved enquiry', async () => {
  configureEmail();
  for (const recipient of [env.MAIL_TO, valid.contact]) {
    sent = [];
    updates = [];
    failedRecipient = recipient;
    assert.equal((await send(valid)).status, 201);
    assert.equal(sent.length, 2);
    assert.equal(updates.length, recipient === env.MAIL_TO ? 0 : 1);
  }
});

test('unconfigured email skips both sends and uses the existing sender fallback when configured', async () => {
  assert.equal((await send(valid)).status, 201);
  assert.equal(sent.length, 0);
  configureEmail();
  delete env.MAIL_FROM;
  assert.equal((await send(valid)).status, 201);
  assert.ok(sent.every((mail) => mail.from === env.SMTP_USER));
});

test('rejected, honeypot and unsaved enquiries send no emails', async () => {
  configureEmail();
  assert.equal((await send('{')).status, 400);
  assert.equal((await send({ name: 'Customer' })).status, 422);
  assert.equal((await send({ ...valid, hp: 'bot' })).status, 201);
  allowed = false;
  try {
    assert.equal((await send(valid)).status, 429);
  } finally {
    allowed = true;
  }
  saveError = true;
  assert.equal((await send(valid)).status, 503);
  assert.equal(sent.length, 0);
  assert.equal(updates.length, 0);
});
