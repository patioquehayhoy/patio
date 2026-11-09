import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import { ahoraCDMX, estaAbiertoAhora, type HorarioSemanal } from './horario';
import { sha256Hex } from './sha256';

// Visitas reales (DECISIONES §17 y §19). Con «Tus visitas» activado (permiso
// de ubicación «Siempre»), el teléfono vigila los lugares cercanos con
// geocercas de 100 m (mínimo que recomienda la guía de geocercas de Android).
//   · En vivo: al entrar y al salir se avisa al servidor, sin cuenta ni
//     coordenadas; el servidor solo cuenta a quien lleva 3 minutos o más dentro.
//   · Visita: de 3 minutos a 4 horas, en horario del lugar; la gráfica de
//     «Qué tan lleno» filtra en el servidor (visit_settings, hoy 5 minutos).
//   · «Tacos Juan · ¿Qué te pareció?»: solo con 8 minutos o más, 40 minutos
//     después de salir, si no lo has reseñado.
// Nunca en tu propio negocio ni en lugares donde estás casi a diario (casa o
// trabajo: 5 de los últimos 7 días). Todo es ajustable: decisión de dos vías.

export const VISITS_TASK = 'patio-visits';
export const VISIT_RADIUS_M = 100;
export const REPORT_MIN_MS = 3 * 60_000;
export const PROMPT_MIN_MS = 8 * 60_000;
export const MAX_DWELL_MS = 240 * 60_000;
const FREQUENT_DAYS = 5; // de los últimos 7: casa o trabajo, no visita
export const PROMPT_DELAY_S = 40 * 60;
export const SAME_PLACE_COOLDOWN_MS = 30 * 86_400_000;
export const QUIET_FROM_HOUR = 22;
export const QUIET_TO_HOUR = 9;
export const REFRESH_REGION_ID = 'patio-refresh';
const REFRESH_RADIUS_M = 1500;
const MAX_PLACES = 19; // iOS vigila hasta 20 regiones por app: 19 lugares + la de refresco.
const MAX_DISTANCE_M = 5000;
const REFRESH_EVERY_MS = 15 * 60_000;
const STALE_ENTER_MS = 12 * 3_600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const VISIT_KEYS = {
  enabled: '@patio_visits_enabled',
  places: '@patio_visits_places',
  entered: '@patio_visits_entered',
  asked: '@patio_visits_asked',
  lastPromptDay: '@patio_visits_last_prompt_day',
  ownPlace: '@patio_visits_own_place',
  days: '@patio_visits_days',
  refreshedAt: '@patio_visits_refreshed_at',
  secret: '@patio_device_secret',
} as const;

export type VisitPlace = { id: string; name: string; latitude: number; longitude: number; weeklyHours: HorarioSemanal | null };
type Point = { latitude: number; longitude: number };
export type GeofenceRegion = { identifier: string; latitude: number; longitude: number; radius: number; notifyOnEnter: boolean; notifyOnExit: boolean };
export type GeofenceEvent = { type: 'enter' | 'exit'; id: string };

// ─── Reglas puras (probadas en scripts/tests/visits.test.cjs) ─────────────────

export function distanceM(a: Point, b: Point): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Los 19 lugares más cercanos (hasta 5 km) y una región grande que, al salir de ella, renueva la lista. */
export function regionsFor(places: VisitPlace[], origin: Point): GeofenceRegion[] {
  const nearest = places
    .map((place) => ({ place, distance: distanceM(origin, place) }))
    .filter(({ distance }) => distance <= MAX_DISTANCE_M)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_PLACES)
    .map(({ place }) => ({ identifier: place.id, latitude: place.latitude, longitude: place.longitude, radius: VISIT_RADIUS_M, notifyOnEnter: true, notifyOnExit: true }));
  return [...nearest, { identifier: REFRESH_REGION_ID, latitude: origin.latitude, longitude: origin.longitude, radius: REFRESH_RADIUS_M, notifyOnEnter: false, notifyOnExit: true }];
}

function cdmxShifted(ms: number): Date {
  return new Date(ms + (new Date(ms).getTimezoneOffset() - 360) * 60_000);
}

