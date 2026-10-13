import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR || 10);
const hits = new Map(); // ip -> timestamps (in memory)
const clip = (v, max) => String(v ?? '').trim().slice(0, max);
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (list.length >= LIMIT) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}

async function sendEmail(id, e) {
  const { SMTP_HOST, SMTP_PORT = '587', SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;
  const mail = {
    from: MAIL_FROM || SMTP_USER || 'enquiries@localhost',
    to: MAIL_TO || 'dry-run@localhost',
    subject: oneLine(`[Tata Tex] ${e.type}: ${e.product} - ${e.name}`).slice(0, 200),
    text:
      `New website enquiry #${id}\n\nType: ${e.type}\nProduct: ${e.product}\nName: ${e.name}\nContact: ${e.contact}\n` +
      `Company: ${e.company || '-'}\nQuantity: ${e.qty || '-'}\n\nMessage:\n${e.message}\n`,
  };
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.contact)) mail.replyTo = e.contact;
  if (!SMTP_HOST || !MAIL_TO) { console.log('[dry-run, SMTP not configured] would send:\n', mail); return; }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  await transport.sendMail(mail);
  getDb().prepare('update enquiries set emailed = 1 where id = ?').run(id);
  console.log(`Enquiry ${id} emailed to ${MAIL_TO}`);
}

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (rateLimited(ip)) return NextResponse.json({ error: 'Too many enquiries. Please try again later.' }, { status: 429 });
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const e = {
    type: clip(b.type, 40) || 'General enquiry',
    product: clip(b.product, 120) || 'General',
    name: clip(b.name, 100),
    contact: clip(b.contact, 120),
    company: clip(b.company, 120),
    qty: clip(b.qty, 40),
    message: clip(b.message, 2000),
  };
  if (!e.name || e.contact.length < 3 || !e.message) {
    return NextResponse.json({ error: 'Name, contact and message are required.' }, { status: 422 });
  }
  if (clip(b.hp, 200)) return NextResponse.json({ id: 0, message: 'Enquiry received' }, { status: 201 }); // honeypot
  const id = Number(
    getDb()
      .prepare('insert into enquiries (type, product, name, contact, company, qty, message) values (?,?,?,?,?,?,?)')
      .run(e.type, e.product, e.name, e.contact, e.company, e.qty, e.message).lastInsertRowid
  );
  sendEmail(id, e).catch((err) => console.error(`Enquiry ${id} saved but email failed:`, err.message));
  return NextResponse.json({ id, message: 'Enquiry received' }, { status: 201 });
}

// Optional: let another system read enquiries (x-api-key = ADMIN_API_KEY). Staff normally use the admin dashboard.
export async function GET(req) {
  const key = process.env.ADMIN_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const a = Buffer.from(req.headers.get('x-api-key') || ''), k = Buffer.from(key);
  if (a.length !== k.length || !timingSafeEqual(a, k)) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  return NextResponse.json(getDb().prepare('select * from enquiries order by id desc limit 500').all());
}
