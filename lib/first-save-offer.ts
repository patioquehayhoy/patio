import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { getReminder, setReminder } from '@/lib/local-reminders';
import { noWidow } from '@/lib/typography';

const OFFER_KEY = 'patio.offer.lunch-reminder';

// El permiso de avisos se pide cuando tiene sentido: al guardar el primer
// lugar, no en la bienvenida (Apple HIG, Onboarding; decisión del 28 de julio:
// la bienvenida gana intención, no gasta el permiso). Una sola vez.
export async function offerLunchReminderOnce(): Promise<void> {
  const asked = await AsyncStorage.getItem(OFFER_KEY).catch(() => '1');
  if (asked) return;
  await AsyncStorage.setItem(OFFER_KEY, '1').catch(() => {});
  if (await getReminder('lunch').catch(() => true)) return;
  Alert.alert(
    noWidow('¿Te recordamos a la hora de la comida?'),
    noWidow('A la 1 te avisamos para ver qué hay hoy cerca. Lo cambias en Perfil, en Notificaciones.'),
    [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Avisarme', onPress: () => { void setReminder('lunch', true).catch(() => {}); } },
    ],
  );
}
