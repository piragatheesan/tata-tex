import Link from 'next/link';
import { getProducts } from '@/lib/queries';
import { priceLabel, AVAILABILITY } from '@/lib/ui';
import Banner from '@/components/admin/Banner';

export default async function AdminProducts({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const list = getProducts({ all: true, q });
  return (
    <>
      <h1>Products</h1>
      <Banner sp={sp} />
      <div className="bar2">
        <form action="/admin/products" className="search">
          <input type="search" name="q" defaultValue={q} placeholder="Search by name, code or category" aria-label="Search products" />
          <button className="btn" type="submit">Search</button>
        </form>
        <Link className="btn" href="/admin/products/new">Add product</Link>
      </div>
      <div className="ox">
        <table className="tbl">
          <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Price shown</th><th>Availability</th><th>Published</th><th /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td><td>{p.name}</td><td>{p.category_name || '-'}</td><td>{priceLabel(p)}</td>
                <td>{AVAILABILITY[p.availability]}</td><td>{p.published ? 'Yes' : 'No'}</td>
                <td><Link href={`/admin/products/${p.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length ? <p className="m">No products found.</p> : null}
    </>
  );
}
