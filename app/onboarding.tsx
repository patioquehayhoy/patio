import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PatioGiros } from '@/components/business-category-icon';
import { getSystemNotificationStatus, requestSystemNotificationPermission } from '@/lib/community-notifications';
import { completeOnboarding, saveUserRole, type UserRole } from '@/lib/entry-flow';
import { Colors } from '@/lib/colors';
import { Type } from '@/lib/theme';
import { noWidow, noWidowSegments, type RichSegment } from '@/lib/typography';

// Recorrido con la calma de Leica LUX (decisión de Parco, 2026-11-08): una
// idea por pantalla, palabras clave en negrita, puntos de avance, «Siguiente»
// de vidrio y «Omitir» en texto. Orden: cómo vas a usar Patio → tres
// pantallas de tu lado → permisos explicados → cuenta (opcional para quien
// busca; el negocio sigue a su acceso). Copy abierto a cualquier lugar:
// «lo de hoy» y «lugares», sin nombrar giros (IDENTITY_VERBAL).
// Siempre oscura: el texto vive sobre fondo negro y fotos botánicas.

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type Segment = RichSegment;
type Art = 'map' | 'notice' | 'list' | 'camera' | 'pin';
type Slide = { key: string; title: string; body: Segment[]; art: Art; photo: ImageSourcePropType };
type Step = 'role' | 'tour' | 'permisos' | 'cuenta';
type PermKey = 'location' | 'notifications' | 'camera';
type PermState = 'granted' | 'denied' | 'undetermined';

const MARK = require('../assets/images/p-mark-blanco.png');
const APP_ICON = require('../assets/images/p-app-icon-small.png');
const PHOTO = {
  b1: require('../assets/hero/botanica-1.jpg'),
  b2: require('../assets/hero/botanica-2.jpg'),
  b3: require('../assets/hero/botanica-3.jpg'),
  b4: require('../assets/hero/botanica-4.jpg'),
  b5: require('../assets/hero/botanica-5.jpg'),
  b6: require('../assets/hero/botanica-6.jpg'),
  b7: require('../assets/hero/botanica-7.jpg'),
  b8: require('../assets/hero/botanica-8.jpg'),
};

const SLIDES: Record<UserRole, Slide[]> = {
  foodie: [
    { key: 'mapa', title: 'Lo de hoy, en el mapa', art: 'map', photo: PHOTO.b5,
      body: ['Cada punto es un lugar que ', { b: 'ya publicó hoy' }, ', con sus ', { b: 'precios' }, ' y su ', { b: 'horario' }, '.'] },
    { key: 'seguir', title: 'Sigue tus lugares', art: 'notice', photo: PHOTO.b1,
      body: ['Te avisamos cuando ', { b: 'publican' }, ' o tienen una ', { b: 'promo' }, '. Tú decides de quién.'] },
    { key: 'favoritos', title: 'Tus lugares favoritos', art: 'list', photo: PHOTO.b7,
      body: ['Guárdalos por ', { b: 'ocasión' }, ' y ', { b: 'compártelos' }, ' con quien quieras.'] },
  ],
  fondero: [
    { key: 'foto', title: 'Una foto y listo', art: 'camera', photo: PHOTO.b4,
      body: ['Tómale ', { b: 'foto' }, ' a tu pizarrón o a tu carta y Patio ', { b: 'arma tu menú' }, '.'] },
    { key: 'mapa', title: 'Te encuentran en el mapa', art: 'pin', photo: PHOTO.b6,
      body: ['Lo que publicas hoy aparece en el ', { b: 'mapa' }, ', con tu ', { b: 'precio' }, ' y tu ', { b: 'horario' }, '.'] },
    { key: 'avisos', title: 'Avisa a quienes te siguen', art: 'notice', photo: PHOTO.b8,
      body: ['Cada vez que publicas, les llega un ', { b: 'aviso' }, '. Sin mandar mensajes uno por uno.'] },
  ],
};

