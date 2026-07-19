import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { usePatioDetailController } from '@/lib/controllers/usePatioDetailController';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { Fonts, Radius, Spacing, useTheme, type Theme } from '@/lib/theme';

const HERO_HEIGHT = 300;
const OPEN_GREEN = '#1F9D55';

// Fotos botánicas para el hero. Se elige una de forma determinística por id
// para que cada lugar conserve siempre la misma y la galería se vea variada.
const HERO_PHOTOS = [
  require('../../assets/hero/botanica-1.jpg'),
  require('../../assets/hero/botanica-2.jpg'),
  require('../../assets/hero/botanica-3.jpg'),
  require('../../assets/hero/botanica-4.jpg'),
  require('../../assets/hero/botanica-5.jpg'),
  require('../../assets/hero/botanica-6.jpg'),
  require('../../assets/hero/botanica-7.jpg'),
  require('../../assets/hero/botanica-8.jpg'),
];

function heroPhotoFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HERO_PHOTOS[h % HERO_PHOTOS.length];
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scrollContent: { paddingBottom: 120 },

    // ── Hero ──
    hero: { height: HERO_HEIGHT, backgroundColor: t.isDark ? '#1a0a05' : '#241008', overflow: 'hidden' },
    heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    heroImgMuted: { opacity: 0.55 },
    soldBanner: { position: 'absolute', alignSelf: 'center', top: HERO_HEIGHT * 0.5, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100, backgroundColor: t.accent, shadowColor: t.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6, zIndex: 15 },
    soldBannerText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: '#fff' },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    heroNav: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
    glassIcon: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },

    // ── Card traslapada ──
    card: { marginTop: -28, backgroundColor: t.bg, borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet, paddingHorizontal: 20, paddingTop: 22 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
    title: { fontSize: 36, lineHeight: 38, fontWeight: '900', letterSpacing: -1, fontFamily: Fonts.brand, color: t.text, marginBottom: 6 },
    subtitle: { fontSize: 14, color: t.textSecondary, marginBottom: 16 },

    // ── Meta row ──
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 18, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    metaItem: { flexDirection: 'column' },
    metaTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaPrimary: { fontSize: 14, fontWeight: '700', color: t.text, letterSpacing: -0.2 },
    metaSecondary: { fontSize: 11, color: t.textMute, marginTop: 1 },
    metaDivider: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: t.border },

    // ── Menú agrupado ──
    menuHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
    menuEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', color: t.textMute },
    menuPrice: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4, color: t.accent },
    menuPriceStruck: { color: t.text, textDecorationLine: 'line-through' },
    menuSoldWrap: { position: 'relative', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, borderRadius: 18, padding: 16, marginBottom: 16, backgroundColor: t.surface },
    agotadoBadge: { position: 'absolute', right: 14, bottom: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: t.text },
    agotadoBadgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: t.bg },
    mananaCard: { padding: 16, borderRadius: 18, backgroundColor: t.accentSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(242,97,47,0.2)', marginBottom: 16 },
    mananaHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    mananaEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: t.accent },
    mananaBody: { fontSize: 14, fontWeight: '300', lineHeight: 20, color: t.text },
    group: { marginBottom: 16 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: t.textMute },
    chooseTag: { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: t.accentSoft, color: t.accent, letterSpacing: 0.4, textTransform: 'uppercase', overflow: 'hidden' },
    groupItem: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 3 },
    groupItemName: { flex: 1, fontSize: 15, color: t.text, letterSpacing: -0.2, lineHeight: 21 },
    groupItemPrice: { fontSize: 15, fontWeight: '700', color: t.accent },
    groupDashed: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border, marginTop: 12 },

    // ── Detalles + mapa ──
    section: { paddingTop: 24 },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', color: t.textMute, marginBottom: 12 },
    mapPanel: { height: 160, borderRadius: Radius.card, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, marginBottom: 12 },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapPin: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.isDark ? 'rgba(245,245,240,0.92)' : 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.14, shadowRadius: 14, elevation: 4 },
    mapPinCore: { width: 20, height: 20, borderRadius: 10, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    mapPinDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.isDark ? 'rgba(245,245,240,0.92)' : 'rgba(255,255,255,0.92)' },
    panel: { borderRadius: Radius.card, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    row: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
    rowIcon: { width: 24, marginRight: 8, opacity: 0.48 },
    rowText: { flex: 1, fontSize: 14, lineHeight: 18, color: t.textSecondary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 52 },

    // ── CTA sticky ──
    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, backgroundColor: t.bg },
    ctaBtn: { height: 54, borderRadius: Radius.card, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { fontSize: 16, fontWeight: '700', color: t.bg, letterSpacing: -0.2 },
    ctaRow: { flexDirection: 'row', gap: 8 },
    ctaBtnFlex: { flex: 1 },
    ctaSquare: { width: 54, height: 54, borderRadius: Radius.card, backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,18,20,0.06)', alignItems: 'center', justifyContent: 'center' },

    // ── Rating (estrellas en card) ──
    starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    ratingDone: { fontSize: 13, fontWeight: '300', color: t.textSecondary, marginLeft: 4 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)' },
    ratingSheet: { backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 36, paddingHorizontal: 24 },
    sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: t.border, marginBottom: 20 },
    sheetTitle: { fontSize: 22, fontWeight: '900', fontFamily: Fonts.brand, color: t.text, marginBottom: 4 },
    sheetSub: { fontSize: 14, fontWeight: '300', color: t.textSecondary, marginBottom: 20 },
    sheetStars: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 },
    reasonsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    reasonPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    reasonPillActive: { backgroundColor: t.accentLight, borderColor: t.accent },
    reasonText: { fontSize: 13, fontWeight: '300', color: t.text },
    reasonTextActive: { color: t.accent, fontWeight: '900' },
    submitBtn: { minHeight: 52, borderRadius: 14, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' },
    submitText: { fontSize: 16, fontWeight: '900', color: t.surface },
  });
}

