import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { todayDish, useFavoritePatiosController } from '@/lib/controllers/useFavoritePatiosController';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';

const OPEN_GREEN = '#1F9D55';

// Fotos botánicas, elegidas de forma determinística por id (igual que la ficha).
const HERO_PHOTOS = [
  require('../assets/hero/botanica-1.png'),
  require('../assets/hero/botanica-2.png'),
  require('../assets/hero/botanica-3.png'),
  require('../assets/hero/botanica-4.png'),
  require('../assets/hero/botanica-5.png'),
  require('../assets/hero/botanica-6.png'),
  require('../assets/hero/botanica-7.png'),
  require('../assets/hero/botanica-8.png'),
];

function photoFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HERO_PHOTOS[h % HERO_PHOTOS.length];
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    // Header editorial
    header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, marginLeft: -8, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, marginBottom: 4, fontFamily: Fonts.brand },
    subtitle: { fontSize: 13, fontWeight: '300', color: t.textSecondary },

    // Filtros
    filters: { paddingHorizontal: 18, paddingBottom: 14, gap: 8, flexDirection: 'row' },
    filterChip: { paddingHorizontal: 14, minHeight: 34, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    filterChipActive: { backgroundColor: t.text, borderColor: t.text },
    filterChipText: { fontSize: 13, fontWeight: '300', color: t.text },
    filterChipTextActive: { color: t.surface, fontWeight: '700' },
    filterEmpty: { paddingHorizontal: 10, paddingVertical: 24, fontSize: 14, lineHeight: 20, fontWeight: '300', color: t.textSecondary, textAlign: 'center' },

    // Lista
    list: { paddingHorizontal: 18, gap: 10 },
    card: { flexDirection: 'row', gap: 12, backgroundColor: t.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, padding: 12 },
    thumb: { width: 78, height: 78, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111214' },
    thumbImg: { width: '100%', height: '100%' },
    body: { flex: 1, minWidth: 0, justifyContent: 'center' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    name: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, color: t.text, lineHeight: 21, marginBottom: 4 },
    today: { fontSize: 13, fontWeight: '300', color: t.text, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    metaArea: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
    metaAreaText: { fontSize: 12, fontWeight: '300', color: t.textSecondary, flexShrink: 1 },
    price: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, color: t.accent },

    // Empty
    empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: t.text, textAlign: 'center', fontFamily: Fonts.brand },
    emptyText: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '300', color: t.textSecondary, textAlign: 'center' },
    cta: { marginTop: 26, height: 54, paddingHorizontal: 24, borderRadius: Radius.card, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 16, fontWeight: '700', color: t.surface },
  });
}

export default function FavoritosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();
  const { patios, withMenu } = useFavoritePatiosController();

  // Filtros: pensados para cuando los guardados crecen (~70 items). 'hoy'
  // filtra por menú publicado; el resto son las categorías reales de lo
  // guardado — se construyen solas, sin taxonomía inventada.
  const [filter, setFilter] = useState<'all' | 'hoy' | string>('all');
  const categories = useMemo(
    () => [...new Set(patios.map((patio) => patio.category).filter(Boolean))].sort(),
    [patios]
  );
  const filtered = useMemo(() => {
    if (filter === 'all') return patios;
    if (filter === 'hoy') return patios.filter((patio) => todayDish(patio) !== null);
    return patios.filter((patio) => patio.category === filter);
  }, [patios, filter]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar. */}
        <View style={s.header}>
          <Text style={s.eyebrow} allowFontScaling={true}>
            {patios.length} {patios.length === 1 ? 'guardado' : 'guardados'}
          </Text>
          <Text style={s.title} allowFontScaling={true}>Tus guardados</Text>
          <Text style={s.subtitle} allowFontScaling={true}>
            {patios.length === 0
              ? 'Tus lugares de confianza, a un toque'
              : `${withMenu} con menú hoy`}
          </Text>
        </View>

        {patios.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filters}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'hoy', label: 'Con menú hoy' },
              ...categories.map((cat) => ({ key: cat, label: cat })),
            ].map(({ key, label }) => {
              const active = filter === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setFilter(active ? 'all' : key)}
                  activeOpacity={0.78}
                  style={[s.filterChip, active && s.filterChipActive]}>
                  <Text style={[s.filterChipText, active && s.filterChipTextActive]} allowFontScaling={true}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="heart-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>Guarda tus lugares de confianza</Text>
            <Text style={s.emptyText} allowFontScaling={true}>Cuando encuentres una cocina que te late, guárdala con ♥ para volver rápido.</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82}>
              <Text style={s.ctaText} allowFontScaling={true}>Buscar algo rico</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.length === 0 && (
              <Text style={s.filterEmpty} allowFontScaling={true}>Ninguno de tus guardados entra en ese filtro hoy.</Text>
            )}
            {filtered.map((patio) => {
              const today = todayDish(patio);
              const hasMenu = today !== null;
              return (
                <TouchableOpacity
                  key={patio.id}
                  style={[s.card, !hasMenu && { opacity: 0.62 }]}
                  onPress={() => router.push(`/patio/${patio.id}`)}
                  activeOpacity={0.82}>
                  <View style={s.thumb}>
                    <Image source={photoFor(patio.id)} style={s.thumbImg} resizeMode="cover" />
                  </View>
                  <View style={s.body}>
                    <View style={s.statusRow}>
                      <View style={[s.dot, { backgroundColor: hasMenu ? OPEN_GREEN : theme.textMute }]} />
                      <Text style={[s.statusText, { color: hasMenu ? OPEN_GREEN : theme.textMute }]} allowFontScaling={true}>
                        {hasMenu ? 'Hoy hay menú' : 'Sin menú hoy'}
                      </Text>
                    </View>
                    <Text style={s.name} numberOfLines={1} allowFontScaling={true}>{patio.name}</Text>
                    {today ? (
                      <Text style={s.today} numberOfLines={1} allowFontScaling={true}>{today}</Text>
                    ) : null}
                    <View style={s.metaRow}>
                      <View style={s.metaArea}>
                        <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                        <Text style={s.metaAreaText} numberOfLines={1} allowFontScaling={true}>{patio.area}</Text>
                      </View>
                      {hasMenu ? <Text style={s.price} allowFontScaling={true}>{patio.price}</Text> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
