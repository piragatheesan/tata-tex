import Link from 'next/link';
import { swatch, priceLabel, AVAILABILITY } from '@/lib/ui';

export function ProductImage({ p, height = 170 }) {
  return p.image ? (
    <img className="sw" src={`/uploads/${p.image}`} alt={p.name} style={{ width: '100%', height, objectFit: 'cover' }} />
  ) : (
    <div className="sw" style={{ background: swatch(p.id), height }} role="img" aria-label={`Sample swatch for ${p.name}`} />
  );
}

export default function ProductCard({ p }) {
  return (
    <article className="c pc">
      <Link href={`/products/${p.slug}`} className="pc-main">
        <ProductImage p={p} />
        <h3 title={p.name}>{p.name}</h3>
        <p className="m">{p.code}{p.category_name ? ` | ${p.category_name}` : ''}</p>
        <p className="pr">{priceLabel(p)}</p>
        {p.availability !== 'enquire' ? <span className={`av ${p.availability}`}>{AVAILABILITY[p.availability]}</span> : null}
      </Link>
      <Link href={`/products/${p.slug}#enquire`} className="pc-enq" aria-label={`Enquire for availability: ${p.name}`}>Enquire for availability</Link>
    </article>
  );
}