const PERMS: Record<UserRole, { key: PermKey; icon: IoniconName; title: string; sub: string }[]> = {
  foodie: [
    { key: 'location', icon: 'location-outline', title: 'Ubicación', sub: 'Para mostrarte lo que hay cerca' },
    { key: 'notifications', icon: 'notifications-outline', title: 'Notificaciones', sub: 'Para avisarte cuando publican tus lugares' },
  ],
  fondero: [
    { key: 'notifications', icon: 'notifications-outline', title: 'Notificaciones', sub: 'Para avisarte de reseñas y recordarte publicar' },
    { key: 'camera', icon: 'camera-outline', title: 'Cámara', sub: 'Para tomarle foto a tu menú' },
  ],
};

function toState(permission: { granted: boolean; canAskAgain: boolean } | null): PermState {
  if (!permission) return 'undetermined';
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'undetermined' : 'denied';
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole>('foodie');
  const [page, setPage] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [routing, setRouting] = useState(false);
  const [perms, setPerms] = useState<Record<PermKey, PermState>>({ location: 'undetermined', notifications: 'undetermined', camera: 'undetermined' });
  const fade = useRef(new Animated.Value(1)).current;
  const pager = useRef<FlatList<Slide>>(null);
  const finishing = useRef(false);
  const slides = SLIDES[role];

  // Cambio de paso: desvanecido corto, sin deslizar la pantalla entera.
  const go = (next: Step) => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // Android: «atrás» regresa un paso del recorrido antes de salir.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'role' || routing) return false;
      go(step === 'cuenta' ? 'permisos' : step === 'permisos' ? 'tour' : 'role');
      return true;
    });
    return () => sub.remove();
    // `go` solo usa refs y setters estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, routing]);

  // Estado real de cada permiso al llegar a Permisos (puede venir dado).
  useEffect(() => {
    if (step !== 'permisos') return;
    let alive = true;
    void (async () => {
      const [location, notifications, camera] = await Promise.all([
        Location.getForegroundPermissionsAsync().catch(() => null),
        getSystemNotificationStatus().catch(() => 'unavailable' as const),
        ImagePicker.getCameraPermissionsAsync().catch(() => null),
      ]);
      if (!alive) return;
      setPerms({
        location: toState(location),
        notifications: notifications === 'granted' ? 'granted' : notifications === 'denied' ? 'denied' : 'undetermined',
        camera: toState(camera),
      });
    })();
    return () => { alive = false; };
  }, [step]);

  const chooseRole = (value: UserRole) => {
    if (routing) return;
    setRole(value);
    setPage(0);
    saveUserRole(value).catch(() => {});
    go('tour');
  };

  const nextSlide = () => {
    if (page < slides.length - 1) pager.current?.scrollToIndex({ index: page + 1, animated: true });
    else go('permisos');
  };

  const onPageEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / Math.max(1, width)));
  };

  // Cada fila pide su permiso al tocarla; si iOS ya lo negó, abre Ajustes.
  // Se puede continuar sin darlos.
  const ask = async (key: PermKey) => {
    if (perms[key] === 'granted') return;
    if (perms[key] === 'denied') {
      Linking.openSettings().catch(() => {});
      return;
    }
    let state: PermState = 'undetermined';
    try {
      if (key === 'location') state = toState(await Location.requestForegroundPermissionsAsync());
      else if (key === 'camera') state = toState(await ImagePicker.requestCameraPermissionsAsync());
      else state = (await requestSystemNotificationPermission()) ? 'granted' : 'denied';
    } catch {
      state = 'undetermined';
    }
    setPerms((current) => ({ ...current, [key]: state }));
  };

  // Quien busca puede crear su cuenta al final o dejarlo para después; en
  // ambos casos el mapa queda debajo, para volver con «atrás».
  const finish = async (createAccount: boolean) => {
    if (finishing.current) return;
    finishing.current = true;
    setRouting(true);
    const destination = await completeOnboarding(role);
    router.replace(destination);
    if (createAccount) router.push('/comunidad-acceso');
  };

  const afterPermisos = () => {
    if (role === 'foodie') go('cuenta');
    else void finish(false);
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <Animated.View style={[s.fill, { opacity: fade }]}>
        {step === 'role' && (
          <View style={[s.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
            <Image source={MARK} style={s.mark} resizeMode="contain" accessibilityLabel="Patio" />
            <Text style={s.title} accessibilityRole="header" allowFontScaling={true}>{noWidow('¿Cómo vas a usar Patio?')}</Text>
            <Collage photos={[PHOTO.b5, PHOTO.b1, PHOTO.b4, PHOTO.b7, PHOTO.b8]} />
            <RoleOption
              icon={<Ionicons name="map-outline" size={19} color={Colors.accentDark} />}
              title="Ver qué hay hoy"
              hint="Lugares cerca de ti y lo que tienen hoy"
              disabled={routing}
              onPress={() => chooseRole('foodie')}
            />
            <RoleOption
              icon={<PatioGiros name="patio-mipatio" size={20} color={Colors.accentDark} />}
              title="Publicar lo que preparo"
              hint="Crea el perfil de tu negocio"
              disabled={routing}
              onPress={() => chooseRole('fondero')}
            />
          </View>
        )}

        {step === 'tour' && (
          <View style={s.fill}>
            <View style={s.fill} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
              {pageHeight > 0 && (
                <FlatList
                  ref={pager}
                  data={slides}
                  keyExtractor={(item) => `${role}-${item.key}`}
                  horizontal
                  pagingEnabled
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onPageEnd}
                  getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                  renderItem={({ item }) => (
                    <View style={[s.slide, { width, height: pageHeight, paddingTop: insets.top + 28 }]}>
                      <Text style={s.title} accessibilityRole="header" allowFontScaling={true}>{noWidow(item.title)}</Text>
                      <View style={s.frame}>
                        <ImageBackground source={item.photo} style={StyleSheet.absoluteFill} resizeMode="cover">
                          <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.55)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
                          <SlideArt art={item.art} />
                        </ImageBackground>
                      </View>
                      <RichBody segments={item.body} />
                    </View>
                  )}
                />
              )}
            </View>
            <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
              <View style={s.dots} accessible accessibilityLabel={`Pantalla ${page + 1} de ${slides.length}`}>
                {slides.map((slide, index) => <View key={slide.key} style={[s.dot, index === page && s.dotOn]} />)}
              </View>
              <GlassButton label="Siguiente" onPress={nextSlide} />
              <TextButton label="Omitir" onPress={() => go('permisos')} />
            </View>
          </View>
        )}

        {step === 'permisos' && (
          <View style={[s.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
            <Image source={MARK} style={s.mark} resizeMode="contain" accessibilityLabel="Patio" />
            <Text style={s.title} accessibilityRole="header" allowFontScaling={true}>Permisos</Text>
            <Text style={s.lead} allowFontScaling={true}>{noWidow('Patio necesita un par de cosas antes de empezar.')}</Text>
            <View style={s.perms}>
              {PERMS[role].map((row) => {
                const state = perms[row.key];
                return (
                  <TouchableOpacity
                    key={row.key}
                    style={s.permRow}
                    activeOpacity={0.7}
                    onPress={() => void ask(row.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.title}. ${row.sub}`}
                    accessibilityState={{ checked: state === 'granted' }}>
                    <View style={[s.permIcon, state === 'granted' && s.permIconOn]}>
                      <Ionicons name={state === 'granted' ? 'checkmark' : row.icon} size={19} color={state === 'granted' ? Colors.text : '#FFFFFF'} />
                    </View>
                    <View style={s.permCopy}>
                      <Text style={s.permTitle} allowFontScaling={true}>{row.title}</Text>
                      <Text style={s.permSub} allowFontScaling={true}>{noWidow(state === 'denied' ? 'Actívalo en Ajustes' : row.sub)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.fill} />
            <GlassButton label="Continuar" disabled={routing} onPress={afterPermisos} />
          </View>
        )}

        {step === 'cuenta' && (
          <View style={[s.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 12 }]}>
            <Collage photos={[PHOTO.b2, PHOTO.b6, PHOTO.b3, PHOTO.b8]} grid />
            <Image source={MARK} style={s.mark} resizeMode="contain" accessibilityLabel="Patio" />
            <Text style={s.title} accessibilityRole="header" allowFontScaling={true}>{noWidow('Crea tu cuenta')}</Text>
            <Text style={s.lead} allowFontScaling={true}>{noWidow('Para seguir lugares, reseñar y no perder tus favoritos.')}</Text>
            <View style={s.cuentaActions}>
              <GlassButton label="Crear cuenta" disabled={routing} onPress={() => void finish(true)} />
              <TextButton label="Quizás más tarde" disabled={routing} onPress={() => void finish(false)} />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function RichBody({ segments }: { segments: Segment[] }) {
  return (
    <Text style={s.body} allowFontScaling={true}>
      {noWidowSegments(segments).map((segment, index) => (typeof segment === 'string'
        ? segment
        : <Text key={index} style={s.bold}>{segment.b}</Text>))}
    </Text>
  );
}

function Collage({ photos, grid = false }: { photos: ImageSourcePropType[]; grid?: boolean }) {
  if (grid) {
    const [a, b, c, d] = photos;
    return (
      <View style={[s.collage, s.collageGrid]}>
        <View style={s.collageRow}>
          <Image source={a} style={s.collageCell} resizeMode="cover" />
          <Image source={b} style={s.collageCell} resizeMode="cover" />
        </View>
        <View style={s.collageRow}>
          <Image source={c} style={s.collageCell} resizeMode="cover" />
          <Image source={d} style={s.collageCell} resizeMode="cover" />
        </View>
      </View>
    );
  }
  const [a, b, c, d, e] = photos;
  return (
    <View style={s.collage}>
      <View style={s.collageCol}>
        <Image source={a} style={s.collageCell} resizeMode="cover" />
        <Image source={d} style={s.collageCell} resizeMode="cover" />
      </View>
      <View style={s.collageCol}>
        <Image source={b} style={s.collageCell} resizeMode="cover" />
      </View>
      <View style={s.collageCol}>
        <Image source={c} style={s.collageCell} resizeMode="cover" />
        <Image source={e} style={s.collageCell} resizeMode="cover" />
      </View>
    </View>
  );
}

function RoleOption({ icon, title, hint, disabled, onPress }: { icon: ReactNode; title: string; hint: string; disabled: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.role} onPress={onPress} disabled={disabled} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${title}. ${hint}`} accessibilityState={{ disabled }}>
      <BlurView intensity={16} tint="dark" style={s.roleInner}>
        <View style={s.roleIcon}>{icon}</View>
        <View style={s.roleCopy}>
          <Text style={s.roleTitle} allowFontScaling={true}>{noWidow(title)}</Text>
          <Text style={s.roleHint} allowFontScaling={true}>{noWidow(hint)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.46)" />
      </BlurView>
    </TouchableOpacity>
  );
}

function GlassButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[s.cta, disabled && s.disabled]} onPress={onPress} disabled={disabled} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}>
      <BlurView intensity={16} tint="dark" style={s.ctaInner}>
        <Text style={s.ctaText} allowFontScaling={true}>{noWidow(label)}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

function TextButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[s.textButton, disabled && s.disabled]} onPress={onPress} disabled={disabled} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={s.textButtonText} allowFontScaling={true}>{noWidow(label)}</Text>
    </TouchableOpacity>
  );
}

// Ilustraciones sobre la foto: muestran la función sin fingir capturas.
function SlideArt({ art }: { art: Art }) {
  if (art === 'camera') {
    return (
      <View style={s.artCenter} pointerEvents="none">
        <View style={s.guide}>
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />
        </View>
        <View style={s.shutter}><View style={s.shutterInner} /></View>
      </View>
    );
  }
  if (art === 'map' || art === 'pin') {
    const pins = art === 'map' ? [{ left: '22%', top: '24%' }, { left: '62%', top: '36%' }, { left: '38%', top: '54%' }] : [{ left: '46%', top: '36%' }];
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {pins.map((pin, index) => (
          <View key={index} style={[s.pinHalo, { left: pin.left as `${number}%`, top: pin.top as `${number}%` }]}>
            <View style={s.pin} />
          </View>
        ))}
        <ArtCard>
          <Text style={s.artTitle} allowFontScaling={false}>La Esquina</Text>
          <Text style={s.artSub} allowFontScaling={false}>{art === 'map' ? '$85 · a 300 m · abierto' : 'Abierto · $85'}</Text>
        </ArtCard>
      </View>
    );
  }
  if (art === 'notice') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ArtCard>
          <View style={s.noticeRow}>
            <Image source={APP_ICON} style={s.noticeIcon} />
            <View style={s.roleCopy}>
              <Text style={s.artTitle} allowFontScaling={false}>La Esquina</Text>
              <Text style={s.artSub} allowFontScaling={false}>Publicó su menú de hoy.</Text>
            </View>
          </View>
        </ArtCard>
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ArtCard>
        <Text style={s.artTitle} allowFontScaling={false}>Para el viernes</Text>
        <Text style={s.artSub} allowFontScaling={false}>4 lugares</Text>
        <View style={s.listLines}>
          {[0.7, 0.55, 0.62].map((w, index) => (
            <View key={index} style={s.listLine}>
              <View style={s.listDot} />
              <View style={[s.listBar, { width: `${Math.round(w * 100)}%` as `${number}%` }]} />
            </View>
          ))}
        </View>
      </ArtCard>
    </View>
  );
}

