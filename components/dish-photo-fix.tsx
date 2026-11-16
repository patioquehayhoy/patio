import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/glass-button';
import type { DishPhoto } from '@/lib/dish-photos-order';
import { useTheme, Type, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Corregir platillo (2026-11-15): subiste la de lengua y dijiste suadero. Es
// una tarea aparte y corta, por eso va en su propia hoja; al guardar, la foto
// se mueve al platillo correcto en la ficha.
export function DishPhotoFix({ photo, dish, dishOptions, onClose, onSave }: {
  photo: DishPhoto | null;
  /** Platillo en el que está hoy la foto. */
  dish: string;
  dishOptions: string[];
  onClose: () => void;
  onSave: (dish: string) => Promise<void>;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(dish);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (photo) setPicked(dish);
  }, [photo, dish]);

  const save = async () => {
    if (busy || !picked) return;
    setBusy(true);
    try {
      await onSave(picked);
      onClose();
    } catch {
      Alert.alert(noWidow('No se guardó el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!photo} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.nav}>
          <View style={s.navSpacer} />
          <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.title} accessibilityRole="header" allowFontScaling={true}>{noWidow('Corregir platillo')}</Text>
          {!!photo && <Image source={{ uri: photo.url }} style={s.thumb} contentFit="cover" accessibilityIgnoresInvertColors />}
          <Text style={s.label} allowFontScaling={true}>{noWidow('¿De qué platillo es?')}</Text>
          <View style={s.chips}>
            {dishOptions.map((name) => {
              const on = picked === name;
              return (
                <TouchableOpacity key={name} style={[s.chip, on ? s.chipOn : s.chipOff]} onPress={() => setPicked(name)} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ selected: on }}>
                  <Text style={[s.chipText, on && s.chipTextOn]} allowFontScaling={true}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={[s.cta, (busy || !picked) && s.ctaDisabled]} onPress={save} disabled={busy || !picked} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ busy, disabled: busy || !picked }}>
            <Text style={s.ctaText} allowFontScaling={true}>{busy ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    navSpacer: { width: 40, height: 40 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    title: { ...Type.section, color: t.text },
    thumb: { width: 96, height: 96, borderRadius: 14, borderCurve: 'continuous', marginTop: 16, backgroundColor: t.border },
    label: { marginTop: 24, marginBottom: 6, fontSize: 13, fontWeight: '400', color: t.textSecondary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
    chipOff: { backgroundColor: t.surface, borderColor: t.border },
    chipOn: { backgroundColor: t.text, borderColor: t.text },
    chipText: { fontSize: 13, fontWeight: '500', color: t.text },
    chipTextOn: { color: t.bg },
    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: t.bg },
    cta: { minHeight: 54, borderRadius: 27, borderCurve: 'continuous', backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
