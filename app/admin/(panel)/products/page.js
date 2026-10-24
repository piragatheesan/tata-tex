import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getProducts } from '@/lib/queries';
import { ProductImage } from '@/components/ProductCard';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import Banner from '@/components/admin/Banner';
import styles from '@/components/admin/ProductEditor.module.css';
export default async function Products({ searchParams }) {
  await requireUser();
  const sp = await searchParams;
  const query = typeof sp.q === 'string' ? sp.q.trim().slice(0, 120) : '';
  const products = await getProducts({ all: true, q: query });
  return (
    <>
      <div className="toolbar">
        <div>
          <h1>Products</h1>
          <p>Manage your existing catalogue.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/products/new">
          Add product
        </Link>
      </div>
      <Banner sp={sp} />
      <form method="get" className="toolbar" role="search">
        <label style={{ flex: '1 1 240px' }}>
          Find a product
          <input
            className="form-control"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, code or category"
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
        {query ? (
          <Link className="btn btn-outline-primary" href="/admin/products">
            Clear
          </Link>
        ) : null}
      </form>
      {products.length ? (
        <div className={styles.list}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Code</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link className={styles.productName} href={`/admin/products/${product.id}`}>
                      <ProductImage p={product} height={72} />
                      <strong>{product.name}</strong>
                    </Link>
                  </td>
                  <td>{product.code}</td>
                  <td>{product.category_name || 'Uncategorised'}</td>
                  <td>{product.published ? 'Published' : 'Draft'}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                      <DeleteProductButton product={{ id: product.id, name: product.name }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          {query
            ? 'No products match your search.'
            : 'No products yet. Add your first product to get started.'}
        </p>
      )}
    </>
  );
}
