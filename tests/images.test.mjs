import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { productImages, categoryImages, homeImages } from '../lib/product-images.js';
import { SEED } from '../lib/seed.js';
import { slugify } from '../lib/ui.js';

test('all bundled photos exist and every product mapping targets a seeded product', () => {
  const slugs = new Set(
    SEED.flatMap(([category, names]) =>
      names.map((name) => `${slugify(category)}-${slugify(name)}`),
    ),
  );
  for (const [slug, photos] of Object.entries(productImages)) {
    assert.ok(slugs.has(slug), `Unknown product slug: ${slug}`);
    for (const photo of photos)
      assert.ok(fs.existsSync(`public${photo.src}`), `Missing: ${photo.src}`);
  }
  for (const photo of [...Object.values(categoryImages), ...homeImages])
    assert.ok(fs.existsSync(`public${photo.src}`));
  const sources = JSON.parse(fs.readFileSync('docs/image-sources.json', 'utf8'));
  assert.equal(sources.length, 88);
  const used = new Set(
    [...Object.values(productImages).flat(), ...homeImages].map((photo) => photo.src),
  );
  assert.equal(used.size, 88);
});