export default function PatioDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const {
    cleanId,
    handleAvisarManana,
    handleBack,
    handleComoLlegar,
    handleShare,
    handleStarPress,
    handleToggleSaved,
    hoy,
    isClosed,
    isSaved,
    loading,
    notifyOn,
    patio,
    patioId,
    priceLabel,
    proxTexto,
    rangoHoy,
    sections,
    soldOut,
    status,
    todayLabel,
    userRating,
  } = usePatioDetailController(id);
  const heroPhoto = useMemo(() => heroPhotoFor(patioId ?? cleanId ?? ''), [patioId, cleanId]);

  const GlassIcon = ({ name, size = 17, onPress, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; onPress: () => void; color?: string }) => (
    <TouchableOpacity style={s.glassIcon} onPress={onPress} activeOpacity={0.76}>
      <BlurView intensity={theme.isDark ? 24 : 40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.glass }]} />
      <Ionicons name={name} size={size} color={color ?? theme.text} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top + 8 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingHorizontal: 20 }}>
          <GlassIcon name="chevron-back" size={22} onPress={handleBack} />
        </View>
        <AgentSpinner color={theme.text} size={22} style={{ alignSelf: 'center', marginTop: 80 }} />
      </View>
    );
  }

  if (!patio) {
    return (
      <View style={[s.container, { paddingTop: insets.top + 8 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingHorizontal: 20 }}>
          <GlassIcon name="chevron-back" size={22} onPress={handleBack} />
          <Text style={[s.title, { marginTop: 24 }]}>No encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero con foto botánica real + degradado que la funde con la card */}
        <View style={s.hero}>
          <Image source={heroPhoto} style={[s.heroImg, soldOut && s.heroImgMuted]} resizeMode="cover" />
          <LinearGradient
            colors={theme.isDark
              ? ['rgba(10,11,13,0.10)', 'rgba(10,11,13,0.35)', theme.bg]
              : ['rgba(36,16,8,0.10)', 'rgba(36,16,8,0.45)', theme.bg]}
            locations={[0, 0.55, 1]}
            style={s.heroGradient}
          />
          {soldOut && (
            <View style={s.soldBanner}>
              <Ionicons name="time-outline" size={13} color="#fff" />
              <Text style={s.soldBannerText} allowFontScaling={true}>Se acabó por hoy</Text>
            </View>
          )}
          <View style={[s.heroNav, { top: insets.top + 8 }]}>
            <GlassIcon name="chevron-back" size={20} onPress={handleBack} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <GlassIcon name="share-outline" size={17} onPress={handleShare} />
              <GlassIcon name={isSaved ? 'heart' : 'heart-outline'} size={17} onPress={handleToggleSaved} color={isSaved ? theme.accent : theme.text} />
            </View>
          </View>
        </View>

        {/* Card traslapada */}
        <View style={s.card}>
          {status !== null && (
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: status ? OPEN_GREEN : theme.textMute }]} />
              <Text style={[s.statusText, { color: status ? OPEN_GREEN : theme.textMute }]} allowFontScaling={true}>
                {status ? `Abierto · ${rangoHoy}` : (proxTexto ? `Cerrado · ${proxTexto}` : 'Cerrado por hoy')}
              </Text>
            </View>
          )}
          <Text style={s.title} allowFontScaling={true}>{patio.name}</Text>
          <Text style={s.subtitle} allowFontScaling={true}>{patio.category} · {patio.area}</Text>

          {/* Solo señales reales: calificación propia y horario configurado. */}
          <View style={s.metaRow}>
            <TouchableOpacity style={s.metaItem} onPress={() => handleStarPress(userRating ?? 0)} activeOpacity={0.7}>
              <View style={s.metaTop}>
                <Ionicons name={userRating ? 'star' : 'star-outline'} size={13} color={theme.accent} />
                <Text style={s.metaPrimary}>{userRating ?? 'Calificar'}</Text>
              </View>
              <Text style={s.metaSecondary}>{userRating !== null ? 'Tu calificación' : 'Comparte tu experiencia'}</Text>
            </TouchableOpacity>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <View style={s.metaTop}>
                <Ionicons name="time-outline" size={13} color={theme.textMute} />
                <Text style={s.metaPrimary}>{hoy && hoy.cerrado ? 'Cerrado' : rangoHoy}</Text>
              </View>
              <Text style={s.metaSecondary}>{todayLabel}</Text>
            </View>
          </View>

          {/* Menú del día — agrupado por sección (atenuado si ya se acabó) */}
          <View style={soldOut && s.menuSoldWrap}>
            <View style={soldOut ? { opacity: 0.42 } : undefined}>
              <View style={s.menuHead}>
                <Text style={s.menuEyebrow} allowFontScaling={true}>{soldOut ? 'Lo que había hoy' : 'Menú del día · Hoy'}</Text>
                <Text style={[s.menuPrice, soldOut && s.menuPriceStruck]} allowFontScaling={true}>{priceLabel}</Text>
              </View>
              {sections.map((section, si) => (
                <View key={section.section} style={s.group}>
                  <View style={s.groupHead}>
                    <Text style={s.groupTitle} allowFontScaling={true}>{section.section}</Text>
                    {!soldOut && section.items.length > 1 && section.section.toLowerCase().includes('guisad') && (
                      <Text style={s.chooseTag} allowFontScaling={true}>Elige uno</Text>
                    )}
                  </View>
                  {section.items.map((item) => (
                    <View key={`${section.section}-${item.name}`} style={s.groupItem}>
                      <Text style={s.groupItemName} allowFontScaling={true}>{item.name}</Text>
                      {!!item.price && <Text style={s.groupItemPrice} allowFontScaling={true}>{item.price}</Text>}
                    </View>
                  ))}
                  {si < sections.length - 1 && <View style={s.groupDashed} />}
                </View>
              ))}
            </View>
            {soldOut && (
              <View style={s.agotadoBadge}>
                <Text style={s.agotadoBadgeText} allowFontScaling={true}>Agotado</Text>
              </View>
            )}
          </View>

          {soldOut && (
            <View style={s.mananaCard}>
              <View style={s.mananaHead}>
                <Ionicons name="time-outline" size={12} color={theme.accent} />
                <Text style={s.mananaEyebrow} allowFontScaling={true}>{proxTexto ? `${proxTexto}` : `Mañana abre a las ${patio.open.split(/[-–]/)[0]}`}</Text>
              </View>
              <Text style={s.mananaBody} allowFontScaling={true}>Vuelve mañana por el menú del día. Guárdalo y te avisamos cuando publiquen.</Text>
            </View>
          )}

          {/* Detalles + mapa */}
          <View style={s.section}>
            <Text style={s.sectionTitle} allowFontScaling={true}>Dónde está</Text>
            {patio.latitude > 0 && (
              <View style={s.mapPanel}>
                <MapView
                  customMapStyle={theme.isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
                  initialRegion={{ latitude: patio.latitude, longitude: patio.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
                  mapType="mutedStandard"
                  pitchEnabled={false}
                  pointerEvents="none"
                  rotateEnabled={false}
                  scrollEnabled={false}
                  showsBuildings={false}
                  showsCompass={false}
                  showsPointsOfInterest={false}
                  showsTraffic={false}
                  style={s.mapView}
                  userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
                  zoomEnabled={false}>
                  <Marker coordinate={{ latitude: patio.latitude, longitude: patio.longitude }} tracksViewChanges={false}>
                    <View style={s.mapPin}>
                      <View style={s.mapPinCore}><View style={s.mapPinDot} /></View>
                    </View>
                  </Marker>
                </MapView>
              </View>
            )}
            <View style={s.panel}>
              <View style={s.row}>
                <Ionicons name="location-outline" size={22} color={theme.text} style={s.rowIcon} />
                <Text style={s.rowText} allowFontScaling={true}>{patio.address}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <Ionicons name="card-outline" size={22} color={theme.text} style={s.rowIcon} />
                <Text style={s.rowText} allowFontScaling={true}>{patio.payments.join(' · ')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA sticky */}
      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <View style={{ backgroundColor: theme.bg }}>
          {soldOut ? (
            <View style={s.ctaRow}>
              <TouchableOpacity style={[s.ctaBtn, s.ctaBtnFlex]} onPress={handleAvisarManana} activeOpacity={0.86}>
                <Ionicons name={notifyOn ? 'notifications' : 'notifications-outline'} size={16} color={theme.bg} />
                <Text style={s.ctaText}>{notifyOn ? 'Te avisamos mañana' : 'Avísame mañana'}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel={`Cómo llegar a ${patio.name}`} style={s.ctaSquare} onPress={handleComoLlegar} activeOpacity={0.86}>
                <Ionicons name="location-outline" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity accessibilityLabel={`Cómo llegar a ${patio.name}`} style={s.ctaBtn} onPress={handleComoLlegar} activeOpacity={0.86}>
              <Ionicons name="navigate" size={16} color={theme.bg} />
              <Text style={s.ctaText}>{isClosed ? 'Ver cómo llegar' : 'Cómo llegar'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
}
