import { getProducts } from '@/lib/queries';
import { siteUrl } from '@/lib/site';

// Reflect publishing changes without rebuilding the site.
export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const products = await getProducts();
  return [
    ...['', '/products', '/about', '/contact'].map((path) => ({ url: `${siteUrl}${path}` })),
    ...products.map((product) => ({
      url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
    })),
  ];
}