/** Día en CDMX, «AAAA-MM-DD». */
export function cdmxDay(ms: number): string {
  const d = cdmxShifted(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function cdmxHour(ms: number): number {
  return cdmxShifted(ms).getHours();
}

/** Estancia válida: entre `minMs` y 4 horas y, si el lugar tiene horario, dentro de él. */
export function isVisit(place: VisitPlace, enteredAt: number, exitedAt: number, minMs: number): boolean {
  const dwell = exitedAt - enteredAt;
  if (dwell < minMs || dwell > MAX_DWELL_MS) return false;
  return estaAbiertoAhora(place.weeklyHours, ahoraCDMX(new Date(enteredAt + dwell / 2))) !== false;
}

/** Visita suficiente para preguntar «¿Qué te pareció?» (8 minutos o más). */
export function isRealVisit(place: VisitPlace, enteredAt: number, exitedAt: number): boolean {
  return isVisit(place, enteredAt, exitedAt, PROMPT_MIN_MS);
}

/** Casa o trabajo: estuviste ahí 5 de los últimos 7 días. */
export function isFrequentPlace(days: string[], now: number): boolean {
  const lastWeek = new Set(Array.from({ length: 7 }, (_, index) => cdmxDay(now - index * 86_400_000)));
  return new Set(days.filter((day) => lastWeek.has(day))).size >= FREQUENT_DAYS;
}

export function shouldAskOpinion(input: {
  place: VisitPlace;
  enteredAt: number;
  exitedAt: number;
  now: number;
  askedAt?: number;
  lastPromptDay: string | null;
  reviewed: boolean;
  ownPlaceId: string | null;
}): boolean {
  const { place, enteredAt, exitedAt, now, askedAt, lastPromptDay, reviewed, ownPlaceId } = input;
  if (!isRealVisit(place, enteredAt, exitedAt)) return false;
  if (place.id === ownPlaceId || reviewed) return false;
  if (askedAt && now - askedAt < SAME_PLACE_COOLDOWN_MS) return false;
  if (lastPromptDay === cdmxDay(now)) return false;
  const hour = cdmxHour(now + PROMPT_DELAY_S * 1000);
  return hour >= QUIET_TO_HOUR && hour < QUIET_FROM_HOUR;
}

export type VisitDeps = {
  now: () => number;
  read: <T>(key: string, fallback: T) => Promise<T>;
  write: (key: string, value: unknown) => Promise<void>;
  isReviewed: (placeId: string) => Promise<boolean>;
  report: (place: VisitPlace, enteredAt: number, exitedAt: number) => Promise<void>;
  presence: (place: VisitPlace, inside: boolean) => Promise<void>;
  ask: (place: VisitPlace) => Promise<void>;
  refresh: () => Promise<void>;
};

export async function handleGeofenceEvent(event: GeofenceEvent, deps: VisitDeps): Promise<'entered' | 'visit' | 'ignored' | 'refreshed'> {
  if (event.id === REFRESH_REGION_ID) {
    if (event.type !== 'exit') return 'ignored';
    await deps.refresh();
    return 'refreshed';
  }
  const now = deps.now();
  const [entered, places, ownPlaceId, days] = await Promise.all([
    deps.read<Record<string, number>>(VISIT_KEYS.entered, {}),
    deps.read<VisitPlace[]>(VISIT_KEYS.places, []),
    deps.read<string | null>(VISIT_KEYS.ownPlace, null),
    deps.read<Record<string, string[]>>(VISIT_KEYS.days, {}),
  ]);
  for (const [id, at] of Object.entries(entered)) if (now - at > STALE_ENTER_MS) delete entered[id];
  const place = places.find((candidate) => candidate.id === event.id);
  const frequent = isFrequentPlace(days[event.id] ?? [], now);

  if (event.type === 'enter') {
    entered[event.id] = now;
    await deps.write(VISIT_KEYS.entered, entered);
    if (place && place.id !== ownPlaceId && !frequent) await deps.presence(place, true).catch(() => {});
    return 'entered';
  }

  const enteredAt = entered[event.id];
  delete entered[event.id];
  await deps.write(VISIT_KEYS.entered, entered);
  if (!place || place.id === ownPlaceId) return 'ignored';
  await deps.presence(place, false).catch(() => {});
  if (!enteredAt || !isVisit(place, enteredAt, now, REPORT_MIN_MS)) return 'ignored';

  // Se anota el día antes de decidir: así casa y trabajo se reconocen solos.
  days[place.id] = [...new Set([...(days[place.id] ?? []), cdmxDay(now)])].slice(-10);
  await deps.write(VISIT_KEYS.days, days);
  if (frequent) return 'ignored';

  await deps.report(place, enteredAt, now).catch(() => {});
  const [asked, lastPromptDay, reviewed] = await Promise.all([
    deps.read<Record<string, number>>(VISIT_KEYS.asked, {}),
    deps.read<string | null>(VISIT_KEYS.lastPromptDay, null),
    deps.isReviewed(place.id).catch(() => true),
  ]);
  if (shouldAskOpinion({ place, enteredAt, exitedAt: now, now, askedAt: asked[place.id], lastPromptDay, reviewed, ownPlaceId })) {
    await deps.ask(place);
    asked[place.id] = now;
    await Promise.all([deps.write(VISIT_KEYS.asked, asked), deps.write(VISIT_KEYS.lastPromptDay, cdmxDay(now))]);
  }
  return 'visit';
}

// ─── Teléfono ─────────────────────────────────────────────────────────────────

/** Necesita el build con `expo-task-manager`; en builds anteriores no aparece. */
export function visitsSupported(): boolean {
  return (Platform.OS === 'ios' || Platform.OS === 'android')
    && Boolean(requireOptionalNativeModule('ExpoTaskManager'))
    && Boolean(requireOptionalNativeModule('ExpoLocation'));
}

/** Además del módulo, el build debe declarar ubicación en segundo plano. */
export async function visitsAvailable(): Promise<boolean> {
  if (!visitsSupported()) return false;
  const Location = await import('expo-location');
  return Location.isBackgroundLocationAvailableAsync().catch(() => false);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function visitsEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(VISIT_KEYS.enabled).catch(() => null)) === '1';
}

/** Guarda los lugares que el mapa ya cargó; con visitas activas, renueva las geocercas cada 15 min. */
export async function rememberVisitPlaces(places: VisitPlace[], ownPlaceId: string | null): Promise<void> {
  const clean = places
    .filter((place) => UUID.test(place.id) && Number.isFinite(place.latitude) && Number.isFinite(place.longitude) && place.latitude !== 0)
    .map(({ id, name, latitude, longitude, weeklyHours }) => ({ id, name, latitude, longitude, weeklyHours }));
  if (!clean.length) return;
  await Promise.all([writeJson(VISIT_KEYS.places, clean), writeJson(VISIT_KEYS.ownPlace, ownPlaceId)]);
  if (!visitsSupported() || !(await visitsEnabled())) return;
  const last = Number(await AsyncStorage.getItem(VISIT_KEYS.refreshedAt).catch(() => null)) || 0;
  if (Date.now() - last < REFRESH_EVERY_MS) return;
  await refreshRegions().catch(() => {});
}

export async function refreshRegions(): Promise<void> {
  if (!visitsSupported()) return;
  const Location = await import('expo-location');
  const position = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })
    ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const places = await readJson<VisitPlace[]>(VISIT_KEYS.places, []);
  await Location.startGeofencingAsync(VISITS_TASK, regionsFor(places, position.coords));
  await AsyncStorage.setItem(VISIT_KEYS.refreshedAt, String(Date.now()));
}

