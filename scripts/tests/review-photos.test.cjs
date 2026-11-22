/* global __dirname */
// Varias fotos por reseña (2026-11-21): hasta 5, cada una con su platillo
// opcional; reseña y fotos se publican juntas (`publish_review`).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const PUBLIC = 'https://x.supabase.co/storage/v1/object/public/review-photos/';
const PLACE = '11111111-2222-3333-4444-555555555555';

function fixture({ failUpload = null, rows = [] } = {}) {
  const values = new Map();
  const calls = { rpc: [], removed: [], uploads: 0, select: null };
  const query = {};
  for (const method of ['eq', 'lt', 'order', 'limit', 'in', 'not']) query[method] = () => query;
  query.select = (columns) => { calls.select = columns; return query; };
  query.then = (resolve, reject) => Promise.resolve({ data: rows, error: null }).then(resolve, reject);
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'me' } } }),
      getSession: async () => ({ data: { session: { user: { id: 'me' } } } }),
    },
    rpc: async (name, args) => { calls.rpc.push({ name, args }); return { data: 'review-id', error: null }; },
    from: (table) => (table === 'user_profiles'
      ? { select: () => ({ in: async () => ({ data: [{ user_id: 'u1', display_name: 'Caro M.' }] }) }) }
      : query),
    storage: { from: () => ({ remove: async (paths) => { calls.removed.push(...paths); return {}; } }) },
    functions: { invoke: async () => ({}) },
  };
  const mocks = {
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => { values.set(key, value); },
    },
    '@/lib/supabase': { supabase },
    '@/lib/dish-photo': {
      uploadReviewPhoto: async (uri) => {
        calls.uploads += 1;
        if (uri === failUpload) throw new Error('offline');
        return { url: `${PUBLIC}me/${uri}.jpg`, hash: undefined };
      },
    },
    '@/lib/dish-photo-url': { isReviewPhotoUrl: (url) => typeof url === 'string' && url.startsWith(PUBLIC) },
    '@/lib/photo-hash': { isPhotoHash: () => false },
    '@/lib/menu-date': { localMenuDate: (date = new Date()) => date.toISOString().slice(0, 10) },
  };
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const requireModule = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      const local = id.startsWith('@/') ? path.resolve(root, id.slice(2)) : id.startsWith('.') ? path.resolve(path.dirname(filename), id) : null;
      if (!local) throw new Error(`Missing mock: ${id}`);
      const canonical = `@/${path.relative(root, local).replace(/\.ts$/, '')}`;
      if (Object.hasOwn(mocks, canonical)) return mocks[canonical];
      return load(fs.existsSync(`${local}.ts`) ? `${local}.ts` : local);
    };
    new Function('require', 'module', 'exports', '__DEV__', source)(requireModule, module, module.exports, false);
    return module.exports;
  }
  return { ratings: load('lib/ratings.ts'), calls, values };
}

test('a review publishes up to 5 photos with their optional dish in one step', async () => {
  const f = fixture();
  const photos = ['a', 'b', 'c', 'd', 'e', 'f'].map((uri, index) => ({ uri, ...(index === 1 ? { dish: ' Suadero ' } : {}) }));
  await f.ratings.savePatioRating(PLACE, { stars: 5, photos });
  assert.equal(f.calls.uploads, 5);
  assert.equal(f.calls.rpc.length, 1);
  const { name, args } = f.calls.rpc[0];
  assert.equal(name, 'publish_review');
  assert.equal(args.review_photos.length, 5);
  assert.deepEqual(args.review_photos.map((photo) => photo.dish), [null, 'Suadero', null, null, null]);
  assert.ok(args.review_photos.every((photo) => photo.url.startsWith(`${PUBLIC}me/`)));
});

test('if one photo fails to upload, nothing is published and the uploaded ones are removed', async () => {
  const f = fixture({ failUpload: 'b' });
  await assert.rejects(f.ratings.savePatioRating(PLACE, { stars: 4, photos: [{ uri: 'a' }, { uri: 'b' }, { uri: 'c' }] }), /REVIEW_PHOTO_UPLOAD_FAILED/);
  assert.equal(f.calls.rpc.length, 0);
  assert.deepEqual(f.calls.removed.sort(), ['me/a.jpg', 'me/c.jpg']);
});

test('photos come back in their order, only from Patio storage, and photo-only pages require one', async () => {
  const f = fixture({
    rows: [{
      id: 'r1', user_id: 'u1', stars: 5, reasons: [], created_at: '2026-11-20T18:00:00Z',
      review_photos: [
        { id: 'p2', url: `${PUBLIC}u1/2.jpg`, platillo: 'Suadero', sort_order: 1 },
        { id: 'px', url: 'https://elsewhere.example/x.jpg', sort_order: 2 },
        { id: 'p1', url: `${PUBLIC}u1/1.jpg`, platillo: null, sort_order: 0 },
      ],
    }],
  });
  const { reviews } = await f.ratings.getPublicPatioReviewPage(PLACE, { photosOnly: true, limit: 20 });
  assert.match(f.calls.select, /review_photos!inner\(/);
  assert.deepEqual(reviews[0].photos, [
    { id: 'p1', url: `${PUBLIC}u1/1.jpg` },
    { id: 'p2', url: `${PUBLIC}u1/2.jpg`, dish: 'Suadero' },
  ]);
});

test('reviews saved on the phone before 21 nov keep their single photo', async () => {
  const f = fixture();
  f.values.set('@patio_ratings', JSON.stringify({ 'demo-dev-1': [{ stars: 4, photoUri: 'file://old.jpg', photoDish: 'Mole', timestamp: 1 }] }));
  const { reviews } = await f.ratings.getPublicPatioReviewPage('demo-dev-1');
  assert.deepEqual(reviews[0].photos, [{ url: 'file://old.jpg', dish: 'Mole' }]);
  assert.equal(reviews[0].photoUri, undefined);
});
