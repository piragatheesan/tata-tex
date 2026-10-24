import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function action({ denied = false, fails = false } = {}) {
  const writes = [],
    removed = [];
  let uploaded = 0;
  const slides = Array.from({ length: 3 }, (_, i) => ({
    title: `Slide ${i}`,
    text: 'Description',
    alt: 'Photo',
    image: '/images/home-hero.png',
  }));
  const mocks = {
    'next/navigation': {
      redirect(url) {
        throw Object.assign(new Error(url), { redirect: true });
      },
    },
    'next/cache': { revalidatePath() {} },
    './auth': {
      requireAdminRole: async () => {
        if (denied) throw Error('Denied');
      },
    },
    './home-content': {
      HOME_BUCKET: 'homepage-settings',
      getHomeSlides: async () => structuredClone(slides),
    },
    './storage': {
      uploadImage: async () => {
        uploaded++;
        return 'a'.repeat(24) + '.png';
      },
      removeImage: async (name) => removed.push(name),
    },
    './supabase/admin': {
      unwrap(result) {
        if (result.error) throw result.error;
        return result.data;
      },
      createAdminClient: () => ({
        storage: {
          getBucket: async () => ({ data: {} }),
          from: () => ({
            upload: async (path, value) => {
              writes.push(JSON.parse(value));
              return fails ? { error: Error('Unavailable') } : { data: {} };
            },
          }),
        },
      }),
    },
  };
  const { code } = require('next/dist/compiled/babel/core').transformSync(
    fs.readFileSync('lib/home-actions.js', 'utf8'),
    {
      babelrc: false,
      configFile: false,
      plugins: [require('next/dist/compiled/babel/plugin-transform-modules-commonjs')],
    },
  );
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => mocks[name], module, module.exports);
  return {
    save: module.exports.saveHomeSlide,
    writes,
    removed,
    get uploaded() {
      return uploaded;
    },
  };
}
function form(image = false) {
  const data = new FormData();
  for (const [k, v] of Object.entries({
    index: '1',
    title: 'New title',
    text: 'New description',
    alt: 'Uniform team',
  }))
    data.set(k, v);
  if (image) data.set('image', new Blob(['image'], { type: 'image/png' }), 'photo.png');
  return data;
}
test('homepage save requires administrator before storage access', async () => {
  const a = action({ denied: true });
  await assert.rejects(a.save(form(true)), /Denied/);
  assert.equal(a.uploaded, 0);
  assert.equal(a.writes.length, 0);
});
test('homepage save changes only selected slide and retains picture without replacement', async () => {
  const a = action();
  await assert.rejects(a.save(form()), /ok=Slide/);
  assert.equal(a.writes[0][1].title, 'New title');
  assert.equal(a.writes[0][1].image, '/images/home-hero.png');
  assert.equal(a.writes[0][0].title, 'Slide 0');
  assert.equal(a.writes[0][2].title, 'Slide 2');
});
test('failed homepage save removes new upload and reports a safe error', async () => {
  const a = action({ fails: true });
  await assert.rejects(a.save(form(true)), /error=Unable/);
  assert.equal(a.removed.length, 1);
});
