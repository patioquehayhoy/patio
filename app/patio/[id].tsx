import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { SaveToListSheet } from '@/components/save-to-list-sheet';
import { usePatioDetailController } from '@/lib/controllers/usePatioDetailController';
import { getLikedDishNames, toggleDishLike } from '@/lib/dish-likes';
import { canonicalDishName } from '@/lib/menu-store';
import { formatHHMM12 } from '@/lib/horario';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { Fonts, Radius, Spacing, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type ReviewThreadReply = {
  id: string;
  author: string;
  body: string;
  likes: number;
  mine?: boolean;
  patio?: boolean;
  parentId?: string;
  timeLabel?: string;
};

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

const HERO_HEIGHT = 300;
const OPEN_GREEN = '#1F9D55';
const PULL_TO_DISMISS_THRESHOLD = 93;
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

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    heroBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, height: HERO_HEIGHT + 120, width: '100%' },
    scrollContent: { paddingBottom: 120 },
    // ── Hero ──
    hero: { height: HERO_HEIGHT, backgroundColor: 'transparent', overflow: 'hidden' },
    heroImgMuted: { opacity: 0.55 },
    soldBanner: { position: 'absolute', alignSelf: 'center', top: HERO_HEIGHT * 0.5, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100, backgroundColor: t.accent, shadowColor: t.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6, zIndex: 15 },
    soldBannerText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: '#fff' },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    heroNav: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
    glassIcon: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
    // ── Card traslapada ──
    card: { marginTop: -28, backgroundColor: t.bg, borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet, paddingHorizontal: 20, paddingTop: 22 },
    statusRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 7, height: 7, borderRadius: 3.5 },
    statusText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
    schedule: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: t.surface },
    scheduleRow: { minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scheduleDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    scheduleDay: { fontSize: 12.5, fontWeight: '600', color: t.text },
    scheduleHours: { fontSize: 12.5, color: t.textSecondary },
    titleRow: { marginBottom: 6 },
    title: { fontSize: 36, lineHeight: 38, fontWeight: '900', letterSpacing: -1, fontFamily: Fonts.brand, color: t.text },
    verifiedMark: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    subtitle: { fontSize: 14, color: t.textSecondary, marginBottom: 16 },
    payments: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    paymentIconBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    // ── Menú agrupado ──
    menuSoldWrap: { position: 'relative', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, borderRadius: 18, padding: 16, marginBottom: 16, backgroundColor: t.surface },
    agotadoBadge: { position: 'absolute', right: 14, bottom: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: t.text },
    agotadoBadgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: t.bg },
    mananaCard: { padding: 16, borderRadius: 18, backgroundColor: t.accentSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(242,97,47,0.2)', marginBottom: 16 },
    mananaHead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    mananaEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: t.accent },
    mananaBody: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: t.text },
    group: { marginBottom: 22 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    groupTitle: { fontSize: 12.5, lineHeight: 17, fontWeight: '700', letterSpacing: 0.55, textTransform: 'uppercase', color: t.accent },
    groupItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
    groupItemName: { flex: 1, fontSize: 16, fontWeight: '600', color: t.text, letterSpacing: -0.18, lineHeight: 21 },
    groupItemDescription: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.03, color: t.textSecondary },
    groupItemPrice: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: t.text },
    dishLikeBtn: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center' },
    groupDashed: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border, marginTop: 4 },
    reviewSection: { paddingTop: 28, marginBottom: 22 },
    reviewsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    reviewsTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    ratingOverview: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingVertical: 4 },
    ratingScore: { width: 84, minHeight: 88, alignItems: 'center', justifyContent: 'center' },
    ratingAverage: { fontSize: 34, lineHeight: 38, fontWeight: '900', fontFamily: Fonts.brand, color: t.text, letterSpacing: -1 },
    ratingStars: { flexDirection: 'row', gap: 1, marginTop: 3 },
    ratingAll: { marginTop: 5, fontSize: 11.5, fontWeight: '600', color: t.textSecondary },
    ratingBars: { flex: 1, gap: 4 },
    ratingBarRow: { minHeight: 17, flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.62 },
    ratingBarRowActive: { opacity: 1 },
    ratingBarLabel: { width: 10, fontSize: 10.5, fontWeight: '600', color: t.textSecondary, textAlign: 'right' },
    ratingTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: t.border },
    ratingFill: { height: 4, borderRadius: 2, backgroundColor: t.accent },
    ratingCount: { width: 15, fontSize: 10.5, color: t.textMute, textAlign: 'right' },
    reviewCard: { paddingHorizontal: 16, paddingTop: 11, paddingBottom: 4, borderRadius: 18, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    reviewCardGap: { marginTop: 10 },
    reviewAuthorRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
    reviewAuthor: { flex: 1, fontSize: 14, fontWeight: '700', color: t.text },
    reviewDate: { fontSize: 11.5, color: t.textMute },
    reviewStars: { flexDirection: 'row', gap: 4, marginBottom: 10 },
    reviewReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
    reviewReason: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100, backgroundColor: t.accentSoft },
    reviewReasonText: { fontSize: 11, fontWeight: '600', color: t.textSecondary },
    reviewNote: { fontSize: 14, lineHeight: 20, color: t.text },
    businessReply: { marginTop: 14, paddingTop: 12, paddingLeft: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, borderLeftWidth: 2, borderLeftColor: t.accent },
    reviewActions: { height: 36, marginTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewAction: { minWidth: 44, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    reviewActionText: { fontSize: 12.5, fontWeight: '700', color: t.textSecondary },
    reviewThread: { marginTop: 6, gap: 4, paddingLeft: 10, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.border },
    reviewThreadItem: { alignItems: 'flex-start' },
    reviewThreadChildren: { marginLeft: 18, paddingLeft: 9, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.border, gap: 4 },
    reviewThreadBubble: { maxWidth: '94%', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 15, backgroundColor: t.bg },
    reviewThreadHead: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewThreadAuthor: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16, fontWeight: '800', color: t.text },
    reviewThreadSeal: { width: 16, height: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    reviewThreadText: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: t.textSecondary },
    reviewThreadActions: { height: 29, paddingLeft: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewThreadTime: { paddingHorizontal: 4, fontSize: 10.5, color: t.textMute },
    reviewThreadTextAction: { height: 28, paddingHorizontal: 5, justifyContent: 'center' },
    reviewThreadTextActionLabel: { fontSize: 11, fontWeight: '700', color: t.textSecondary },
    reviewReplyRow: { marginTop: 8, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewInlineReplyRow: { marginLeft: 18, marginTop: 3, paddingTop: 7 },
    reviewReplyInput: { flex: 1, minHeight: 38, borderRadius: 12, paddingHorizontal: 11, color: t.text, backgroundColor: t.bg },
    reviewReplySend: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent },
    reviewPrompt: { minHeight: 44, borderRadius: 22, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: t.surface },
    reviewPromptText: { fontSize: 13, fontWeight: '700', color: t.text },
    // ── Detalles + mapa ──
    section: { paddingTop: 6 },
    earnedBadges: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    earnedBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    earnedBadgeActive: { backgroundColor: t.accentSoft, borderColor: t.accent },
    facts: { marginTop: 4, marginBottom: 14, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    factsStage: { height: 48, justifyContent: 'center', overflow: 'hidden' },
    factsLine: { height: 48, flexDirection: 'row', alignItems: 'center' },
    factColumn: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    factColumnCenter: { justifyContent: 'center' },
    factColumnRight: { justifyContent: 'flex-end' },
    historyMetaText: { fontSize: 11.5, color: t.textMute, flexShrink: 1 },
    badgeInline: { height: 48, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 12 },
    badgeInlineTitle: { fontSize: 12.5, fontWeight: '800', color: t.text, textAlign: 'left' },
    badgeInlineText: { marginTop: 1, fontSize: 11.5, lineHeight: 15, color: t.textSecondary, textAlign: 'left' },
    mapPanel: { height: 92, borderRadius: 18, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapMarker: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#111214', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.82)', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.24, shadowRadius: 6, elevation: 4 },
  });
}

export default function PatioDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [showSchedule, setShowSchedule] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const [reviewLikes, setReviewLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [reviewReplies, setReviewReplies] = useState<Record<string, ReviewThreadReply[]>>({});
  const [replyLikes, setReplyLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<{ reviewKey: string; parentId: string; author: string } | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const pullDismissed = useRef(false);
  const heroPullY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const {
    cleanId,
    handleBack,
    handleComoLlegar,
    handleShare,
    handleStarPress,
    handleToggleSaved,
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

  const handleSavePress = async () => {
    if (!isSaved) await handleToggleSaved();
    setSaveSheetVisible(true);
  };

  // Like por platillo: micro-señal de compromiso de fricción casi cero,
  // independiente de la reseña completa (lib/dish-likes.ts).
  const [likedDishNames, setLikedDishNames] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!patio?.id) return;
    getLikedDishNames(patio.id).then(setLikedDishNames).catch(() => {});
  }, [patio?.id]);

  const handleToggleDishLike = async (dishName: string) => {
    if (!patio?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const nowLiked = await toggleDishLike(patio.id, dishName);
    setLikedDishNames((current) => {
      const next = new Set(current);
      const key = canonicalDishName(dishName);
      if (nowLiked) next.add(key); else next.delete(key);
      return next;
    });
  };

  useEffect(() => {
    const likes: Record<string, { count: number; mine: boolean }> = {};
    const replies: Record<string, ReviewThreadReply[]> = {};
    reviews.forEach((review) => {
      const key = `${review.userId}-${review.timestamp}`;
      const synthetic = review.userId.startsWith('demo-');
      likes[key] = {
        count: review.userId === 'demo-critical-1'
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
            timeLabel: '1 h',
          },
          ...(replies[key] ?? []),
        ];
      }
    });
    setReviewLikes(likes);
    setReviewReplies(replies);
  }, [patio?.name, reviews]);

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

  const GlassIcon = ({ name, size = 17, onPress, color, label, selected }: { name: keyof typeof Ionicons.glyphMap; size?: number; onPress: () => void; color?: string; label: string; selected?: boolean }) => (
    <TouchableOpacity
      style={s.glassIcon}
      onPress={onPress}
      activeOpacity={0.76}
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
        <View style={{ paddingHorizontal: 20 }}>
          <GlassIcon name="chevron-back" size={22} onPress={handleBack} label="Regresar" />
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
          <GlassIcon name="chevron-back" size={22} onPress={handleBack} label="Regresar" />
          <Text style={[s.title, { marginTop: 24 }]}>No encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.Image
        source={heroPhoto}
        style={[
          s.heroBackdrop,
          soldOut && s.heroImgMuted,
          { transform: [{ scale: heroPullY.interpolate({ inputRange: [-120, 0], outputRange: [1.045, 1], extrapolate: 'clamp' }) }] },
        ]}
        resizeMode="cover"
      />
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: heroPullY } } }],
          {
            useNativeDriver: true,
            listener: (event: any) => {
              const y = event.nativeEvent.contentOffset.y;
              if (y >= 0) pullDismissed.current = false;
              if (y < -PULL_TO_DISMISS_THRESHOLD && !pullDismissed.current) {
                pullDismissed.current = true;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                handleBack();
              }
            },
          }
        )}>

        {/* Hero con foto botánica real + degradado que la funde con la card */}
        <View style={s.hero}>
          <LinearGradient
            colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.48)']}
            locations={[0, 0.62, 1]}
            style={s.heroGradient}
          />
          {soldOut && (
            <View style={s.soldBanner}>
              <Ionicons name="time-outline" size={13} color="#fff" />
              <Text style={s.soldBannerText} allowFontScaling={true}>{noWidow('Se acabó por hoy')}</Text>
            </View>
          )}
          <View style={[s.heroNav, { top: insets.top + 8 }]}>
            <GlassIcon name="chevron-back" size={20} onPress={handleBack} label="Regresar" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <GlassIcon name="share-outline" size={17} onPress={handleShare} label="Compartir" />
              <GlassIcon
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={17}
                onPress={handleSavePress}
                color={isSaved ? theme.accent : theme.text}
                label={isSaved ? 'Guardado' : 'Guardar'}
                selected={isSaved}
              />
            </View>
          </View>
        </View>

        {/* Card traslapada */}
        <View style={s.card}>
          {(status !== null || patio.isVerifiedBusiness) && (
            <View style={s.statusRow}>
              {status !== null ? (
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
              ) : <View />}
              {patio.isVerifiedBusiness && (
                <View style={s.verifiedMark} accessible accessibilityLabel="Negocio verificado">
                  <SymbolView name="checkmark.seal.fill" size={25} weight="medium" tintColor={theme.accent} fallback={<Ionicons name="checkmark-circle" size={25} color={theme.accent} />} />
                </View>
              )}
            </View>
          )}
          <View style={s.titleRow}>
            <Text style={s.title} allowFontScaling={true}>{noWidow(patio.name)}</Text>
          </View>
          <Text style={s.subtitle} allowFontScaling={true}>{patio.categories.join(' · ')} · {patio.area}</Text>
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
                  {section.items.map((item) => {
                    const dishLiked = likedDishNames.has(canonicalDishName(item.name));
                    return (
                      <View key={`${section.section}-${item.name}`} style={s.groupItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.groupItemName} allowFontScaling={true}>{item.name}</Text>
                          {!!item.description && (
                            <Text style={s.groupItemDescription} allowFontScaling={true}>{noWidow(item.description)}</Text>
                          )}
                        </View>
                        {!!item.price && <Text style={s.groupItemPrice} allowFontScaling={true}>{item.price}</Text>}
                        <TouchableOpacity
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => handleToggleDishLike(item.name)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={dishLiked ? `Quitar like a ${item.name}` : `Dar like a ${item.name}`}
                          accessibilityState={{ selected: dishLiked }}
                          style={s.dishLikeBtn}>
                          <Ionicons name={dishLiked ? 'heart' : 'heart-outline'} size={17} color={dishLiked ? theme.accent : theme.textMute} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
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
              <Text style={s.mananaBody} allowFontScaling={true}>{noWidow('Vuelve mañana por el menú del día. Guárdalo y te avisamos cuando publiquen.')}</Text>
            </View>
          )}

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
              <View style={s.factsStage}>
                {activeBadge ? (
                  <TouchableOpacity style={s.badgeInline} onPress={() => setActiveBadgeId(null)} accessibilityRole="button" accessible accessibilityLabel={`${activeBadge.title}. ${activeBadge.detail}. Toca para cerrar`}>
                    <Text style={s.badgeInlineTitle}>{activeBadge.title}</Text>
                    <Text style={s.badgeInlineText} numberOfLines={2}>{activeBadge.detail}</Text>
                  </TouchableOpacity>
                ) : <View style={s.factsLine}>
                {businessOpeningLabel && (
                  <View style={s.factColumn} accessible accessibilityLabel={businessOpeningLabel}>
                    <Ionicons name="calendar-outline" size={13} color={theme.textMute} />
                    <Text style={s.historyMetaText} numberOfLines={1}>{businessOpeningLabel}</Text>
                  </View>
                )}
                {!!patio.payments.length && (
                  <View style={[s.factColumn, s.factColumnCenter]} accessible accessibilityLabel={`Acepta ${patio.payments.join(', ')}`}>
                  <View style={s.payments}>
                    {PAYMENT_ORDER.filter((payment) => patio.payments.includes(payment)).map((payment) => {
                      const icon = PAYMENT_SYMBOLS[payment];
                      return (
                        <View key={payment} style={s.paymentIconBox}>
                          <SymbolView name={icon.symbol} size={icon.size} weight="regular" tintColor={theme.textMute} fallback={<Ionicons name={icon.fallback} size={icon.size} color={theme.textMute} />} />
                        </View>
                      );
                    })}
                  </View>
                  </View>
                )}
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={patio.weeklyHours?.length ? 'Ver horario semanal' : 'Horario no disponible'} accessibilityState={{ expanded: showSchedule, disabled: !patio.weeklyHours?.length }} disabled={!patio.weeklyHours?.length} style={[s.factColumn, s.factColumnRight]} onPress={() => setShowSchedule((value) => !value)}>
                  <Ionicons name="time-outline" size={14} color={theme.textMute} />
                  <Text style={s.historyMetaText} numberOfLines={1}>{rangoHoy}</Text>
                  {!!patio.weeklyHours?.length && <Ionicons name={showSchedule ? 'chevron-up' : 'chevron-down'} size={11} color={theme.textMute} />}
                  </TouchableOpacity>
                </View>}
              </View>
              {showSchedule && !!patio.weeklyHours?.length && (
                <View style={s.schedule}>
                  {patio.weeklyHours.map((day, index) => (
                    <View key={day.dia} style={[s.scheduleRow, index > 0 && s.scheduleDivider]}>
                      <Text style={s.scheduleDay}>{DAYS[day.dia]}</Text>
                      <Text style={s.scheduleHours}>{day.cerrado || !day.abre || !day.cierra ? 'Cerrado' : `${formatHHMM12(day.abre)}–${formatHHMM12(day.cierra)}`}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
              <TouchableOpacity style={[s.reviewPrompt, reviewedToday && { opacity: 0.55 }]} onPress={reviewedToday ? undefined : () => handleStarPress(0)} disabled={reviewedToday} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={reviewedToday ? 'Ya reseñaste hoy' : userReview ? 'Registrar otra visita' : 'Reseñar este Patio'}>
                <Ionicons name={reviewedToday ? 'checkmark-circle-outline' : userReview ? 'add-circle-outline' : 'star-outline'} size={16} color={theme.accent} />
                <Text style={s.reviewPromptText}>{reviewedToday ? 'Reseña de hoy' : userReview ? 'Otra visita' : 'Reseñar'}</Text>
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
                  <Text style={[s.ratingAll, ratingFilter === null && { color: theme.accent }]}>({reviews.length})</Text>
                </TouchableOpacity>
                <View style={s.ratingBars}>
                  {ratingDistribution.map(({ stars, count }) => (
                    <TouchableOpacity
                      key={stars}
                      style={[s.ratingBarRow, (ratingFilter === null || ratingFilter === stars) && s.ratingBarRowActive]}
                      onPress={() => setRatingFilter((current) => current === stars ? null : stars)}
                      disabled={!count}
                      hitSlop={{ top: 3, bottom: 3, left: 0, right: 0 }}
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
              <View
                key={`${review.userId}-${review.timestamp}`}
                style={[s.reviewCard, index > 0 && s.reviewCardGap]}>
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
                          onPress={() => setReviewLikes((current) => ({ ...current, [reviewKey]: { mine: !like.mine, count: Math.max(0, like.count + (like.mine ? -1 : 1)) } }))}
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
                        const renderComment = (reply: ReviewThreadReply, replyIndex: number, parentId: string) => {
                          const reaction = replyLikes[reply.id] ?? { count: reply.likes, mine: false };
                          return (
                            <View key={reply.id} style={s.reviewThreadItem}>
                              <View style={s.reviewThreadBubble}>
                                <View style={s.reviewThreadHead}>
                                  <Text style={s.reviewThreadAuthor} numberOfLines={1}>{reply.mine ? 'Tú' : reply.author}</Text>
                                  {reply.patio && (
                                    <View style={s.reviewThreadSeal}>
                                      <SymbolView name="checkmark.seal.fill" size={13} weight="medium" tintColor={theme.accent} fallback={<Ionicons name="checkmark-circle" size={13} color={theme.accent} />} />
                                    </View>
                                  )}
                                </View>
                                <Text style={s.reviewThreadText}>{reply.body}</Text>
                              </View>
                              <View style={s.reviewThreadActions}>
                                <Text style={s.reviewThreadTime}>{reply.timeLabel ?? `${replyIndex + 1} h`}</Text>
                                <TouchableOpacity
                                  style={s.reviewThreadTextAction}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                  onPress={() => setReplyLikes((current) => ({
                                    ...current,
                                    [reply.id]: {
                                      mine: !reaction.mine,
                                      count: Math.max(0, reaction.count + (reaction.mine ? -1 : 1)),
                                    },
                                  }))}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Me gusta el comentario de ${reply.mine ? 'ti' : reply.author}`}
                                  accessibilityState={{ selected: reaction.mine }}>
                                  <Text style={[s.reviewThreadTextActionLabel, reaction.mine && { color: theme.accent }]}>Me gusta{reaction.count ? ` · ${reaction.count}` : ''}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={s.reviewThreadTextAction}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                  onPress={() => {
                                    setReplyingToComment({ reviewKey, parentId, author: reply.mine ? 'Tú' : reply.author });
                                    setReplyingTo(null);
                                    setReplyDraft('');
                                  }}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Responder a ${reply.mine ? 'tu comentario' : reply.author}`}>
                                  <Text style={s.reviewThreadTextActionLabel}>Responder</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        };
                        return (
                          <View style={[s.reviewThread, !expanded && { borderLeftWidth: 0, paddingLeft: 0 }]}>
                            {rootReplies.map((reply, rootIndex) => {
                              const children = shownReplies.filter((candidate) => candidate.parentId === reply.id);
                              const inlineReplying = replyingToComment?.reviewKey === reviewKey && replyingToComment.parentId === reply.id;
                              return (
                                <View key={reply.id}>
                                  {renderComment(reply, rootIndex, reply.id)}
                                  {!!children.length && (
                                    <View style={s.reviewThreadChildren}>
                                      {children.map((child, childIndex) => renderComment(child, childIndex, reply.id))}
                                    </View>
                                  )}
                                  {inlineReplying && (
                                    <View style={[s.reviewReplyRow, s.reviewInlineReplyRow]}>
                                      <TextInput value={replyDraft} onChangeText={setReplyDraft} placeholder={`Responder a ${replyingToComment.author}`} placeholderTextColor={theme.textMute} style={s.reviewReplyInput} maxLength={280} autoFocus />
                                      <TouchableOpacity
                                        style={[s.reviewReplySend, !replyDraft.trim() && { opacity: 0.35 }]}
                                        hitSlop={3}
                                        disabled={!replyDraft.trim()}
                                        onPress={() => {
                                          const next = replyDraft.trim();
                                          const child: ReviewThreadReply = { id: `${reviewKey}-mine-${Date.now()}`, author: 'Tú', body: next, likes: 0, mine: true, parentId: reply.id };
                                          setReviewReplies((current) => ({ ...current, [reviewKey]: [...(current[reviewKey] ?? []), child] }));
                                          setReplyDraft('');
                                          setReplyingToComment(null);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Publicar respuesta">
                                        <SymbolView name="paperplane.fill" size={15} weight="semibold" tintColor="#FFFFFF" fallback={<Ionicons name="send" size={15} color="#FFFFFF" />} />
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
                            style={[s.reviewReplySend, !replyDraft.trim() && { opacity: 0.35 }]}
                            hitSlop={3}
                            disabled={!replyDraft.trim()}
                            onPress={() => {
                              const next = replyDraft.trim();
                              const reply: ReviewThreadReply = {
                                id: `${reviewKey}-mine-${Date.now()}`,
                                author: 'Tú',
                                body: next,
                                likes: 0,
                                mine: true,
                              };
                              setReviewReplies((current) => ({ ...current, [reviewKey]: [...(current[reviewKey] ?? []), reply] }));
                              setExpandedThreads((current) => ({ ...current, [reviewKey]: true }));
                              setReplyDraft('');
                              setReplyingTo(null);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Publicar respuesta">
                            <SymbolView name="paperplane.fill" size={15} weight="semibold" tintColor="#FFFFFF" fallback={<Ionicons name="send" size={15} color="#FFFFFF" />} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            ))}
            {!reviews.length && userReview && (
              <Text style={s.reviewNote}>{noWidow('Tu reseña será la primera experiencia compartida sobre este Patio.')}</Text>
            )}
          </View>

        </View>
      </Animated.ScrollView>
      <SaveToListSheet
        visible={saveSheetVisible}
        patioIds={[patio.id]}
        patioName={patio.name}
        onDismiss={() => setSaveSheetVisible(false)}
      />

    </View>
  );
}
