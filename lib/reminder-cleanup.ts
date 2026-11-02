// Claves y limpieza de los recordatorios locales, sin dependencias nativas en
// la carga: account-session lo usa al cerrar sesión o eliminar la cuenta, para
// que el teléfono no siga recordando publicar a quien ya salió.
export const REMINDER_STORAGE_KEYS = ['patio.reminder.publish', 'patio.reminder.lunch'];
export const REMINDER_ID_PREFIXES = ['publish-reminder', 'lunch-reminder'];

export async function cancelScheduledReminders(prefixes = REMINDER_ID_PREFIXES): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const N = require('expo-notifications') as typeof import('expo-notifications');
    const scheduled = await N.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter((item) => prefixes.some((prefix) => item.identifier.startsWith(prefix)))
      .map((item) => N.cancelScheduledNotificationAsync(item.identifier)));
  } catch {
    // Sin módulo nativo (web, pruebas) no hay nada programado.
  }
}
