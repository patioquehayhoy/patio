import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { fonderoPalette } from '@/lib/fondero-palette';
import { getLocalMenus, seedDemoHistory } from '@/lib/menu-history';
import { setMenuData, type MenuData } from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme } from '@/lib/theme';
import { getFonditaId } from '@/lib/user-store';

type PublishedMenu = { fecha: string; secciones: MenuData };

function summary(menu: MenuData): string {
  return menu.secciones
    .flatMap(section => section.platillos)
    .map(dish => dish.nombre.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');
}

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const [menus, setMenus] = useState<PublishedMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const { onScroll } = useTabBarScroll();

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      await seedDemoHistory();
      const locales = await getLocalMenus();
      const id = getFonditaId();
      let remotos: PublishedMenu[] = [];
      if (id) {
        const { data } = await supabase
          .from('menus')
          .select('fecha,secciones')
          .eq('fondita_id', id)
          .order('fecha', { ascending: false })
          .limit(20);
        remotos = (data ?? []) as PublishedMenu[];
      }
      // Supabase manda cuando hay sesión; lo local llena los huecos (modo DEV/offline).
      const porFecha = new Map<string, PublishedMenu>();
      for (const menu of locales) porFecha.set(menu.fecha, menu);
      for (const menu of remotos) porFecha.set(menu.fecha, menu);
      const merged = [...porFecha.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 20);
      if (active) {
        setMenus(merged);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []));

  const reuse = (menu: MenuData) => {
    setMenuData(menu);
    router.push({ pathname: '/menu-editar', params: { reuse: '1' } });
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: c.accent }]}>PUBLICACIONES</Text>
        <Text style={[s.title, { color: c.text }]}>Historial</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }]}>Vuelve a usar cualquiera de tus menús publicados.</Text>

        {!loading && menus.length === 0 ? (
          <View style={[s.empty, { borderColor: c.border }]}>
            <Ionicons name="receipt-outline" size={28} color={c.textMute} />
            <Text style={[s.emptyTitle, { color: c.text }]}>Todavía no hay menús</Text>
            <Text style={[s.emptyBody, { color: c.textSecondary }]}>Cuando publiques uno aparecerá aquí para volver a usarlo.</Text>
            <TouchableOpacity style={[s.emptyButton, { backgroundColor: c.accent }]} onPress={() => router.replace('/menu')} activeOpacity={0.84}>
              <Text style={s.emptyButtonText}>Crear menú</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.list, { borderColor: c.border }]}>
            {menus.map((menu, index) => (
              <TouchableOpacity
                key={`${menu.fecha}-${index}`}
                style={[s.row, index > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}
                onPress={() => reuse(menu.secciones)}
                activeOpacity={0.74}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.date, { color: c.accent }]}>
                    {new Date(`${menu.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                  </Text>
                  <Text style={[s.summary, { color: c.text }]} numberOfLines={2}>{summary(menu.secciones) || 'Menú publicado'}</Text>
                </View>
                <View style={[s.reuse, { backgroundColor: c.iconBg }]}>
                  <Ionicons name="refresh" size={17} color={c.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.3, fontFamily: Fonts.brand },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  empty: { marginTop: 34, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  emptyButton: { minHeight: 48, marginTop: 20, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  list: { marginTop: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 84, paddingHorizontal: 17, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 14 },
  date: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  summary: { marginTop: 5, fontSize: 15, lineHeight: 20, fontWeight: '500' },
  reuse: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
