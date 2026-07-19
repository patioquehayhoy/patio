import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsingHeader, CollapsingTitle } from '@/components/collapsing-header';
import { todayDish } from '@/lib/controllers/patioListHelpers';
import { useViewedPatiosController } from '@/lib/controllers/useViewedPatiosController';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';

const OPEN_GREEN = '#1F9D55';

// Fotos botánicas, elegidas de forma determinística por id (igual que favoritos/ficha).
const HERO_PHOTOS = [
  require('../assets/hero/botanica-1.jpg'),
  require('../assets/hero/botanica-2.jpg'),
  require('../assets/hero/botanica-3.jpg'),
  require('../assets/hero/botanica-4.jpg'),
  require('../assets/hero/botanica-5.jpg'),
  require('../assets/hero/botanica-6.jpg'),
  require('../assets/hero/botanica-7.jpg'),
  require('../assets/hero/botanica-8.jpg'),
];

function photoFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HERO_PHOTOS[h % HERO_PHOTOS.length];
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 40 },

    // Header editorial
    header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, marginLeft: -8, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, marginBottom: 4, fontFamily: Fonts.brand },
    subtitle: { fontSize: 13, fontWeight: '300', color: t.textSecondary },

    // Lista
    list: { paddingHorizontal: 18, gap: 10, marginTop: 16 },
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

export default function VistosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { patios } = useViewedPatiosController();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CollapsingHeader
        scrollY={scrollY}
        c={theme}
        onBack={() => router.back()}
        title="Lo que viste"
      />

      <Animated.ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 48 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}>

        <CollapsingTitle
          scrollY={scrollY}
          c={theme}
          eyebrow={`${patios.length} ${patios.length === 1 ? 'lugar' : 'lugares'}`}
          title="Lo que viste"
          subtitle="Las cocinas que abriste, lo más reciente primero"
        />

        {patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="eye-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>Aún no has visto nada</Text>
            <Text style={s.emptyText} allowFontScaling={true}>Cuando abras una cocina en el mapa, aparece aquí para volver rápido.</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82}>
              <Text style={s.ctaText} allowFontScaling={true}>Ver qué hay hoy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {patios.map((patio) => {
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
      </Animated.ScrollView>
    </View>
  );
}
