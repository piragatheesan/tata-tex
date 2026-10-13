import { getDb } from './db';

const BASE = `select p.*, c.name as category_name, c.slug as category_slug
  from products p left join categories c on c.id = p.category_id`;

export function getCategories({ all = false } = {}) {
  return getDb()
    .prepare(
      `select c.*, (select count(*) from products p where p.category_id = c.id ${all ? '' : 'and p.published = 1'}) as count
       from categories c ${all ? '' : 'where c.published = 1'} order by c.display_order, c.id`
    )
    .all();
}

export function getProducts({
  category = '', q = '', all = false,
  min = null, max = null, includeUnpriced = true, avail = [], sort = 'default',
} = {}) {
  const where = [];
  const args = [];
  if (!all) where.push('p.published = 1 and (c.id is null or c.published = 1)');
  if (category) { where.push('c.slug = ?'); args.push(category); }
  if (q) {
    where.push('(p.name like ? or p.code like ? or c.name like ?)');
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  if (avail.length) {
    where.push(`p.availability in (${avail.map(() => '?').join(',')})`);
    args.push(...avail);
  }
  if (min !== null || max !== null) {
    const inRange = ["p.price_display = 'public' and p.price is not null"];
    if (min !== null) { inRange.push('p.price >= ?'); args.push(min); }
    if (max !== null) { inRange.push('p.price <= ?'); args.push(max); }
    const priced = `(${inRange.join(' and ')})`;
    where.push(includeUnpriced ? `(${priced} or p.price_display <> 'public' or p.price is null)` : priced);
  }
  const unpricedLast = "(p.price is null or p.price_display <> 'public')";
  const order =
    sort === 'price_asc' ? `${unpricedLast}, p.price asc, p.id`
    : sort === 'price_desc' ? `${unpricedLast}, p.price desc, p.id`
    : sort === 'name' ? 'p.name collate nocase, p.id'
    : 'c.display_order, p.id';
  return getDb()
    .prepare(`${BASE} ${where.length ? 'where ' + where.join(' and ') : ''} order by ${order}`)
    .all(...args);
}

// How many published products show a price, and the lowest and highest of those prices.
export const getPriceBounds = () =>
  getDb()
    .prepare("select count(*) as n, min(price) as min, max(price) as max from products where published = 1 and price_display = 'public' and price is not null")
    .get();

export const getProductBySlug = (slug) =>
  getDb().prepare(`${BASE} where p.slug = ? and p.published = 1 and (c.id is null or c.published = 1)`).get(slug);
export const getProductById = (id) => getDb().prepare(`${BASE} where p.id = ?`).get(id);
