import test from 'node:test';
import assert from 'node:assert/strict';
import { requestAddress } from '../lib/rate-limit.mjs';

const original = {
  trust: process.env.TRUST_PROXY,
  environment: process.env.NODE_ENV,
};
test.after(() => {
  if (original.trust === undefined) delete process.env.TRUST_PROXY;
  else process.env.TRUST_PROXY = original.trust;
  if (original.environment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = original.environment;
});

test('trusted proxy address uses the first forwarded visitor address', () => {
  process.env.TRUST_PROXY = 'true';
  process.env.NODE_ENV = 'production';
  const headers = new Headers({ 'x-forwarded-for': '198.51.100.12, 10.0.0.4' });
  assert.equal(requestAddress(headers), '198.51.100.12');
});

test('production refuses a shared local rate-limit identity without proxy trust', () => {
  process.env.TRUST_PROXY = 'false';
  process.env.NODE_ENV = 'production';
  assert.throws(() => requestAddress(new Headers()), /Configure TRUST_PROXY/);
});

test('development has a stable local address for local testing', () => {
  process.env.TRUST_PROXY = 'false';
  process.env.NODE_ENV = 'development';
  assert.equal(requestAddress(new Headers()), 'local');
});
