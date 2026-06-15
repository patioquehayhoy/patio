import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { fetchFonditaById, getPatioById, type Patio, type PatioMenuSection } from '@/lib/patios';
import { fetchMenuForFondita } from '@/lib/menu';
import { getPatioRating, savePatioRating } from '@/lib/ratings';
import { Fonts, Radius, Spacing, useTheme, type Theme } from '@/lib/theme';

const HERO_HEIGHT = 300;
const OPEN_GREEN = '#1F9D55';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scrollContent: { paddingBottom: 120 },

    // ── Hero ──
    hero: { height: HERO_HEIGHT, backgroundColor: t.isDark ? '#1a0a05' : '#241008', overflow: 'hidden' },
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
    group: { marginBottom: 16 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: t.textMute },
    chooseTag: { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: t.accentSoft, color: t.accent, letterSpacing: 0.4, textTransform: 'uppercase', overflow: 'hidden' },
    groupItem: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 3 },
    groupItemName: { flex: 1, fontSize: 15, color: t.text, letterSpacing: -0.2, lineHeight: 21 },
    groupItemPrice: { fontSize: 15, fontWeight: '700', color: t.accent },
    groupDashed: { borderBottomWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed', borderBottomColor: t.border, marginTop: 12 },

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
    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14 },
    ctaFade: { position: 'absolute', left: 0, right: 0, top: -24, height: 24 },
    ctaBtn: { height: 54, borderRadius: Radius.card, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { fontSize: 16, fontWeight: '700', color: t.bg, letterSpacing: -0.2 },

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

function isPatioOpen(open: string): boolean | null {
  const m = open.match(/(\d+)(am|pm)?[-–](\d+)(am|pm)/i);
  if (!m) return null;
  const toH = (h: string, period: string) => {
    let n = parseInt(h, 10);
    if (period?.toLowerCase() === 'pm' && n !== 12) n += 12;
    if (period?.toLowerCase() === 'am' && n === 12) n = 0;
    return n;
  };
  const now = new Date();
  const cdmx = now.getUTCHours() - 5 + (now.getUTCMinutes() / 60);
  const open_ = toH(m[1], m[2] ?? m[4]);
  const close_ = toH(m[3], m[4]);
  return cdmx >= open_ && cdmx < close_;
}

export default function PatioDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [patio, setPatio] = useState<Patio | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveMenu, setLiveMenu] = useState<PatioMenuSection[] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [pendingStars, setPendingStars] = useState(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    const cleanId = Array.isArray(id) ? id[0] : id;
    if (!cleanId) { setLoading(false); return; }
    const mock = getPatioById(cleanId);
    if (mock) { setPatio(mock); setLoading(false); return; }
    fetchFonditaById(cleanId).then((found) => { setPatio(found); setLoading(false); });
  }, [id]);

  const patioId = patio?.id;
  useEffect(() => {
    if (!patioId) return;
    getFavoritePatioIds().then((ids) => setIsSaved(ids.includes(patioId)));
    getPatioRating(patioId).then((r) => { if (r) setUserRating(r.stars); });
    fetchMenuForFondita(patioId).then((sections) => { if (sections.length > 0) setLiveMenu(sections); });
  }, [patioId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleComoLlegar = () => {
    if (!patio) return;
    const { latitude, longitude } = patio;
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleToggleSaved = async () => {
    if (!patio) return;
    const next = await toggleFavoritePatio(patio.id);
    setIsSaved(next.includes(patio.id));
  };

  const handleShare = () => {
    if (!patio) return;
    const mapsUrl = `https://maps.apple.com/?q=${patio.latitude},${patio.longitude}`;
    Share.share({
      message: `${patio.name}\n${patio.category} · ${patio.area}\n${patio.open}\n\n📍 ${patio.address}\n${mapsUrl}`,
    });
  };

  const handleStarPress = (n: number) => {
    if (!patio) return;
    setPendingStars(n);
    setSelectedReasons([]);
    if (n === 5) {
      savePatioRating(patio.id, 5);
      setUserRating(5);
    } else {
      setShowRatingSheet(true);
    }
  };

  const toggleReason = (r: string) => {
    setSelectedReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const submitRating = async () => {
    if (!patio) return;
    await savePatioRating(patio.id, pendingStars, selectedReasons);
    setUserRating(pendingStars);
    setShowRatingSheet(false);
  };

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

  const status = isPatioOpen(patio.open);
  const sections = liveMenu ?? patio.menu;
  const priceLabel = patio.price === '$' ? 'Precio pendiente' : patio.price;

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero con degradado (placeholder para foto botánica futura) */}
        <View style={s.hero}>
          <LinearGradient
            colors={theme.isDark
              ? ['rgba(242,97,47,0.30)', 'rgba(26,10,5,0.4)', theme.bg]
              : ['rgba(242,97,47,0.35)', 'rgba(36,16,8,0.55)', theme.bg]}
            locations={[0, 0.55, 1]}
            style={s.heroGradient}
          />
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
                {status ? `Abierto · ${patio.open}` : 'Cerrado ahora'}
              </Text>
            </View>
          )}
          <Text style={s.title} allowFontScaling={true}>{patio.name}</Text>
          <Text style={s.subtitle} allowFontScaling={true}>{patio.category} · {patio.area}</Text>

          {/* Meta row */}
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <View style={s.metaTop}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => handleStarPress(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}>
                    <Ionicons name={userRating !== null && n <= userRating ? 'star' : 'star-outline'} size={15} color={theme.accent} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.metaSecondary}>{userRating !== null ? 'Tu calificación' : 'Califica'}</Text>
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <View style={s.metaTop}>
                <Ionicons name="time-outline" size={13} color={theme.textMute} />
                <Text style={s.metaPrimary}>{patio.open}</Text>
              </View>
              <Text style={s.metaSecondary}>Horario</Text>
            </View>
          </View>

          {/* Menú del día — agrupado por sección */}
          <View style={s.menuHead}>
            <Text style={s.menuEyebrow} allowFontScaling={true}>Menú del día · Hoy</Text>
            <Text style={s.menuPrice} allowFontScaling={true}>{priceLabel}</Text>
          </View>
          {sections.map((section, si) => (
            <View key={section.section} style={s.group}>
              <View style={s.groupHead}>
                <Text style={s.groupTitle} allowFontScaling={true}>{section.section}</Text>
                {section.items.length > 1 && section.section.toLowerCase().includes('guisad') && (
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
        <LinearGradient colors={['rgba(248,248,245,0)', theme.bg]} style={s.ctaFade} pointerEvents="none" />
        <View style={{ backgroundColor: theme.bg }}>
          <TouchableOpacity style={s.ctaBtn} onPress={handleComoLlegar} activeOpacity={0.86}>
            <Ionicons name="navigate" size={16} color={theme.bg} />
            <Text style={s.ctaText}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showRatingSheet} transparent animationType="slide" onRequestClose={() => setShowRatingSheet(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => setShowRatingSheet(false)}>
            <View style={s.overlay} />
          </TouchableWithoutFeedback>
          <View style={[s.ratingSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>¿Qué pasó?</Text>
            <Text style={s.sheetSub}>Ayúdanos a mejorar — elige lo que no estuvo bien.</Text>
            <View style={s.sheetStars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setPendingStars(n)} activeOpacity={0.7}>
                  <Ionicons
                    name={n <= pendingStars ? 'star' : 'star-outline'}
                    size={28}
                    color={theme.accent}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.reasonsWrap}>
              {['Horario incorrecto', 'Ubicación confusa', 'Menú no disponible', 'Precio distinto', 'Atención', 'Estaba cerrado', 'Otro'].map((r) => {
                const active = selectedReasons.includes(r);
                return (
                  <TouchableOpacity key={r} style={[s.reasonPill, active && s.reasonPillActive]} onPress={() => toggleReason(r)} activeOpacity={0.76}>
                    <Text style={[s.reasonText, active && s.reasonTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={submitRating} activeOpacity={0.86}>
              <Text style={s.submitText}>Enviar calificación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
