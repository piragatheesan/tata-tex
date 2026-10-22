import { getUser } from '@/lib/auth';
import { collectRows } from '@/lib/queries';

export const dynamic = 'force-dynamic';
const COLS = [
  'id',
  'created_at',
  'status',
  'type',
  'product',
  'name',
  'contact',
  'company',
  'qty',
  'message',
  'notes',
];
// Cells starting with = + - @ are prefixed so spreadsheets do not run them as formulas.
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

export async function GET() {
  if (!(await getUser())) return new Response('Unauthorized', { status: 401 });
  const rows = (await collectRows('enquiries')).reverse();
  const csv = [COLS.join(','), ...rows.map((r) => COLS.map((c) => cell(r[c])).join(','))].join(
    '\r\n',
  );
  return new Response('\ufeff' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tatatex-enquiries.csv"',
    },
  });
}
