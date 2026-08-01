import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { usePatioDetailController } from '@/lib/controllers/usePatioDetailController';
import { formatHHMM12 } from '@/lib/horario';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { Fonts, Radius, Spacing, useTheme, type Theme } from '@/lib/theme';

const HERO_HEIGHT = 300;
const OPEN_GREEN = '#1F9D55';
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const PAYMENT_ORDER = ['Efectivo', 'Tarjeta', 'Transferencia'];
const PAYMENT_SYMBOLS: Record<string, { symbol: SFSymbol; fallback: keyof typeof Ionicons.glyphMap; size: number }> = {
  Efectivo: { symbol: 'banknote', fallback: 'cash-outline', size: 18 },
  Tarjeta: { symbol: 'creditcard', fallback: 'card-outline', size: 17 },
  Transferencia: { symbol: 'arrow.left.arrow.right', fallback: 'swap-horizontal-outline', size: 15.5 },
};

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

function discoveryIsNew(value?: string): boolean {
  if (!value) return false;
  const openedAt = new Date(value).getTime();
  if (Number.isNaN(openedAt)) return false;
  const ageInDays = Math.floor((Date.now() - openedAt) / 86400000);
  return ageInDays >= 0 && ageInDays <= 120;
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
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 7, height: 7, borderRadius: 3.5 },
    statusText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
    hoursButton: { minHeight: 32, paddingHorizontal: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.surface },
    hoursButtonText: { fontSize: 11.5, fontWeight: '700', color: t.textSecondary },
    schedule: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: t.surface },
    scheduleRow: { minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scheduleDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    scheduleDay: { fontSize: 12.5, fontWeight: '600', color: t.text },
    scheduleHours: { fontSize: 12.5, color: t.textSecondary },
    title: { fontSize: 36, lineHeight: 38, fontWeight: '900', letterSpacing: -1, fontFamily: Fonts.brand, color: t.text, marginBottom: 6 },
    subtitle: { fontSize: 14, color: t.textSecondary, marginBottom: 16 },
    payments: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    paymentIconBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

    // ── Menú agrupado ──
    menuSoldWrap: { position: 'relative', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, borderRadius: 18, padding: 16, marginBottom: 16, backgroundColor: t.surface },
    agotadoBadge: { position: 'absolute', right: 14, bottom: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: t.text },
    agotadoBadgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: t.bg },
    mananaCard: { padding: 16, borderRadius: 18, backgroundColor: t.accentSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(242,97,47,0.2)', marginBottom: 16 },
    mananaHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    mananaEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: t.accent },
    mananaBody: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: t.text },
    group: { marginBottom: 22 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    groupTitle: { fontSize: 12.5, lineHeight: 17, fontWeight: '700', letterSpacing: 0.55, textTransform: 'uppercase', color: t.accent },
    groupItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 12 },
    groupItemName: { flex: 1, fontSize: 16, fontWeight: '600', color: t.text, letterSpacing: -0.18, lineHeight: 21 },
    groupItemDescription: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.03, color: t.textSecondary },
    groupItemPrice: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: t.text },
    groupDashed: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border, marginTop: 4 },
    reviewSection: { paddingTop: 28, marginBottom: 22 },
    reviewsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    reviewsTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    ratingOverview: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16, paddingVertical: 4 },
    ratingScore: { width: 84, minHeight: 88, alignItems: 'center', justifyContent: 'center' },
    ratingAverage: { fontSize: 34, lineHeight: 38, fontWeight: '900', fontFamily: Fonts.brand, color: t.text, letterSpacing: -1 },
    ratingStars: { flexDirection: 'row', gap: 1, marginTop: 3 },
    ratingAll: { marginTop: 5, fontSize: 11.5, fontWeight: '600', color: t.textSecondary },
    ratingBars: { flex: 1, gap: 2 },
    ratingBarRow: { minHeight: 17, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.62 },
    ratingBarRowActive: { opacity: 1 },
    ratingBarLabel: { width: 10, fontSize: 10.5, fontWeight: '600', color: t.textSecondary, textAlign: 'right' },
    ratingTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: t.border },
    ratingFill: { height: 4, borderRadius: 2, backgroundColor: t.accent },
    ratingCount: { width: 15, fontSize: 10.5, color: t.textMute, textAlign: 'right' },
    reviewCard: { padding: 16, borderRadius: 18, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    reviewCardGap: { marginTop: 10 },
    reviewAuthorRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
    reviewAuthor: { flex: 1, fontSize: 14, fontWeight: '700', color: t.text },
    reviewDate: { fontSize: 11.5, color: t.textMute },
    reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 10 },
    reviewReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    reviewReason: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100, backgroundColor: t.accentSoft },
    reviewReasonText: { fontSize: 11, fontWeight: '600', color: t.textSecondary },
    reviewNote: { fontSize: 14, lineHeight: 20, color: t.text },
    reviewEdit: { marginTop: 12, fontSize: 12, fontWeight: '700', color: t.accent },
    businessReply: { marginTop: 14, paddingTop: 12, paddingLeft: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, borderLeftWidth: 2, borderLeftColor: t.accent },
    businessReplyLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: t.accent, marginBottom: 5 },
    businessReplyText: { fontSize: 13.5, lineHeight: 19, color: t.textSecondary },
    reviewPrompt: { minHeight: 38, borderRadius: 19, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: t.surface },
    reviewPromptText: { fontSize: 13, fontWeight: '700', color: t.text },

    // ── Detalles + mapa ──
    section: { paddingTop: 6 },
    placeDescription: { maxWidth: 340, marginTop: -7, marginBottom: 18, fontSize: 14, lineHeight: 20, color: t.textSecondary },
    distinctions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -6, marginBottom: 18 },
    distinction: { minHeight: 30, paddingHorizontal: 11, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.accentSoft },
    distinctionText: { fontSize: 11.5, fontWeight: '700', color: t.accent },
    historyMeta: { minHeight: 44, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 9 },
    historyMetaText: { fontSize: 12.5, color: t.textMute },
    mapPanel: { height: 92, borderRadius: 18, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapMarker: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#111214', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.82)', alignItems: 'center', justifyContent: 'center', shadowColor: '#A8E7FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.58, shadowRadius: 8, elevation: 6 },

    // ── Rating (estrellas en card) ──
    starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    ratingDone: { fontSize: 13, fontWeight: '400', color: t.textSecondary, marginLeft: 4 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)' },
    ratingSheet: { backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 36, paddingHorizontal: 24 },
    sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: t.border, marginBottom: 20 },
    sheetTitle: { fontSize: 22, fontWeight: '900', fontFamily: Fonts.brand, color: t.text, marginBottom: 4 },
    sheetSub: { fontSize: 14, fontWeight: '400', color: t.textSecondary, marginBottom: 20 },
    sheetStars: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 },
    reasonsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    reasonPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    reasonPillActive: { backgroundColor: t.accentLight, borderColor: t.accent },
    reasonText: { fontSize: 13, fontWeight: '400', color: t.text },
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
  const [showSchedule, setShowSchedule] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const {
    cleanId,
    handleBack,
    handleComoLlegar,
    handleShare,
    handleStarPress,
    isSaved,
    loading,
    patio,
    patioId,
    proxTexto,
    rangoHoy,
    reviews,
    sections,
    soldOut,
    status,
    userRating,
    userReview,
  } = usePatioDetailController(id);
  const heroPhoto = useMemo(() => heroPhotoFor(patioId ?? cleanId ?? ''), [patioId, cleanId]);
  const ratingAverage = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length : 0,
    [reviews],
  );
  const ratingDistribution = useMemo(
    () => [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.stars === stars).length })),
    [reviews],
  );
  const visibleReviews = useMemo(
    () => ratingFilter ? reviews.filter((review) => review.stars === ratingFilter) : reviews,
    [ratingFilter, reviews],
  );
  const businessOpeningLabel = useMemo(() => {
    if (!patio?.businessOpenedAt) return null;
    const openedAt = new Date(patio.businessOpenedAt);
    if (Number.isNaN(openedAt.getTime())) return null;
    return `Abrió en ${openedAt.getFullYear()}`;
  }, [patio?.businessOpenedAt]);

  useEffect(() => {
    if (!status) {
      pulse.setValue(1);
      return;
    }
    pulse.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, status]);

  const GlassIcon = ({ name, size = 17, onPress, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; onPress: () => void; color?: string }) => (
    <TouchableOpacity
      style={s.glassIcon}
      onPress={onPress}
      activeOpacity={0.76}
      accessibilityRole="button">
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
            colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.48)']}
            locations={[0, 0.62, 1]}
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
              <GlassIcon
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={17}
                onPress={() => router.push({ pathname: '/guardar/[id]', params: { id: patio.id } })}
                color={isSaved ? theme.accent : theme.text}
              />
            </View>
          </View>
        </View>

        {/* Card traslapada */}
        <View style={s.card}>
          {status !== null && (
            <View style={s.statusRow}>
              <View style={s.statusLeft}>
                <Animated.View style={[s.statusDot, {
                  backgroundColor: status ? OPEN_GREEN : theme.textMute,
                  opacity: status ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) : 1,
                  transform: [{ scale: status ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) : 1 }],
                }]} />
                <Text style={[s.statusText, { color: status ? OPEN_GREEN : theme.textMute }]} allowFontScaling={true}>
                  {status ? 'Abierto' : 'Cerrado'}
                </Text>
              </View>
              {!!patio.payments.length && (
                <View style={s.payments} accessible accessibilityLabel={`Acepta ${patio.payments.join(', ')}`}>
                  {PAYMENT_ORDER.filter((payment) => patio.payments.includes(payment)).map((payment) => {
                    const icon = PAYMENT_SYMBOLS[payment];
                    return (
                      <View key={payment} style={s.paymentIconBox}>
                        <SymbolView
                          name={icon.symbol}
                          size={icon.size}
                          weight="regular"
                          tintColor={theme.textSecondary}
                          fallback={<Ionicons name={icon.fallback} size={icon.size} color={theme.textSecondary} />}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Ver horario semanal"
                accessibilityState={{ expanded: showSchedule }}
                style={s.hoursButton}
                onPress={() => setShowSchedule((value) => !value)}>
                <Text style={s.hoursButtonText}>{status ? rangoHoy : 'Horarios'}</Text>
                <Ionicons name={showSchedule ? 'chevron-up' : 'chevron-down'} size={13} color={theme.textMute} />
              </TouchableOpacity>
            </View>
          )}
          {showSchedule && !!patio.weeklyHours?.length && (
            <View style={s.schedule}>
              {patio.weeklyHours.map((day, index) => (
                <View key={day.dia} style={[s.scheduleRow, index > 0 && s.scheduleDivider]}>
                  <Text style={s.scheduleDay}>{DAYS[day.dia]}</Text>
                  <Text style={s.scheduleHours}>
                    {day.cerrado || !day.abre || !day.cierra ? 'Cerrado' : `${formatHHMM12(day.abre)}–${formatHHMM12(day.cierra)}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={s.title} allowFontScaling={true}>{patio.name}</Text>
          <Text style={s.subtitle} allowFontScaling={true}>{patio.category} · {patio.area}</Text>
          {!!patio.reason && <Text style={s.placeDescription} allowFontScaling={true}>{patio.reason}</Text>}
          {(patio.isNeighborhoodFavorite || discoveryIsNew(patio.businessOpenedAt)) && (
            <View style={s.distinctions}>
              {!!patio.isNeighborhoodFavorite && (
                <View style={s.distinction} accessible accessibilityLabel="Favorito del barrio">
                  <Ionicons name="leaf-outline" size={12} color={theme.accent} />
                  <Text style={s.distinctionText}>Favorito del barrio</Text>
                  <Ionicons name="leaf-outline" size={12} color={theme.accent} style={{ transform: [{ scaleX: -1 }] }} />
                </View>
              )}
              {discoveryIsNew(patio.businessOpenedAt) && (
                <View style={s.distinction} accessible accessibilityLabel="Nuevo por aquí">
                  <Ionicons name="sparkles-outline" size={12} color={theme.accent} />
                  <Text style={s.distinctionText}>Nuevo por aquí</Text>
                </View>
              )}
            </View>
          )}
          {/* Menú del día — agrupado por sección (atenuado si ya se acabó) */}
          <View style={soldOut && s.menuSoldWrap}>
            <View style={soldOut ? { opacity: 0.42 } : undefined}>
              {sections.map((section, si) => (
                <View key={section.section} style={s.group}>
                  {!['menu del dia', 'menu de hoy'].includes(
                    section.section.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(),
                  ) && (
                    <View style={s.groupHead}>
                      <Text style={s.groupTitle} allowFontScaling={true}>{section.section}</Text>
                    </View>
                  )}
                  {section.items.map((item) => (
                    <View key={`${section.section}-${item.name}`} style={s.groupItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.groupItemName} allowFontScaling={true}>{item.name}</Text>
                        {!!item.description && (
                          <Text style={s.groupItemDescription} allowFontScaling={true}>{item.description}</Text>
                        )}
                      </View>
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
            {patio.latitude > 0 && (
              <TouchableOpacity
                accessibilityLabel={`Abrir indicaciones para ${patio.name}`}
                accessibilityRole="button"
                style={s.mapPanel}
                onPress={handleComoLlegar}
                activeOpacity={0.86}>
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
                  <Marker
                    coordinate={{ latitude: patio.latitude, longitude: patio.longitude }}
                    tracksViewChanges={false}>
                    <View style={s.mapMarker}>
                      <Ionicons name="navigate" size={12} color="#FFFFFF" />
                    </View>
                  </Marker>
                </MapView>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.reviewSection}>
            <View style={s.reviewsSummary}>
              <View>
                <Text style={s.reviewsTitle}>Reseñas</Text>
              </View>
              <TouchableOpacity style={s.reviewPrompt} onPress={() => handleStarPress(userRating ?? 0)} activeOpacity={0.8}>
                <Ionicons name={userReview ? 'create-outline' : 'star-outline'} size={16} color={theme.accent} />
                <Text style={s.reviewPromptText}>{userReview ? 'Editar la tuya' : 'Reseñar'}</Text>
              </TouchableOpacity>
            </View>
            {!!reviews.length && (
              <View style={s.ratingOverview}>
                <TouchableOpacity
                  style={s.ratingScore}
                  onPress={() => setRatingFilter(null)}
                  accessibilityRole="button"
                  accessibilityLabel={`${ratingAverage.toFixed(1)} de 5, ${reviews.length} reseñas. Mostrar todas`}>
                  <Text style={s.ratingAverage}>{ratingAverage.toFixed(1)}</Text>
                  <View style={s.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name={star <= Math.round(ratingAverage) ? 'star' : 'star-outline'} size={9} color={theme.accent} />)}
                  </View>
                  <Text style={[s.ratingAll, ratingFilter === null && { color: theme.accent }]}>{reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</Text>
                </TouchableOpacity>
                <View style={s.ratingBars}>
                  {ratingDistribution.map(({ stars, count }) => (
                    <TouchableOpacity
                      key={stars}
                      style={[s.ratingBarRow, (ratingFilter === null || ratingFilter === stars) && s.ratingBarRowActive]}
                      onPress={() => setRatingFilter((current) => current === stars ? null : stars)}
                      disabled={!count}
                      accessibilityRole="button"
                      accessibilityLabel={`${stars} estrellas, ${count} reseñas`}>
                      <Text style={s.ratingBarLabel}>{stars}</Text>
                      <View style={s.ratingTrack}>
                        <View style={[s.ratingFill, { width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }]} />
                      </View>
                      <Text style={s.ratingCount}>{count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {visibleReviews.map((review, index) => (
              <TouchableOpacity
                key={`${review.userId}-${review.timestamp}`}
                style={[s.reviewCard, index > 0 && s.reviewCardGap]}
                onPress={review.isMine ? () => handleStarPress(review.stars) : undefined}
                activeOpacity={review.isMine ? 0.82 : 1}>
                <View style={s.reviewAuthorRow}>
                  <Text style={s.reviewAuthor}>{review.isMine ? 'Tu reseña' : review.author}</Text>
                  <Text style={s.reviewDate}>
                    {new Date(review.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={s.reviewStars}>
                  {Array.from({ length: 5 }, (_, star) => (
                    <Ionicons key={star} name={star < review.stars ? 'star' : 'star-outline'} size={15} color={theme.accent} />
                  ))}
                </View>
                {!!review.reasons?.length && (
                  <View style={s.reviewReasons}>
                    {review.reasons.map((reason) => <View key={reason} style={s.reviewReason}><Text style={s.reviewReasonText}>{reason}</Text></View>)}
                  </View>
                )}
                {!!review.note && <Text style={s.reviewNote}>{review.note}</Text>}
                {review.isMine && <Text style={s.reviewEdit}>Editar reseña</Text>}
                {!!review.businessReply && (
                  <View style={s.businessReply}>
                    <Text style={s.businessReplyLabel}>Respuesta del Patio</Text>
                    <Text style={s.businessReplyText}>{review.businessReply}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {!reviews.length && userReview && (
              <Text style={s.reviewNote}>Tu reseña será la primera experiencia compartida sobre este Patio.</Text>
            )}
          </View>

          {businessOpeningLabel && (
            <View style={s.historyMeta} accessible accessibilityLabel={businessOpeningLabel}>
              <Ionicons name="calendar-outline" size={14} color={theme.textMute} />
              <Text style={s.historyMetaText}>{businessOpeningLabel}</Text>
            </View>
          )}
        </View>
      </ScrollView>

    </View>
  );
}
