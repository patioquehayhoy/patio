import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { loadRitmo, saveRitmo } from '@/lib/business-places';
import { syncPublishReminder } from '@/lib/local-reminders';
import { getTipoNegocio } from '@/lib/menu-store';
import { defaultRitmo, setCachedRitmo, type Ritmo } from '@/lib/ritmo';
import type { Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// «Tu menú» (2026-11-21): cada cuándo cambia lo que vendes. Decide el aviso
// que te llega: con «Cambia cada día», «¿Ya publicaste lo de hoy?»; con «Casi
// siempre es el mismo», uno al mes «¿Siguen igual tus precios?». Se guarda en
// cuanto se elige, como «Dónde vendes».
const OPTIONS: { value: Ritmo; title: string; sub: string; icon: 'today-outline' | 'book-outline' }[] = [
  { value: 'diario', title: 'Cambia cada día', sub: 'Publicas lo de hoy; te recordamos antes de abrir', icon: 'today-outline' },
  { value: 'carta', title: 'Casi siempre es el mismo', sub: 'Tu carta se ve sola; te preguntamos una vez al mes por tus precios', icon: 'book-outline' },
];

export function BusinessRhythmEditor({ colors, negocioId }: { colors: Theme; negocioId: string | null }) {
  const sc = settingsColors(colors);
  const s = makeStyles(colors);
  const fallback = defaultRitmo(getTipoNegocio());
  const [ritmo, setRitmo] = useState<Ritmo | null>(null);

  useFocusEffect(useCallback(() => {
    if (!negocioId) return;
    let active = true;
    loadRitmo(negocioId)
      .then((value) => {
        if (!active) return;
        const current = value ?? fallback;
        setRitmo(current);
        void setCachedRitmo(current);
      })
      .catch(() => { if (active) setRitmo(fallback); });
    return () => { active = false; };
  }, [negocioId, fallback]));

  const choose = async (next: Ritmo) => {
    if (!negocioId || next === ritmo) return;
    const before = ritmo;
    setRitmo(next);
    try {
      await saveRitmo(negocioId, next);
      await setCachedRitmo(next);
      // El aviso cambia con el ritmo: diario o una vez al mes.
      syncPublishReminder(false).catch(() => {});
    } catch {
      setRitmo(before);
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    }
  };

  if (!negocioId) return <Text style={s.help}>{noWidow('Guarda tu negocio primero para elegir cómo es tu menú.')}</Text>;
  return (
    <SettingsGroup c={sc}>
      {OPTIONS.map((option, index) => (
        <SettingsRow
          key={option.value}
          c={sc}
          icon={option.icon}
          title={option.title}
          sub={option.sub}
          divider={index > 0}
          onPress={() => { void choose(option.value); }}
          trailing={(ritmo ?? fallback) === option.value ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : <View style={s.markSlot} />}
        />
      ))}
    </SettingsGroup>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    help: { fontSize: 13, lineHeight: 18, color: t.textSecondary },
    markSlot: { width: 18 },
  });
}
