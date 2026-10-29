import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { blockUser, reportContent, type ReportReason, type ReportTarget } from '@/lib/content-safety';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { ActionSheet } from './action-sheet';

type Props = { targetType: ReportTarget; targetId: string; authorId?: string; onBlocked?: () => void };

export function ContentSafetyMenu({ targetType, targetId, authorId, onBlocked }: Props) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const anchor = useRef<View>(null);
  const inFlight = useRef(false);
  const [menu, setMenu] = useState<'actions' | 'reasons' | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (operation: () => Promise<void>, success: () => void) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push({ pathname: '/comunidad-acceso', params: { returnTo: pathname } });
        return;
      }
      await operation();
      success();
    } catch (error) {
      Alert.alert(noWidow('No pudimos completar la acción'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.'));
    } finally { inFlight.current = false; setBusy(false); }
  };
  const report = (reason: ReportReason) => void run(
    () => reportContent(targetType, targetId, reason),
    () => Alert.alert(noWidow('Reporte enviado'), noWidow('Gracias por avisarnos. El equipo de Patio revisará este contenido.')),
  );
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return null;
  return <View ref={anchor} collapsable={false}>
    <TouchableOpacity style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => setMenu('actions')} accessibilityRole="button" accessibilityLabel="Reportar o bloquear contenido">
      {busy ? <ActivityIndicator color={theme.textSecondary} /> : <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />}
    </TouchableOpacity>
    <ActionSheet visible={menu !== null} anchorRef={anchor} title={menu === 'reasons' ? 'Motivo del reporte' : 'Seguridad'} onDismiss={() => setMenu(null)}
      options={menu === 'reasons' ? [
        { label: 'Spam o publicidad', icon: 'megaphone-outline', onPress: () => report('spam') },
        { label: 'Abuso o contenido ofensivo', icon: 'flag-outline', onPress: () => report('abuse') },
        { label: 'Información incorrecta', icon: 'information-circle-outline', onPress: () => report('inaccurate') },
        { label: 'Otro motivo', icon: 'ellipsis-horizontal', onPress: () => report('other') },
      ] : [
        { label: 'Reportar contenido', icon: 'flag-outline', onPress: () => setMenu('reasons') },
        ...(authorId ? [{ label: 'Bloquear cuenta', icon: 'ban-outline' as const, onPress: () => Alert.alert(
          noWidow('¿Bloquear esta cuenta?'), noWidow('Dejarás de ver su perfil, reseñas y colecciones. Puedes desbloquearla en Perfil → Cuentas bloqueadas.'),
          [{ text: 'Cancelar', style: 'cancel' as const }, { text: 'Bloquear', style: 'destructive' as const, onPress: () => void run(() => blockUser(authorId), () => { onBlocked?.(); }) }],
        ) }] : []),
      ]} />
  </View>;
}
