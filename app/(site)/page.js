import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/queries';
import { swatch } from '@/lib/ui';
import { categoryImages, homeImages } from '@/lib/product-images';
import ProductCard from '@/components/ProductCard';
import HomeHero from '@/components/HomeHero';
import { getHomeSlides } from '@/lib/home-content';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const [categories, products, slides] = await Promise.all([
    getCategories(),
    getProducts(),
    getHomeSlides(),
  ]);
  const featured = categories
    .map((category) => products.find((product) => product.category_slug === category.slug))
    .filter(Boolean)
    .slice(0, 3);
  return (
    <>
      <HomeHero slides={slides} />
      <section className="container section">
        <div className="section-heading">
          <h2>Shop by Category</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-card"
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
            >
              {categoryImages[category.slug] ? (
                <img
                  className="category-photo"
                  src={categoryImages[category.slug].src}
                  alt={category.name}
                  width="400"
                  height="320"
                  loading="lazy"
                />
              ) : (
                <div className="category-swatch" style={{ background: swatch(category.id) }} />
              )}
              <h3 className="category-caption">{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="container section featured-section">
          <div className="section-heading">
            <h2>Featured Products</h2>
            <Link className="text-link" href="/products">
              View all products
            </Link>
          </div>
          <div className="card-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        </section>
      )}
      <section className="container section home-trust" aria-labelledby="home-trust-title">
        <div className="home-trust-heading">
          <p className="eyebrow">What we offer</p>
          <h2 id="home-trust-title">Uniforms for everyday work and special occasions.</h2>
          <p>
            Explore uniform collections for schools, workplaces, and teams, with options for retail
            and wholesale enquiries.
          </p>
        </div>
        <div className="home-trust-grid">
          <article className="home-trust-item">
            <span className="home-trust-number">01</span>
            <h3>Made for many roles</h3>
            <p>Browse collections for education, healthcare, hospitality, security, and more.</p>
          </article>
          <article className="home-trust-item">
            <span className="home-trust-number">02</span>
            <h3>Retail &amp; wholesale</h3>
            <p>Tell us what you need, whether it is one item or a larger team requirement.</p>
          </article>
        </div>
      </section>
      <section className="container home-quote-wrap" aria-labelledby="home-quote-title">
        <div className="home-quote-callout">
          <div>
            <p className="eyebrow">Let’s get started</p>
            <h2 id="home-quote-title">Looking for the right uniform?</h2>
            <p>Share your requirements with us and request a quotation.</p>
          </div>
          <Link className="btn home-quote-button" href="/contact?type=quote">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
