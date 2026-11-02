const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Same approach as backend-security: run the real Edge handlers without Deno.
function loadEdge(name, admin, fetchImpl, env = {}) {
  let handler;
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require: (id) => id.startsWith('npm:') ? { createClient: () => admin } : load(path.resolve(path.dirname(filename), id)),
      Deno: { env: { get: (key) => env[key] ?? 'test-secret' }, serve: (fn) => { handler = fn; } },
      Response, Request, TextDecoder, Uint8Array, AbortSignal, fetch: fetchImpl, console: { error() {} },
    }, { filename });
    return module.exports;
  }
  load(path.resolve(__dirname, '../../supabase/functions', name, 'index.ts'));
  return handler;
}

const reviewer = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const support = '33333333-3333-4333-8333-333333333333';
const patio = '44444444-4444-4444-8444-444444444444';
const report = '55555555-5555-4555-8555-555555555555';

// A tiny query builder: every chained filter is recorded; the terminal call
// answers from `rows[table]` (an object for maybeSingle, an array otherwise).
function makeAdmin(rows) {
  const calls = [];
  const builder = (table) => {
    const q = { table, ops: [] };
    const chain = new Proxy({}, {
      get(_, key) {
        if (key === 'then') {
          const value = Array.isArray(rows[table]) ? rows[table] : [];
          return (resolve) => resolve({ data: value, error: null });
        }
        if (key === 'maybeSingle') return async () => { calls.push(q); return { data: rows[table] ?? null, error: null }; };
        return (...args) => { q.ops.push([key, ...args]); if (key === 'update' || key === 'in') calls.push(q); return chain; };
      },
    });
    return chain;
  };
  return {
    calls,
    auth: { getUser: async () => ({ data: { user: { id: reviewer, is_anonymous: false } }, error: null }) },
    from: builder,
  };
}

