import { BusinessCategoryIcon } from '@/components/business-category-icon';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessPaymentSelector } from '@/components/business-payment-selector';
import { NewMenuSheet } from '@/components/new-menu-sheet';
import { BusinessScheduleEditor } from '@/components/business-schedule-editor';
import { saveUserRole } from '@/lib/entry-flow';
import { Colors } from '@/lib/colors';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { sanitizeNombreInput } from '@/lib/fondita-name';
import {
  setFonditaDireccion,
  setFonditaHorarioSemanal,
  setFonditaName,
  setPagosEfectivo,
  setPagosTarjeta,
  setPagosTrans,
  setTipoNegocio,
} from '@/lib/menu-store';
import { BUSINESS_TYPE_LABELS, confirmedSchedule, saveSmartSetup, type BusinessType, type SmartSetupResult } from '@/lib/smart-setup';
import { CONTENT_REJECTED_MESSAGE, isContentRejected } from '@/lib/content-safety';
import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { TEXT_LIMITS } from '@/lib/text-limits';

type Stage = 'name' | 'category' | 'location' | 'schedule' | 'payments' | 'finish';

const MAX_CATEGORIES = 3;

const INITIAL_RESULT: SmartSetupResult = {
  nombre: '',
  descripcion: '',
  direccion: '',
  latitude: null,
  longitude: null,
  tipo: 'otro',
  tipos: [],
  especialidades: [],
  pagos: { efectivo: false, transferencia: false, tarjeta: false },
  horario: Array.from({ length: 7 }, (_, dia) => ({
    dia,
    confirmado: true,
    cerrado: true,
    abre: null,
    cierra: null,
  })),
  faltantes: [],
};

const STEP_BY_STAGE: Record<Exclude<Stage, 'finish'>, number> = {
  name: 0,
  category: 1,
  location: 2,
  schedule: 3,
  payments: 4,
};

// Multi-tag: hasta 3 (ver MAX_CATEGORIES). 'Elotes' y 'Botanas' viven
// separados — antes eran una sola etiqueta compuesta "Elotes y botanas".
// Iconos únicos dentro de este arreglo, sin repetir entre entradas.
const BUSINESS_TYPES: { id: BusinessType; label: string }[] = [
  { id: 'fondita', label: BUSINESS_TYPE_LABELS.fondita },
  { id: 'taqueria', label: BUSINESS_TYPE_LABELS.taqueria },
  { id: 'antojitos', label: BUSINESS_TYPE_LABELS.antojitos },
  { id: 'elotes', label: BUSINESS_TYPE_LABELS.elotes },
  { id: 'botanas', label: BUSINESS_TYPE_LABELS.botanas },
  { id: 'reposteria', label: BUSINESS_TYPE_LABELS.reposteria },
  { id: 'cafeteria', label: BUSINESS_TYPE_LABELS.cafeteria },
  { id: 'mariscos', label: BUSINESS_TYPE_LABELS.mariscos },
  { id: 'bebidas', label: BUSINESS_TYPE_LABELS.bebidas },
  { id: 'jugos', label: BUSINESS_TYPE_LABELS.jugos },
  { id: 'restaurante', label: BUSINESS_TYPE_LABELS.restaurante },
  { id: 'casa', label: BUSINESS_TYPE_LABELS.casa },
  { id: 'otro', label: 'Otro' },
];

function formatPlacemark(place?: Location.LocationGeocodedAddress): string {
  if (!place) return '';
  const street = [place.street, place.streetNumber].filter(Boolean).join(' ');
  const area = place.district ?? place.subregion;
  const city = place.city && place.city !== area ? place.city : null;
  return [...new Set([street, area, city].filter((value): value is string => Boolean(value)))].join(', ');
}

function StepHeader({ colors, title, subtitle }: {
  colors: FonderoColors;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={s.headerBlock}>
      <Text style={[s.title, { color: colors.text }]} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.35}>
        {noWidow(title)}
      </Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.6}>
        {noWidow(subtitle)}
      </Text>
    </View>
  );
}

