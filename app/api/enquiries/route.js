import { requestAddress } from '@/lib/rate-limit.mjs';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createAdminClient, unwrap } from '@/lib/supabase/admin';
import { consumeRateLimit } from '@/lib/security-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const configuredLimit = Number(process.env.RATE_LIMIT_PER_HOUR || 10);
const maximumEnquiriesPerHour = Number.isFinite(configuredLimit)
  ? Math.max(1, Math.min(30, Math.floor(configuredLimit)))
  : 10;
const clip = (value, maximum) => (typeof value === 'string' ? value.trim().slice(0, maximum) : '');
const oneLine = (value) => value.replace(/[\r\n]+/g, ' ');

async function readRequestBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty request');
  const chunks = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 16384) {
      await reader.cancel();
      throw new Error('Request too large');
    }
    chunks.push(Buffer.from(value));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
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
  if (!SMTP_HOST || !MAIL_TO) {
    console.info(`Enquiry ${id} stored. Email is not configured.`);
    return;
  }
  const transport = nodemailer.createTransport({
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  await transport.sendMail(mail);
  unwrap(await createAdminClient().from('enquiries').update({ emailed: true }).eq('id', id));
  console.log(`Enquiry ${id} emailed to ${MAIL_TO}`);
}

export async function POST(req) {
  try {
    const ip = requestAddress(req.headers);
    if (!(await consumeRateLimit('enquiry', ip, maximumEnquiriesPerHour, 3600)))
      return NextResponse.json(
        { error: 'Too many enquiries. Please try again later.' },
        { status: 429 },
      );
  } catch (error) {
    console.error('Enquiry rate limit could not be checked:', error.message);
    return NextResponse.json(
      { error: 'Enquiries are temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }
  let b;
  try {
    b = await readRequestBody(req);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!b || typeof b !== 'object' || Array.isArray(b))
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
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
  if (clip(b.hp, 200))
    return NextResponse.json({ id: 0, message: 'Enquiry received' }, { status: 201 }); // honeypot
  let id;
  try {
    id = unwrap(await createAdminClient().from('enquiries').insert(e).select('id').single()).id;
  } catch {
    return NextResponse.json(
      { error: 'We could not save your enquiry. Please try again.' },
      { status: 503 },
    );
  }
  await sendEmail(id, e).catch((err) =>
    console.error(`Enquiry ${id} saved but email failed:`, err.message),
  );
  return NextResponse.json({ id, message: 'Enquiry received' }, { status: 201 });
}