function ArtCard({ children }: { children: ReactNode }) {
  return (
    <View style={s.artCardWrap}>
      <BlurView intensity={20} tint="dark" style={s.artCard}>{children}</BlurView>
    </View>
  );
}

const GUTTER = 28;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  fill: { flex: 1 },
  page: { flex: 1, paddingHorizontal: GUTTER },
  slide: { paddingHorizontal: GUTTER, paddingBottom: 8 },
  mark: { width: 53, height: 24, alignSelf: 'center', marginBottom: 20 },
  title: { ...Type.title, color: '#FFFFFF', textAlign: 'center' },
  lead: { marginTop: 8, fontSize: 15, lineHeight: 21, fontWeight: '400', color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400', color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
  bold: { fontWeight: '700', color: '#FFFFFF' },
  frame: { flex: 1, marginVertical: 24, borderRadius: 28, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#161618' },
  footer: { paddingHorizontal: GUTTER },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.28)' },
  dotOn: { backgroundColor: '#FFFFFF' },
  // Escala homologada: cápsula de 54, radio 27, texto 16/700. Vidrio solo en
  // entrada y onboarding (excepción de marca de CLAUDE.md).
  cta: { alignSelf: 'stretch', height: 54, borderRadius: 27, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  ctaInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  textButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonText: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.78)' },
  disabled: { opacity: 0.4 },
  collage: { flex: 1, flexDirection: 'row', gap: 8, marginVertical: 28 },
  collageGrid: { flexDirection: 'column', marginTop: 0, marginBottom: 28 },
  collageRow: { flex: 1, flexDirection: 'row', gap: 8 },
  collageCol: { flex: 1, gap: 8 },
  collageCell: { flex: 1, width: '100%', borderRadius: 14 },
  role: { minHeight: 72, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  roleInner: { minHeight: 72, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  roleIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,106,61,0.16)', alignItems: 'center', justifyContent: 'center' },
  roleCopy: { flex: 1, minWidth: 0 },
  roleTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: '#FFFFFF' },
  roleHint: { marginTop: 2, fontSize: 13, lineHeight: 17, fontWeight: '400', color: 'rgba(255,255,255,0.62)' },
  perms: { marginTop: 28 },
  permRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14 },
  permIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  permIconOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  permCopy: { flex: 1, minWidth: 0 },
  permTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: '#FFFFFF' },
  permSub: { marginTop: 1, fontSize: 13, lineHeight: 17, fontWeight: '400', color: 'rgba(255,255,255,0.62)' },
  cuentaActions: { marginTop: 28 },
  artCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guide: { width: '62%', aspectRatio: 1, maxHeight: '64%' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.86)' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 8 },
  shutter: { position: 'absolute', bottom: 20, width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF' },
  pinHalo: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(242,97,47,0.28)', alignItems: 'center', justifyContent: 'center' },
  pin: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.accent },
  artCardWrap: { position: 'absolute', left: 14, right: 14, bottom: 14, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  artCard: { padding: 14, backgroundColor: 'rgba(20,20,22,0.35)' },
  artTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#FFFFFF' },
  artSub: { marginTop: 1, fontSize: 13, lineHeight: 17, fontWeight: '400', color: 'rgba(255,255,255,0.72)' },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeIcon: { width: 34, height: 34, borderRadius: 8 },
  listLines: { marginTop: 10, gap: 8 },
  listLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  listBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.32)' },
});
