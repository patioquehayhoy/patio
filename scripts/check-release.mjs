#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const platformArg = process.argv.find((arg) => arg.startsWith('--platform='));
const platform = platformArg?.split('=')[1] ?? 'all';
if (!['all', 'ios', 'android'].includes(platform)) {
  console.error('Usa --platform=ios, --platform=android o --platform=all.');
  process.exit(1);
}

// Match Expo's environment resolution without printing names, paths or values.
require('@expo/env').loadProjectEnv(root, { mode: 'production', silent: true });
const { expo: config } = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8'));
const eas = JSON.parse(readFileSync(resolve(root, 'eas.json'), 'utf8'));
const failures = [];
const pending = [];
let passed = 0;
function check(condition, message) {
  if (condition) passed += 1;
  else failures.push(message);
}
function external(condition, message) {
  if (condition) passed += 1;
  else pending.push(message);
}
function pluginOptions(name) {
  const entry = config.plugins?.find((item) => Array.isArray(item) && item[0] === name);
  return entry?.[1] ?? {};
}
function checkAsset(path) {
  check(typeof path === 'string' && existsSync(resolve(root, path)), `Falta recurso: ${path ?? '(sin ruta)'}.`);
}
function pngInfo(path) {
  const data = readFileSync(resolve(root, path));
  if (data.length < 33 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('El icono debe ser PNG.');
  }
  let hasTransparency = [4, 6].includes(data[25]);
  for (let offset = 8; offset + 12 <= data.length;) {
    const length = data.readUInt32BE(offset);
    if (data.toString('ascii', offset + 4, offset + 8) === 'tRNS') hasTransparency = true;
    offset += length + 12;
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), hasTransparency };
}

check(config.ios?.bundleIdentifier === 'com.parcomx.patio', 'Revisa el bundle identifier iOS registrado.');
check(config.android?.package === 'com.parcomx.patio', 'Revisa el package Android registrado.');
check(config.scheme === 'patio', 'El scheme patio es necesario para los enlaces de acceso y contenido.');
check(/^\d+\.\d+\.\d+$/.test(config.version ?? ''), 'La versión pública debe tener formato X.Y.Z.');
check(/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(config.extra?.eas?.projectId ?? ''), 'Falta un EAS projectId válido para push.');
check(eas.cli?.appVersionSource === 'remote' && eas.build?.production?.autoIncrement === true, 'Producción debe incrementar buildNumber/versionCode de forma remota.');
check(eas.build?.production?.environment === 'production', 'El perfil production debe usar el entorno EAS production.');
check(eas.build?.production?.distribution === 'store', 'El perfil production debe usar distribución store.');
checkAsset(config.icon);
try {
  const icon = pngInfo(config.ios?.icon ?? config.icon);
  check(icon.width === 1024 && icon.height === 1024 && !icon.hasTransparency, 'El icono App Store debe medir 1024×1024 y ser opaco.');
} catch (error) {
  check(false, error.code === 'ENOENT' ? 'No se encontró el icono App Store.' : error.message);
}
const splash = pluginOptions('expo-splash-screen');
checkAsset(splash.image);
if (splash.dark?.image) checkAsset(splash.dark.image);
check(pluginOptions('expo-image-picker').microphonePermission === false, 'Image picker no debe añadir permiso de micrófono.');
check(pluginOptions('expo-camera').microphonePermission === false && pluginOptions('expo-camera').recordAudioAndroid === false, 'La cámara de fotos no debe añadir grabación de audio.');
const location = pluginOptions('expo-location');
check(location.locationAlwaysPermission === false && location.locationAlwaysAndWhenInUsePermission === false, 'Elimina permisos iOS de ubicación permanente; Patio usa ubicación en contexto.');
check(location.isIosBackgroundLocationEnabled === false && location.isAndroidBackgroundLocationEnabled === false, 'Ubicación en segundo plano no debe estar habilitada.');

if (platform !== 'android') {
  const image = eas.build?.production?.ios?.image ?? '';
  const xcodeVersion = image.match(/xcode-(\d+)/)?.[1];
  check(Number(xcodeVersion) >= 26, 'La imagen iOS de producción debe usar Xcode 26+ (SDK iOS 26+).');
  check(Boolean(eas.submit?.production?.ios?.ascAppId), 'Falta ascAppId de App Store Connect.');
  check(config.ios?.privacyManifests?.NSPrivacyTracking === false, 'Revisa la declaración de tracking en el manifiesto de privacidad.');
}

if (platform !== 'ios') {
  for (const asset of ['foregroundImage', 'backgroundImage', 'monochromeImage']) {
    const path = config.android?.adaptiveIcon?.[asset];
    if (path) checkAsset(path);
  }
  check(eas.build?.production?.android?.buildType === 'app-bundle', 'Google Play requiere producción como Android App Bundle.');
  const blocked = config.android?.blockedPermissions ?? [];
  for (const permission of ['RECORD_AUDIO', 'ACCESS_BACKGROUND_LOCATION', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO']) {
    check(blocked.includes(`android.permission.${permission}`), `Evita permiso Android innecesario: ${permission}.`);
  }
  check(pluginOptions('expo-notifications').defaultChannel === 'default', 'El canal Android de push debe coincidir con el canal default creado en runtime.');
  const versionsPath = resolve(root, 'node_modules/react-native/gradle/libs.versions.toml');
  if (existsSync(versionsPath)) {
    const versions = readFileSync(versionsPath, 'utf8');
    const overrides = pluginOptions('expo-build-properties').android ?? {};
    const target = overrides.targetSdkVersion ?? Number(versions.match(/^targetSdk = "(\d+)"/m)?.[1]);
    const compile = overrides.compileSdkVersion ?? Number(versions.match(/^compileSdk = "(\d+)"/m)?.[1]);
    check(target >= 36 && compile >= target, 'Play exige target API 36+; compile SDK debe ser al menos el target.');
    console.log(`Android configurado: target API ${target}, compile API ${compile}.`);
  } else {
    check(false, 'Instala dependencias para verificar los SDK nativos de React Native.');
  }
  external(Boolean(process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim()), 'Configura GOOGLE_MAPS_ANDROID_API_KEY, restringida por package y SHA-1 de firma.');
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim();
  external(Boolean(googleServicesFile && existsSync(resolve(root, googleServicesFile))), 'Configura GOOGLE_SERVICES_JSON como archivo Firebase Android existente.');
}

for (const message of failures) console.error(`ERROR: ${message}`);
for (const message of pending) console.warn(`PENDIENTE: ${message}`);
console.log(`${passed} verificaciones correctas; ${failures.length} errores; ${pending.length} pendientes de configuración externa.`);
console.log('Este control valida configuración. La firma, el backend, los dispositivos y las fichas de tienda requieren el checklist docs/STORE_RELEASE_READINESS.md.');
process.exitCode = failures.length || (strict && pending.length) ? 1 : 0;
