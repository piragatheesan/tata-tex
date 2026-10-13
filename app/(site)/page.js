import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/queries';
import { swatch } from '@/lib/ui';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default function Home() {
  const categories = getCategories();
  const all = getProducts();
  const step = Math.max(1, Math.floor(all.length / 4));
  const popular = all.filter((_, i) => i % step === 0).slice(0, 4);
  const featured = categories[0];
  return (
    <>
      <section className="vh">
        <div className="w vh-in">
          <div>
            <h1 className="hh">Uniforms <em>since</em> 1983.</h1>
            <p className="vh-p">Ready-made and custom uniforms and accessories for schools, businesses, industries and institutions. Retail and wholesale.</p>
            <Link className="pill" href="/products"><span>Explore Products</span><i aria-hidden="true">↗</i></Link>
            <div className="vh-row">
              {featured ? (
                <Link className="vh-card" href={`/products?category=${featured.slug}`}>
                  <div className="vh-sw" style={{ background: swatch(featured.id) }} />
                  <b>{featured.name}</b><span>{featured.count} items</span>
                </Link>
              ) : null}
              <Link className="badge" href="/contact?type=quote" aria-label="Request a wholesale quotation">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <defs><path id="cp" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs>
                  <g className="rot"><text fontSize="9.5" fontWeight="700" letterSpacing="1.6" fill="#232A6B"><textPath href="#cp">REQUEST A QUOTE · WHOLESALE · REQUEST A QUOTE · WHOLESALE ·</textPath></text></g>
                  <circle cx="60" cy="60" r="29" fill="#232A6B" />
                  <text x="60" y="58" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Quote</text>
                  <text x="60" y="76" textAnchor="middle" fontSize="15" fill="#fff">↗</text>
                </svg>
              </Link>
            </div>
          </div>
          <div className="vh-r"><img src="/hero.jpg" alt="Photograph of a historic building" /></div>
        </div>
      </section>

      <section className="w sec">
        <h2>Our uniforms</h2>
        <div className="g">
          {categories.map((c) => (
            <Link key={c.slug} className="c" href={`/products?category=${c.slug}`}>
              <div className="sw" style={{ background: swatch(c.id), height: 120 }} />
              <h3>{c.name}</h3>
              <p className="m">{c.count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {popular.length ? (
        <section className="w" style={{ paddingBottom: 48 }}>
          <h2>Popular items</h2>
          <div className="g">{popular.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      ) : null}

      <section className="w" style={{ paddingBottom: 48 }}>
        <div className="note">
          <h2>Why choose Tata Tex</h2>
          <ul>
            <li>Trusted quality and reliability since 1983</li>
            <li>Affordable pricing for retail and bulk orders</li>
            <li>Timely delivery and efficient service for institutions and businesses</li>
            <li>Modern designs combined with skilled craftsmanship</li>
            <li>Friendly, customer-focused approach</li>
          </ul>
          <Link className="btn" href="/contact?type=quote">Request a quotation</Link>
        </div>
      </section>
    </>
  );
}
