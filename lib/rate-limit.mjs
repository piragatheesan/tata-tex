export function requestAddress(headers) {
  // The reverse proxy must overwrite, not append to, client-supplied headers.
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim().slice(0, 100) || 'unknown';
  }
  // Never put every production visitor into a shared "local" rate-limit bucket.
  if (process.env.NODE_ENV === 'production')
    throw new Error('Configure TRUST_PROXY for the production hosting proxy.');
  return 'local';
}
