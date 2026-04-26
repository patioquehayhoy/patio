import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFavoritePatioIds } from '@/lib/favorites';
import { MOCK_PATIOS } from '@/lib/patios';
import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 24, paddingBottom: 34 },
    top: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: t.text },
    spacer: { width: 44 },
    list: { paddingTop: 22 },
    row: { minHeight: 86, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    badge: { width: 42, height: 42, borderRadius: 14, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1 },
    name: { fontSize: 18, lineHeight: 23, fontWeight: '900', color: t.text },
    meta: { marginTop: 5, fontSize: 13, lineHeight: 18, color: t.textSecondary },
    price: { fontSize: 14, fontWeight: '900', color: t.text },
    empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
    emptyIcon: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 21, lineHeight: 27, fontWeight: '900', color: t.text, textAlign: 'center' },
    emptyText: { marginTop: 10, fontSize: 15, lineHeight: 21, color: t.textSecondary, textAlign: 'center' },
    cta: { marginTop: 26, minHeight: 54, paddingHorizontal: 24, borderRadius: 27, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 15, fontWeight: '900', color: t.surface },
  });
}

export default function FavoritosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getFavoritePatioIds().then((ids) => {
        if (mounted) setFavoriteIds(ids);
      });

      return () => { mounted = false; };
    }, [])
  );

  const patios = MOCK_PATIOS.filter((patio) => favoriteIds.includes(patio.id));

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.title} allowFontScaling={true}>Favoritos</Text>
          <View style={s.spacer} />
        </View>

        {patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="star-outline" size={34} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>Guarda tus lugares de confianza</Text>
            <Text style={s.emptyText} allowFontScaling={true}>Toca la estrella en una ficha para volver rápido cuando ya sepas qué lugar te late.</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82}>
              <Text style={s.ctaText} allowFontScaling={true}>Ver mapa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {patios.map((patio) => (
              <TouchableOpacity key={patio.id} style={s.row} onPress={() => router.push(`/patio/${patio.id}`)} activeOpacity={0.78}>
                <View style={s.badge}>
                  <Ionicons name="star" size={20} color={theme.accent} />
                </View>
                <View style={s.rowBody}>
                  <Text style={s.name} allowFontScaling={true}>{patio.name}</Text>
                  <Text style={s.meta} allowFontScaling={true}>{patio.category} · {patio.open}</Text>
                </View>
                <Text style={s.price} allowFontScaling={true}>{patio.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
