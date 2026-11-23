import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, LayoutAnimation, Pressable, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions, type ScrollView } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, type ActionSheetOption } from '@/components/action-sheet';
import { SectionBar } from '@/components/section-bar';
import { GlassIconButton } from '@/components/glass-button';
import { recordPatioView } from '@/lib/patio-views';
import { AgentSpinner } from '@/components/agent-spinner';
import { PAYMENT_ORDER, PaymentIcon } from '@/components/payment-icon';
import { ANDROID_ICONS, TintIcon } from '@/components/tint-icon';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { ContentSafetyMenu } from '@/components/content-safety-menu';
import { SaveToListSheet } from '@/components/save-to-list-sheet';
import { patioCardPrice } from '@/lib/patio-card-info';
import { usePatioDetailController } from '@/lib/controllers/usePatioDetailController';
import { getLikedDishNames, toggleDishLike } from '@/lib/dish-likes';
import { canonicalDishName } from '@/lib/menu-store';
import { dishKey, dishKeysOf } from '@/lib/dish-identity';
import { getLikedReviewIds, getReviewLikeCounts, toggleReviewLike } from '@/lib/review-likes';
import { CommentSignInRequiredError, commentTimeLabel, deleteReviewComment, getReviewComments, isRealReviewId, postReviewComment, setCommentLike } from '@/lib/review-comments';
import { reportContent, writeErrorMessage, type ReportReason } from '@/lib/content-safety';
import { businessStatsLabel, getBusinessStats, getDishLikeCounts, type BusinessStats } from '@/lib/business-stats';
import { diasLabel, isToday } from '@/lib/puntos';
import { atHour } from '@/lib/publish-timing';
import { getPatioNotificationModes, getRemoteNotificationPreferences, PATIO_NOTIFY_HINTS, PATIO_NOTIFY_ICONS, PATIO_NOTIFY_LABELS, setPatioNotificationMode, type PatioNotifyMode } from '@/lib/community-notifications';
import { floatingSurfaceShadow, sheetSurfaceTint } from '@/lib/surface-styles';
import { opticalIndent } from '@/lib/optical';
import { supabase } from '@/lib/supabase';
import { getPatioHighlights, getProStatus, setFeaturedDish, type PatioHighlights } from '@/lib/business-pro';
import { axisHour, getPlaceBusyness, liveLabel, peakLabel, type Busyness } from '@/lib/busyness';
import { formatHHMM12 } from '@/lib/horario';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { Fonts, Radius, useTheme, type Theme, Type } from '@/lib/theme';
import { recordRecentPatio } from '@/lib/recent-patios';
import { noWidow } from '@/lib/typography';
import { menuPricesAccessibilityLabel } from '@/lib/menu-prices';
import { sectionDisplayName } from '@/lib/section-names';
import { DishPeek, type DishPeekItem } from '@/components/dish-peek';
import { DishGallery, type DishGalleryLike } from '@/components/dish-gallery';
import { DishPhotoFix } from '@/components/dish-photo-fix';
import { ReviewPhotos } from '@/components/review-photo';
import { createStore, useStore, type Store } from '@/lib/tiny-store';
import { loadMyPublicName, peekMyPublicName } from '@/lib/my-public-name';
import { orderDishPhotos, type DishPhoto } from '@/lib/dish-photos-order';
import { removeMyReviewPhoto, updateMyReviewPhoto } from '@/lib/ratings';
import { isCartaName } from '@/lib/menu-carta';
import { useKnownLocation } from '@/lib/use-known-location';
import { patioDistance } from '@/lib/patio-sort';
import { formatDistance } from '@/lib/geo';
import { bottomTabClearance } from '@/lib/layout-metrics';

type ReviewThreadReply = {
  id: string;
  author: string;
  body: string;
  likes: number;
  mine?: boolean;
  patio?: boolean;
  parentId?: string;
  timeLabel?: string;
  /** Guardado en Supabase (no demo ni respuesta oficial). */
  real?: boolean;
  userId?: string;
};

// Solo las cuentas reales tienen perfil que abrir (no las de demostración).
const isAccountId = (id?: string) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
// Tocar a una persona abre su perfil. En desarrollo, la gente de prueba
// también abre un perfil de prueba, para revisar el recorrido completo.
const canOpenProfile = (id?: string) => isAccountId(id) || (__DEV__ && !!id?.startsWith('demo-'));
const openProfile = (id: string, name?: string) => router.push({ pathname: '/foodie/[id]', params: name ? { id, name } : { id } });

const SYNTHETIC_THREAD_NAMES = ['Mariana L.', 'Diego M.', 'Sofía R.', 'Carlos N.', 'Pilar N.', 'Jorge A.'];
const SYNTHETIC_THREAD_COMMENTS = {
  positive: [
    'También nos gustó mucho; las porciones estuvieron muy bien.',
    '¿Ese platillo está disponible todos los días?',
    'Fuimos el fin de semana y mantuvieron la misma calidad.',
    'Lo guardé para regresar con mi familia.',
  ],
  critical: [
    'Nos pasó algo parecido con el tiempo de espera.',
    'Cuando fuimos ya habían corregido ese detalle.',
    'Ojalá actualicen el menú antes de abrir.',
    'La última visita estuvo mejor que la anterior.',
  ],
};

function syntheticThreadFor(userId: string, patioName: string, stars: number): ReviewThreadReply[] {
  const hash = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const count = 2 + (hash % 4);
  const comments = stars >= 4 ? SYNTHETIC_THREAD_COMMENTS.positive : SYNTHETIC_THREAD_COMMENTS.critical;
  const thread: ReviewThreadReply[] = [];
  for (let index = 0; index < count; index += 1) {
    const patioReply = index === 1 && hash % 3 !== 1;
    thread.push({
      id: `${userId}-generated-${index}`,
      author: patioReply ? patioName : SYNTHETIC_THREAD_NAMES[(hash + index) % SYNTHETIC_THREAD_NAMES.length],
      body: patioReply
        ? (stars >= 4 ? 'Gracias por compartirlo. Confirmamos disponibilidad cada mañana en el menú.' : 'Gracias por avisarnos. Ya revisamos este punto con el equipo y estamos dando seguimiento.')
        : comments[(hash + index) % comments.length],
      likes: (hash + index * 5) % 17,
      patio: patioReply,
      timeLabel: index === 0 ? '35 min' : `${index + 1} h`,
    });
  }
  return thread;
}

const HERO_HEIGHT = 320;
const TITLE_STEPS = [Type.screen, Type.title, Type.section] as const;
const PULL_TO_DISMISS_THRESHOLD = 93;
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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

type PeekState = { item: DishPeekItem; sticky: boolean; touchY?: number } | null;

// El vistazo y las fotos abiertas viven en su propio estado (lib/tiny-store):
// abrirlos repinta solo esto, nunca la ficha entera.
function PeekLayer({ store }: { store: Store<PeekState> }) {
  const peek = useStore(store, (value) => value);
  return <DishPeek item={peek?.item ?? null} sticky={!!peek?.sticky} touchY={peek?.touchY} onClose={() => store.set(null)} />;
}

function DishPhotosSlot({ store, dishKey, render }: { store: Store<string | null>; dishKey: string; render: () => React.ReactNode }) {
  const open = useStore(store, (value) => value === dishKey);
  return open ? <View style={{ marginBottom: 8 }}>{render()}</View> : null;
}

function heroPhotoFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HERO_PHOTOS[h % HERO_PHOTOS.length];
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    heroBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, width: '100%' },
    scrollContent: { paddingBottom: 120 },
    // ── Hero ──
    hero: { height: HERO_HEIGHT, backgroundColor: 'transparent', overflow: 'hidden' },
    heroImgMuted: { opacity: 0.55 },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    heroNav: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
    glassIcon: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
    // ── Card traslapada ──
    card: { marginTop: -28, backgroundColor: t.bg, borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet, paddingHorizontal: 20, paddingTop: 24 },
    schedule: { marginBottom: 16, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: t.surface },
    scheduleRow: { minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scheduleDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    scheduleDay: { fontSize: 13, fontWeight: '700', color: t.text },
    scheduleHours: { fontSize: 13, color: t.textSecondary },
    heroIdentity: { position: 'absolute', left: 20, right: 20, bottom: 44 },
    // A 4 del nombre: la cápsula nunca toca los rasgos descendentes del nombre.
    followersLink: { flexShrink: 1 },
    // Entre grupos 16 (identidad → seguidores y Seguir); dentro del grupo 2.
    heroMeta: { height: 32, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    title: { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
    verifiedInline: { paddingLeft: 2 },
    heroBio: { marginTop: 2 },
    heroFacts: { marginTop: 8, fontSize: 14, lineHeight: 19, fontWeight: '400', color: 'rgba(255,255,255,0.86)', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
    heroFactsUnderName: { marginTop: 4 },
    addressRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    placesList: { marginTop: 16 },
    placesLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: t.textSecondary, marginBottom: 4 },
    placeRow: { minHeight: 48, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
    placeRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep },
    placeName: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: t.text },
    placeToday: { fontSize: 13, fontWeight: '700', color: t.accent },
    address: { flex: 1, fontSize: 13, lineHeight: 17, fontWeight: '400', color: t.textSecondary },
    contactIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    // Sin descripción, el nombre ya trae su propio aire abajo (los rasgos
    // descendentes de Monument): 4 se ve igual de separado que 16 tras texto.
    heroMetaUnderName: { marginTop: 4 },
    heroBioText: { fontSize: 15, lineHeight: 20, fontWeight: '400', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
    followersText: { fontSize: 14, lineHeight: 19, fontWeight: '400', color: 'rgba(255,255,255,0.86)' },
    followersValue: { fontWeight: '700', color: '#FFFFFF' },
    followToast: { position: 'absolute', left: 16, right: 16, borderRadius: 28, borderCurve: 'continuous' },
    followToastInner: { minHeight: 56, paddingLeft: 16, paddingRight: 4, borderRadius: 28, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 8 },
    followToastText: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19, fontWeight: '400', color: t.text },
    followToastAction: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
    followToastActionText: { fontSize: 14, fontWeight: '700', color: t.accent },
    followToastClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    // Ancho fijo en sus dos estados, como el botón de Instagram: al seguir no
    // cambia de tamaño ni mueve el nombre.
    followPill: { width: 112, height: 32, borderRadius: 16, borderCurve: 'continuous', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    followPillGlass: { borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)' },
    followPillText: { fontSize: 15, fontWeight: '700' },
    notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 24, padding: 12, borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.accentSoft },
    noticeText: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontWeight: '400', color: t.text },
    featuredLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    featuredLabelText: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.accent },
    payments: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    paymentIconBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    // ── Menú agrupado ──
    mananaCard: { padding: 16, borderRadius: 18, borderCurve: 'continuous', backgroundColor: t.accentSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(242,97,47,0.2)', marginBottom: 24 },
    mananaHead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    mananaEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.accent },
    mananaBody: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: t.text },
    // Jerarquía del menú (2026-11-08): la sección manda (marca, 21), el
    // platillo después (16 Semibold) y la descripción al final (13, gris).
    // Entre secciones, el doble que entre platillos (24 contra 12).
    group: { marginBottom: 24 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    groupTitle: { ...Type.section, color: t.text },
    groupPrice: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: t.text, fontVariant: ['tabular-nums'] },
    cartaTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    cartaHead: { paddingTop: 16, marginBottom: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, gap: 2 },
    cartaTitle: { ...Type.title, color: t.text },
    cartaNote: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    sectionBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 },
    groupItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
    // Platillo y, si se abren, sus fotos debajo; abiertas dejan más aire antes del siguiente.
    dishBlock: { marginBottom: 12 },
    dishRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    groupItemName: { flex: 1, fontSize: 16, fontWeight: '700', color: t.text, lineHeight: 21 },
    dishPhotoMark: { fontSize: 14 },
    groupItemDescription: { marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    groupItemPrice: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: t.text },
    soldOutName: { color: t.textMute },
    soldOutPrice: { fontWeight: '500', color: t.textSecondary },
    dishLikeCount: { minWidth: 21, height: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
    dishLikeCountText: { fontSize: 12, fontWeight: '500', color: t.textSecondary, fontVariant: ['tabular-nums'] },
    dishHeartBox: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center' },
    reviewSection: { paddingTop: 32, marginBottom: 24 },
    reviewsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    reviewsTitle: { ...Type.section, color: t.text },
    ratingOverview: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingVertical: 4 },
    ratingScore: { width: 84, minHeight: 88, alignItems: 'center', justifyContent: 'center' },
    ratingAverage: { ...Type.number, color: t.text },
    ratingStars: { flexDirection: 'row', gap: 1, marginTop: 3 },
    ratingAll: { marginTop: 5, fontSize: 12, fontWeight: '700', color: t.textSecondary },
    ratingBars: { flex: 1, gap: 4 },
    ratingBarRow: { minHeight: 17, flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.62 },
    ratingBarRowActive: { opacity: 1 },
    ratingBarLabel: { width: 10, fontSize: 11, fontWeight: '700', color: t.textSecondary, textAlign: 'right' },
    ratingTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: t.border },
    ratingFill: { height: 4, borderRadius: 2, backgroundColor: t.accent },
    ratingCount: { width: 15, fontSize: 11, color: t.textMute, textAlign: 'right' },
    reviewCard: { paddingHorizontal: 16, paddingTop: 11, paddingBottom: 4, borderRadius: 18, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    reviewCardGap: { marginTop: 10 },
    moreReviews: { marginTop: 10, minHeight: 44, borderRadius: 22, borderCurve: 'continuous', borderWidth: 1.5, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    moreReviewsText: { fontSize: 14, fontWeight: '700', color: t.text },
    reviewAuthorRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
    reviewAuthor: { flex: 1, fontSize: 14, fontWeight: '700', color: t.text },
    reviewDate: { fontSize: 12, color: t.textMute },
    reviewStars: { flexDirection: 'row', gap: 4, marginBottom: 10 },
    reviewReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
    reviewReason: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100, backgroundColor: t.accentSoft },
    reviewReasonText: { fontSize: 11, fontWeight: '700', color: t.textSecondary },
    reviewNote: { fontSize: 14, lineHeight: 20, color: t.text },
    businessReply: { marginTop: 14, paddingTop: 12, paddingLeft: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, borderLeftWidth: 2, borderLeftColor: t.accent },
    reviewActions: { height: 36, marginTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewAction: { minWidth: 44, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    reviewActionText: { fontSize: 13, fontWeight: '700', color: t.textSecondary },
    reviewThread: { marginTop: 6, gap: 4, paddingLeft: 10, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.border },
    reviewThreadItem: { alignItems: 'flex-start' },
    reviewThreadChildren: { marginLeft: 18, paddingLeft: 9, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.border, gap: 4 },
    reviewThreadBubble: { maxWidth: '94%', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 15, borderCurve: 'continuous', backgroundColor: t.bg },
    reviewThreadHead: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewThreadAuthor: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16, fontWeight: '700', color: t.text },
    reviewThreadAuthorLink: { flexShrink: 1, minWidth: 0 },
    reviewThreadSeal: { width: 16, height: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    reviewThreadText: { marginTop: 2, fontSize: 13, lineHeight: 18, color: t.textSecondary },
    reviewThreadActions: { height: 29, paddingLeft: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewThreadTime: { paddingHorizontal: 4, fontSize: 11, color: t.textMute },
    reviewThreadTextAction: { height: 28, paddingHorizontal: 5, justifyContent: 'center' },
    reviewThreadTextActionLabel: { fontSize: 11, fontWeight: '700', color: t.textSecondary },
    reviewReplyRow: { marginTop: 8, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewInlineReplyRow: { marginLeft: 18, marginTop: 3, paddingTop: 7 },
    reviewReplyInput: { flex: 1, minHeight: 38, borderRadius: 12, borderCurve: 'continuous', paddingHorizontal: 11, color: t.text, backgroundColor: t.bg },
    reviewReplySend: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent },
    reviewPrompt: { minHeight: 44, borderRadius: 22, borderCurve: 'continuous', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: t.surface },
    reviewPromptText: { fontSize: 13, fontWeight: '700', color: t.text },
    // ── Detalles + mapa ──
    section: { paddingTop: 8 },
    earnedBadges: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    earnedBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    earnedBadgeActive: { backgroundColor: t.accentSoft, borderColor: t.accent },
    facts: { marginBottom: 8 },
    // Alto mínimo, nunca fijo: con letra grande o un dato largo la franja
    // crece en vez de recortar (antes 48 fijos con overflow oculto).
    // Arriba y al borde izquierdo, como la fila de datos: al abrir o cerrar
    // un reconocimiento ni la caja ni el texto cambian de lugar.
    factsStage: { minHeight: 48, justifyContent: 'flex-start' },
    factsLine: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
    factColumn: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    factColumnCenter: { justifyContent: 'center' },
    factColumnRight: { justifyContent: 'flex-end' },
    historyMetaText: { fontSize: 12, lineHeight: 16, color: t.textMute, flexShrink: 1 },
    factRight: { textAlign: 'right' },
    badgeInline: { minHeight: 48, alignItems: 'flex-start', justifyContent: 'flex-start', paddingHorizontal: 0, paddingVertical: 7 },
    badgeOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 },
    badgeMeasure: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 },
    badgeInlineTitle: { fontSize: 13, fontWeight: '700', color: t.text, textAlign: 'left' },
    badgeInlineText: { marginTop: 1, fontSize: 12, lineHeight: 16, color: t.textSecondary, textAlign: 'left' },
    // «Qué tan lleno»: tarjeta como el horario; barras del color de las
    // líneas y la hora actual en naranja, como las calificaciones.
    busySection: { marginBottom: 16 },
    // Volver arriba: círculo de vidrio al centro que sube desde el borde de
    // abajo, como una pestaña (capa de control, decisión de Parco).
    backToTopDock: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    backToTop: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface },
    returnPillShadow: { borderRadius: 100 },
    returnPill: {
      minHeight: 40, paddingHorizontal: 16, borderRadius: 100, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 6,
      borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)',
    },
    returnPillText: { fontSize: 15, fontWeight: '600', color: t.text },
    busyCard: { borderRadius: Radius.card, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, padding: 16 },
    busyLive: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    busyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent },
    busyLead: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '700', color: t.text },
    busyNote: { marginTop: 2, fontSize: 13, lineHeight: 17, fontWeight: '400', color: t.textSecondary },
    busyBars: { height: 72, marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    busyBar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 1, borderBottomRightRadius: 1, backgroundColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,18,20,0.09)' },
    busyBarNow: { backgroundColor: t.accent },
    busyAxis: { flexDirection: 'row', gap: 4, marginTop: 6 },
    busyAxisText: { flex: 1, fontSize: 11, lineHeight: 14, fontWeight: '400', color: t.textMute },
    mapPanel: { height: 92, borderRadius: 18, borderCurve: 'continuous', backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapMarker: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#111214', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.82)', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.24, shadowRadius: 6, elevation: 4 },
  });
}

