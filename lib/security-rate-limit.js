import 'server-only';
import { createHmac } from 'node:crypto';
import { createAdminClient, unwrap } from './supabase/admin';

function hashAddress(address) {
  // The Supabase secret key is a server-only fallback so raw IP addresses are
  // never persisted in the rate-limit table.
  const secret =
    process.env.RATE_LIMIT_HASH_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Configure RATE_LIMIT_HASH_SECRET for rate limiting.');
  return createHmac('sha256', secret).update(String(address)).digest('hex');
}

async function callRateLimitRpc(name, args) {
  return unwrap(await createAdminClient().rpc(name, args));
}

export async function consumeRateLimit(scope, address, maximum, windowSeconds) {
  return callRateLimitRpc('consume_rate_limit', {
    p_scope: scope,
    p_key_hash: hashAddress(address),
    p_maximum: maximum,
    p_window_seconds: windowSeconds,
  });
}

export async function clearRateLimit(scope, address) {
  await callRateLimitRpc('clear_rate_limit', {
    p_scope: scope,
    p_key_hash: hashAddress(address),
  });
}
