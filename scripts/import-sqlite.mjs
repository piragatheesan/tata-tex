import fs from 'node:fs';
import path from 'node:path';
import { scriptClient, check } from './supabase-client.mjs';
const [filename, uploadDirectory] = process.argv.slice(2);
if (!filename) throw new Error('Usage: npm run migrate:sqlite -- export.json path/to/data/uploads');
const payload = JSON.parse(fs.readFileSync(filename, 'utf8'));
const database = scriptClient();
// Intentionally require empty tables to avoid overwriting a different site's data.
for (const table of ['categories', 'products', 'enquiries']) {
  const result = await database.from(table).select('id', { count: 'exact', head: true });
  check(result);
  if (result.count)
    throw new Error(`${table} is not empty. Import only into a fresh Supabase project.`);
}
const products = payload.products || [];
// Validate all required images before importing any records.
for (const product of products)
  if (
    product.image &&
    (!uploadDirectory || !fs.existsSync(path.join(uploadDirectory, product.image)))
  )
    throw new Error(
      `Missing original upload: ${product.image}. Supply the old data/uploads folder.`,
    );
for (const product of products) {
  if (!product.image) continue;
  const ext = path.extname(product.image).toLowerCase();
  if (!/^[a-f0-9]{16,}\.(jpg|png|webp)$/.test(product.image))
    throw new Error('Unexpected image filename in export.');
  const types = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  check(
    await database.storage
      .from('product-images')
      .upload(product.image, fs.readFileSync(path.join(uploadDirectory, product.image)), {
        contentType: types[ext],
        upsert: true,
      }),
  );
}
// All database rows and identity counters are imported in one Postgres transaction.
check(await database.rpc('import_catalogue', { payload }));
console.log(
  'Imported categories, products, enquiries and uploaded images. Recreate staff accounts in Supabase Auth.',
);
