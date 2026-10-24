import { scriptClient, check } from './supabase-client.mjs';
import { defaultSlides } from '../lib/home-slides.js';
const client = scriptClient();
const bucket = 'homepage-settings';
const existing = await client.storage.getBucket(bucket);
if (existing.error)
  check(
    await client.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 65536,
      allowedMimeTypes: ['application/json'],
    }),
  );
const saved = await client.storage.from(bucket).download('slides.json');
if (saved.error) {
  if (!['404', '400'].includes(String(saved.error.statusCode)))
    throw new Error('Cannot read existing homepage settings');
  check(
    await client.storage
      .from(bucket)
      .upload('slides.json', JSON.stringify(defaultSlides), {
        contentType: 'application/json',
        upsert: false,
        cacheControl: '0',
      }),
  );
}
const result = check(await client.storage.from(bucket).download('slides.json'));
const slides = JSON.parse(await result.text());
if (slides.length !== 3) throw new Error('Unexpected slideshow configuration');
console.log(
  'Supabase homepage settings connected: three slides, private settings bucket. Existing configuration preserved.',
);
