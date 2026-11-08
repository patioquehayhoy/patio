const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
function load(file, deps = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const req = (id) => {
    if (id in deps) return deps[id];
    if (id === './horario') return load('lib/horario.ts');
    if (id === './sha256') return load('lib/sha256.ts');
    throw new Error(`unexpected require ${id}`);
  };
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports;
}
const visitsDeps = {
  '@react-native-async-storage/async-storage': { default: {} },
  'expo-modules-core': { requireOptionalNativeModule: () => null },
  'react-native': { Platform: { OS: 'ios' } },
};
const V = () => load('lib/visits.ts', visitsDeps);

// 2026-11-06 es viernes. 14:00 CDMX = 20:00 UTC.
const at = (hh, mm = 0, day = 6) => Date.UTC(2026, 10, day, hh + 6, mm);
const open9to18 = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: false, abre: '09:00', cierra: '18:00' }));
const place = { id: '11111111-1111-4111-8111-111111111111', name: 'Tacos Juan', latitude: 19.4, longitude: -99.16, weeklyHours: open9to18 };

test('sha256 matches node crypto', () => {
  const { sha256Hex } = load('lib/sha256.ts');
  for (const text of ['', 'abc', 'Tacos Juan · ¿Qué te pareció?', 'x'.repeat(200)]) {
    assert.equal(sha256Hex(text), crypto.createHash('sha256').update(text, 'utf8').digest('hex'));
  }
});

test('a real visit needs 8+ minutes inside opening hours', () => {
  const { isRealVisit } = V();
  assert.equal(isRealVisit(place, at(14, 0), at(14, 5)), false, 'passing by does not count');
  assert.equal(isRealVisit(place, at(14, 0), at(14, 20)), true);
  assert.equal(isRealVisit(place, at(20, 0), at(20, 30)), false, 'closed');
  assert.equal(isRealVisit({ ...place, weeklyHours: null }, at(20, 0), at(20, 30)), true, 'unknown hours do not block');
  assert.equal(isRealVisit(place, at(9, 0), at(14, 0)), false, 'more than 4 hours is not a visit');
});

test('ask once: not reviewed, not own place, 30-day cooldown, one per day, never at night', () => {
  const { shouldAskOpinion, cdmxDay } = V();
  const base = { place, enteredAt: at(14, 0), exitedAt: at(14, 20), now: at(14, 20), lastPromptDay: null, reviewed: false, ownPlaceId: null };
  assert.equal(shouldAskOpinion(base), true);
  assert.equal(shouldAskOpinion({ ...base, reviewed: true }), false);
  assert.equal(shouldAskOpinion({ ...base, ownPlaceId: place.id }), false);
  assert.equal(shouldAskOpinion({ ...base, askedAt: at(14, 0, 1) }), false, 'asked 5 days ago');
  assert.equal(shouldAskOpinion({ ...base, lastPromptDay: cdmxDay(base.now) }), false);
  const late = { ...base, enteredAt: at(17, 30), exitedAt: at(17, 55), now: at(21, 30) };
  assert.equal(shouldAskOpinion({ ...late, place: { ...place, weeklyHours: null } }), false, 'would arrive after 22 h');
});

test('regions: 19 nearest within 5 km plus the refresh region', () => {
  const { regionsFor, REFRESH_REGION_ID, VISIT_RADIUS_M } = V();
  const places = Array.from({ length: 30 }, (_, i) => ({ ...place, id: `p${i}`, latitude: 19.4 + i * 0.001, longitude: -99.16 }));
  places.push({ ...place, id: 'far', latitude: 19.6, longitude: -99.16 });
  const regions = regionsFor(places, { latitude: 19.4, longitude: -99.16 });
  assert.equal(regions.length, 20);
  assert.equal(regions[0].identifier, 'p0');
  assert.equal(regions[0].radius, VISIT_RADIUS_M);
  assert.ok(!regions.some((region) => region.identifier === 'far'));
  assert.equal(regions[19].identifier, REFRESH_REGION_ID);
});

