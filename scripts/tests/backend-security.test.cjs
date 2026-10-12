const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual Edge handlers without network, a deployed project, or Deno.
function loadEdge(name, admin, fetchImpl = async () => { throw new Error('Unexpected upstream request'); }) {
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
      Deno: { env: { get: () => 'test-secret' }, serve: (fn) => { handler = fn; } },
      Response, Request, TextDecoder, Uint8Array, AbortSignal,
      fetch: fetchImpl, console: { error() {} },
    }, { filename });
    return module.exports;
  }
  load(path.resolve(__dirname, '../../supabase/functions', name, 'index.ts'));
  return handler;
}

const userId = 'a992e8c0-290e-4e17-a65f-bfd89d6e849c';
function makeAdmin({ authenticated = true, anonymous = false, failStorage = false, ready = true, failDelete = false, fileCount = 1 } = {}) {
  const calls = [];
  const objects = { avatars: [...Array.from({ length: fileCount }, (_, index) => `${userId}/avatar-${index}.jpg`), `${userId}/old/photo.jpg`], 'business-logos': [`${userId}/logo.jpg`] };
  const admin = {
    auth: {
      getUser: async (token) => {
        calls.push(['getUser', token]);
        return { data: { user: authenticated ? { id: userId, is_anonymous: anonymous } : null }, error: null };
      },
      admin: { deleteUser: async (...args) => { calls.push(['deleteUser', ...args]); return { error: failDelete ? new Error('Foreign key prevented deletion') : null }; } },
    },
    rpc: async (name) => { calls.push(['rpc', name]); return { data: ready, error: null }; },
    storage: { from: (bucket) => ({
      list: async (prefix, { limit, offset }) => {
        calls.push(['list', bucket, prefix]);
        if (failStorage) return { error: new Error('Storage unavailable') };
        const rows = new Map();
        for (const object of objects[bucket]) {
          if (!object.startsWith(`${prefix}/`)) continue;
          const relative = object.slice(prefix.length + 1);
          const name = relative.split('/')[0];
          rows.set(name, { name, id: relative.includes('/') ? null : name });
        }
        return { data: [...rows.values()].slice(offset, offset + limit), error: null };
      },
      remove: async (paths) => {
        calls.push(['remove', bucket, Array.from(paths)]);
        objects[bucket] = objects[bucket].filter((name) => !paths.includes(name));
        return { error: null };
      },
    }) },
  };
  return { admin, calls, objects };
}

function request(body, authorization = 'Bearer user-session') {
  return new Request('https://example.test/function', {
    method: 'POST', headers: authorization ? { Authorization: authorization } : {},
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
  });
}

for (const name of ['delete-account', 'read-menu', 'smart-setup', 'search-intent', 'send-publication-notifications']) {
  test(`${name}: only POST performs work; CORS preflight is allowed`, async () => {
    const { admin, calls } = makeAdmin();
    const handler = loadEdge(name, admin);
    assert.equal((await handler(new Request('https://example.test', { method: 'GET' }))).status, 405);
    assert.equal((await handler(new Request('https://example.test', { method: 'OPTIONS' }))).status, 200);
    assert.deepEqual(calls, []);
  });
  test(`${name}: no authorization cannot reach privileged work`, async () => {
    const { admin, calls } = makeAdmin();
    const response = await loadEdge(name, admin)(request({}, null));
    assert.equal(response.status, 401);
    assert.deepEqual(calls, []);
  });
  test(`${name}: invalid or anonymous sessions are rejected`, async () => {
    for (const options of [{ authenticated: false }, { anonymous: true }]) {
      const { admin, calls } = makeAdmin(options);
      const response = await loadEdge(name, admin)(request());
      assert.equal(response.status, 401);
      assert.deepEqual(calls.map((call) => call[0]), ['getUser']);
    }
  });
}

