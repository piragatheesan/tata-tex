import { scriptClient, check } from './supabase-client.mjs';
import { SEED } from '../lib/seed.js';
import { slugify } from '../lib/ui.js';
const database = scriptClient();
const categories = [],
  products = [];
for (const [index, [name, names]] of SEED.entries()) {
  categories.push({
    id: index + 1,
    name,
    slug: slugify(name),
    display_order: index,
    published: true,
  });
  for (const productName of names)
    products.push({
      id: products.length + 1,
      code: `TT-${String(products.length + 1).padStart(3, '0')}`,
      slug: `${slugify(name)}-${slugify(productName)}`,
      name: productName,
      category_id: index + 1,
      published: true,
    });
}
check(await database.rpc('import_catalogue', { payload: { categories, products, enquiries: [] } }));
console.log(
  `Seeded ${categories.length} categories and ${products.length} products. Bundled photos are already mapped.`,
);
