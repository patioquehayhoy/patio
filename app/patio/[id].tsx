import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { getPatioById } from '@/lib/patios';
import { getPatioRating, savePatioRating } from '@/lib/ratings';
import { Fonts, useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 34 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 20 },
    iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    hero: { paddingBottom: 16 },
    eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.textSecondary, marginBottom: 8 },
    title: { fontSize: 32, lineHeight: 36, fontWeight: '900', fontFamily: Fonts.brand, color: t.text, letterSpacing: 0 },
    meta: { marginTop: 8, fontSize: 15, lineHeight: 21, color: t.textSecondary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
    ratingText: { fontSize: 15, fontWeight: '900', color: t.text },
    mapPanel: { height: 176, borderRadius: 26, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, marginBottom: 20 },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapPin: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.isDark ? 'rgba(245,245,240,0.92)' : 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.14, shadowRadius: 14, elevation: 4 },
    mapPinCore: { width: 20, height: 20, borderRadius: 10, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    mapPinDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.isDark ? 'rgba(245,245,240,0.92)' : 'rgba(255,255,255,0.92)' },
    mapPill: { position: 'absolute', left: 14, right: 14, bottom: 14, minHeight: 52, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
    mapPillText: { flex: 1, fontSize: 13, fontWeight: '900', color: t.text },
    mapPillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)' },
    mapPillBtnText: { fontSize: 12, fontWeight: '900', color: t.text },
    panel: { borderRadius: 22, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    menuPanel: { borderRadius: 26, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.16 : 0.06, shadowRadius: 24, elevation: 3 },
    menuHeader: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    menuHeaderTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.text },
    menuHeaderMeta: { fontSize: 14, fontWeight: '900', color: t.textSecondary },
    menuSectionHeader: { minHeight: 44, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(248,248,245,0.68)' },
    menuSectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.2, color: t.textSecondary },
    menuSectionPrice: { fontSize: 13, fontWeight: '900', color: t.textSecondary },
    row: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
    rowIcon: { width: 24, marginRight: 8, opacity: 0.48 },
    rowText: { flex: 1, fontSize: 13, lineHeight: 18, color: t.textSecondary },
    rowValue: { fontSize: 16, fontWeight: '900', color: t.text },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 52 },
    menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 44 },
    section: { paddingTop: 18 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.text, marginBottom: 12 },
    menuItem: { minHeight: 52, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
    bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent, marginRight: 12 },
    menuText: { flex: 1, fontSize: 16, fontWeight: '900', color: t.text },
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
  const patio = getPatioById(id);
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [pendingStars, setPendingStars] = useState(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const patioId = patio?.id;

  useEffect(() => {
    if (!patioId) return;
    getFavoritePatioIds().then((ids) => setIsSaved(ids.includes(patioId)));
    getPatioRating(patioId).then((r) => { if (r) setUserRating(r.stars); });
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

  if (!patio) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.scrollContent}>
          <View style={s.top}>
            <TouchableOpacity style={s.iconButton} onPress={handleBack} activeOpacity={0.76}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={s.title}>No encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <TouchableOpacity style={s.iconButton} onPress={handleBack} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={s.iconButton} onPress={handleShare} activeOpacity={0.76}>
              <Ionicons name="share-outline" size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconButton} onPress={handleToggleSaved} activeOpacity={0.76}>
              <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={22} color={isSaved ? theme.accent : theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.hero}>
          <Text style={s.eyebrow} allowFontScaling={true}>PATIO PÚBLICO</Text>
          <Text style={s.title} allowFontScaling={true}>{patio.name}</Text>
          <Text style={s.meta} allowFontScaling={true}>
            {patio.category} · {patio.area} · {patio.open}
          </Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => handleStarPress(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Ionicons
                  name={userRating !== null && n <= userRating ? 'star' : 'star-outline'}
                  size={22}
                  color={theme.accent}
                />
              </TouchableOpacity>
            ))}
            {userRating !== null && (
              <Text style={s.ratingDone}>Tu calificación</Text>
            )}
          </View>
        </View>

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
                <View style={s.mapPinCore}>
                  <View style={s.mapPinDot} />
                </View>
              </View>
            </Marker>
          </MapView>
          <View style={s.mapPill}>
            <BlurView intensity={theme.isDark ? 10 : 14} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <Text style={s.mapPillText} numberOfLines={1} allowFontScaling={true}>{patio.address}</Text>
            <TouchableOpacity style={s.mapPillBtn} onPress={handleComoLlegar} activeOpacity={0.76}>
              <Ionicons name="navigate-outline" size={13} color={theme.text} />
              <Text style={s.mapPillBtnText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.menuPanel}>
          <View style={s.menuHeader}>
            <Text style={s.menuHeaderTitle} allowFontScaling={true}>MENÚ DE HOY</Text>
            <Text style={s.menuHeaderMeta} allowFontScaling={true}>{patio.price === '$' ? 'Precio pendiente' : patio.price}</Text>
          </View>
          <View style={s.divider} />
          {patio.menu.map((section, sectionIndex) => (
            <View key={section.section}>
              <View style={s.menuSectionHeader}>
                <Text style={s.menuSectionTitle} allowFontScaling={true}>{section.section}</Text>
                {!!section.price && <Text style={s.menuSectionPrice} allowFontScaling={true}>{section.price}</Text>}
              </View>
              {section.items.map((item, index) => (
                <View key={`${section.section}-${item.name}`}>
                  <View style={s.menuItem}>
                    <View style={s.bullet} />
                    <Text style={s.menuText} allowFontScaling={true}>{item.name}</Text>
                  </View>
                  {index < section.items.length - 1 && <View style={s.menuDivider} />}
                </View>
              ))}
              {sectionIndex < patio.menu.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle} allowFontScaling={true}>DETALLES</Text>
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
      </ScrollView>

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
