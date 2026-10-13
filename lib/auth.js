import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';
import { getDb } from './db';

const COOKIE = 'tt_session';
const TTL = 8 * 3600; // seconds

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is not set');
    return 'dev-only-secret';
  }
  return s;
}
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
export function verifyPassword(pw, stored) {
  const [salt, h] = String(stored).split(':');
  if (!salt || !h) return false;
  const a = Buffer.from(h, 'hex');
  const b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function setSession(uid) {
  const payload = Buffer.from(JSON.stringify({ uid, exp: Math.floor(Date.now() / 1000) + TTL })).toString('base64url');
  const secure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE !== 'false' : process.env.NODE_ENV === 'production';
  (await cookies()).set(COOKIE, payload + '.' + sign(payload), { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: TTL });
}
export const clearSession = async () => (await cookies()).delete(COOKIE);

export async function getUser() {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  const [p, s] = c.split('.');
  if (!p || !s) return null;
  const A = Buffer.from(s), B = Buffer.from(sign(p));
  if (A.length !== B.length || !crypto.timingSafeEqual(A, B)) return null;
  let d;
  try { d = JSON.parse(Buffer.from(p, 'base64url').toString()); } catch { return null; }
  if (!d.exp || d.exp < Date.now() / 1000) return null;
  return getDb().prepare('select id, username, role from users where id = ?').get(d.uid) || null;
}
export async function requireUser() {
  const u = await getUser();
  if (!u) redirect('/admin/login');
  return u;
}
export async function requireAdminRole() {
  const u = await requireUser();
  if (u.role !== 'administrator') redirect('/admin?error=' + encodeURIComponent('Only administrators can do that.'));
  return u;
}

// Login attempt limiter (in memory): 5 failed attempts per address per 15 minutes.
const fails = new Map();
export const clientIp = async () => ((await headers()).get('x-forwarded-for') || 'local').split(',')[0].trim();
export function loginBlocked(ip) {
  const now = Date.now();
  const list = (fails.get(ip) || []).filter((t) => now - t < 900_000);
  fails.set(ip, list);
  return list.length >= 5;
}
export const recordFail = (ip) => fails.set(ip, [...(fails.get(ip) || []), Date.now()]);
export const clearFails = (ip) => fails.delete(ip);
