/* global __dirname */
// «¿Ya publicaste lo de hoy?» (2026-11-21): una hora antes de abrir, entre
// las 7 y las 12, y nunca los días que el negocio cierra.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function transpile(relative, mocks) {
  const file = path.resolve(__dirname, '../..', relative);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)((id) => mocks[id], module, module.exports);
  return module.exports;
}
const timing = () => transpile('lib/publish-timing.ts', { './menu-date': { localMenuDate: localDate } });

function load() {
  const file = path.resolve(__dirname, '../../lib/local-reminders.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mocks = {
    '@/lib/publish-timing': timing(),
    '@react-native-async-storage/async-storage': {},
    'react-native': { Platform: { OS: 'ios' } },
    '@/lib/community-notifications': {},
    '@/lib/reminder-cleanup': { REMINDER_STORAGE_KEYS: ['a', 'b'] },
    '@/lib/menu-store': { getFonditaHorarioSemanal: () => null },
    '@/lib/menu-history': { getLocalMenus: async () => [] },
    '@/lib/closed-days': { getClosedDays: async () => new Set() },
    '@/lib/menu-date': { localMenuDate: localDate },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)((id) => mocks[id], module, module.exports);
  return module.exports;
}

const week = (overrides) => Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: false, abre: '13:00', cierra: '18:00', ...(overrides[dia] ?? {}) }));

test('publish reminder follows opening time and skips closed days', () => {
  const { publishReminderMinute } = load();
  const horario = week({ 0: { cerrado: true, abre: null, cierra: null }, 1: { abre: '07:30' }, 2: { abre: '08:30' }, 3: { abre: '19:00' } });
  assert.equal(publishReminderMinute(horario, 0), null);
  assert.equal(publishReminderMinute(horario, 1), 7 * 60);
  assert.equal(publishReminderMinute(horario, 2), 7 * 60 + 30);
  assert.equal(publishReminderMinute(horario, 3), 12 * 60);
  assert.equal(publishReminderMinute(horario, 4), 12 * 60);
  assert.equal(publishReminderMinute(null, 4), 10 * 60);
});

// Lunes 23 nov 2026, 6 am. Abre de lunes a sábado a las 13 (aviso a las 12).
const MONDAY = new Date(2026, 10, 23, 6, 0, 0);
const openWeek = week({ 0: { cerrado: true, abre: null, cierra: null } });
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('someone who publishes gets a daily reminder only on open days', () => {
  const { planPublishReminders } = load();
  const plan = planPublishReminders({ now: MONDAY, horario: openWeek, published: new Set([key(new Date(2026, 10, 21))]), publishedToday: false, since: new Date(2026, 10, 1) });
  assert.deepEqual(plan.slice(0, 3).map((item) => [item.kind, item.date.getDate(), item.date.getHours()]), [['daily', 23, 12], ['daily', 24, 12], ['daily', 25, 12]]);
  assert.equal(plan[3].kind, 'ask');
  assert.ok(plan.every((item) => item.date.getDay() !== 0));
});

test('after 3 open days without publishing it asks once, then weekly', () => {
  const { planPublishReminders } = load();
  // Último menú: el jueves 19; viernes, sábado y hoy (lunes) ya cuentan.
  const plan = planPublishReminders({ now: MONDAY, horario: openWeek, published: new Set([key(new Date(2026, 10, 19))]), publishedToday: false, since: new Date(2026, 10, 1) });
  assert.deepEqual(plan.map((item) => item.kind), ['daily', 'ask', 'weekly', 'weekly']);
  assert.equal(Math.round((plan[2].date - plan[1].date) / 86400000), 7);
});

test('days before turning the reminder on and days marked closed do not count', () => {
  const { planPublishReminders } = load();
  const fresh = planPublishReminders({ now: MONDAY, horario: openWeek, published: new Set(), publishedToday: false, since: MONDAY });
  assert.deepEqual(fresh.slice(0, 4).map((item) => item.kind), ['daily', 'daily', 'daily', 'ask']);
  const closedFriSat = planPublishReminders({
    now: MONDAY, horario: openWeek, published: new Set([key(new Date(2026, 10, 19))]), publishedToday: false, since: new Date(2026, 10, 1),
    closed: new Set([key(new Date(2026, 10, 20)), key(new Date(2026, 10, 21))]),
  });
  assert.deepEqual(closedFriSat.slice(0, 4).map((item) => item.kind), ['daily', 'daily', 'daily', 'ask']);
});

test('a menu left ready for tomorrow skips tomorrow\'s reminder and counts as published', () => {
  const { planPublishReminders } = load();
  const plan = planPublishReminders({
    now: MONDAY, horario: openWeek, published: new Set([key(new Date(2026, 10, 21)), key(new Date(2026, 10, 24))]),
    publishedToday: false, since: new Date(2026, 10, 1),
  });
  assert.ok(plan.every((item) => item.date.getDate() !== 24));
  assert.deepEqual(plan.slice(0, 4).map((item) => [item.kind, item.date.getDate()]), [['daily', 23], ['daily', 25], ['daily', 26], ['daily', 27]]);
});

test('publish timing: after service, next slot and labels', () => {
  const { isAfterService, nextPublishSlot, hourLabel, atHour, scheduledLabel } = timing();
  const week = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: dia === 0, abre: dia === 0 ? null : '10:00', cierra: dia === 0 ? null : '17:00' }));
  // Sábado 28 nov 2026: a las 4 pm sigue el servicio; a las 6 pm ya pasó.
  assert.equal(isAfterService(week, new Date(2026, 10, 28, 16, 0)), false);
  assert.equal(isAfterService(week, new Date(2026, 10, 28, 18, 0)), true);
  // Domingo cierra; un turno de noche nunca «ya pasó» de día; sin horario, después de las 6.
  assert.equal(isAfterService(week, new Date(2026, 10, 29, 12, 0)), true);
  const night = week.map((day) => ({ ...day, cerrado: false, abre: '20:00', cierra: '03:00' }));
  assert.equal(isAfterService(night, new Date(2026, 10, 28, 15, 0)), false);
  assert.equal(isAfterService(null, new Date(2026, 10, 28, 19, 0)), true);
  // Sábado en la noche: mañana (domingo) cierra, así que sale el lunes a las 9 am.
  const slot = nextPublishSlot(week, new Date(2026, 10, 28, 21, 0));
  assert.equal(slot.label, 'El lunes a las 9 am');
  assert.equal(slot.fecha, '2026-11-30');
  assert.equal(slot.at.getHours(), 9);
  assert.equal(nextPublishSlot(week, new Date(2026, 10, 26, 21, 0)).label, 'Mañana a las 9 am');
  assert.equal(hourLabel(13 * 60), '1 pm');
  assert.equal(atHour(13 * 60), 'a la 1 pm');
  assert.equal(atHour(8 * 60 + 30), 'a las 8:30 am');
  assert.equal(scheduledLabel(new Date(2026, 10, 27, 9, 0).toISOString(), new Date(2026, 10, 26, 22, 0)), 'Mañana a las 9 am');
});
