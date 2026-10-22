import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/queries';
import { priceLabel, AVAILABILITY } from '@/lib/ui';
import EnquiryDialog from '@/components/EnquiryDialog';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const p = await getProductBySlug((await params).slug);
  return p
    ? {
        title: p.name,
        description:
          `${p.name} from Tata Tex. ${p.description || 'Contact us for prices and wholesale quotations.'}`.slice(
            0,
            160,
          ),
      }
    : {};
}

export default async function ProductPage({ params }) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const related = (await getProducts({ category: p.category_slug || '' }))
    .filter((x) => x.id !== p.id)
    .slice(0, 3);
  return (
    <div className="container section product-page">
      <p className="muted">
        <Link href="/">Home</Link> / <Link href="/products">Products</Link>
        {p.category_slug ? (
          <>
            {' '}
            / <Link href={`/products?category=${p.category_slug}`}>{p.category_name}</Link>
          </>
        ) : null}
      </p>
      <div className="detail-layout product-detail">
        <div>
          <ProductGallery product={{ id: p.id, slug: p.slug, name: p.name, image: p.image }} />
        </div>
        <div className="product-summary">
          <h1>{p.name}</h1>
          <p className="muted">Product code: {p.code}</p>
          <p className="product-price price-large">{priceLabel(p)}</p>
          <p>
            <b>Availability:</b> {AVAILABILITY[p.availability]}
          </p>
          <p>
            {p.description ||
              'Available in retail and wholesale quantities. Contact us for sizes, colours and prices.'}
          </p>
          <EnquiryDialog key={p.slug} product={{ code: p.code, name: p.name }} />
          <div className="product-accordions">
            {p.specifications && (
              <details>
                <summary>Product Details</summary>
                <p>{p.specifications}</p>
              </details>
            )}
            <details>
              <summary>Sizes &amp; Customisation</summary>
              <p>Contact us to confirm available sizes, colours and custom requirements.</p>
            </details>
            <details>
              <summary>Bulk Enquiries</summary>
              <p>Include quantities and any team requirements in your enquiry.</p>
            </details>
          </div>
        </div>
      </div>
      {related.length ? (
        <section className="related">
          <h2>Related products</h2>
          <div className="card-grid">
            {related.map((x) => (
              <ProductCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