function post(body) {
  return new Request('https://patio.test/fn', { method: 'POST', headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('a new review notifies the business owner once', async () => {
  const sent = [];
  const admin = makeAdmin({
    reviews: { stars: 4 },
    negocios: { nombre: 'Cocina Lupita', owner_id: owner },
    push_devices: [{ id: 'd1', user_id: owner, expo_push_token: 'ExponentPushToken[x]' }],
    notification_preferences: [],
  });
  const handler = loadEdge('send-review-notification', admin, async (_, init) => {
    sent.push(...JSON.parse(init.body));
    return { ok: true, json: async () => ({ data: [{ status: 'ok' }] }) };
  });
  const response = await handler(post({ fonditaId: patio }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).delivered, 1);
  assert.equal(sent[0].title, 'Nueva reseña en Cocina Lupita');
  assert.match(sent[0].body, /^★★★★☆/);
  const claim = admin.calls.find((call) => call.table === 'reviews');
  assert.ok(claim.ops.some(([op, column]) => op === 'is' && column === 'owner_notified_at'), 'claims only unnotified reviews');
  assert.ok(claim.ops.some(([op, column, value]) => op === 'eq' && column === 'user_id' && value === reviewer), 'only the author can trigger it');
});

test('a review already notified sends nothing', async () => {
  const admin = makeAdmin({ reviews: null });
  const handler = loadEdge('send-review-notification', admin, async () => { throw new Error('must not call Expo'); });
  const response = await handler(post({ fonditaId: patio }));
  assert.deepEqual(await response.json(), { delivered: 0, deduplicated: true });
});

test('an owner who turned off reviews is not notified', async () => {
  const admin = makeAdmin({
    reviews: { stars: 5 },
    negocios: { nombre: 'Cocina Lupita', owner_id: owner },
    push_devices: [{ id: 'd1', user_id: owner, expo_push_token: 'ExponentPushToken[x]' }],
    notification_preferences: [{ user_id: owner, business_activity: false }],
  });
  const handler = loadEdge('send-review-notification', admin, async () => { throw new Error('must not call Expo'); });
  assert.equal((await (await handler(post({ fonditaId: patio }))).json()).delivered, 0);
});

test('a new report notifies the support accounts', async () => {
  const sent = [];
  const admin = makeAdmin({
    content_reports: { target_type: 'review', reason: 'abuse' },
    push_devices: [{ id: 'd2', user_id: support, expo_push_token: 'ExponentPushToken[s]' }],
  });
  const handler = loadEdge('notify-content-report', admin, async (_, init) => {
    sent.push(...JSON.parse(init.body));
    return { ok: true, json: async () => ({ data: [{ status: 'ok' }] }) };
  }, { SUPPORT_ADMIN_USER_IDS: support });
  const response = await handler(post({ reportId: report }));
  assert.equal((await response.json()).delivered, 1);
  assert.equal(sent[0].body, 'Reportaron una reseña · Abuso u ofensivo');
});

test('report alerts reject malformed ids before touching the database', async () => {
  const admin = makeAdmin({});
  const handler = loadEdge('notify-content-report', admin, async () => { throw new Error('must not call Expo'); });
  assert.equal((await handler(post({ reportId: 'nope' }))).status, 400);
  assert.equal(admin.calls.length, 0);
});

const reviewAuthor = '66666666-6666-4666-8666-666666666666';
const comment = '77777777-7777-4777-8777-777777777777';
const sendOk = (sent) => async (_, init) => {
  sent.push(...JSON.parse(init.body));
  return { ok: true, json: async () => ({ data: [{ status: 'ok' }] }) };
};

test('a comment notifies the review author once, never the commenter', async () => {
  const sent = [];
  const admin = makeAdmin({
    review_comments: { review_id: 'r1', parent_id: null, body: 'Yo también pedí el caldo y estaba buenísimo.' },
    reviews: { user_id: reviewAuthor, negocio_id: patio },
    negocios: { nombre: 'Cocina Lupita', owner_id: owner },
    user_profiles: { display_name: 'Ana P.' },
    push_devices: [{ id: 'd3', user_id: reviewAuthor, expo_push_token: 'ExponentPushToken[a]' }],
    notification_preferences: [],
  });
  const handler = loadEdge('send-community-notification', admin, sendOk(sent));
  const response = await handler(post({ kind: 'comment', commentId: comment }));
  assert.equal((await response.json()).delivered, 1);
  assert.equal(sent[0].title, 'Ana P. comentó tu reseña');
  assert.equal(sent[0].data.patioId, patio);
  const claim = admin.calls.find((call) => call.table === 'review_comments');
  assert.ok(claim.ops.some(([op, column]) => op === 'is' && column === 'notified_at'), 'claims only unnotified comments');
  assert.ok(claim.ops.some(([op, column, value]) => op === 'eq' && column === 'user_id' && value === reviewer), 'only the author can trigger it');
});

test('a comment by the business signs with the Patio name', async () => {
  const sent = [];
  const admin = makeAdmin({
    review_comments: { review_id: 'r1', parent_id: null, body: 'Gracias por venir.' },
    reviews: { user_id: reviewAuthor, negocio_id: patio },
    negocios: { nombre: 'Cocina Lupita', owner_id: reviewer },
    push_devices: [{ id: 'd3', user_id: reviewAuthor, expo_push_token: 'ExponentPushToken[a]' }],
    notification_preferences: [],
  });
  const handler = loadEdge('send-community-notification', admin, sendOk(sent));
  await handler(post({ kind: 'comment', commentId: comment }));
  assert.equal(sent[0].title, 'Cocina Lupita comentó tu reseña');
});

test('people who turned off community alerts get no comment push', async () => {
  const admin = makeAdmin({
    review_comments: { review_id: 'r1', parent_id: null, body: 'Hola' },
    reviews: { user_id: reviewAuthor, negocio_id: patio },
    negocios: { nombre: 'Cocina Lupita', owner_id: owner },
    user_profiles: { display_name: 'Ana P.' },
    push_devices: [{ id: 'd3', user_id: reviewAuthor, expo_push_token: 'ExponentPushToken[a]' }],
    notification_preferences: [{ user_id: reviewAuthor, social_activity: false }],
  });
  const handler = loadEdge('send-community-notification', admin, async () => { throw new Error('must not call Expo'); });
  assert.equal((await (await handler(post({ kind: 'comment', commentId: comment }))).json()).delivered, 0);
});

test('only the business owner can announce its reply to a review', async () => {
  const admin = makeAdmin({ reviews: { negocio_id: patio }, negocios: { nombre: 'Cocina Lupita', owner_id: owner } });
  const handler = loadEdge('send-community-notification', admin, async () => { throw new Error('must not call Expo'); });
  assert.equal((await handler(post({ kind: 'business_reply', reviewId: comment }))).status, 403);
});

test('a follow request to a private profile asks for approval', async () => {
  const sent = [];
  const admin = makeAdmin({
    profile_follows: { status: 'pending' },
    user_profiles: { display_name: 'Luis R.' },
    push_devices: [{ id: 'd4', user_id: reviewAuthor, expo_push_token: 'ExponentPushToken[l]' }],
    notification_preferences: [],
  });
  const handler = loadEdge('send-community-notification', admin, sendOk(sent));
  await handler(post({ kind: 'follow', followedId: reviewAuthor }));
  assert.equal(sent[0].title, 'Quieren seguirte');
  assert.equal(sent[0].data.type, 'follow_request');
});

test('community alerts reject unknown kinds and malformed ids', async () => {
  const admin = makeAdmin({});
  const handler = loadEdge('send-community-notification', admin, async () => { throw new Error('must not call Expo'); });
  assert.equal((await handler(post({ kind: 'comment', commentId: 'nope' }))).status, 400);
  assert.equal((await handler(post({ kind: 'spam' }))).status, 400);
  assert.equal(admin.calls.length, 0);
});

test('reports on comments name the comment for support', async () => {
  const sent = [];
  const admin = makeAdmin({
    content_reports: { target_type: 'comment', reason: 'spam' },
    push_devices: [{ id: 'd2', user_id: support, expo_push_token: 'ExponentPushToken[s]' }],
  });
  const handler = loadEdge('notify-content-report', admin, sendOk(sent), { SUPPORT_ADMIN_USER_IDS: support });
  await handler(post({ reportId: report }));
  assert.equal(sent[0].body, 'Reportaron un comentario · Spam o publicidad');
});
