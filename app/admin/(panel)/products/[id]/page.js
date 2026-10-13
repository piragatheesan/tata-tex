import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getProductById } from '@/lib/queries';
import { deleteProduct } from '@/lib/actions';
import ProductForm from '@/components/admin/ProductForm';
import Banner from '@/components/admin/Banner';

export default async function EditProduct({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const product = getProductById(Number(id));
  if (!product) notFound();
  return (
    <>
      <p className="m"><Link href="/admin/products">← All products</Link></p>
      <h1>Edit: {product.name}</h1>
      <Banner sp={sp} />
      <ProductForm product={product} categories={getCategories({ all: true })} />
      <details className="danger">
        <summary>Delete this product</summary>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <p>This permanently removes the product and its photo.</p>
          <button className="btn" type="submit">Yes, delete {product.name}</button>
        </form>
      </details>
    </>
  );
}