export type EnableVisitsResult = 'enabled' | 'denied' | 'unsupported';

/** Pide ubicación «Siempre» (primero «Al usar la app», como exige iOS) y avisos. */
export async function enableVisits(): Promise<EnableVisitsResult> {
  if (!(await visitsAvailable())) return 'unsupported';
  const Location = await import('expo-location');
  let foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted && foreground.canAskAgain) foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return 'denied';
  let background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted && background.canAskAgain) background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return 'denied';
  const { requestSystemNotificationPermission } = await import('./community-notifications');
  await requestSystemNotificationPermission().catch(() => false);
  await AsyncStorage.setItem(VISIT_KEYS.enabled, '1');
  await refreshRegions().catch(() => {});
  return 'enabled';
}

export async function disableVisits(): Promise<void> {
  await AsyncStorage.setItem(VISIT_KEYS.enabled, '0');
  if (!visitsSupported()) return;
  const Location = await import('expo-location');
  if (await Location.hasStartedGeofencingAsync(VISITS_TASK).catch(() => false)) {
    await Location.stopGeofencingAsync(VISITS_TASK).catch(() => {});
  }
}

/** Identificador del teléfono que cambia cada día: une las visitas de un mismo día y nada más. */
export async function deviceDay(now: number): Promise<string> {
  let secret = await AsyncStorage.getItem(VISIT_KEYS.secret);
  if (!secret) {
    secret = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    await AsyncStorage.setItem(VISIT_KEYS.secret, secret);
  }
  return sha256Hex(`${secret}:${cdmxDay(now)}`);
}

async function reportVisit(place: VisitPlace, enteredAt: number, exitedAt: number): Promise<void> {
  const { supabase } = await import('./supabase');
  await supabase.rpc('record_visit', {
    p_negocio: place.id,
    p_started_at: new Date(enteredAt).toISOString(),
    p_minutes: Math.round((exitedAt - enteredAt) / 60_000),
    p_device_day: await deviceDay(exitedAt),
  });
}

async function markPresence(place: VisitPlace, inside: boolean): Promise<void> {
  const { supabase } = await import('./supabase');
  await supabase.rpc('mark_presence', { p_negocio: place.id, p_device_day: await deviceDay(Date.now()), p_inside: inside });
}

async function askOpinion(place: VisitPlace): Promise<void> {
  const Notifications = await import('expo-notifications');
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  // Gramática de avisos: título = quién; cuerpo = una línea.
  await Notifications.scheduleNotificationAsync({
    content: { title: place.name, body: '¿Qué te pareció?', sound: 'default', data: { type: 'visit_review', patioId: place.id } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: PROMPT_DELAY_S, channelId: 'default' },
  });
}

async function isReviewed(placeId: string): Promise<boolean> {
  const { hasRatedPatio } = await import('./ratings');
  return hasRatedPatio(placeId);
}

/** Llamado por la tarea de geocercas (lib/visits-task.ts). */
export function handleVisitTaskEvent(event: GeofenceEvent) {
  return handleGeofenceEvent(event, {
    now: () => Date.now(),
    read: readJson,
    write: writeJson,
    isReviewed,
    report: reportVisit,
    presence: markPresence,
    ask: askOpinion,
    refresh: refreshRegions,
  });
}
