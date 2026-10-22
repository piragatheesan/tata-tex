import Link from 'next/link';
import { swatch, priceLabel, AVAILABILITY } from '@/lib/ui';
import { productImages } from '@/lib/product-images';

/** Uploaded photos override the bundled catalogue photo for this product. */
export function ProductImage({ p: product, height = 170 }) {
  const imageSource = product.image
    ? `/uploads/${product.image}`
    : productImages[product.slug]?.[0]?.src;

  if (imageSource) {
    return (
      <img
        className="product-visual product-photo"
        src={imageSource}
        alt={product.name}
        loading="lazy"
        width="480"
        height="600"
        style={{ height }}
      />
    );
  }
  return (
    <div
      className="product-visual"
      style={{ background: swatch(product.id), height }}
      role="img"
      aria-label={`Illustrative fabric swatch for ${product.name}`}
    >
      <span className="sample-label">Photo coming soon</span>
    </div>
  );
}

export default function ProductCard({ p: product }) {
  return (
    <article className="surface-card product-card">
      <Link href={`/products/${product.slug}`} className="pc-main">
        <span className="product-card-image-wrap">
          <ProductImage p={product} />
          <span className="product-card-hover" aria-hidden="true">
            <span className="product-hover-copy">
              <b>{product.name}</b>
              <small>
                {product.code}
                {product.category_name ? ` · ${product.category_name}` : ''}
              </small>
            </span>
            <span className="product-hover-action">
              View Uniform Details <span>↗</span>
            </span>
          </span>
        </span>
        <h3>{product.name}</h3>
        <p className="muted">
          {product.code}
          {product.category_name ? ` · ${product.category_name}` : ''}
        </p>
        <p className="product-price">{priceLabel(product)}</p>
        {product.availability !== 'enquire' && (
          <span className={`av ${product.availability}`}>{AVAILABILITY[product.availability]}</span>
        )}
      </Link>
      <Link
        href={`/products/${product.slug}`}
        className="pc-enq"
        aria-label={`View details for ${product.name}`}
      >
        View Uniform Details
      </Link>
    </article>
  );
}
