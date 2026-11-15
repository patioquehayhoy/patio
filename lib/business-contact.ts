// Número del negocio (decisión 2026-11-11): opcional, solo el número. En la
// ficha abre llamar o, si el negocio lo marca, WhatsApp. Se guardan diez
// dígitos de México; lo demás (espacios, guiones, +52, 044) se limpia aquí.

export const PHONE_DIGITS = 10;

/** Deja solo los dígitos del número nacional, máximo diez. */
export function cleanPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  // Quien pega el número con lada internacional o el prefijo viejo de celular.
  if (digits.length > PHONE_DIGITS && digits.startsWith('521')) digits = digits.slice(3);
  else if (digits.length > PHONE_DIGITS && digits.startsWith('52')) digits = digits.slice(2);
  else if (digits.length > PHONE_DIGITS && /^0(44|45)/.test(digits)) digits = digits.slice(3);
  return digits.slice(0, PHONE_DIGITS);
}

export function isCompletePhone(value?: string | null): boolean {
  return !!value && new RegExp(`^\\d{${PHONE_DIGITS}}$`).test(value);
}

/**
 * Como se lee en voz alta en México. CDMX, Guadalajara y Monterrey usan lada
 * de dos dígitos (55 1234 5678); el resto, de tres (222 123 4567).
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== PHONE_DIGITS) return digits;
  const twoDigitArea = /^(55|56|33|81)/.test(digits);
  return twoDigitArea
    ? `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
    : `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function phoneCallUrl(value: string): string {
  return `tel:+52${value}`;
}

/** WhatsApp abre el chat con un saludo que el negocio reconoce. */
export function whatsappUrl(value: string, businessName?: string): string {
  const hello = businessName?.trim() ? `Hola, ${businessName.trim()}. Te vi en Patio.` : 'Hola, te vi en Patio.';
  return `https://wa.me/52${value}?text=${encodeURIComponent(hello)}`;
}
