import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearRecentPatios, getRecentPatios, type RecentPatio } from '@/lib/recent-patios';
import { fetchFonditaById } from '@/lib/patios';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const LABELS = { opened: 'Consultado', searched: 'Desde tu búsqueda', visited: 'Marcaste Ya fui' };

export function RecentPatiosButton({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [entries, setEntries] = useState<RecentPatio[]>([]);
  const pendingRoute = useRef<string | null>(null);
  const navigate = () => {
    const id = pendingRoute.current;
    pendingRoute.current = null;
    if (id) router.push(`/patio/${id}`);
  };
  useEffect(() => {
    if (visible || Platform.OS === 'ios') return;
    const frame = requestAnimationFrame(navigate);
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    setEntries([]);
    setFailed(false);
    getRecentPatios().then(async (items) => {
      const hydrated = await Promise.all(items.map(async (item) => {
        if (item.name) return item;
        const patio = await fetchFonditaById(item.patioId).catch(() => null);
        return patio ? { ...item, name: patio.name, area: patio.area } : null;
      }));
      if (active) setEntries(hydrated.filter((item): item is RecentPatio => item !== null));
    }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visible]);
  const clear = () => Alert.alert(noWidow('Borrar recientes'), noWidow('Se borrará este historial. Tus lugares y listas se conservan.'), [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar', style: 'destructive', onPress: () => { clearRecentPatios().then(() => setEntries([])).catch(() => Alert.alert(noWidow('No pudimos borrar el historial'))); } },
  ]);
  return <>
    <TouchableOpacity onPress={() => { Keyboard.dismiss(); setVisible(true); }} hitSlop={6} accessibilityRole="button" accessibilityLabel="Lugares recientes"
      style={[s.pill, { backgroundColor: theme.glass, borderColor: theme.border }, compact && s.compact]}>
      <BlurView pointerEvents="none" intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <Ionicons name="time-outline" size={20} color={theme.text} />
      {!compact && <Text style={[s.label, { color: theme.text }]}>Recientes</Text>}
    </TouchableOpacity>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)} onDismiss={navigate}>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setVisible(false)} accessibilityRole="button" accessibilityLabel="Cerrar recientes" />
        <View accessibilityViewIsModal onAccessibilityEscape={() => setVisible(false)} style={[s.sheet, { maxHeight: height - insets.top - 32, paddingBottom: Math.max(8, insets.bottom), backgroundColor: theme.glass, borderColor: theme.border }]}>
          <BlurView pointerEvents="none" intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View style={s.header}>
            <TouchableOpacity disabled={!entries.length || loading} onPress={clear} style={s.headerAction} accessibilityRole="button" accessibilityLabel="Borrar recientes"><Text style={[s.label, { color: theme.textSecondary, opacity: entries.length && !loading ? 1 : 0.35 }]}>Borrar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setVisible(false)} style={s.headerAction} accessibilityRole="button" accessibilityLabel="Cerrar recientes"><Text style={[s.label, { color: theme.text }]}>Listo</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ flexGrow: 0, maxHeight: height * 0.55 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            {loading ? <ActivityIndicator style={{ padding: 24 }} color={theme.textSecondary} /> : entries.length ? <View style={{ backgroundColor: theme.surface, borderRadius: 14, overflow: 'hidden' }}>
              {entries.map((entry, index) => <TouchableOpacity key={entry.patioId} accessibilityRole="button" accessibilityLabel={`Abrir ${entry.name}`}
                onPress={() => { pendingRoute.current = entry.patioId; setVisible(false); }} style={[s.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>{entry.name}</Text>
                  <Text style={[s.meta, { color: theme.textSecondary }]} numberOfLines={1}>{noWidow(LABELS[entry.kind])}{entry.area ? ` · ${entry.area}` : ''}</Text>
                </View>
                <Text style={[s.meta, { color: theme.textSecondary }]}>{new Date(entry.at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</Text>
              </TouchableOpacity>)}
            </View> : <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow(failed ? 'No pudimos cargar tus recientes.' : 'Aquí aparecerán los lugares que consultes y las visitas que marques.')}</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const s = StyleSheet.create({
  pill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
  compact: { width: 32, paddingHorizontal: 0, justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: { minHeight: 52, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between' },
  headerAction: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  row: { minHeight: 60, paddingHorizontal: 16, paddingVertical: 8, gap: 12, flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
  empty: { padding: 24, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