test('delete-account: deletes only authenticated user storage before hard deletion, ignoring spoofed ids', async () => {
  const { admin, calls, objects } = makeAdmin();
  const response = await loadEdge('delete-account', admin)(request({ userId: 'another-user' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: true });
  assert.deepEqual(calls.at(-1), ['deleteUser', userId, false]);
  assert.ok(calls.filter(([operation]) => operation === 'list').every(([, , prefix]) => prefix.startsWith(userId)));
  assert.deepEqual(Object.values(objects), [[], []]);
});

test('delete-account: pagination removes every file without skipping shifted offsets', async () => {
  const { admin, calls, objects } = makeAdmin({ fileCount: 205 });
  const response = await loadEdge('delete-account', admin)(request());
  assert.equal(response.status, 200);
  assert.deepEqual(Object.values(objects), [[], []]);
  assert.ok(calls.filter(([operation, bucket]) => operation === 'remove' && bucket === 'avatars').length >= 3);
});

test('delete-account: failed SQL/auth transaction is not reported as deleted', async () => {
  const { admin } = makeAdmin({ failDelete: true });
  const response = await loadEdge('delete-account', admin)(request());
  assert.equal(response.status, 500);
  assert.equal((await response.json()).deleted, undefined);
});

test('installed Supabase SDK sends the session JWT and publishable key separately', async () => {
  const { createClient } = require('@supabase/supabase-js');
  let headers;
  const client = createClient('https://example.supabase.co', 'sb_publishable_test', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (_url, init) => {
      headers = new Headers(init.headers);
      return Response.json({ deleted: true });
    } },
  });
  client.auth.getSession = async () => ({ data: { session: { access_token: 'user-session-jwt' } }, error: null });
  const { error } = await client.functions.invoke('delete-account', { body: {} });
  assert.equal(error, null);
  assert.equal(headers.get('Authorization'), 'Bearer user-session-jwt');
  assert.equal(headers.get('apikey'), 'sb_publishable_test');
});

test('delete-account: absent migration or failed storage leaves authentication intact', async () => {
  for (const options of [{ ready: false }, { failStorage: true }]) {
    const { admin, calls } = makeAdmin(options);
    const response = await loadEdge('delete-account', admin)(request());
    assert.equal(response.status, 500);
    assert.ok(!calls.some(([operation]) => operation === 'deleteUser'));
  }
});

for (const name of ['read-menu', 'smart-setup', 'search-intent']) {
  test(`${name}: malformed JSON and wrong types fail before a paid request`, async () => {
    const { admin } = makeAdmin();
    const handler = loadEdge(name, admin);
    for (const body of ['{invalid', 'null', '[]', '{"imageBase64":123,"relato":123,"query":123}']) {
      assert.equal((await handler(request(body))).status, 400);
    }
  });
}

test('search-intent: oversized body without Content-Length is rejected', async () => {
  const { admin } = makeAdmin();
  assert.equal((await loadEdge('search-intent', admin)(request({ query: 'x'.repeat(9_000) }))).status, 413);
});

test('search-intent: signed in request reaches provider and returns structured intent', async () => {
  const { admin } = makeAdmin();
  let requested = 0;
  const intent = { terminos: ['caldo'], abiertoAhora: false, menuDeHoy: true, nota: 'Algo caldoso' };
  const handler = loadEdge('search-intent', admin, async () => {
    requested++;
    return Response.json({ content: [{ type: 'text', text: JSON.stringify(intent) }] });
  });
  const response = await handler(request({ query: 'Algo caldoso' }));
  assert.equal(response.status, 200);
  assert.equal(requested, 1);
  assert.deepEqual(await response.json(), intent);
});

