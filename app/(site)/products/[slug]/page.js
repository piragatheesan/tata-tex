import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/queries';
import { priceLabel, AVAILABILITY } from '@/lib/ui';
import EnquiryForm from '@/components/EnquiryForm';
import ProductCard, { ProductImage } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const p = getProductBySlug((await params).slug);
  return p ? { title: p.name, description: `${p.name} from Tata Tex. ${p.description || 'Contact us for prices and wholesale quotations.'}`.slice(0, 160) } : {};
}

export default async function ProductPage({ params }) {
  const p = getProductBySlug((await params).slug);
  if (!p) notFound();
  const related = getProducts({ category: p.category_slug || '' }).filter((x) => x.id !== p.id).slice(0, 4);
    return (
    <div className="w sec">
      <p className="m">
        <Link href="/">Home</Link> / <Link href="/products">Products</Link>
        {p.category_slug ? <> / <Link href={`/products?category=${p.category_slug}`}>{p.category_name}</Link></> : null}
      </p>
      <div className="pd pdp">
        <div><ProductImage p={p} height={360} /></div>
        <div>
          <h1>{p.name}</h1>
          <p className="m">Product code: {p.code}</p>
          <p className="pr big">{priceLabel(p)}</p>
          <p><b>Availability:</b> {AVAILABILITY[p.availability]}</p>
          <p>{p.description || 'Available in retail and wholesale quantities. Contact us for sizes, colours and prices.'}</p>
          {p.specifications ? <p><b>Specifications:</b> {p.specifications}</p> : null}
          <section id="enquire" className="enq">
            <h2>Enquire about this product</h2>
            <EnquiryForm product={{ code: p.code, name: p.name }} defaultType="Product enquiry" />
          </section>
        </div>
      </div>
      {related.length ? (
        <section className="related">
          <h2>Related products</h2>
          <div className="g">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      ) : null}
    </div>
  );
}