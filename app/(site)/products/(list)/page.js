import { getCategories, getProducts, getPriceBounds } from '@/lib/queries';
import ProductBrowser from '@/components/ProductBrowser';

export const metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

const AVAIL_VALUES = ['available', 'enquire', 'unavailable'];
const SORT_VALUES = ['default', 'name', 'name_desc', 'code', 'price_asc', 'price_desc'];
const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
const num = (v) => {
  const s = one(v);
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? String(n) : '';
};

export default async function Products({ searchParams }) {
  const sp = await searchParams;
  const categories = (await getCategories()).map(({ id, slug, name, count }) => ({
    id,
    slug,
    name,
    count,
  }));
  const bounds = await getPriceBounds();
  // Only the fields the cards need are sent to the browser.
  const products = (await getProducts()).map((p) => ({
    id: p.id,
    slug: p.slug,
    code: p.code,
    name: p.name,
    image: p.image,
    category_slug: p.category_slug,
    category_name: p.category_name,
    price: p.price_display === 'public' ? p.price : null,
    price_display: p.price_display,
    price_unit: p.price_unit,
    availability: p.availability,
  }));
  const wanted = one(sp.category);
  const sortWanted = one(sp.sort);
  const hasPrices = bounds.n > 0;
  const initial = {
    category: categories.some((c) => c.slug === wanted) ? wanted : '',
    q: one(sp.q).slice(0, 80),
    avail: [].concat(sp.avail || []).filter((a) => AVAIL_VALUES.includes(a)),
    sort:
      SORT_VALUES.includes(sortWanted) && (hasPrices || !sortWanted.startsWith('price'))
        ? sortWanted
        : 'default',
    min: hasPrices ? num(sp.min) : '',
    max: hasPrices ? num(sp.max) : '',
    unpriced: one(sp.unpriced) !== '0',
  };
  return (
    <div className="container catalogue-page">
      <ProductBrowser
        key={JSON.stringify(initial)}
        categories={categories}
        products={products}
        initial={initial}
        bounds={bounds}
      />
    </div>
  );
}
