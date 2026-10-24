import 'server-only';
import { createAdminClient, unwrap } from './supabase/admin';
import { requireUser, requireAdminRole } from './auth';
import { filterProducts } from './catalogue.mjs';

const PRODUCT_SELECT = '*, categories(name,slug,published,display_order)';
function flattenProduct(row, publicOnly = false) {
  const { categories: category, ...product } = row;
  return {
    ...product,
    price: publicOnly && product.price_display !== 'public' ? null : product.price,
    category_name: category?.name || '',
    category_slug: category?.slug || '',
    category_order: category?.display_order || 0,
  };
}

/** Page through PostgREST results rather than silently truncating at 1,000 rows. */
export async function collectRows(table, select = '*', configure = (query) => query) {
  const database = createAdminClient();
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const batch = unwrap(
      await configure(database.from(table).select(select))
        .order('id')
        .range(offset, offset + 499),
    );
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
export async function getCategories({ all = false } = {}) {
  if (all) await requireUser();
  const [categories, products] = await Promise.all([
    collectRows('categories'),
    collectRows('products', 'id,category_id,published'),
  ]);
  return categories
    .filter((category) => all || category.published)
    .map((category) => ({
      ...category,
      count: products.filter(
        (product) => product.category_id === category.id && (all || product.published),
      ).length,
    }))
    .sort((first, second) => first.display_order - second.display_order || first.id - second.id);
}
export async function getProducts({
  category = '',
  q = '',
  all = false,
  min = null,
  max = null,
  includeUnpriced = true,
  avail = [],
  sort = 'default',
} = {}) {
  if (all) await requireUser();
  const rows = await collectRows('products', PRODUCT_SELECT, (query) =>
    all ? query : query.eq('published', true),
  );
  const products = rows
    .filter((row) => all || !row.categories || row.categories.published)
    .map((row) => flattenProduct(row, !all))
    .sort((first, second) => first.category_order - second.category_order || first.id - second.id);
  return filterProducts(products, {
    category,
    query: q,
    availability: avail,
    sort,
    minimum: min === null ? '' : String(min),
    maximum: max === null ? '' : String(max),
    includeUnpriced,
  });
}
export async function getPriceBounds() {
  const prices = (await getProducts())
    .filter((product) => product.price_display === 'public' && product.price !== null)
    .map((product) => product.price);
  return {
    n: prices.length,
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
  };
}
export async function getProductBySlug(slug) {
  const row = unwrap(
    await createAdminClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle(),
  );
  return row && (!row.categories || row.categories.published) ? flattenProduct(row, true) : null;
}
export async function getProductById(id) {
  await requireUser();
  const row = unwrap(
    await createAdminClient().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle(),
  );
  return row ? flattenProduct(row) : null;
}
export async function getEnquiries({ status = '', limit = 200 } = {}) {
  await requireUser();
  let query = createAdminClient()
    .from('enquiries')
    .select('*')
    .order('id', { ascending: false })
    .limit(limit);
  if (status) query = query.eq('status', status);
  return unwrap(await query);
}
export async function getProfiles() {
  await requireAdminRole();
  return collectRows('profiles');
}
export async function getDashboardStats() {
  await requireUser();
  const database = createAdminClient();
  const count = async (table, configure = (query) => query) => {
    const result = await configure(
      database.from(table).select('*', { count: 'exact', head: true }),
    );
    if (result.error) throw result.error;
    return result.count;
  };
  const [products, published, categories, enquiries, awaitingReply] = await Promise.all([
    count('products'),
    count('products', (query) => query.eq('published', true)),
    count('categories'),
    count('enquiries', (query) => query.eq('status', 'New')),
    count('enquiries', (query) => query.eq('status', 'In Progress')),
  ]);
  return { products, published, categories, enquiries, awaitingReply };
}