// Estados homologados (2026-11-01): si falta algo, superficie con borde fino
// y el texto dice qué falta; listo, naranja; en curso, naranja con indicador.
function ContinueButton({ colors, missing, label: readyLabel, loading, onPress }: {
  colors: FonderoColors;
  missing?: string;
  label?: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const label = missing ?? readyLabel ?? 'Continuar';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!missing || loading, busy: loading }}
      disabled={!!missing || loading}
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.continueButton, missing
        ? { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
        : { backgroundColor: colors.accent }]}>
      {loading
        ? <ActivityIndicator size="small" color="#FFFFFF" />
        : <Text style={[s.continueText, { color: missing ? colors.textSecondary : '#FFFFFF' }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{noWidow(label)}</Text>}
    </TouchableOpacity>
  );
}

export default function PatioSmartScreen() {
  const { theme } = useTheme();
  const colors = fonderoPalette(theme.isDark);
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('name');
  const [loading, setLoading] = useState(false);
  const [firstMenuVisible, setFirstMenuVisible] = useState(false);
  // En desarrollo, «Ver alta del negocio» recorre el alta sin guardar nada.
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = __DEV__ && preview === '1';
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<SmartSetupResult>(INITIAL_RESULT);

  useEffect(() => {
    saveUserRole('fondero').catch(() => {});
  }, []);

  const update = (values: Partial<SmartSetupResult>) => {
    setResult((current) => ({ ...current, ...values }));
  };

  const selectedDays = useMemo(
    () => result.horario.filter((day) => day.confirmado && !day.cerrado),
    [result.horario],
  );

  const hasCoordinates = Number.isFinite(result.latitude) && Number.isFinite(result.longitude);
  // Dirección escrita a mano: se busca en el mapa y se confirma antes de
  // seguir («Te ubicamos en…»); si no aparece en México, se pide revisarla.
  const [addressCheck, setAddressCheck] = useState<{ status: 'idle' | 'found' | 'notFound'; label?: string }>({ status: 'idle' });
  const hasLocation = hasCoordinates || Boolean(result.direccion.trim());

  const useCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          noWidow('Ubicación desactivada'),
          noWidow('Puedes escribir la dirección para continuar.'),
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      let direccion = result.direccion;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        direccion = formatPlacemark(places[0]) || direccion;
      } catch {}
      update({ latitude, longitude, direccion });
    } catch {
      Alert.alert(noWidow('No pudimos ubicarte'), noWidow('Escribe la dirección para continuar.'));
    } finally {
      setLocating(false);
    }
  };

  const continueFromLocation = async () => {
    if (!hasLocation || locating) return;
    Keyboard.dismiss();

    if (!hasCoordinates && result.direccion.trim()) {
      setLocating(true);
      try {
        const match = (await Location.geocodeAsync(result.direccion.trim()))[0];
        const place = match ? (await Location.reverseGeocodeAsync({ latitude: match.latitude, longitude: match.longitude }).catch(() => []))[0] : undefined;
        // Si no aparece, se avisa una vez y el segundo toque deja seguir:
        // la dirección escrita sirve y el punto se afina después.
        if (!match || (place?.isoCountryCode && place.isoCountryCode !== 'MX')) {
          if (addressCheck.status !== 'notFound') { setAddressCheck({ status: 'notFound' }); return; }
          setStage('schedule');
          return;
        }
        update({ latitude: match.latitude, longitude: match.longitude });
        setAddressCheck({ status: 'found', label: formatPlacemark(place) || result.direccion.trim() });
        return;
      } catch {
        // Sin conexión con el geocodificador no bloqueamos el alta: la
        // dirección escrita sirve y el punto se afina después.
      } finally {
        setLocating(false);
      }
    }

    setStage('schedule');
  };

  const persistSetup = async () => {
    await saveSmartSetup(result);
    setFonditaName(result.nombre);
    setFonditaDireccion(result.direccion);
    // Tag primario (el primero elegido) decide secciones sugeridas y perfil
    // de lectura de menú por visión — el resto vive en `categorias`.
    setTipoNegocio(result.tipos[0] ?? result.tipo);
    const schedule = confirmedSchedule(result);
    if (schedule) setFonditaHorarioSemanal(schedule);
    setPagosEfectivo(result.pagos.efectivo);
    setPagosTrans(result.pagos.transferencia);
    setPagosTarjeta(result.pagos.tarjeta);
  };

  const confirmSchedule = () => {
    if (selectedDays.length === 0) {
      Alert.alert(noWidow('Elige tus días'), noWidow('Selecciona por lo menos un día para continuar.'));
      return;
    }

    setStage('payments');
  };

  const confirmPayments = async () => {
    if (!Object.values(result.pagos).some(Boolean)) {
      Alert.alert(noWidow('Elige una forma de pago'), noWidow('Selecciona por lo menos una opción para continuar.'));
      return;
    }

    setLoading(true);
    try {
      if (!isPreview) await persistSetup();
      setStage('finish');
    } catch (err) {
      if (isContentRejected(err)) {
        Alert.alert(noWidow('Revisa el nombre'), noWidow(CONTENT_REJECTED_MESSAGE));
        setStage('name');
      } else {
        Alert.alert(noWidow('No pudimos guardarlo'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (stage === 'name') router.back();
    else if (stage === 'category') setStage('name');
    else if (stage === 'location') setStage('category');
    else if (stage === 'schedule') setStage('location');
    else setStage('schedule');
  };

  if (stage === 'finish') {
    const businessName = result.nombre.trim();
    return (
      <View style={s.finishRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <Image source={require('../assets/hero/botanica-5.jpg')} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.84)']}
          locations={[0, 0.46, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          onPress={() => setStage('payments')}
          activeOpacity={0.7}
          style={[s.finishBack, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={21} color={colors.accent} />
        </TouchableOpacity>

        <View style={s.finishIdentity} pointerEvents="none">
          <Text
            style={s.finishName}
            lineBreakStrategyIOS="push-out"
            maxFontSizeMultiplier={1.25}>
            {noWidow(businessName)}
          </Text>
        </View>

        <View style={[s.finishContent, { paddingBottom: insets.bottom + 24 }]}>
          {/* La primera vez se vende la foto: es lo que Patio hace mejor
              (lee el menú solo). Una primaria y una secundaria, como pide la
              regla de celebraciones; los datos se editan con «volver». */}
          <Text style={s.finishTitle} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.35}>
            {noWidow('Tómale foto a tu menú.')}
          </Text>
          <Text style={s.finishBody} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.6}>
            {noWidow('Patio lo lee y lo acomoda por ti. Tú solo revisas y publicas.')}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/foto-menu', params: { source: 'camera' } })}
            activeOpacity={0.85}
            style={s.finishButton}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto del menú">
            <Text style={s.finishButtonText} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>
              {noWidow('Tomar foto del menú')}
            </Text>
          </TouchableOpacity>
          {/* Si se cancela, entra a Menús; nunca se queda atorado aquí. */}
          <TouchableOpacity
            onPress={() => setFirstMenuVisible(true)}
            activeOpacity={0.7}
            style={s.finishEdit}
            accessibilityRole="button"
            accessibilityLabel="Elegir de Fotos o escribirlo">
            <Text style={s.finishEditText} numberOfLines={1} maxFontSizeMultiplier={1.3}>{noWidow('Elegir de Fotos o escribirlo')}</Text>
          </TouchableOpacity>
        </View>
        <NewMenuSheet
          visible={firstMenuVisible}
          onClose={() => setFirstMenuVisible(false)}
          onCancel={() => router.replace('/historial')}
          replaceOnNavigate
        />
      </View>
    );
  }

  const stepIndex = STEP_BY_STAGE[stage];

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.nav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={goBack}
          activeOpacity={0.7}
          style={[s.close, { backgroundColor: colors.surface }]}>
          <Ionicons name={stage === 'name' ? 'close' : 'chevron-back'} size={21} color={colors.accent} />
        </TouchableOpacity>
        <View style={s.progress} accessibilityLabel={`Paso ${stepIndex + 1} de 5`}>
          {[0, 1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                s.progressDot,
                {
                  backgroundColor: step === stepIndex
                    ? colors.accent
                    : step < stepIndex ? colors.text : colors.border,
                },
                step === stepIndex && s.progressDotCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        onScrollBeginDrag={Keyboard.dismiss}>
        {stage === 'name' && (
          <>
            <StepHeader colors={colors} title="Nombre de tu negocio" subtitle="Así lo encontrará la gente en Patio." />
            <View style={[s.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.fieldLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>NOMBRE</Text>
              <TextInput
                accessibilityLabel="Nombre del negocio"
                value={result.nombre}
                onChangeText={(nombre) => update({ nombre: sanitizeNombreInput(nombre) })}
                selectionColor={colors.accent}
                returnKeyType="next"
                clearButtonMode="while-editing"
                autoCorrect={false}
                onSubmitEditing={() => {
                  if (!result.nombre.trim()) return;
                  Keyboard.dismiss();
                  setStage('category');
                }}
                maxFontSizeMultiplier={1.4}
                style={[s.fieldInput, { color: colors.text }]}
              />
            </View>
            <ContinueButton
              colors={colors}
              missing={result.nombre.trim() ? undefined : 'Falta el nombre'}
              onPress={() => { Keyboard.dismiss(); setStage('category'); }}
            />
          </>
        )}

        {stage === 'category' && (
          <>
            <StepHeader
              colors={colors}
              title="¿Qué tipo de lugar es?"
              subtitle="Así te encuentran por lo que preparas."
            />
            <View style={s.typeGrid}>
              {BUSINESS_TYPES.map((item) => {
                const selected = result.tipos.includes(item.id);
                const atMax = result.tipos.length >= MAX_CATEGORIES;
                const locked = atMax && !selected;
                return (
                  <TouchableOpacity
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.label}
                    accessibilityState={{ checked: selected, disabled: locked }}
                    disabled={locked}
                    onPress={() => {
                      if (selected) {
                        const next = result.tipos.filter((id) => id !== item.id);
                        update({ tipos: next, tipo: next[0] ?? 'otro' });
                        Haptics.selectionAsync();
                      } else if (!atMax) {
                        const next = [...result.tipos, item.id];
                        update({ tipos: next, tipo: next[0] });
                        Haptics.selectionAsync();
                      } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      }
                    }}
                    style={[
                      s.typeOption,
                      { backgroundColor: colors.surface, borderColor: selected ? colors.accent : colors.border },
                      locked && s.typeOptionLocked,
                    ]}>
                    <BusinessCategoryIcon category={item.id} size={19} color={selected ? colors.accent : colors.textSecondary} />
                    <Text style={[s.typeLabel, { color: colors.text }]}>{item.label}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.accent} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            {result.tipos.includes('otro') ? (
              <View style={[s.field, s.otroField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.fieldLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>¿DE QUÉ ES TU NEGOCIO?</Text>
                <TextInput
                  accessibilityLabel="De qué es tu negocio"
                  value={result.otroGiro ?? ''}
                  onChangeText={(otroGiro) => update({ otroGiro: otroGiro.slice(0, 40) })}
                  placeholder="Tamales, crepas, pozole…"
                  placeholderTextColor={colors.textMute}
                  selectionColor={colors.accent}
                  returnKeyType="done"
                  autoCapitalize="sentences"
                  maxFontSizeMultiplier={1.4}
                  style={[s.fieldInput, { color: colors.text }]}
                />
              </View>
            ) : null}
            <ContinueButton
              colors={colors}
              missing={!result.tipos.length ? 'Elige el tipo de lugar' : result.tipos.includes('otro') && !result.otroGiro?.trim() ? 'Escribe de qué es' : undefined}
              onPress={() => { Keyboard.dismiss(); setStage('location'); }}
            />
          </>
        )}

        {stage === 'location' && (
          <>
            <StepHeader
              colors={colors}
              title="Ubicación del negocio"
              subtitle="Esto coloca tu negocio en el mapa de Patio."
            />

            <TouchableOpacity
              accessibilityRole="button"
              onPress={useCurrentLocation}
              accessibilityLabel={hasCoordinates ? 'Actualizar ubicación del negocio' : 'Usar mi ubicación actual'}
              accessibilityState={{ disabled: locating, busy: locating }}
              disabled={locating}
              activeOpacity={0.7}
              style={[s.locationAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.locationIcon, { backgroundColor: colors.iconBg }]}>
                {locating
                  ? <ActivityIndicator size="small" color={colors.text} />
                  : <Ionicons name={hasCoordinates ? 'checkmark' : 'navigate-outline'} size={18} color={colors.text} />}
              </View>
              <View style={s.locationCopy}>
                <Text style={[s.locationTitle, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
                  {hasCoordinates ? noWidow('Ubicación guardada') : noWidow('Usar mi ubicación actual')}
                </Text>
                <Text style={[s.locationHint, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.5}>
                  {noWidow(hasCoordinates ? 'Puedes ajustar la dirección abajo.' : 'La forma más rápida de aparecer en el mapa.')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMute} />
            </TouchableOpacity>

            <View style={[s.field, s.addressField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.fieldLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>DIRECCIÓN</Text>
              <TextInput
                accessibilityLabel="Dirección del negocio"
                value={result.direccion}
                onChangeText={(direccion) => { setAddressCheck({ status: 'idle' }); update({ direccion: direccion.slice(0, TEXT_LIMITS.address), latitude: null, longitude: null }); }}
                // El teclado de iOS sugiere direcciones guardadas en el teléfono.
                textContentType="fullStreetAddress"
                autoComplete="street-address"
                placeholder="Calle, número y colonia"
                placeholderTextColor={colors.textMute}
                selectionColor={colors.accent}
                returnKeyType="done"
                clearButtonMode="while-editing"
                autoCapitalize="words"
                onSubmitEditing={continueFromLocation}
                maxFontSizeMultiplier={1.4}
                style={[s.fieldInput, { color: colors.text }]}
              />
            </View>

            {result.tipos.includes('casa') && addressCheck.status === 'idle' && (
              // Vender desde casa no obliga a publicar el departamento.
              <Text style={[s.addressError, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.5}>
                {noWidow('Si vendes en tu casa, basta con tu edificio o unidad; no pongas el número de departamento.')}
              </Text>
            )}
            {addressCheck.status === 'found' && (
              <View style={s.addressCheck} accessibilityLiveRegion="polite">
                <Ionicons name="location" size={15} color={colors.accent} />
                <Text style={[s.addressCheckText, { color: colors.text }]} maxFontSizeMultiplier={1.5}>{noWidow(`Te ubicamos en ${addressCheck.label}. ¿Es aquí?`)}</Text>
              </View>
            )}
            {addressCheck.status === 'notFound' && (
              <Text style={[s.addressError, { color: colors.accent }]} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.5}>
                {noWidow('No la encontramos en el mapa. Revisa calle, número y colonia, o continúa así y la ajustas después.')}
              </Text>
            )}
            <ContinueButton
              colors={colors}
              missing={!hasLocation ? 'Falta la dirección' : undefined}
              label={addressCheck.status === 'found' ? 'Sí, es aquí' : addressCheck.status === 'notFound' ? 'Continuar así' : undefined}
              loading={locating}
              onPress={continueFromLocation}
            />
          </>
        )}

        {stage === 'schedule' && (
          <>
            <StepHeader colors={colors} title="Días y horarios" subtitle="Selecciona los días que abres." />

            <View style={s.scheduleEditor}>
              <BusinessScheduleEditor
                colors={colors}
                value={result.horario}
                onChange={(horario) => update({ horario: horario.map((day) => ({ ...day, confirmado: true })) })}
                isDark={theme.isDark}
              />
            </View>

            <ContinueButton
              colors={colors}
              missing={selectedDays.length ? undefined : 'Elige los días que abres'}
              onPress={confirmSchedule}
            />
          </>
        )}

        {stage === 'payments' && (
          <>
            <StepHeader
              colors={colors}
              title="¿Cómo te pueden pagar?"
              subtitle="Elige todas las formas que aceptas."
            />
            <View style={s.paymentEditor}>
              <BusinessPaymentSelector
                colors={colors}
                value={result.pagos}
                onChange={(pagos) => update({ pagos })}
              />
            </View>
            <ContinueButton
              colors={colors}
              missing={Object.values(result.pagos).some(Boolean) ? undefined : 'Elige cómo te pagan'}
              loading={loading}
              onPress={confirmPayments}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: 58, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  progress: { position: 'absolute', left: 0, right: 0, bottom: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  progressDotCurrent: { width: 18 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 },
  headerBlock: { alignItems: 'center', paddingHorizontal: 10 },
  title: { ...Type.screen, maxWidth: 340, textAlign: 'center' },
  subtitle: { maxWidth: 330, marginTop: 10, fontSize: 16, lineHeight: 22, fontWeight: '400', textAlign: 'center' },
  field: { marginTop: 30, minHeight: 76, borderRadius: 14, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 10 },
  fieldLabel: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
  fieldInput: { flex: 1, minHeight: 36, padding: 0, fontSize: 19, lineHeight: 25, fontWeight: '500' },
  addressField: { marginTop: 12 },
  addressCheck: { marginTop: 12, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressCheckText: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '400' },
  addressError: { marginTop: 10, paddingHorizontal: 4, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  otroField: { marginTop: 12 },
  continueButton: { minWidth: 154, minHeight: 54, alignSelf: 'center', marginTop: 26, paddingHorizontal: 26, borderRadius: 27, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 16, fontWeight: '700' },
  locationAction: { minHeight: 76, marginTop: 28, borderRadius: 14, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationIcon: { width: 38, height: 38, borderRadius: 12, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  locationCopy: { flex: 1, minWidth: 0 },
  typeGrid: { marginTop: 26, gap: 8 },
  typeOption: { minHeight: 52, borderRadius: 14, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeOptionLocked: { opacity: 0.4 },
  typeLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  locationTitle: { fontSize: 15, lineHeight: 19, fontWeight: '700' },
  locationHint: { marginTop: 3, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  scheduleEditor: { marginTop: 24 },
  paymentEditor: { marginTop: 30 },
  finishRoot: { flex: 1, backgroundColor: '#0B0B0C' },
  finishBack: { position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  finishIdentity: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  finishName: { ...Type.celebration, maxWidth: 350, color: '#fff', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.28)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 16 },
  finishContent: { position: 'absolute', left: 26, right: 26, bottom: 0, alignItems: 'center' },
  finishTitle: { color: '#fff', ...Type.section, textAlign: 'center' },
  finishBody: { maxWidth: 340, color: 'rgba(255,255,255,0.74)', marginTop: 8, fontSize: 15, lineHeight: 21, fontWeight: '400', textAlign: 'center' },
  // La única acción destacada de la pantalla va en naranja (CLAUDE.md).
  finishButton: { minHeight: 54, marginTop: 22, paddingHorizontal: 24, borderRadius: 27, borderCurve: 'continuous', backgroundColor: Colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  finishButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  finishEdit: { minHeight: 44, marginTop: 4, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  finishEditText: { color: 'rgba(255,255,255,0.82)', fontSize: 15, fontWeight: '700' },
});