function publicationAdmin({ menuExists = true, ownsPatio = true, targetCount = 0 } = {}) {
  const mutations = [];
  const targets = Array.from({ length: targetCount }, (_, index) => ({
    id: `device-${index}`, user_id: `follower-${index}`, expo_push_token: `ExpoPushToken[${index}]`,
  }));
  return {
    mutations,
    admin: {
      auth: { getUser: async () => ({ data: { user: { id: userId, email: 'owner@example.test', email_confirmed_at: '2026-01-01' } }, error: null }) },
      from: (table) => {
        let inserted;
        const query = {
          select() { return query; }, eq() { return query; }, in() { return query; },
          insert(rows) { inserted = rows; mutations.push([table, rows]); return query; },
          update(rows) { mutations.push([table, rows]); return query; },
          single() { return query; }, maybeSingle() { return query; },
          then(resolve) {
            const values = {
              fonditas: { id: userId, nombre: 'Patio prueba', owner_id: ownsPatio ? userId : 'someone-else' },
              menus: menuExists ? { secciones: { secciones: [] } } : null,
              publication_events: inserted ? { id: 'event-1' } : null,
              patio_follows: targets.map(({ user_id }) => ({ user_id })),
              notification_preferences: targets.map(({ user_id }) => ({ user_id, patio_publications: true })),
              push_devices: targets,
              notification_deliveries: null,
            };
            return Promise.resolve({ data: values[table], error: null }).then(resolve);
          },
        };
        return query;
      },
    },
  };
}

test('publication: cannot announce another owner or a menu that does not exist', async () => {
  for (const [options, status] of [[{ ownsPatio: false }, 403], [{ menuExists: false }, 409]]) {
    const { admin, mutations } = publicationAdmin(options);
    const response = await loadEdge('send-publication-notifications', admin)(request({ fonditaId: userId }));
    assert.equal(response.status, status);
    assert.deepEqual(mutations, []);
  }
});

test('publication: 205 recipients use Expo batches of 100 with one audited ticket per device', async () => {
  const { admin, mutations } = publicationAdmin({ targetCount: 205 });
  const batchSizes = [];
  const handler = loadEdge('send-publication-notifications', admin, async (_url, options) => {
    const messages = JSON.parse(options.body);
    batchSizes.push(messages.length);
    assert.ok(messages.every((message) => message.channelId === 'default'));
    return Response.json({ data: messages.map((message) => ({ status: 'ok', id: message.to })) });
  });
  const response = await handler(request({ fonditaId: userId }));
  assert.equal(response.status, 200);
  assert.deepEqual(batchSizes, [100, 100, 5]);
  assert.equal((await response.json()).delivered, 205);
  assert.equal(mutations.find(([table]) => table === 'notification_deliveries')[1].length, 205);
});

test('publication: a failed Expo batch records errors without shifting later device tickets', async () => {
  const { admin, mutations } = publicationAdmin({ targetCount: 101 });
  let batch = 0;
  const handler = loadEdge('send-publication-notifications', admin, async (_url, options) => {
    if (batch++ === 0) return Response.json({ errors: [{ message: 'Unavailable' }] }, { status: 503 });
    return Response.json({ data: JSON.parse(options.body).map(() => ({ status: 'ok', id: 'last-ticket' })) });
  });
  const response = await handler(request({ fonditaId: userId }));
  assert.deepEqual(await response.json(), { eventId: 'event-1', delivered: 1, failed: 100 });
  const deliveries = mutations.find(([table]) => table === 'notification_deliveries')[1];
  assert.equal(deliveries[100].push_device_id, 'device-100');
  assert.equal(deliveries[100].expo_ticket_id, 'last-ticket');
});

for (const [feature, body] of [['read-menu', { imageBase64: 'A'.repeat(120), mediaType: 'image/jpeg' }], ['smart-setup', { relato: 'Vendemos comida casera en Polanco.' }], ['search-intent', { query: 'Sopa cerca de aquí' }]]) {
  test(`${feature}: exhausted quota returns 429 before provider work`, async () => {
    const { admin } = makeAdmin();
    let quota;
    admin.rpc = async (name, params) => { quota = { name, params }; return { data: false, error: null }; };
    let paid = 0;
    const response = await loadEdge(feature, admin, async () => { paid++; throw new Error('Must not call provider'); })(request(body));
    assert.equal(response.status, 429); assert.equal(paid, 0);
    assert.equal(quota.name, 'consume_ai_request');
    assert.equal(quota.params.p_user_id, userId); assert.equal(quota.params.p_feature, feature);
  });
  test(`${feature}: unavailable quota fails closed with 503`, async () => {
    const { admin } = makeAdmin();
    admin.rpc = async () => ({ data: null, error: new Error('Missing migration') });
    assert.equal((await loadEdge(feature, admin)(request(body))).status, 503);
  });
}
