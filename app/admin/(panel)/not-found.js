import Link from 'next/link';
export default function AdminNotFound() {
  return (
    <section>
      <h1>Product not found</h1>
      <p>This product may have been deleted or the link is incorrect.</p>
      <Link className="btn btn-primary" href="/admin/products">
        Back to products
      </Link>
    </section>
  );
}
