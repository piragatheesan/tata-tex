import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '@/lib/db';

export const dynamic = 'force-dynamic';
const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function GET(req, { params }) {
  const { file } = await params;
  const m = /^[a-f0-9]{16,}\.(jpg|png|webp)$/.exec(file);
  if (!m) return new Response('Not found', { status: 404 });
  try {
    const buf = fs.readFileSync(path.join(DATA_DIR, 'uploads', file));
    return new Response(buf, {
      headers: { 'Content-Type': TYPES[m[1]], 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
