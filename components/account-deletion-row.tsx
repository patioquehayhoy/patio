import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { deleteAccount } from '@/lib/account-session';
import { supabase } from '@/lib/supabase';
import { noWidow } from '@/lib/typography';
import { SettingsRow, type SettingsColors } from './settings-list';

export function AccountDeletionRow({ c }: { c: SettingsColors }) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const remove = async (userId: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await deleteAccount(userId);
      router.replace('/entrada');
    } catch (error) {
      Alert.alert(noWidow('No pudimos completar la eliminación'), noWidow(
        error instanceof Error ? error.message : 'Inténtalo de nuevo.'
      ));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const confirm = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      Alert.alert(noWidow('Inicia sesión de nuevo'), noWidow('Necesitas entrar a tu cuenta para eliminarla.'));
      return;
    }
    const userId = data.session.user.id;
    Alert.alert(
      noWidow('¿Eliminar tu cuenta?'),
      noWidow('Se eliminarán tu perfil, reseñas, listas y, si tienes un negocio, su perfil y menús. Esta acción es permanente.'),
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar cuenta', style: 'destructive', onPress: () => { void remove(userId); } }],
    );
  };
  return <SettingsRow c={c} icon="trash-outline" divider
    title={busy ? 'Eliminando cuenta…' : 'Eliminar cuenta'}
    trailing={busy ? <ActivityIndicator color={c.textSecondary} /> : undefined}
    onPress={busy ? undefined : () => { void confirm().catch(() => Alert.alert(noWidow('No pudimos verificar tu cuenta'), noWidow('Inténtalo de nuevo.'))); }} />;
}
