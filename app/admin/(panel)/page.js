import Link from 'next/link';
import { getDb } from '@/lib/db';
import Banner from '@/components/admin/Banner';

export default async function Dashboard({ searchParams }) {
  const sp = await searchParams;
  const db = getDb();
  const n = (sql) => db.prepare(sql).get().n;
  const stats = [
    ['Products', n('select count(*) n from products'), '/admin/products'],
    ['Published', n('select count(*) n from products where published = 1'), '/admin/products'],
    ['Categories', n('select count(*) n from categories'), '/admin/categories'],
    ['New enquiries', n("select count(*) n from enquiries where status = 'New'"), '/admin/enquiries?status=New'],
  ];
  const recent = db.prepare('select id, created_at, type, product, name, status from enquiries order by id desc limit 5').all();
  return (
    <>
      <h1>Dashboard</h1>
      <Banner sp={sp} />
      <div className="stats">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href} className="stat"><b>{value}</b><span>{label}</span></Link>
        ))}
      </div>
      <h2>Latest enquiries</h2>
      {recent.length ? (
        <div className="ox">
          <table className="tbl">
            <thead><tr><th>Received</th><th>Type</th><th>Product</th><th>From</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id}><td>{e.created_at}</td><td>{e.type}</td><td>{e.product}</td><td>{e.name}</td><td>{e.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="m">No enquiries yet.</p>}
      <p><Link className="btn" href="/admin/enquiries">Open all enquiries</Link></p>
    </>
  );
}