test('geofence events: enter then exit reports the visit and asks once', async () => {
  const { handleGeofenceEvent, VISIT_KEYS } = V();
  const store = { [VISIT_KEYS.places]: [place], [VISIT_KEYS.ownPlace]: null };
  let now = at(14, 0);
  const calls = { report: 0, ask: 0, refresh: 0 };
  const deps = {
    now: () => now,
    read: async (key, fallback) => (key in store ? JSON.parse(JSON.stringify(store[key])) : fallback),
    write: async (key, value) => { store[key] = JSON.parse(JSON.stringify(value)); },
    isReviewed: async () => false,
    report: async () => { calls.report++; },
    ask: async () => { calls.ask++; },
    refresh: async () => { calls.refresh++; },
  };
  assert.equal(await handleGeofenceEvent({ type: 'enter', id: place.id }, deps), 'entered');
  now = at(14, 3);
  assert.equal(await handleGeofenceEvent({ type: 'exit', id: place.id }, deps), 'ignored', '3 minutes is passing by');
  now = at(14, 10);
  await handleGeofenceEvent({ type: 'enter', id: place.id }, deps);
  now = at(14, 40);
  assert.equal(await handleGeofenceEvent({ type: 'exit', id: place.id }, deps), 'visit');
  assert.deepEqual(calls, { report: 1, ask: 1, refresh: 0 });
  now = at(15, 0);
  await handleGeofenceEvent({ type: 'enter', id: place.id }, deps);
  now = at(15, 30);
  await handleGeofenceEvent({ type: 'exit', id: place.id }, deps);
  assert.equal(calls.ask, 1, 'never twice the same day');
  assert.equal(calls.report, 2);
  assert.equal(await handleGeofenceEvent({ type: 'exit', id: 'patio-refresh' }, deps), 'refreshed');
});

test('own business never counts as a visit', async () => {
  const { handleGeofenceEvent, VISIT_KEYS } = V();
  const store = { [VISIT_KEYS.places]: [place], [VISIT_KEYS.ownPlace]: place.id };
  let now = at(14, 0);
  let reported = 0;
  const deps = {
    now: () => now,
    read: async (key, fallback) => (key in store ? store[key] : fallback),
    write: async (key, value) => { store[key] = value; },
    isReviewed: async () => false,
    report: async () => { reported++; },
    ask: async () => {},
    refresh: async () => {},
  };
  await handleGeofenceEvent({ type: 'enter', id: place.id }, deps);
  now = at(15, 0);
  assert.equal(await handleGeofenceEvent({ type: 'exit', id: place.id }, deps), 'ignored');
  assert.equal(reported, 0);
});

test('busyness: bars inside opening hours, peak label and live only with enough recent visits', () => {
  const B = load('lib/busyness.ts', { './supabase': { supabase: {} } });
  const rows = [
    { weekday: 5, hour_of_day: 13, level: 60, recent_visits: null, usual_visits: null },
    { weekday: 5, hour_of_day: 14, level: 100, recent_visits: 5, usual_visits: '2.5' },
    { weekday: 5, hour_of_day: 15, level: 40, recent_visits: null, usual_visits: null },
    { weekday: 2, hour_of_day: 14, level: 80, recent_visits: null, usual_visits: null },
  ];
  const hours = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: false, abre: '13:00', cierra: '17:00' }));
  const now = new Date(at(14, 20));
  const shaped = B.shapeBusyness(rows, now, hours);
  assert.deepEqual(shaped.hours.map((h) => h.hour), [13, 14, 15, 16]);
  assert.equal(shaped.currentHour, 14);
  assert.equal(shaped.live, 'more');
  assert.equal(B.peakLabel(shaped), 'Los viernes suele llenarse de 2 a 3 pm');
  assert.equal(B.liveLabel(shaped), 'Ahora: más lleno de lo normal');
  const quiet = B.shapeBusyness(rows.map((r) => (r.recent_visits ? { ...r, recent_visits: 2 } : r)), now, hours);
  assert.equal(quiet.live, null, 'fewer than 3 recent visits says nothing');
  assert.equal(B.shapeBusyness(rows, new Date(at(14, 0, 8)), hours), null, 'no data for Sunday');
  assert.equal(B.axisHour(13), '1');
  assert.equal(B.peakLabel({ ...shaped, peak: { from: 11, to: 12 } }), 'Los viernes suele llenarse de 11 am a 12 pm');
});
