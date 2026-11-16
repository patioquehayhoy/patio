// Vista previa instantánea de fotos (2026-11-15): un ThumbHash
// (https://evanw.github.io/thumbhash/) es un resumen de ~25 bytes de los
// colores y la forma de la foto. Viaja con el menú o la reseña, así que se
// pinta al instante, difuminado, mientras baja la foto de verdad.
//
// Se guarda en hexadecimal: solo letras y números, una sola «palabra». El
// filtro de groserías del servidor lee el menú completo como texto y separa
// palabras en «+», «/» o «=»; en base64 un pedazo podría, por azar, formar una.

const HEX = /^(?:[0-9a-f]{2}){10,50}$/;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function isPhotoHash(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

/** base64 (lo que da expo-image al calcularlo) → hexadecimal (lo que se guarda). */
export function photoHashFromBase64(base64: string): string | undefined {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  let bits = 0;
  let value = 0;
  let hex = '';
  for (const char of clean) {
    value = (value << 6) | B64.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      hex += ((value >> bits) & 0xff).toString(16).padStart(2, '0');
    }
  }
  return isPhotoHash(hex) ? hex : undefined;
}

/** hexadecimal → base64, como lo pide expo-image en `placeholder={{ thumbhash }}`. */
export function photoHashToBase64(hex: string): string {
  const bytes = hex.match(/../g)?.map((pair) => parseInt(pair, 16)) ?? [];
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b = 0, c = 0] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    const chunk = (a << 16) | (b << 8) | c;
    out += B64[(chunk >> 18) & 63] + B64[(chunk >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(chunk >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[chunk & 63] : '=';
  }
  return out;
}

/** Lo que va en `placeholder` de expo-image; nada si la foto no trae resumen. */
export function photoPlaceholder(hex: string | undefined): { thumbhash: string } | undefined {
  return isPhotoHash(hex) ? { thumbhash: photoHashToBase64(hex) } : undefined;
}