export default function PatioDetailScreen() {
  // `platillo`: llega desde una foto en el perfil de alguien; la ficha abre
  // las fotos de ese platillo y lleva ahí.
  const { id, platillo } = useLocalSearchParams<{ id?: string; platillo?: string }>();
  return <PatioDetailView id={id} focusDish={platillo} />;
}

// `own`: la pestaña «Mi Patio» del negocio. Es la misma ficha que ve la gente,
// sin regresar, guardar, reportar ni reseñar, y con la barra del negocio.
export function PatioDetailView({ id, own = false, focusDish }: { id?: string; own?: boolean; focusDish?: string }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [here] = useKnownLocation();
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  // Alto fijo de la fila de datos: el del texto de reconocimiento más alto.
  const [badgeStageHeight, setBadgeStageHeight] = useState(0);
  const badgeHeights = useRef<Record<string, number>>({});
  const [reviewLikes, setReviewLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [reviewReplies, setReviewReplies] = useState<Record<string, ReviewThreadReply[]>>({});
  const [replyLikes, setReplyLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<{ reviewKey: string; parentId: string; author: string } | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const pullDismissed = useRef(false);
  const heroPullY = useRef(new Animated.Value(0)).current;

  const {
    cleanId,
    handleBack,
    handleComoLlegar,
    handleWhatsapp,
    handleShare,
    handleStarPress,
    handleToggleSaved,
    isSaved,
    savedKnown,
    loading,
    patio,
    patioId,
    proxTexto,
    rangoHoy,
    reviews: fetchedReviews,
    reviewsPaged,
    sections,
    menuPrices,
    carta,
    soldOut,
    userReview,
  } = usePatioDetailController(id);
  // Filtro por estrellas de la lista de reseñas: lo pide al servidor por partes.
  const ratingFilter = reviewsPaged.filter;
  const setRatingFilter = reviewsPaged.setFilter;
  // Lo de hoy y, debajo, la carta de siempre: una sola lista para la barra
  // de secciones y el recorrido.
  const menuGroups = useMemo(() => [...sections, ...carta], [sections, carta]);
  // Cuántos platillos traen foto: ninguno, algunos o todos.
  // Fotos de clientes (2026-11-15): las de reseñas que dicen de qué platillo
  // son. Se juntan por nombre canónico; la más nueva primero.
  // Personas bloqueadas: ni sus reseñas ni sus fotos.
  const [hiddenAuthors, setHiddenAuthors] = useState<string[]>([]);
  // Lo tuyo lleva tu nombre, como lo ven los demás (como en Facebook o
  // Instagram): la app nunca firma «Tú». Sabes que es tuyo por tu nombre y
  // porque sus opciones son corregir o quitar en vez de reportar.
  const [me, setMe] = useState(peekMyPublicName);
  useEffect(() => {
    let active = true;
    loadMyPublicName().then((value) => { if (active) setMe(value); }).catch(() => {});
    return () => { active = false; };
  }, []);
  // En reseñas reales tu nombre ya llega con la reseña; las de prueba dicen «Tú».
  const shownName = (author: string | undefined, mine?: boolean) => (mine && (!author || author === 'Tú') ? me?.name : author);
  // Correcciones hechas aquí mismo (cambió de platillo, la frase o la quitó):
  // se ven al momento, sin recargar la ficha. La llave es la de cada foto
  // (una reseña lleva hasta 5).
  const [photoEdits, setPhotoEdits] = useState<Record<string, { dish?: string; note?: string; removed?: boolean }>>({});
  const editKeyOf = (reviewKey: string, photo: { id?: string; url: string }) => `${reviewKey}#${photo.id ?? photo.url}`;
  // Las fotos de una reseña: las públicas o, en un lugar de prueba, las tuyas
  // guardadas en este teléfono (así se puede probar todo el flujo en DEV).
  const reviewPhotosOf = (review: (typeof fetchedReviews)[number]) => {
    const reviewKey = `${review.userId}-${review.timestamp}`;
    return (review.photos ?? []).flatMap((photo) => {
      const edit = photoEdits[editKeyOf(reviewKey, photo)];
      if (edit?.removed) return [];
      return [{
        id: photo.id,
        url: photo.url,
        hash: photo.hash,
        dish: edit && 'dish' in edit ? edit.dish : photo.dish,
        note: edit && 'note' in edit ? edit.note : photo.note,
      }];
    });
  };
  const customerPhotos = useMemo(() => {
    const byDish = new Map<string, DishPhoto[]>();
    fetchedReviews.forEach((review) => {
      if (hiddenAuthors.includes(review.userId)) return;
      reviewPhotosOf(review).forEach((photo) => {
        // Sin platillo, la foto sale en su reseña pero no en el menú.
        if (!photo.dish) return;
        // Por la identidad del platillo, no por el texto exacto (lib/dish-identity.ts).
        const key = dishKey(photo.dish);
        byDish.set(key, [...(byDish.get(key) ?? []), {
          url: photo.url,
          hash: photo.hash,
          by: review.author,
          avatar: review.avatarUrl,
          note: photo.note,
          at: review.timestamp,
          reviewId: review.reviewId,
          photoId: photo.id,
          userId: review.userId,
          mine: review.isMine,
        }]);
      });
    });
    return byDish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedReviews, hiddenAuthors, photoEdits, patioId]);
  // Todas las fotos de un platillo, en orden (`lib/dish-photos-order.ts`): las
  // de su nombre y las de sus otros nombres confirmados por el negocio.
  const photosFor = (item: { name: string; aliases?: string[]; photo?: string; photoHash?: string }) => orderDishPhotos(
    item.photo ? { url: item.photo, hash: item.photoHash } : undefined,
    dishKeysOf(item).flatMap((key) => customerPhotos.get(key) ?? []),
  );
  const peekStore = useRef(createStore<PeekState>(null)).current;
  // Vistazo: mantener presionado muestra la mejor foto, con quién y cuántas.
  const openDishPeek = (item: { name: string; aliases?: string[]; description?: string; price?: string | false; photo?: string; photoHash?: string }, sticky = false, touchY?: number) => {
    const photos = photosFor(item);
    if (!photos.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    peekStore.set({
      item: {
        name: item.name,
        description: item.description,
        price: item.price || undefined,
        photo: photos[0].url,
        hash: photos[0].hash,
        by: photos[0].by ? shownName(photos[0].by, photos[0].mine) ?? photos[0].by : patio?.name,
        count: photos.length,
      },
      sticky,
      touchY,
    });
  };
  // Fotos en su lugar: tocar un platillo con fotos las abre ahí mismo, dentro
  // del menú (una a la vez); tocarlo otra vez las cierra.
  const openDishStore = useRef(createStore<string | null>(null)).current;
  const openDishPhotos = (key: string | null) => {
    peekStore.set(null);
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    openDishStore.set(key);
  };
  const toggleDish = (key: string) => openDishPhotos(openDishStore.get() === key ? null : key);
  useEffect(() => { openDishStore.set(null); peekStore.set(null); }, [patioId, openDishStore, peekStore]);
  // Todas las fotos de cada platillo, ordenadas una sola vez (no en cada pintada).
  const dishPhotosByKey = useMemo(() => {
    const byKey = new Map<string, DishPhoto[]>();
    menuGroups.forEach((group, groupIndex) => group.items.forEach((item) => {
      const photos = photosFor(item);
      if (photos.length) byKey.set(`${groupIndex}-${item.name}`, photos);
    }));
    return byKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuGroups, customerPhotos]);
  // Corregir platillo de tu foto (de qué platillo es): hoja propia, es otra tarea.
  const [fixingPhoto, setFixingPhoto] = useState<{ photo: DishPhoto; dish: string } | null>(null);
  // Dónde quedó cada platillo y cada reseña, para llevar de una a otra.
  const dishY = useRef<Record<string, number>>({});
  const reviewCardY = useRef<Record<string, number>>({});
  const photoKey = (photo: DishPhoto) => `${photo.userId}-${photo.at}`;
  // Carga de fotos: primero lo que se ve, y un poco antes de que se necesite.
  // · Al poner el dedo en un platillo ya empieza a bajar su foto (le gana
  //   unos 200 ms al toque y al vistazo).
  // · Al dejar de desplazarte, bajan las portadas de los platillos en
  //   pantalla: si te detuviste, es que los estás leyendo.
  // · Las fotos de las reseñas, solo cuando las reseñas están cerca.
  const prefetched = useRef(new Set<string>());
  const prefetchPhotos = (urls: string[]) => {
    const fresh = urls.filter((url) => !prefetched.current.has(url));
    if (!fresh.length) return;
    fresh.forEach((url) => prefetched.current.add(url));
    void Image.prefetch(fresh, { cachePolicy: 'memory-disk' }).catch(() => {});
  };
  const prefetchVisibleCovers = (scrollY: number) => {
    const { cardY, menuY } = menuFrame.current;
    const urls: string[] = [];
    menuGroups.forEach((group, groupIndex) => {
      const groupTop = groupY.current[groupIndex];
      if (groupTop == null) return;
      group.items.forEach((item) => {
        const key = `${groupIndex}-${item.name}`;
        const dishTop = dishY.current[key];
        if (dishTop == null) return;
        const y = cardY + menuY + groupTop + dishTop;
        if (y < scrollY - 80 || y > scrollY + windowHeight + 80) return;
        const cover = dishPhotosByKey.get(key)?.[0]?.url;
        if (cover) urls.push(cover);
      });
    });
    prefetchPhotos(urls);
  };
  const [reviewsNear, setReviewsNear] = useState(false);
  const reviewsNearRef = useRef(false);
  const markReviewsNear = () => {
    if (reviewsNearRef.current) return;
    reviewsNearRef.current = true;
    setReviewsNear(true);
  };
  // Me gusta de una foto = me gusta de la reseña de donde sale: una visita,
  // un solo «me gusta». Sin corazón en las del lugar ni en las tuyas.
  const photoLike = (photo: DishPhoto): DishGalleryLike | undefined => (
    photo.by && !photo.mine ? (reviewLikes[photoKey(photo)] ?? { count: 0, mine: false }) : undefined
  );
  const togglePhotoLike = (photo: DishPhoto) => {
    const key = photoKey(photo);
    // La galería ya pintó el corazón; la ficha se pone al día sin frenarla.
    startTransition(() => {
      setReviewLikes((current) => {
        const like = current[key] ?? { count: 0, mine: false };
        return { ...current, [key]: { mine: !like.mine, count: Math.max(0, like.count + (like.mine ? -1 : 1)) } };
      });
    });
    if (photo.reviewId) void toggleReviewLike(photo.reviewId);
  };
  const dishTarget = (name: string) => {
    const key = dishKey(name);
    for (let group = 0; group < menuGroups.length; group++) {
      const found = menuGroups[group].items.find((candidate) => dishKeysOf(candidate).includes(key));
      if (found) return { key: `${group}-${found.name}`, group };
    }
    return null;
  };
  // Saltos dentro de la ficha (de la reseña al platillo y al revés): siempre
  // con una cápsula para regresar a donde estabas (orientación). Se va al
  // tocarla, o sola si regresas desplazándote.
  const [returnTo, setReturnTo] = useState<{ label: string; y: number; icon: 'arrow-up' | 'arrow-down' } | null>(null);
  const returnRef = useRef<{ y: number; armed: boolean } | null>(null);
  const offerReturn = (label: string, icon: 'arrow-up' | 'arrow-down') => {
    const origin = { y: lastScrollY.current, armed: false };
    returnRef.current = origin;
    setReturnTo({ label, y: origin.y, icon });
    // Se arma cuando ya terminó el salto: antes, la posición aún está cerca del origen.
    setTimeout(() => { if (returnRef.current === origin) origin.armed = true; }, 900);
  };
  const clearReturn = () => {
    returnRef.current = null;
    setReturnTo(null);
  };
  const goBackFromJump = () => {
    if (!returnTo) return;
    Haptics.selectionAsync().catch(() => {});
    scrollRef.current?.scrollTo({ y: Math.max(0, returnTo.y), animated: true });
    clearReturn();
  };
  // De la foto a su reseña (más abajo en la ficha), con todas las reseñas a la vista.
  const jumpToReview = async (key: string) => {
    offerReturn('Volver al platillo', 'arrow-up');
    markReviewsNear();
    if (ratingFilter !== null) setRatingFilter(null);
    // Con reseñas por partes, la de esa foto puede no estar cargada aún.
    const target = fetchedReviews.find((review) => `${review.userId}-${review.timestamp}` === key);
    if (target) await reviewsPaged.ensureListed(target).catch(() => {});
    setTimeout(() => {
      const y = reviewCardY.current[key];
      if (y == null) return;
      scrollRef.current?.scrollTo({ y: Math.max(0, menuFrame.current.cardY + reviewsY.current + y - insets.top - 8), animated: true });
    }, 80);
  };
  // De la foto de una reseña a su platillo en el menú (opcional, desde «Ver en
  // el menú»): abre sus fotos ahí y ofrece volver a la reseña.
  const showDishInMenu = (dishName: string) => {
    const target = dishTarget(dishName);
    if (!target) return;
    offerReturn('Volver a la reseña', 'arrow-down');
    openDishPhotos(target.key);
    setTimeout(() => {
      const { cardY, menuY } = menuFrame.current;
      const groupTop = groupY.current[target.group];
      const dishTop = dishY.current[target.key];
      if (groupTop == null || dishTop == null) return;
      scrollRef.current?.scrollTo({ y: Math.max(0, cardY + menuY + groupTop + dishTop - barHeight - 8), animated: true });
    }, 260);
  };
  // Llegaste desde una foto (perfil de alguien): se abre ese platillo y se va ahí.
  const focusedDish = useRef<string | null>(null);
  useEffect(() => {
    if (!focusDish || !menuGroups.length || focusedDish.current === focusDish) return;
    const target = dishTarget(focusDish);
    if (!target) return;
    focusedDish.current = focusDish;
    openDishPhotos(target.key);
    let tries = 0;
    const goThere = () => {
      const { cardY, menuY } = menuFrame.current;
      const groupTop = groupY.current[target.group];
      const dishTop = dishY.current[target.key];
      if (groupTop == null || dishTop == null || !cardY) {
        if (tries++ < 10) setTimeout(goThere, 150);
        return;
      }
      scrollRef.current?.scrollTo({ y: Math.max(0, cardY + menuY + groupTop + dishTop - barHeight - 8), animated: true });
    };
    const timer = setTimeout(goThere, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDish, menuGroups]);
  const reportPhoto = (photo: DishPhoto, reason: 'inaccurate' | 'abuse', dishName: string) => {
    const thanks = () => Alert.alert(noWidow('Gracias por avisarnos'), noWidow('Revisaremos esta foto.'));
    // Fotos de prueba (sin reseña real): mismo aviso, para probar el flujo.
    if (!photo.reviewId || !isRealReviewId(photo.reviewId)) { thanks(); return; }
    reportContent('review', photo.reviewId, reason, reason === 'inaccurate' ? `Foto que no es de ${dishName}` : 'Foto de platillo')
      .then(thanks)
      .catch((error: Error) => {
        if (/Inicia sesión/.test(error.message)) askToSignIn();
        else Alert.alert(noWidow('No se envió el reporte'), noWidow(error.message));
      });
  };
  const askRemovePhoto = (photo: DishPhoto) => {
    Alert.alert(noWidow('¿Quitar tu foto?'), noWidow('Tu reseña se queda; solo deja de verse la foto.'), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar foto',
        style: 'destructive',
        onPress: () => {
          const remote = photo.photoId && photo.reviewId && isRealReviewId(photo.reviewId) ? removeMyReviewPhoto(photo.photoId, photo.url) : Promise.resolve();
          remote.then(
            () => setPhotoEdits((current) => ({ ...current, [editKeyOf(photoKey(photo), { id: photo.photoId, url: photo.url })]: { removed: true } })),
            () => Alert.alert(noWidow('No se quitó la foto'), noWidow('Revisa tu conexión e inténtalo otra vez.')),
          );
        },
      },
    ]);
  };
  // «···» de cada foto de cliente: la tuya se corrige o se quita; la de otro se reporta.
  const photoMenu = (photo: DishPhoto, dishName: string): ActionSheetOption[] => {
    if (!photo.by) return [];
    const seeReview: ActionSheetOption = { label: photo.mine ? 'Ver mi reseña' : 'Ver la reseña', icon: 'chatbubble-outline', onPress: () => jumpToReview(photoKey(photo)) };
    if (photo.mine) {
      return [
        seeReview,
        { label: 'Corregir platillo', icon: 'create-outline', afterDismiss: true, onPress: () => setFixingPhoto({ photo, dish: dishName }) },
        { label: 'Quitar mi foto', icon: 'trash-outline', destructive: true, afterDismiss: true, onPress: () => askRemovePhoto(photo) },
      ];
    }
    return [
      seeReview,
      { label: 'No es de este platillo', icon: 'help-circle-outline', afterDismiss: true, onPress: () => reportPhoto(photo, 'inaccurate', dishName) },
      { label: 'Reportar foto', icon: 'flag-outline', afterDismiss: true, onPress: () => reportPhoto(photo, 'abuse', dishName) },
    ];
  };
  const dishNames = useMemo(() => [...new Set(menuGroups.flatMap((group) => group.items.map((item) => item.name)))], [menuGroups]);
  const recentRecordedId = useRef<string | null>(null);
  useEffect(() => {
    if (own || !patio || recentRecordedId.current === patio.id) return;
    recentRecordedId.current = patio.id;
    void recordRecentPatio(patio, 'opened').catch(() => {});
  }, [own, patio]);
  const reviews = useMemo(() => fetchedReviews.filter((review) => !hiddenAuthors.includes(review.userId)), [fetchedReviews, hiddenAuthors]);
  useEffect(() => { setHiddenAuthors([]); }, [patioId]);
  const heroPhoto = useMemo(() => heroPhotoFor(patioId ?? cleanId ?? ''), [patioId, cleanId]);
  // Promedio, total y estrellas del servidor; la lista llega de 20 en 20.
  const { average: ratingAverage, total: reviewTotal, byStars: ratingDistribution } = reviewsPaged.summary;
  const visibleReviews = useMemo(
    () => reviewsPaged.list.filter((review) => !hiddenAuthors.includes(review.userId)),
    [reviewsPaged.list, hiddenAuthors],
  );
  const businessOpeningLabel = useMemo(() => {
    if (!patio?.businessOpenedAt) return null;
    const openedAt = new Date(patio.businessOpenedAt);
    if (Number.isNaN(openedAt.getTime())) return null;
    return `Abrió en ${openedAt.getFullYear()}`;
  }, [patio?.businessOpenedAt]);
  const earnedBadges = useMemo(() => {
    if (!patio) return [];
    const itemCount = patio.menu.reduce((total, section) => total + section.items.length, 0);
    const openedYear = patio.businessOpenedAt ? new Date(patio.businessOpenedAt).getFullYear() : null;
    return [
      ...(itemCount >= 8 ? [{ id: 'menu', icon: 'checkmark-circle' as const, title: 'Menú completo', detail: 'Publica información suficiente para decidir antes de llegar.' }] : []),
      ...(patio.isNeighborhoodFavorite ? [{ id: 'community', icon: 'heart' as const, title: 'Reconocido por su comunidad', detail: 'Mantiene una reputación positiva entre quienes lo visitan.' }] : []),
      ...(openedYear && new Date().getFullYear() - openedYear >= 10 ? [{ id: 'history', icon: 'ribbon' as const, title: 'Trayectoria', detail: 'El negocio lleva al menos diez años abierto.' }] : []),
    ];
  }, [patio]);
  const activeBadge = earnedBadges.find((badge) => badge.id === activeBadgeId) ?? null;
  const reviewedToday = !!userReview && new Date(userReview.timestamp).toDateString() === new Date().toDateString();

  // Seguir, como Instagram: «Seguir» sigue de un toque; «Siguiendo» abre
  // agregar a una lista o dejar de seguir.
  const followAnchor = useRef<View>(null);
  const [followMenu, setFollowMenu] = useState(false);
  // Notificaciones por lugar con la campana de YouTube tal cual (2026-11-21):
  // desde «Siguiendo» eliges «Todas», «Personalizadas» (por defecto, en tu
  // resumen del día) o «Ninguna».
  const [notifyMode, setNotifyMode] = useState<PatioNotifyMode | null>(null);
  const muted = notifyMode === 'off';
  useEffect(() => {
    if (!patio?.id || !isSaved || own) { setNotifyMode(null); return; }
    let active = true;
    getPatioNotificationModes().then((modes) => { if (active) setNotifyMode(modes.get(patio.id) ?? null); }).catch(() => {});
    return () => { active = false; };
  }, [isSaved, own, patio?.id]);
  const chooseNotifyMode = async (mode: PatioNotifyMode) => {
    if (!patio?.id || mode === notifyMode) return;
    const before = notifyMode;
    setNotifyMode(mode);
    try {
      await setPatioNotificationMode(patio.id, mode);
    } catch {
      setNotifyMode(before);
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Entra a tu cuenta y revisa tu conexión.'));
    }
  };
  // Al seguir, una barra dice que llegarán avisos y deja silenciarlos ahí
  // mismo, como YouTube al suscribirte. Se va cuando la persona la cierra,
  // silencia o se mueve por la ficha; nunca por tiempo.
  // Nombre sobre la foto: dos líneas en Type.screen o Type.title y hasta tres
  // en Type.section, que conservan el interlineado de la fuente de marca
  // (encogerla a mano lo abre y corta acentos). Nunca se corta con «…» salvo
  // un nombre que no quepa ni así; entonces el sello no va pegado al texto.
  const [titleStep, setTitleStep] = useState(0);
  const [titleClamped, setTitleClamped] = useState(false);
  useEffect(() => { setTitleStep(0); setTitleClamped(false); }, [patio?.name]);
  // Descripción del negocio sobre la foto, completa (hasta 80, dos renglones),
  // como la bio de un perfil. Una antigua más larga se corta en dos renglones.
  const description = patio?.reason.trim() ?? '';
  // La foto crece si la identidad (nombre largo + descripción abierta) no cabe
  // debajo de volver y compartir: nunca se enciman.
  const [identityHeight, setIdentityHeight] = useState(0);
  // Datos junto a seguidores: un renglón si cabe; si no, bajan a su línea.
  const [metaStacked, setMetaStacked] = useState(false);
  useEffect(() => { setMetaStacked(false); }, [patio?.id, patio?.area, patio?.price, businessStats?.saves]);
  // Cuenta la vista para «Hoy» del negocio (anónima, una al día); el dueño no.
  useEffect(() => { if (patio?.id && !own) void recordPatioView(patio.id); }, [patio?.id, own]);
  const heroHeight = Math.max(HERO_HEIGHT, insets.top + 8 + 44 + 16 + identityHeight + 44);
  // La foto de fondo siempre cubre el encabezado aunque crezca por un nombre largo.
  const backdropHeight = heroHeight + 120;
  const [followToast, setFollowToast] = useState(false);
  const toastScrollY = useRef<number | null>(null);
  const handleFollowPress = async () => {
    if (isSaved) { setFollowMenu(true); return; }
    await handleToggleSaved();
    const [{ data }, prefs] = await Promise.all([
      supabase.auth.getSession(),
      getRemoteNotificationPreferences().catch(() => null),
    ]);
    if (data.session && prefs?.patioPublications) {
      // Al seguir, como YouTube: «Personalizadas» (la fila del servidor llega
      // un momento después).
      setNotifyMode((current) => current ?? 'digest');
      toastScrollY.current = null;
      setFollowToast(true);
    }
  };
  useEffect(() => { if (!isSaved) setFollowToast(false); }, [isSaved]);

  // Like por platillo: micro-señal de compromiso de fricción casi cero,
  // independiente de la reseña completa (lib/dish-likes.ts).
  const [likedDishNames, setLikedDishNames] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!patio?.id) return;
    getLikedDishNames(patio.id).then(setLikedDishNames).catch(() => {});
  }, [patio?.id]);

  // El conteo positivo acompaña al corazón tanto en Mi Patio como en la ficha pública.
  const [dishLikeCounts, setDishLikeCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!patio?.id) return;
    let active = true;
    getDishLikeCounts(patio.id).then((counts) => {
      if (active) setDishLikeCounts(Object.fromEntries(counts.map((dish) => [dish.dishName, dish.likes])));
    }).catch(() => {});
    return () => { active = false; };
  }, [patio?.id]);

  // Pro: aviso especial de las últimas 24 horas y platillo destacado. En Mi
  // Patio, con Pro, la estrella de cada platillo elige cuál se destaca.
  const [highlights, setHighlights] = useState<PatioHighlights>({ featuredDish: null, notice: null });
  const [ownPro, setOwnPro] = useState(false);
  useEffect(() => {
    if (!patio?.id) return;
    let active = true;
    getPatioHighlights(patio.id).then((value) => { if (active) setHighlights(value); }).catch(() => {});
    if (own) getProStatus(patio.id).then((status) => { if (active) setOwnPro(!!status?.proUntil); }).catch(() => {});
    return () => { active = false; };
  }, [own, patio?.id]);
  // Barra de secciones (menús de 4 secciones o más): aparece fija arriba en
  // cuanto el menú llega a la parte de arriba, marca la sección en pantalla y
  // lleva a la que toques. Patrón de las apps de comida (ley de Jakob). Sin
  // «volver» (decisión de Parco, 8 nov): toda la barra es para las secciones.
  const scrollRef = useRef<ScrollView>(null);
  // «Volver arriba» (NN/g, Loranger 2017): solo en fichas de más de cuatro
  // pantallas; aparece ya abajo cuando la persona empieza a subir o llega al
  // final, y se va al seguir bajando. Círculo de vidrio sin texto, al centro,
  // que sube desde el borde de abajo y ahí se queda quieto (decisión de Parco);
  // VoiceOver dice «Volver arriba».
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState(0);
  const longFicha = contentHeight > windowHeight * 4;
  const lastScrollY = useRef(0);
  const backToTopShown = useRef(false);
  const backToTopOpacity = useRef(new Animated.Value(0)).current;
  const [backToTopVisible, setBackToTopVisible] = useState(false);
  const updateBackToTop = (y: number) => {
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;
    let next = backToTopShown.current;
    if (!longFicha || y < windowHeight * 2) next = false;
    else if (delta < -6 || y + windowHeight >= contentHeight - 80) next = true;
    else if (delta > 6) next = false;
    if (next === backToTopShown.current) return;
    backToTopShown.current = next;
    setBackToTopVisible(next);
    Animated.timing(backToTopOpacity, { toValue: next ? 1 : 0, duration: 200, easing: next ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic), useNativeDriver: true }).start();
  };
  const scrollToTop = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);
  const backToTopBottom = own ? bottomTabClearance(insets.bottom) : insets.bottom + 16;
  const menuFrame = useRef({ cardY: 0, menuY: 0, menuHeight: 0 });
  const groupY = useRef<number[]>([]);
  const reviewsY = useRef(0);
  const barHeight = insets.top + 52;
  const [barVisible, setBarVisible] = useState(false);
  const barVisibleRef = useRef(false);
  const barOpacity = useRef(new Animated.Value(0)).current;
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const followSections = (scrollY: number) => {
    const { cardY, menuY, menuHeight } = menuFrame.current;
    const top = cardY + menuY;
    const visible = menuHeight > 0 && scrollY + barHeight >= top - 8 && scrollY + barHeight <= top + menuHeight - 48;
    if (visible !== barVisibleRef.current) {
      barVisibleRef.current = visible;
      setBarVisible(true);
      // Baja desde arriba y se asienta (sale más rápido de lo que entra),
      // como la barra de una app de comida; antes solo se desvanecía.
      Animated.timing(barOpacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 280 : 180,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        if (!barVisibleRef.current) setBarVisible(false);
      });
    }
    const line = scrollY + barHeight + 16 - top;
    let current = 0;
    groupY.current.forEach((y, index) => { if (y != null && y <= line) current = index; });
    if (current !== activeSectionRef.current) {
      activeSectionRef.current = current;
      setActiveSection(current);
    }
  };
  const jumpToSection = (index: number) => {
    const { cardY, menuY } = menuFrame.current;
    const y = groupY.current[index];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, cardY + menuY + y - barHeight - 8), animated: true });
  };

  // «Qué tan lleno»: solo aparece con visitas reales suficientes.
  const [busyness, setBusyness] = useState<Busyness | null>(null);
  useEffect(() => {
    if (!patio?.id) return;
    let active = true;
    setBusyness(null);
    getPlaceBusyness(patio.id, patio.weeklyHours).then((value) => { if (active) setBusyness(value); }).catch(() => {});
    return () => { active = false; };
  }, [patio?.id, patio?.weeklyHours]);
  // «Me gusta» y recomendado por la identidad del platillo: si te gustó
  // «Pozole» y hoy es «Pozole rojo» (mismo platillo para el negocio), sale con
  // tu corazón y suma sus «me gusta».
  const likedKeys = useMemo(() => new Set([...likedDishNames].map(dishKey)), [likedDishNames]);
  const likeCountByKey = useMemo(() => {
    const byKey = new Map<string, number>();
    Object.entries(dishLikeCounts).forEach(([name, count]) => byKey.set(dishKey(name), (byKey.get(dishKey(name)) ?? 0) + count));
    return byKey;
  }, [dishLikeCounts]);
  const featuredKey = highlights.featuredDish ? dishKey(highlights.featuredDish) : null;
  const handleFeatureDish = async (item: { name: string; aliases?: string[] }) => {
    if (!patio?.id) return;
    const dishName = item.name;
    const next = featuredKey && dishKeysOf(item).includes(featuredKey) ? null : dishName;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await setFeaturedDish(patio.id, next);
      setHighlights((current) => ({ ...current, featuredDish: next ? canonicalDishName(next) : null }));
    } catch (error) {
      Alert.alert(noWidow('No se pudo destacar'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.'));
    }
  };

  const handleToggleDishLike = async (item: { name: string; aliases?: string[] }) => {
    if (!patio?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const keys = dishKeysOf(item);
    // Si ya te gustaba con otro de sus nombres, se quita ese; si no, se da con el de hoy.
    const likedNames = [...likedDishNames].filter((name) => keys.includes(dishKey(name)));
    const names = likedNames.length ? likedNames : [item.name];
    for (const name of names) {
      const nowLiked = await toggleDishLike(patio.id, name);
      const key = canonicalDishName(name);
      setLikedDishNames((current) => {
        const next = new Set(current);
        if (nowLiked) next.add(key); else next.delete(key);
        return next;
      });
      setDishLikeCounts((current) => ({ ...current, [key]: Math.max(0, (current[key] ?? 0) + (nowLiked ? 1 : -1)) }));
    }
  };

  useEffect(() => {
    const likes: Record<string, { count: number; mine: boolean }> = {};
    const replies: Record<string, ReviewThreadReply[]> = {};
    reviews.forEach((review) => {
      const key = `${review.userId}-${review.timestamp}`;
      const synthetic = review.userId.startsWith('demo-');
      likes[key] = {
        // Caso límite de «me gusta» en una foto (Cocina Grande Dev 6).
        count: review.photos?.[0]?.url.endsWith('v=dev6-0')
          ? 12480
          : review.userId === 'demo-critical-1'
          ? 14
          : review.userId === 'demo-critical-2'
            ? 6
            : synthetic ? Math.max(1, review.stars * 2) : 0,
        mine: false,
      };
      if (review.userId === 'demo-critical-1') replies[key] = [
        { id: `${key}-1`, author: 'Mariana L.', body: 'El domingo el caldo también llegó tibio.', likes: 5 },
        { id: `${key}-2`, author: 'Carlos N.', body: 'La carne estaba más dura que otras veces.', likes: 3 },
        { id: `${key}-3`, author: patio?.name ?? 'El Patio', body: 'Gracias por avisarnos. Revisamos temperatura y cocción con cocina.', likes: 11, patio: true },
        { id: `${key}-4`, author: 'Sofía R.', body: 'Fuimos el martes y ya estaba caliente otra vez.', likes: 8 },
      ];
      if (review.userId === 'demo-critical-2') replies[key] = [
        { id: `${key}-1`, author: 'Diego M.', body: 'Nos ofrecieron dos platos distintos a los publicados.', likes: 2 },
        { id: `${key}-2`, author: patio?.name ?? 'El Patio', body: 'Ya corregimos el menú publicado para que coincida con cocina.', likes: 7, patio: true },
        { id: `${key}-3`, author: 'Ana P.', body: 'Por la tarde ya aparecía actualizado.', likes: 4 },
      ];
      if (review.userId === 'demo-established-1') replies[key] = [
        { id: `${key}-1`, author: 'Jorge A.', body: 'El chamorro también es lo que más pedimos.', likes: 12 },
        { id: `${key}-2`, author: 'Pilar N.', body: '¿Lo sirven todos los días o sólo el fin de semana?', likes: 6 },
        { id: `${key}-3`, author: 'Fernanda T.', body: 'Yo lo he visto de jueves a domingo; el domingo todavía alcanzamos a las tres.', likes: 9, parentId: `${key}-2` },
        { id: `${key}-4`, author: patio?.name ?? 'El Patio', body: 'Confirmamos: está en la carta de jueves a domingo, sujeto a disponibilidad.', likes: 18, patio: true, parentId: `${key}-2` },
        { id: `${key}-5`, author: 'Mariana L.', body: 'Las enmoladas también valen mucho la pena.', likes: 7 },
      ];
      if (synthetic && !replies[key]) {
        replies[key] = syntheticThreadFor(review.userId, patio?.name ?? 'El Patio', review.stars);
      }
      if (review.businessReply) {
        replies[key] = [
          {
            id: `${key}-official`,
            author: patio?.name ?? 'El Patio',
            body: review.businessReply,
            likes: synthetic ? 4 : 0,
            patio: true,
            timeLabel: synthetic ? '1 h' : review.businessRepliedAt && Number.isFinite(Date.parse(review.businessRepliedAt))
              ? new Date(review.businessRepliedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
              : undefined,
          },
          ...(replies[key] ?? []),
        ];
      }
    });
    setReviewLikes(likes);
    setReviewReplies(replies);
  }, [patio?.name, reviews]);

  // Overlay de datos reales sobre las reseñas reales (las que sí tienen
  // reviewId de Supabase) — las demo/sintéticas de arriba se quedan tal
  // cual, esto solo reemplaza el conteo/mine de las genuinas.
  useEffect(() => {
    const realReviews = reviews.filter((review) => !!review.reviewId);
    if (!realReviews.length) return;
    const reviewIds = realReviews.map((review) => review.reviewId!);
    Promise.all([getReviewLikeCounts(reviewIds), getLikedReviewIds(reviewIds)]).then(([counts, liked]) => {
      setReviewLikes((current) => {
        const next = { ...current };
        for (const review of realReviews) {
          const key = `${review.userId}-${review.timestamp}`;
          next[key] = { count: counts[review.reviewId!] ?? 0, mine: liked.has(review.reviewId!) };
        }
        return next;
      });
    }).catch(() => {});
  }, [reviews]);

  // Comentarios guardados de las reseñas reales; se suman después de la
  // respuesta oficial del negocio y reemplazan la carga anterior.
  useEffect(() => {
    const realReviews = reviews.filter((review) => isRealReviewId(review.reviewId));
    if (!realReviews.length || !patio?.id) return;
    let active = true;
    getReviewComments(realReviews.map((review) => review.reviewId!), { id: patio.id, name: patio.name }).then((comments) => {
      if (!active) return;
      setReviewReplies((current) => {
        const next = { ...current };
        for (const review of realReviews) {
          const key = `${review.userId}-${review.timestamp}`;
          const saved = comments.filter((comment) => comment.reviewId === review.reviewId).map((comment): ReviewThreadReply => ({
            id: comment.id,
            author: comment.author,
            body: comment.body,
            likes: comment.likes,
            mine: comment.mine,
            patio: comment.byPatio,
            parentId: comment.parentId,
            timeLabel: commentTimeLabel(comment.createdAt),
            real: true,
            userId: comment.userId,
          }));
          next[key] = [...(next[key] ?? []).filter((reply) => !reply.real), ...saved];
        }
        return next;
      });
      setReplyLikes((current) => {
        const next = { ...current };
        for (const comment of comments) next[comment.id] = { count: comment.likes, mine: comment.liked };
        return next;
      });
    }).catch(() => {});
    return () => { active = false; };
  }, [reviews, patio?.id, patio?.name]);

  // Seguidores y «me gusta» del lugar; se vuelven a contar cuando la persona
  // lo sigue o deja de seguir, para que el número no se quede atrás.
  useEffect(() => {
    if (!patio?.id) return;
    let active = true;
    getBusinessStats(patio.id).then((stats) => { if (active) setBusinessStats(stats); }).catch(() => {});
    return () => { active = false; };
  }, [patio?.id, isSaved]);

  const appendReply = (reviewKey: string, reply: ReviewThreadReply) => {
    setReviewReplies((current) => ({ ...current, [reviewKey]: [...(current[reviewKey] ?? []), reply] }));
    setExpandedThreads((current) => ({ ...current, [reviewKey]: true }));
    setReplyDraft('');
    setReplyingTo(null);
    setReplyingToComment(null);
  };

  const askToSignIn = () => router.push({ pathname: '/comunidad-acceso', params: { returnTo: `/patio/${patio?.id ?? ''}` } });

  // Publica un comentario o una respuesta. Las reseñas de demostración y las
  // locales no existen en el servidor: ahí el comentario se queda en el teléfono.
  const sendComment = async (reviewId: string | undefined, reviewKey: string, parent?: ReviewThreadReply) => {
    const body = replyDraft.trim();
    if (!body || sendingComment) return;
    if (!isRealReviewId(reviewId)) {
      appendReply(reviewKey, { id: `${reviewKey}-mine-${Date.now()}`, author: 'Tú', body, likes: 0, mine: true, parentId: parent ? (parent.parentId ?? parent.id) : undefined });
      return;
    }
    setSendingComment(true);
    try {
      const rootId = parent?.real ? (parent.parentId ?? parent.id) : undefined;
      const saved = await postReviewComment(reviewId, body, rootId);
      appendReply(reviewKey, {
        id: saved.id,
        author: own ? (patio?.name ?? 'Tu Patio') : 'Tú',
        body,
        likes: 0,
        mine: true,
        patio: own,
        parentId: saved.parentId,
        timeLabel: 'Ahora',
        real: true,
      });
    } catch (error) {
      if (error instanceof CommentSignInRequiredError) { askToSignIn(); return; }
      if ((error as { code?: string })?.code === '42501') {
        Alert.alert(noWidow('Completa tu perfil para comentar'), noWidow('Tu nombre aparece junto a lo que publicas en Patio.'), [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Completar', onPress: () => router.push('/perfil-comunidad') },
        ]);
        return;
      }
      Alert.alert(noWidow('No se publicó tu comentario'), noWidow(writeErrorMessage(error, 'Revisa tu conexión e inténtalo de nuevo.')));
    } finally {
      setSendingComment(false);
    }
  };

  const toggleCommentReaction = (reply: ReviewThreadReply, reaction: { count: number; mine: boolean }) => {
    const nextMine = !reaction.mine;
    setReplyLikes((current) => ({ ...current, [reply.id]: { mine: nextMine, count: Math.max(0, reaction.count + (nextMine ? 1 : -1)) } }));
    if (!reply.real) return;
    setCommentLike(reply.id, nextMine).catch((error) => {
      setReplyLikes((current) => ({ ...current, [reply.id]: reaction }));
      if (error instanceof CommentSignInRequiredError) askToSignIn();
    });
  };

  const removeComment = (reviewKey: string, reply: ReviewThreadReply) => {
    Alert.alert(noWidow('¿Eliminar comentario?'), noWidow('Se borra para todos, con sus respuestas.'), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteReviewComment(reply.id).then(() => {
            setReviewReplies((current) => ({
              ...current,
              [reviewKey]: (current[reviewKey] ?? []).filter((item) => item.id !== reply.id && item.parentId !== reply.id),
            }));
          }).catch(() => Alert.alert(noWidow('No se eliminó'), noWidow('Revisa tu conexión e inténtalo de nuevo.')));
        },
      },
    ]);
  };

  const reportComment = (reply: ReviewThreadReply) => {
    const send = (reason: ReportReason) => {
      reportContent('comment', reply.id, reason)
        .then(() => Alert.alert(noWidow('Gracias por avisarnos'), noWidow('Revisaremos este comentario.')))
        .catch((error: Error) => {
          if (/Inicia sesión/.test(error.message)) askToSignIn();
          else Alert.alert(noWidow('No se envió el reporte'), noWidow(error.message));
        });
    };
    Alert.alert(noWidow('Reportar comentario'), noWidow('¿Qué tiene de malo?'), [
      { text: 'Ofensivo o abuso', onPress: () => send('abuse') },
      { text: 'Spam o publicidad', onPress: () => send('spam') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const GlassIcon = ({ name, size = 17, onPress, color, label, selected }: { name: keyof typeof Ionicons.glyphMap; size?: number; onPress: () => void; color?: string; label: string; selected?: boolean }) => (
    <TouchableOpacity
      style={s.glassIcon}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected !== undefined ? { selected } : undefined}>
      <BlurView intensity={theme.isDark ? 24 : 40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.glass }]} />
      <Ionicons name={name} size={size} color={color ?? theme.text} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top + 8 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {!own && (
          <View style={{ paddingHorizontal: 20 }}>
            <GlassIcon name="chevron-back" size={21} onPress={handleBack} label="Volver" />
          </View>
        )}
        <AgentSpinner color={theme.text} size={22} style={{ alignSelf: 'center', marginTop: 80 }} />
        {own && <BottomTabBar variant="fondero" />}
      </View>
    );
  }

  if (!patio) {
    return (
      <View style={[s.container, { paddingTop: insets.top + 8 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingHorizontal: 20 }}>
          {!own && <GlassIcon name="chevron-back" size={21} onPress={handleBack} label="Volver" />}
          <Text style={[s.title, { marginTop: 24 }]}>{noWidow(own ? 'Tu Patio aparecerá aquí' : 'No encontrado')}</Text>
        </View>
        {own && <BottomTabBar variant="fondero" />}
      </View>
    );
  }

  const km = patioDistance(here, patio);
  const distance = km === null ? null : formatDistance(km);
  const heroPrice = patioCardPrice(patio);
  // En el encabezado, solo lo que decide la visita: distancia y precio. La
  // colonia va abajo del mapa, con la dirección (como la ficha de Google).
  // Calificación arriba y reseñas completas abajo (Jev, 8 nov: «resumen
  // arriba» 68–92 % en tres perfiles; como Google y Apple Maps). Tocarla baja
  // a las reseñas.
  const ratingFact = reviewTotal ? `★\u00A0${ratingAverage.toFixed(1)}\u00A0(${reviewTotal.toLocaleString('es-MX')})` : null;
  const factParts = [distance, heroPrice.source === 'missing' ? null : heroPrice.label].filter((part): part is string => !!part);
  const heroFacts = [ratingFact, ...factParts].filter(Boolean).join(' · ');
  const jumpToReviews = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, menuFrame.current.cardY + reviewsY.current - insets.top - 8), animated: true });
  };
  const renderFacts = (lead: string) => (
    <>
      {lead}
      {ratingFact && (
        <Text suppressHighlighting onPress={jumpToReviews} accessibilityLabel={`${ratingAverage.toFixed(1)} de 5, ${reviewTotal} reseñas`}>{ratingFact}</Text>
      )}
      {factParts.length ? `${ratingFact ? ' · ' : ''}${factParts.join(' · ')}` : ''}
    </>
  );
  // Dónde vende (lib/puntos.ts, 2026-11-21): en su local (y otras
  // sucursales), en tianguis o sobre ruedas (dónde está hoy), o solo a
  // domicilio (su zona, nunca su calle).
  const modalidad = patio.modalidad ?? 'local';
  const puntos = patio.puntos ?? [];
  const weekday = new Date().getDay();
  const todayPunto = modalidad === 'itinerante' ? puntos.find((punto) => isToday(punto, weekday)) : undefined;
  const placeAddress = modalidad === 'domicilio'
    ? ['Solo a domicilio', patio.area?.trim()].filter(Boolean).join(' · ')
    : todayPunto
      ? [`Hoy: ${todayPunto.nombre}`, todayPunto.direccion?.trim()].filter(Boolean).join(' · ')
      : modalidad === 'itinerante' && puntos.length
        ? 'Hoy no sale'
        : [patio.address?.trim(), patio.area?.trim()].filter(Boolean).join(' · ');
  // Qué tan al día están los precios de la carta (2026-11-21): el mes en que
  // el negocio la cambió o confirmó «Siguen igual».
  const preciosLabel = patio.cartaPreciosAl ? (() => {
    const at = new Date(patio.cartaPreciosAl);
    if (Number.isNaN(at.getTime())) return null;
    const sameYear = at.getFullYear() === new Date().getFullYear();
    return `Precios de ${at.toLocaleDateString('es-MX', sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' })}`;
  })() : null;
  const pedidosHasta = patio.pedidosHasta ? (() => {
    const [h, m] = patio.pedidosHasta.split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? `Pedidos hasta ${atHour(h * 60 + m)}` : null;
  })() : null;
  const followersCount = businessStats ? businessStats.saves.toLocaleString('es-MX') : '';
  const metaLead = businessStats ? followersCount : heroFacts;
  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.Image
        source={patio.photoUrl ? { uri: patio.photoUrl } : heroPhoto}
        style={[
          s.heroBackdrop,
          soldOut && s.heroImgMuted,
          { height: backdropHeight },
          // Foodie: leve zoom mientras jala para cerrar y ver el mapa.
          // Fondero en su ficha: la foto se estira desde arriba con el
          // rebote (encabezado elástico de iOS), así nunca se ve cortada.
          { transform: own ? [
            { translateY: heroPullY.interpolate({ inputRange: [-300, 0], outputRange: [150, 0], extrapolateRight: 'clamp' }) },
            { scale: heroPullY.interpolate({ inputRange: [-300, 0], outputRange: [1 + 300 / backdropHeight, 1], extrapolateRight: 'clamp' }) },
          ] : [{ scale: heroPullY.interpolate({ inputRange: [-120, 0], outputRange: [1.045, 1], extrapolate: 'clamp' }) }] },
        ]}
        resizeMode="cover"
      />
      {/* Foodie: arrastrar hacia abajo cierra la ficha y deja ver el mapa.
          Fondero en su propia ficha: rebote normal de iOS sin cerrar; la foto
          se estira con él (ver heroBackdrop). */}
      <Animated.ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[s.scrollContent, own && { paddingBottom: bottomTabClearance(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        onScrollEndDrag={(event) => prefetchVisibleCovers(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => prefetchVisibleCovers(event.nativeEvent.contentOffset.y)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: heroPullY } } }],
          {
            useNativeDriver: true,
            listener: (event: any) => {
              const y = event.nativeEvent.contentOffset.y;
              if (menuGroups.length >= 4) followSections(y);
              if (!reviewsNearRef.current && y + windowHeight * 1.5 >= menuFrame.current.cardY + reviewsY.current) markReviewsNear();
              if (returnRef.current?.armed && Math.abs(y - returnRef.current.y) < 120) clearReturn();
              updateBackToTop(y);
              if (followToast) {
                if (toastScrollY.current === null) toastScrollY.current = y;
                else if (Math.abs(y - toastScrollY.current) > 48) setFollowToast(false);
              }
              if (y >= 0) pullDismissed.current = false;
              if (!own && y < -PULL_TO_DISMISS_THRESHOLD && !pullDismissed.current) {
                pullDismissed.current = true;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                handleBack();
              }
            },
          }
        )}>

        {/* Hero con foto botánica real + degradado que la funde con la card */}
        <View style={[s.hero, { height: heroHeight }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.48)']}
            locations={[0, 0.62, 1]}
            style={s.heroGradient}
          />
          {/* Identidad sobre la foto, en la misma retícula de 20 que volver y
              compartir: el nombre a todo lo ancho (baja de tamaño si es largo)
              con el sello pegado a la última palabra y, debajo, una línea con
              «N seguidores» a la izquierda y «Seguir» a la derecha, como el
              encabezado de un perfil en X. El estado del día vive en la
              tarjeta, no en la foto. */}
          <View style={s.heroIdentity} onLayout={(event) => setIdentityHeight(event.nativeEvent.layout.height)}>
            <Text
              accessibilityRole="header"
              accessibilityLabel={patio.isVerifiedBusiness ? `${patio.name}, negocio verificado` : patio.name}
              // Alineación óptica: la tinta del nombre, la descripción y los
              // seguidores empieza en la misma vertical (no sus cajas).
              style={[s.title, TITLE_STEPS[titleStep], { marginLeft: opticalIndent(patio.name, Fonts.brand, TITLE_STEPS[titleStep].fontSize) }]}
              numberOfLines={titleClamped ? 3 : undefined}
              onTextLayout={(event) => {
                const last = titleStep === TITLE_STEPS.length - 1;
                if (event.nativeEvent.lines.length <= (last ? 3 : 2)) return;
                if (!last) setTitleStep(titleStep + 1);
                else if (!titleClamped) setTitleClamped(true);
              }}
              allowFontScaling={true}>
              {noWidow(patio.name)}
              {/* El sello va pegado a la última palabra, como en X o Instagram. */}
              {patio.isVerifiedBusiness && !titleClamped && <>{'\u00A0'}<View style={s.verifiedInline}>
                <SymbolView name="checkmark.seal.fill" size={Math.round(TITLE_STEPS[titleStep].fontSize * 0.72)} weight="medium" tintColor="#FFFFFF" fallback={<TintIcon source={ANDROID_ICONS.verified} size={Math.round(TITLE_STEPS[titleStep].fontSize * 0.72)} color="#FFFFFF" />} />
              </View></>}
            </Text>
            {!!description && (
              <Text style={[s.heroBioText, s.heroBio, { marginLeft: opticalIndent(description, Fonts.text, 15) }]} allowFontScaling={true}>{noWidow(description)}</Text>
            )}
            {/* Datos junto a seguidores (Parco, 8 nov): «240 seguidores · 450 m ·
                $95» en la línea de «Seguir» cuando cabe en un renglón. Si no cabe
                (rango de precio, miles de seguidores, letra grande), los datos
                bajan a su propia línea a todo lo ancho, como ViewThatFits de
                Apple: nunca se cortan ni se aprietan. */}
            {metaStacked && !!heroFacts && (
              <Text style={[s.heroFacts, !description && s.heroFactsUnderName, { marginLeft: opticalIndent(heroFacts, Fonts.text, 14) }]} allowFontScaling={true}>{renderFacts('')}</Text>
            )}
            <View style={[s.heroMeta, !description && !(metaStacked && heroFacts) && s.heroMetaUnderName]}>
              <View style={s.followersLink}>
                <Text
                  style={[s.followersText, { marginLeft: opticalIndent(metaLead, businessStats ? Fonts.textSemibold : Fonts.text, 14) }]}
                  accessibilityLabel={[businessStats ? businessStatsLabel(businessStats) : '', metaStacked ? '' : heroFacts].filter(Boolean).join('. ')}
                  onTextLayout={(event) => { if (!metaStacked && event.nativeEvent.lines.length > 1) setMetaStacked(true); }}
                  allowFontScaling={true}>
                  {businessStats ? (
                    <Text
                      suppressHighlighting
                      onPress={/^[0-9a-f-]{36}$/i.test(patio.id) ? () => router.push({ pathname: '/foodie/seguidores', params: { patio: patio.id } }) : undefined}>
                      <Text style={s.followersValue}>{followersCount}</Text>{` ${businessStats.saves === 1 ? 'seguidor' : 'seguidores'}`}
                    </Text>
                  ) : null}
                  {!metaStacked && heroFacts ? renderFacts(businessStats ? ' · ' : '') : null}
                </Text>
              </View>
              {!own && (
                <View ref={followAnchor} collapsable={false} style={{ opacity: savedKnown ? 1 : 0 }} pointerEvents={savedKnown ? 'auto' : 'none'}>
                  <TouchableOpacity
                    style={[s.followPill, isSaved ? s.followPillGlass : { backgroundColor: theme.accent }]}
                    activeOpacity={isSaved ? 0.7 : 0.85}
                    hitSlop={{ top: 6, bottom: 6 }}
                    onPress={() => { void handleFollowPress(); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSaved }}
                    accessibilityLabel={isSaved ? `Siguiendo a ${patio.name}, notificaciones: ${PATIO_NOTIFY_LABELS[notifyMode ?? 'digest']}` : `Seguir a ${patio.name}`}>
                    {isSaved && <BlurView intensity={theme.isDark ? 24 : 40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
                    {isSaved && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.glass }]} />}
                    <Text style={[s.followPillText, { color: isSaved ? theme.text : '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={true}>{isSaved ? 'Siguiendo' : 'Seguir'}</Text>
                    {/* La campana dice cómo te llegan sus notificaciones (Todas, Personalizadas o Ninguna), como el «Suscrito» de YouTube. */}
                    {isSaved && <Ionicons name={PATIO_NOTIFY_ICONS[notifyMode ?? 'digest']} size={14} color={muted ? theme.textSecondary : theme.text} />}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <View style={[s.heroNav, { top: insets.top + 8 }]}>
            {own ? <View /> : <GlassIcon name="chevron-back" size={21} onPress={handleBack} label="Volver" />}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!own && patioId && <ContentSafetyMenu targetType="patio" targetId={patioId} />}
              <GlassIcon name="share-outline" size={17} onPress={handleShare} label="Compartir" />
            </View>
          </View>
        </View>

        {/* Card traslapada */}
        <View style={s.card} onLayout={(event) => { menuFrame.current.cardY = event.nativeEvent.layout.y; }}>
          {!!highlights.notice && (
            <View style={s.notice} accessible accessibilityLabel={`Aviso de ${patio.name}: ${highlights.notice.body}`}>
              <Ionicons name={highlights.notice.kind === 'operation' ? 'time-outline' : highlights.notice.kind === 'fresh' ? 'flame-outline' : 'megaphone-outline'} size={18} color={theme.accent} />
              <Text style={s.noticeText} allowFontScaling={true}>{noWidow(highlights.notice.body)}</Text>
            </View>
          )}
          {soldOut && (
            <View style={s.mananaCard}>
              <View style={s.mananaHead}>
                <Ionicons name="time-outline" size={12} color={theme.accent} />
                <Text style={s.mananaEyebrow} allowFontScaling={true}>Se acabó por hoy</Text>
              </View>
              <Text style={s.mananaBody} allowFontScaling={true}>{noWidow(`${proxTexto ?? `Mañana abre a las ${patio.open.split(/[-–]/)[0]}`}. ${isSaved ? 'Te avisamos cuando publique.' : 'Síguelo y te avisamos cuando publique.'}`)}</Text>
            </View>
          )}
          {/* Menú del día — agrupado por sección. Si ya se acabó, solo se
              atenúa: el aviso de arriba ya lo dice, sin caja ni etiqueta extra. */}
          <View onLayout={(event) => { menuFrame.current.menuY = event.nativeEvent.layout.y; menuFrame.current.menuHeight = event.nativeEvent.layout.height; }}>
            <View style={soldOut ? { opacity: 0.42 } : undefined}>
              {/* Precios del menú de hoy: cómo se cobra el menú completo
                  («Completo $95», «Solo guisado $70»). */}
              {!!menuPrices.length && (
                <View style={s.group} accessible accessibilityLabel={menuPricesAccessibilityLabel(menuPrices)}>
                  {menuPrices.map((item, index) => (
                    <View key={`${index}-${item.label}`} style={s.groupItem}>
                      <Text style={s.groupItemName} allowFontScaling={true}>{noWidow(item.label || 'Precio del menú')}</Text>
                      <Text style={s.groupItemPrice} allowFontScaling={true}>{item.price}</Text>
                    </View>
                  ))}
                </View>
              )}
              {/* Fotos de platillos: el menú sigue en texto; se ven
                  manteniendo presionado. Si todos tienen foto basta esta
                  línea; si solo algunos, la marca junto al nombre dice cuáles. */}
              {/* Sin menú de hoy, lo que se ve es la carta: dice de cuándo son sus precios. */}
              {!patio.hasTodayMenu && !!preciosLabel && menuGroups.length > 0 && (
                <Text style={s.cartaNote} allowFontScaling={true}>{noWidow(`${preciosLabel}.`)}</Text>
              )}
              {menuGroups.map((section, sectionIndex) => (
                <View key={`${sectionIndex}-${section.section}`} style={s.group} onLayout={(event) => { groupY.current[sectionIndex] = event.nativeEvent.layout.y; }}>
                  {/* La carta (lo de siempre) empieza después de lo de hoy. */}
                  {/* Como en el pizarrón, «CARTA $110»: si la primera sección de
                      la carta se llama así, su precio va junto al título. */}
                  {!!carta.length && sectionIndex === sections.length && (
                    <View style={s.cartaHead}>
                      <View style={s.cartaTitleRow}>
                        <Text style={[s.cartaTitle, { flex: 1 }]} accessibilityRole="header" allowFontScaling={true}>La carta</Text>
                        {isCartaName(section.section) && !!section.price && (
                          <Text style={s.groupPrice} allowFontScaling={true}>{section.price}</Text>
                        )}
                      </View>
                      <Text style={s.cartaNote} allowFontScaling={true}>{noWidow(preciosLabel ? `Lo que hay todos los días. ${preciosLabel}.` : 'Lo que hay todos los días.')}</Text>
                    </View>
                  )}
                  {/* «MENÚ DEL DÍA» sin precio no repite título; con precio es el
                      «MENÚ $100» del pizarrón y sí sale. */}
                  {(!!section.price || !['menu del dia', 'menu de hoy'].includes(
                    section.section.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(),
                  )) && !(sectionIndex >= sections.length && isCartaName(section.section)) && (
                    <View style={s.groupHead}>
                      <Text style={[s.groupTitle, { flex: 1 }]} accessibilityRole="header" allowFontScaling={true}>{noWidow(sectionDisplayName(section.section))}</Text>
                      {/* Precio común de la sección: cada platillo cuesta eso
                          salvo el que trae el suyo. */}
                      {!!section.price && <Text style={s.groupPrice} allowFontScaling={true}>{section.price}</Text>}
                    </View>
                  )}
                  {section.items.map((item) => {
                    const itemKeys = dishKeysOf(item);
                    const dishLiked = itemKeys.some((key) => likedKeys.has(key));
                    const dishLikes = itemKeys.reduce((sum, key) => sum + (likeCountByKey.get(key) ?? 0), 0);
                    const featured = !!featuredKey && itemKeys.includes(featuredKey);
                    const dishKey = `${sectionIndex}-${item.name}`;
                    const photos = dishPhotosByKey.get(dishKey) ?? [];
                    return (
                      <View
                        key={`${section.section}-${item.name}`}
                        style={s.dishBlock}
                        onLayout={(event) => { dishY.current[dishKey] = event.nativeEvent.layout.y; }}>
                      <Pressable
                        style={s.dishRow}
                        // Con fotos: tocarlo las abre aquí mismo; mantenerlo, un vistazo.
                        disabled={!photos.length}
                        onPressIn={() => prefetchPhotos(photos.slice(0, 2).map((photo) => photo.url))}
                        onPress={() => toggleDish(dishKey)}
                        delayLongPress={280}
                        onLongPress={(event) => openDishPeek(item, false, event.nativeEvent.pageY)}
                        onPressOut={() => peekStore.set((current) => (current && !current.sticky ? null : current))}
                        accessible={false}>
                        <View style={{ flex: 1 }}>
                          {featured && (
                            <View style={s.featuredLabel}>
                              <Ionicons name="star" size={11} color={theme.accent} />
                              <Text style={s.featuredLabelText} allowFontScaling={true}>Recomendado</Text>
                            </View>
                          )}
                          {/* Con VoiceOver la foto se abre con una acción del nombre. */}
                          <Text
                            style={[s.groupItemName, item.soldOut && s.soldOutName]}
                            allowFontScaling={true}
                            accessibilityLabel={item.soldOut || item.vegetarian ? `${item.name}${item.vegetarian ? ', vegetariano' : ''}${item.soldOut ? ', se acabó hoy' : ''}` : undefined}
                            accessibilityHint={photos.length ? `${photos.length === 1 ? 'Tiene una foto' : `Tiene ${photos.length} fotos`}. Usa la acción Ver fotos para abrirlas o cerrarlas.` : undefined}
                            accessibilityActions={photos.length ? [{ name: 'activate', label: 'Ver fotos' }] : undefined}
                            onAccessibilityAction={() => toggleDish(dishKey)}>
                            {item.name}
                            {/* Solo el ícono dice que tiene fotos (sin número ni leyenda:
                                sería demasiado). Espacios que no se parten: nunca baja solo. */}
                            {photos.length > 0 && (
                              <Text style={s.dishPhotoMark}>
                                {'\u00A0\u00A0'}<Ionicons name="image-outline" size={14} color={theme.textMute} />
                              </Text>
                            )}
                            {/* Vegetariano: una hojita, igual de discreta que la de fotos. */}
                            {item.vegetarian && (
                              <Text style={s.dishPhotoMark}>
                                {'\u00A0\u00A0'}<Ionicons name="leaf-outline" size={14} color={theme.textMute} />
                              </Text>
                            )}
                          </Text>
                          {!!item.description && (
                            <Text style={s.groupItemDescription} allowFontScaling={true}>{noWidow(item.description)}</Text>
                          )}
                        </View>
                        {/* Se acabó hoy: lo dice en la columna del precio (el negocio lo marcó deslizando). */}
                        {item.soldOut
                          ? <Text style={[s.groupItemPrice, s.soldOutPrice]} allowFontScaling={true}>Se acabó</Text>
                          : !!item.price && <Text style={s.groupItemPrice} allowFontScaling={true}>{item.price}</Text>}
                        {own && ownPro && (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => handleFeatureDish(item)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={featured ? `Quitar ${item.name} como recomendado` : `Recomendar ${item.name}`}
                            accessibilityState={{ selected: featured }}
                            style={s.dishLikeCount}>
                            <Ionicons name={featured ? 'star' : 'star-outline'} size={17} color={featured ? theme.accent : theme.textMute} />
                          </TouchableOpacity>
                        )}
                        {own ? (
                          !!dishLikes && (
                            <View style={s.dishLikeCount} accessible accessibilityLabel={`${dishLikes} me gusta`}>
                              {/* El número a la izquierda: el corazón queda en la columna de todos. */}
                              <Text style={s.dishLikeCountText}>{dishLikes}</Text>
                              <View style={s.dishHeartBox}><Ionicons name="heart" size={13} color={theme.accent} /></View>
                            </View>
                          )
                        ) : (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => handleToggleDishLike(item)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`${dishLiked ? 'Quitar me gusta a' : 'Me gusta'} ${item.name}${dishLikes ? `, ${dishLikes} me gusta` : ''}`}
                            accessibilityState={{ selected: dishLiked }}
                            style={s.dishLikeCount}>
                            {dishLikes > 0 && <Text style={s.dishLikeCountText}>{dishLikes}</Text>}
                            <Ionicons name={dishLiked ? 'heart' : 'heart-outline'} size={17} color={dishLiked ? theme.accent : theme.textMute} />
                          </TouchableOpacity>
                        )}
                      </Pressable>
                      {!!photos.length && (
                        <DishPhotosSlot store={openDishStore} dishKey={dishKey} render={() => (
                        <DishGallery
                          dishName={item.name}
                          photos={photos}
                          initialWidth={windowWidth - 40}
                          authorFor={(photo) => (photo.by
                            ? {
                              name: shownName(photo.by, photo.mine) ?? photo.by,
                              onPress: photo.mine
                                ? (me && isAccountId(me.id) ? () => openProfile(me.id) : undefined)
                                : (canOpenProfile(photo.userId) ? () => openProfile(photo.userId!, photo.by) : undefined),
                            }
                            : { name: patio.name })}
                          likeFor={photoLike}
                          onToggleLike={togglePhotoLike}
                          menuFor={(photo) => photoMenu(photo, item.name)}
                        />
                        )} />
                      )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Detalles + mapa */}
          <View style={s.section}>
            {!!earnedBadges.length && (
              <View style={s.earnedBadges} accessibilityRole="toolbar" accessibilityLabel="Reconocimientos del Patio">
                {earnedBadges.map((badge) => (
                  <TouchableOpacity
                    key={badge.id}
                    style={[s.earnedBadge, activeBadgeId === badge.id && s.earnedBadgeActive]}
                    onPress={() => setActiveBadgeId((current) => current === badge.id ? null : badge.id)}
                    accessibilityRole="button"
                    accessibilityLabel={badge.title}
                    accessibilityState={{ expanded: activeBadgeId === badge.id }}>
                    <Ionicons name={badge.icon} size={19} color={activeBadgeId === badge.id ? theme.accent : theme.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={s.facts}>
              {/* Al tocar un reconocimiento, su significado ocupa el lugar de
                  la fila de datos (pagos y horario) sin mover lo de abajo: la
                  fila mide siempre lo que mide el texto más alto de todos los
                  reconocimientos (se miden ocultos), y la explicación se pone
                  encima de la fila, que solo se oculta. */}
              <View style={[s.factsStage, { minHeight: Math.max(48, badgeStageHeight) }]}>
                <View pointerEvents="none" style={s.badgeMeasure} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  {earnedBadges.map((badge) => (
                    <View
                      key={badge.id}
                      style={s.badgeInline}
                      onLayout={(event) => {
                        const height = Math.ceil(event.nativeEvent.layout.height);
                        badgeHeights.current[badge.id] = height;
                        const tallest = Math.max(0, ...Object.values(badgeHeights.current));
                        setBadgeStageHeight((current) => current === tallest ? current : tallest);
                      }}>
                      <Text style={s.badgeInlineTitle}>{badge.title}</Text>
                      <Text style={s.badgeInlineText}>{noWidow(badge.detail)}</Text>
                    </View>
                  ))}
                </View>
                {activeBadge && (
                  <TouchableOpacity style={[s.badgeInline, s.badgeOverlay]} onPress={() => setActiveBadgeId(null)} accessibilityRole="button" accessible accessibilityLabel={`${activeBadge.title}. ${activeBadge.detail}. Toca para cerrar`}>
                    <Text style={s.badgeInlineTitle}>{activeBadge.title}</Text>
                    <Text style={s.badgeInlineText}>{noWidow(activeBadge.detail)}</Text>
                  </TouchableOpacity>
                )}
                <View
                  style={[s.factsLine, activeBadge && { opacity: 0 }]}
                  pointerEvents={activeBadge ? 'none' : 'auto'}
                  importantForAccessibility={activeBadge ? 'no-hide-descendants' : 'auto'}
                  accessibilityElementsHidden={!!activeBadge}>
                {/* Tres lugares fijos (izquierda, centro, derecha): si falta un
                    dato, su hueco se queda y los demás no se recorren. */}
                {businessOpeningLabel ? (
                  <View style={s.factColumn} accessible accessibilityLabel={businessOpeningLabel}>
                    <Ionicons name="calendar-outline" size={13} color={theme.textMute} />
                    <Text style={s.historyMetaText}>{noWidow(businessOpeningLabel)}</Text>
                  </View>
                ) : <View style={s.factColumn} />}
                {!patio.payments.length ? <View style={[s.factColumn, s.factColumnCenter]} /> : (
                  <View style={[s.factColumn, s.factColumnCenter]} accessible accessibilityLabel={`Acepta ${patio.payments.join(', ')}`}>
                  <View style={s.payments}>
                    {PAYMENT_ORDER.filter((payment) => patio.payments.includes(payment)).map((payment) => (
                      <View key={payment} style={s.paymentIconBox}>
                        <PaymentIcon method={payment} size={18} color={theme.textMute} />
                      </View>
                    ))}
                  </View>
                  </View>
                )}
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={patio.weeklyHours?.length ? 'Ver horario semanal' : 'Horario no disponible'} accessibilityState={{ expanded: showSchedule, disabled: !patio.weeklyHours?.length }} disabled={!patio.weeklyHours?.length} style={[s.factColumn, s.factColumnRight]} onPress={() => setShowSchedule((value) => !value)}>
                  <Ionicons name="time-outline" size={14} color={theme.textMute} />
                  <Text style={[s.historyMetaText, s.factRight]}>{rangoHoy}</Text>
                  {!!patio.weeklyHours?.length && <Ionicons name={showSchedule ? 'chevron-up' : 'chevron-down'} size={11} color={theme.textMute} />}
                  </TouchableOpacity>
                </View>
              </View>
              {showSchedule && !!patio.weeklyHours?.length && (
                <View style={s.schedule}>
                  {patio.weeklyHours.map((day, index) => (
                    <View key={day.dia} style={[s.scheduleRow, index > 0 && s.scheduleDivider]}>
                      <Text style={s.scheduleDay}>{DAYS[day.dia]}</Text>
                      <Text style={s.scheduleHours}>{day.cerrado ? 'Cerrado' : !day.abre || !day.cierra ? 'Sin horario' : `${formatHHMM12(day.abre)}–${formatHHMM12(day.cierra)}`}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {!!busyness && (() => {
              const live = liveLabel(busyness);
              const peak = peakLabel(busyness);
              return (
                <View style={s.busySection}>
                  {/* Sin título (8 nov): la primera línea ya dice de qué se
                      trata y los detalles no llevan encabezados; un título
                      del tamaño de las secciones del menú competía con él. */}
                  <View style={s.busyCard} accessible accessibilityLabel={[live, peak].filter(Boolean).join('. ') || 'Qué tan lleno suele estar'}>
                    {!!live && (
                      <View style={s.busyLive}>
                        <View style={s.busyDot} />
                        <Text style={s.busyLead} allowFontScaling={true}>{noWidow(live)}</Text>
                      </View>
                    )}
                    {!!peak && <Text style={live ? s.busyNote : s.busyLead} allowFontScaling={true}>{noWidow(peak)}</Text>}
                    {!live && !peak && <Text style={s.busyLead} allowFontScaling={true}>{noWidow('Qué tan lleno suele estar')}</Text>}
                    <View style={s.busyBars}>
                      {busyness.hours.map((item) => (
                        <View key={item.hour} style={[s.busyBar, { height: `${Math.max(4, item.level)}%` as `${number}%` }, item.hour === busyness.currentHour && s.busyBarNow]} />
                      ))}
                    </View>
                    <View style={s.busyAxis}>
                      {busyness.hours.map((item, index) => (
                        <Text key={item.hour} style={s.busyAxisText} allowFontScaling={false}>{index % 2 === 0 ? axisHour(item.hour) : ''}</Text>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })()}
            {/* Solo a domicilio: su zona, sin pin ni indicaciones (no hay a dónde llegar). */}
            {patio.latitude > 0 && modalidad === 'domicilio' && (
              <View style={s.mapPanel} accessible accessibilityLabel={`Zona de ${patio.name}`}>
                <MapView
                  customMapStyle={theme.isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
                  initialRegion={{ latitude: patio.latitude, longitude: patio.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
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
                  <Circle center={{ latitude: patio.latitude, longitude: patio.longitude }} radius={600} fillColor={theme.isDark ? 'rgba(255,106,61,0.18)' : 'rgba(242,97,47,0.16)'} strokeColor={theme.accent} strokeWidth={1} />
                </MapView>
              </View>
            )}
            {patio.latitude > 0 && modalidad !== 'domicilio' && (
              <TouchableOpacity
                accessibilityLabel={`Abrir indicaciones para ${patio.name}`}
                accessibilityRole="button"
                style={s.mapPanel}
                onPress={() => handleComoLlegar()}
                activeOpacity={0.85}>
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
            {/* Dirección completa bajo el mapa (nunca se corta) y, a su derecha,
                si el negocio tiene WhatsApp, solo su ícono: abre el chat. Sin
                número, sin llamar y sin texto de botón (decisión de Parco, 15 nov). */}
            {(!!placeAddress || (!!patio.phone && patio.whatsapp)) && (
              <View style={s.addressRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.address} allowFontScaling={true}>{placeAddress ? noWidow(placeAddress) : ''}</Text>
                  {!!pedidosHasta && <Text style={s.address} allowFontScaling={true}>{noWidow(pedidosHasta)}</Text>}
                </View>
                {!!patio.phone && patio.whatsapp && (
                  <View style={s.contactIcons}>
                    {patio.whatsapp && (
                      <TouchableOpacity
                        style={s.contactIcon}
                        onPress={handleWhatsapp}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityLabel={`Escribir por WhatsApp a ${patio.name}`}>
                        <Ionicons name="logo-whatsapp" size={17} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
            {/* Sus otros lugares: otras sucursales, o dónde está cada día.
                Tocar uno abre las indicaciones a ese lugar. */}
            {modalidad !== 'domicilio' && puntos.length > 0 && (
              <View style={s.placesList}>
                <Text style={s.placesLabel} allowFontScaling={true}>{modalidad === 'itinerante' ? 'DÓNDE ESTÁ CADA DÍA' : 'OTRAS SUCURSALES'}</Text>
                {puntos.map((punto, index) => {
                  const today = modalidad === 'itinerante' && isToday(punto, weekday);
                  const detail = [modalidad === 'itinerante' ? diasLabel(punto.dias) : null, punto.direccion?.trim()].filter(Boolean).join(' · ');
                  return (
                    <TouchableOpacity
                      key={punto.id}
                      style={[s.placeRow, index > 0 && s.placeRowDivider]}
                      onPress={() => handleComoLlegar(punto)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${punto.nombre}${today ? ', hoy' : ''}${detail ? `, ${detail}` : ''}. Abrir indicaciones`}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.placeName} allowFontScaling={true}>{punto.nombre}</Text>
                        {!!detail && <Text style={s.address} allowFontScaling={true}>{noWidow(detail)}</Text>}
                      </View>
                      {today && <Text style={s.placeToday} allowFontScaling={true}>Hoy</Text>}
                      <Ionicons name="navigate-outline" size={15} color={theme.textMute} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View
            style={s.reviewSection}
            onLayout={(event) => {
              reviewsY.current = event.nativeEvent.layout.y;
              // Ficha corta: las reseñas ya se ven sin desplazarse.
              if (event.nativeEvent.layout.y < windowHeight) markReviewsNear();
            }}>
            <View style={s.reviewsSummary}>
              <View>
                <Text style={s.reviewsTitle}>Reseñas</Text>
              </View>
              {!own && <TouchableOpacity style={[s.reviewPrompt, reviewedToday && { opacity: 0.55 }]} onPress={reviewedToday ? undefined : () => handleStarPress(0)} disabled={reviewedToday} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={reviewedToday ? 'Ya reseñaste hoy' : userReview ? 'Registrar otra visita' : 'Reseñar este Patio'}>
                <Ionicons name={reviewedToday ? 'checkmark-circle-outline' : userReview ? 'add-circle-outline' : 'star-outline'} size={16} color={theme.accent} />
                <Text style={s.reviewPromptText}>{reviewedToday ? 'Reseña de hoy' : userReview ? 'Otra visita' : 'Reseñar'}</Text>
              </TouchableOpacity>}
            </View>
            {!!reviewTotal && (
              <View style={s.ratingOverview}>
                <TouchableOpacity
                  style={s.ratingScore}
                  onPress={() => setRatingFilter(null)}
                  accessibilityRole="button"
                  accessibilityLabel={`${ratingAverage.toFixed(1)} de 5, ${reviewTotal} reseñas. Mostrar todas`}>
                  <Text style={s.ratingAverage}>{ratingAverage.toFixed(1)}</Text>
                  <View style={s.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name={star <= Math.round(ratingAverage) ? 'star' : 'star-outline'} size={9} color={theme.accent} />)}
                  </View>
                  <Text style={[s.ratingAll, ratingFilter === null && { color: theme.accent }]}>({reviewTotal.toLocaleString('es-MX')})</Text>
                </TouchableOpacity>
                <View style={s.ratingBars}>
                  {ratingDistribution.map(({ stars, count }) => (
                    <TouchableOpacity
                      key={stars}
                      style={[s.ratingBarRow, (ratingFilter === null || ratingFilter === stars) && s.ratingBarRowActive]}
                      onPress={() => setRatingFilter(ratingFilter === stars ? null : stars)}
                      disabled={!count}
                      hitSlop={{ top: 3, bottom: 3, left: 0, right: 0 }}
                      accessibilityRole="button"
                      accessibilityLabel={`${stars} estrellas, ${count} reseñas`}>
                      <Text style={s.ratingBarLabel}>{stars}</Text>
                      <View style={s.ratingTrack}>
                        <View style={[s.ratingFill, { width: `${reviewTotal ? (count / reviewTotal) * 100 : 0}%` }]} />
                      </View>
                      <Text style={s.ratingCount}>{count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {visibleReviews.map((review, index) => (
              <View
                key={`${review.userId}-${review.timestamp}`}
                style={[s.reviewCard, index > 0 && s.reviewCardGap]}
                onLayout={(event) => { reviewCardY.current[`${review.userId}-${review.timestamp}`] = event.nativeEvent.layout.y; }}>
                <View style={s.reviewAuthorRow}>
                  {!review.isMine && canOpenProfile(review.userId) ? (
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openProfile(review.userId, review.author)} accessibilityRole="link" accessibilityLabel={`Ver perfil de ${review.author}`} hitSlop={{ top: 6, bottom: 6 }}>
                      <Text style={s.reviewAuthor}>{review.author}</Text>
                    </TouchableOpacity>
                  ) : <Text style={s.reviewAuthor}>{review.isMine ? shownName(review.author, true) ?? 'Tu reseña' : review.author}</Text>}
                  <Text style={s.reviewDate}>
                    {new Date(review.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  {!review.isMine && review.reviewId && <ContentSafetyMenu
                    targetType="review" targetId={review.reviewId} authorId={review.userId}
                    onBlocked={() => setHiddenAuthors((current) => [...current, review.userId])} />}
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
                {(() => {
                  // Las fotos de la visita (hasta 5), con su platillo y su frase:
                  // las mismas que salen en el menú. Se abren aquí mismo; ir al
                  // menú es opcional.
                  const photos = reviewPhotosOf(review);
                  if (!photos.length) return null;
                  return (
                    <ReviewPhotos
                      photos={photos}
                      load={reviewsNear}
                      inMenu={(dish) => !!dishTarget(dish)}
                      onOpenInMenu={showDishInMenu}
                    />
                  );
                })()}
                {!review.isMine && (() => {
                  const reviewKey = `${review.userId}-${review.timestamp}`;
                  const like = reviewLikes[reviewKey] ?? { count: 0, mine: false };
                  const replyCount = reviewReplies[reviewKey]?.length ?? 0;
                  const shareReview = () => Share.share({
                    message: `${review.author} calificó con ${review.stars} de 5 a ${patio?.name ?? 'este Patio'}${review.note ? `\n\n“${review.note}”` : ''}\n\npatio://patio/${patioId}`,
                  });
                  return (
                    <>
                      <View style={s.reviewActions}>
                        <TouchableOpacity
                          style={s.reviewAction}
                          hitSlop={4}
                          onPress={() => {
                            if (replyCount > 0) {
                              setExpandedThreads((current) => ({ ...current, [reviewKey]: !(current[reviewKey] ?? false) }));
                              setReplyingTo(null);
                              setReplyingToComment(null);
                            } else {
                              setReplyingTo((current) => current === reviewKey ? null : reviewKey);
                            }
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={replyCount > 0 ? (expandedThreads[reviewKey] ? 'Ocultar comentarios' : `Ver ${replyCount} comentarios`) : 'Comentar'}
                          accessibilityState={{ expanded: replyCount > 0 ? (expandedThreads[reviewKey] ?? false) : undefined }}>
                          <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
                          {!!replyCount && <Text style={s.reviewActionText}>{replyCount}</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.reviewAction}
                          hitSlop={4}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            setReviewLikes((current) => ({ ...current, [reviewKey]: { mine: !like.mine, count: Math.max(0, like.count + (like.mine ? -1 : 1)) } }));
                            if (review.reviewId) void toggleReviewLike(review.reviewId);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Me gusta"
                          accessibilityState={{ selected: like.mine }}>
                          <Ionicons name={like.mine ? 'heart' : 'heart-outline'} size={17} color={like.mine ? theme.accent : theme.textSecondary} />
                          {!!like.count && <Text style={[s.reviewActionText, like.mine && { color: theme.accent }]}>{like.count}</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.reviewAction}
                          hitSlop={4}
                          onPress={shareReview}
                          accessibilityRole="button"
                          accessibilityLabel="Compartir reseña">
                          <Ionicons name="share-outline" size={17} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      {!!reviewReplies[reviewKey]?.length && (() => {
                        const thread = reviewReplies[reviewKey];
                        const expanded = expandedThreads[reviewKey] ?? false;
                        const shownReplies = expanded ? thread : [];
                        const rootReplies = shownReplies.filter((reply) => !reply.parentId);
                        const renderComment = (reply: ReviewThreadReply, parentId: string) => {
                          const reaction = replyLikes[reply.id] ?? { count: reply.likes, mine: false };
                          return (
                            <View key={reply.id} style={s.reviewThreadItem}>
                              <View style={s.reviewThreadBubble}>
                                <View style={s.reviewThreadHead}>
                                  {reply.real && !reply.mine && !reply.patio && isAccountId(reply.userId) ? (
                                    <TouchableOpacity onPress={() => openProfile(reply.userId!)} accessibilityRole="link" accessibilityLabel={`Ver perfil de ${reply.author}`} hitSlop={{ top: 6, bottom: 6 }} style={s.reviewThreadAuthorLink}>
                                      <Text style={s.reviewThreadAuthor}>{reply.author}</Text>
                                    </TouchableOpacity>
                                  ) : <Text style={s.reviewThreadAuthor}>{reply.mine && !reply.patio ? shownName(reply.author, true) ?? 'Tú' : reply.author}</Text>}
                                  {reply.patio && (
                                    <View style={s.reviewThreadSeal}>
                                      <SymbolView name="checkmark.seal.fill" size={13} weight="medium" tintColor={theme.accent} fallback={<TintIcon source={ANDROID_ICONS.verified} size={13} color={theme.accent} />} />
                                    </View>
                                  )}
                                </View>
                                <Text style={s.reviewThreadText}>{reply.body}</Text>
                              </View>
                              <View style={s.reviewThreadActions}>
                                {!!reply.timeLabel && <Text style={s.reviewThreadTime}>{reply.timeLabel}</Text>}
                                <TouchableOpacity
                                  style={s.reviewThreadTextAction}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                  onPress={() => toggleCommentReaction(reply, reaction)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Me gusta el comentario de ${reply.mine ? 'ti' : reply.author}`}
                                  accessibilityState={{ selected: reaction.mine }}>
                                  <Text style={[s.reviewThreadTextActionLabel, reaction.mine && { color: theme.accent }]}>Me gusta{reaction.count ? ` · ${reaction.count}` : ''}</Text>
                                </TouchableOpacity>
                                {(reply.real || !isRealReviewId(review.reviewId)) && <TouchableOpacity
                                  style={s.reviewThreadTextAction}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                  onPress={() => {
                                    setReplyingToComment({ reviewKey, parentId, author: reply.mine && !reply.patio ? shownName(reply.author, true) ?? 'Tú' : reply.author });
                                    setReplyingTo(null);
                                    setReplyDraft('');
                                  }}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Responder a ${reply.mine ? 'tu comentario' : reply.author}`}>
                                  <Text style={s.reviewThreadTextActionLabel}>Responder</Text>
                                </TouchableOpacity>}
                                {reply.real && (reply.mine || review.isMine) && <TouchableOpacity
                                  style={s.reviewThreadTextAction}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                  onPress={() => removeComment(reviewKey, reply)}
                                  accessibilityRole="button"
                                  accessibilityLabel={reply.mine ? 'Eliminar tu comentario' : `Eliminar el comentario de ${reply.author}`}>
                                  <Text style={s.reviewThreadTextActionLabel}>Eliminar</Text>
                                </TouchableOpacity>}
                                {reply.real && !reply.mine && <TouchableOpacity
                                  style={s.reviewThreadTextAction}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                  onPress={() => reportComment(reply)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Reportar el comentario de ${reply.author}`}>
                                  <Text style={s.reviewThreadTextActionLabel}>Reportar</Text>
                                </TouchableOpacity>}
                              </View>
                            </View>
                          );
                        };
                        return (
                          <View style={[s.reviewThread, !expanded && { borderLeftWidth: 0, paddingLeft: 0 }]}>
                            {rootReplies.map((reply) => {
                              const children = shownReplies.filter((candidate) => candidate.parentId === reply.id);
                              const inlineReplying = replyingToComment?.reviewKey === reviewKey && replyingToComment.parentId === reply.id;
                              return (
                                <View key={reply.id}>
                                  {renderComment(reply, reply.id)}
                                  {!!children.length && (
                                    <View style={s.reviewThreadChildren}>
                                      {children.map((child) => renderComment(child, reply.id))}
                                    </View>
                                  )}
                                  {inlineReplying && (
                                    <View style={[s.reviewReplyRow, s.reviewInlineReplyRow]}>
                                      <TextInput value={replyDraft} onChangeText={setReplyDraft} placeholder={`Responder a ${replyingToComment.author}`} placeholderTextColor={theme.textMute} style={s.reviewReplyInput} maxLength={280} autoFocus />
                                      <TouchableOpacity
                                        style={[s.reviewReplySend, (!replyDraft.trim() || sendingComment) && { opacity: 0.35 }]}
                                        hitSlop={3}
                                        disabled={!replyDraft.trim() || sendingComment}
                                        onPress={() => { void sendComment(review.reviewId, reviewKey, reply); }}
                                        accessibilityRole="button"
                                        accessibilityLabel={sendingComment ? 'Publicando respuesta' : 'Publicar respuesta'}
                                        accessibilityState={{ disabled: !replyDraft.trim() || sendingComment, busy: sendingComment }}>
                                        <SymbolView name="paperplane.fill" size={15} weight="semibold" tintColor="#FFFFFF" fallback={<TintIcon source={ANDROID_ICONS.send} size={15} color="#FFFFFF" />} />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        );
                      })()}
                      {((expandedThreads[reviewKey] ?? false) || replyingTo === reviewKey) && replyingToComment?.reviewKey !== reviewKey && (
                        <View style={s.reviewReplyRow}>
                          <TextInput value={replyDraft} onChangeText={setReplyDraft} placeholder="Escribe un comentario" placeholderTextColor={theme.textMute} style={s.reviewReplyInput} maxLength={280} />
                          <TouchableOpacity
                            style={[s.reviewReplySend, (!replyDraft.trim() || sendingComment) && { opacity: 0.35 }]}
                            hitSlop={3}
                            disabled={!replyDraft.trim() || sendingComment}
                            onPress={() => { void sendComment(review.reviewId, reviewKey); }}
                            accessibilityRole="button"
                            accessibilityLabel={sendingComment ? 'Publicando comentario' : 'Publicar comentario'}
                            accessibilityState={{ disabled: !replyDraft.trim() || sendingComment, busy: sendingComment }}>
                            <SymbolView name="paperplane.fill" size={15} weight="semibold" tintColor="#FFFFFF" fallback={<TintIcon source={ANDROID_ICONS.send} size={15} color="#FFFFFF" />} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            ))}
            {reviewsPaged.hasMore && (
              <TouchableOpacity
                style={s.moreReviews}
                onPress={reviewsPaged.loadMore}
                disabled={reviewsPaged.loadingMore}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Ver más reseñas">
                {reviewsPaged.loadingMore
                  ? <ActivityIndicator size="small" color={theme.textSecondary} />
                  : <Text style={s.moreReviewsText}>Ver más</Text>}
              </TouchableOpacity>
            )}
            {!reviewTotal && userReview && (
              <Text style={s.reviewNote}>{noWidow('Tu reseña será la primera experiencia compartida sobre este Patio.')}</Text>
            )}
          </View>

        </View>
      </Animated.ScrollView>
      {menuGroups.length >= 4 && barVisible && (
        <Animated.View style={[s.sectionBar, { opacity: barOpacity.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: barOpacity.interpolate({ inputRange: [0, 1], outputRange: [-barHeight, 0] }) }] }]} pointerEvents={barVisibleRef.current ? 'auto' : 'none'}>
          <SectionBar
            names={menuGroups.map((section) => section.section)}
            active={activeSection}
            onSelect={jumpToSection}
            colors={{ text: theme.text, textSecondary: theme.textSecondary, bg: theme.bg, border: theme.border, glass: theme.glass, isDark: theme.isDark }}
            style={{ paddingTop: insets.top }}
          />
        </Animated.View>
      )}
      {/* Volver a donde estabas después de un salto: va en el lugar de «Volver
          arriba» (un solo control flotante a la vez). */}
      {!!returnTo && !followToast && (
        <View style={[s.backToTopDock, { bottom: backToTopBottom }]} pointerEvents="box-none">
          <View style={[s.returnPillShadow, floatingSurfaceShadow(theme.isDark)]}>
            <TouchableOpacity style={s.returnPill} onPress={goBackFromJump} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={returnTo.label}>
              <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <Ionicons name={returnTo.icon} size={16} color={theme.text} />
              <Text style={s.returnPillText} allowFontScaling={true}>{returnTo.label}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {longFicha && !followToast && !returnTo && (
        <Animated.View
          pointerEvents={backToTopVisible ? 'box-none' : 'none'}
          accessibilityElementsHidden={!backToTopVisible}
          importantForAccessibility={backToTopVisible ? 'auto' : 'no-hide-descendants'}
          style={[s.backToTopDock, {
            bottom: backToTopBottom,
            opacity: backToTopOpacity,
            // Sube desde fuera de la pantalla, desde el borde de abajo.
            transform: [{ translateY: backToTopOpacity.interpolate({ inputRange: [0, 1], outputRange: [backToTopBottom + 48, 0] }) }],
          }]}>
          <View style={[s.backToTop, floatingSurfaceShadow(theme.isDark)]}>
            <GlassIconButton icon="arrow-up" iconSize={18} accessibilityLabel="Volver arriba" onPress={scrollToTop} />
          </View>
        </Animated.View>
      )}
      <PeekLayer store={peekStore} />
      <DishPhotoFix
        photo={fixingPhoto?.photo ?? null}
        dish={fixingPhoto?.dish ?? ''}
        dishOptions={dishNames}
        onClose={() => setFixingPhoto(null)}
        onSave={async (dish) => {
          if (!fixingPhoto) return;
          const { photo } = fixingPhoto;
          // Solo cambia de qué platillo es; una frase que ya tuviera se queda igual.
          if (photo.photoId && photo.reviewId && isRealReviewId(photo.reviewId)) await updateMyReviewPhoto(photo.photoId, dish, photo.note);
          setPhotoEdits((current) => ({ ...current, [editKeyOf(photoKey(photo), { id: photo.photoId, url: photo.url })]: { dish, note: photo.note } }));
          // Si cambió de platillo, se abre ese para ver dónde quedó.
          if (dishKey(dish) !== dishKey(fixingPhoto.dish)) {
            const target = dishTarget(dish);
            if (target) openDishPhotos(target.key);
          }
        }}
      />
      {followToast && (
        <View style={[s.followToast, { bottom: insets.bottom + 16 }, floatingSurfaceShadow(theme.isDark)]} accessibilityLiveRegion="polite">
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={[s.followToastInner, { backgroundColor: sheetSurfaceTint(theme.isDark), borderColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="notifications-outline" size={18} color={theme.text} />
            <Text style={s.followToastText} allowFontScaling={true}>{noWidow(notifyMode === 'every' ? 'Te avisaremos cuando publique' : 'Saldrá en tu resumen del día')}</Text>
            <TouchableOpacity style={s.followToastAction} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Cambiar avisos de este lugar"
              onPress={() => { setFollowToast(false); setFollowMenu(true); }}>
              <Text style={s.followToastActionText}>Cambiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.followToastClose} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setFollowToast(false)}>
              <Ionicons name="close" size={17} color={theme.textSecondary} />
            </TouchableOpacity>
          </BlurView>
        </View>
      )}
      <ActionSheet
        visible={followMenu}
        anchorRef={followAnchor}
        onDismiss={() => setFollowMenu(false)}
        options={[
          ...(['every', 'digest', 'off'] as PatioNotifyMode[]).map((mode): ActionSheetOption => ({
            label: PATIO_NOTIFY_LABELS[mode],
            icon: PATIO_NOTIFY_ICONS[mode],
            accessibilityHint: PATIO_NOTIFY_HINTS[mode],
            description: PATIO_NOTIFY_HINTS[mode],
            selected: notifyMode === mode,
            sectionLabel: mode === 'every' ? 'Notificaciones' : undefined,
            onPress: () => { void chooseNotifyMode(mode); },
          })),
          { label: 'Agregar a una lista', icon: 'list-outline', afterDismiss: true, sectionLabel: 'Lugar', onPress: () => setSaveSheetVisible(true) },
          { label: 'Dejar de seguir', icon: 'person-remove-outline', destructive: true, onPress: () => { void handleToggleSaved(); } },
        ]}
      />
      <SaveToListSheet
        visible={saveSheetVisible}
        patioIds={[patio.id]}
        patioName={patio.name}
        onDismiss={() => setSaveSheetVisible(false)}
      />
      {own && <BottomTabBar variant="fondero" />}

    </View>
  );
}
