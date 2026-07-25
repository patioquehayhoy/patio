import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
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
import { BusinessScheduleEditor } from '@/components/business-schedule-editor';
import { saveUserRole } from '@/lib/entry-flow';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { sanitizeNombreInput } from '@/lib/fondita-name';
import {
  setFonditaDireccion,
  setFonditaHorarioSemanal,
  setFonditaName,
  setPagosEfectivo,
  setPagosTarjeta,
  setPagosTrans,
} from '@/lib/menu-store';
import { confirmedSchedule, NombreDuplicadoError, saveSmartSetup, type SmartSetupResult } from '@/lib/smart-setup';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Stage = 'name' | 'location' | 'schedule' | 'payments' | 'finish';

const INITIAL_RESULT: SmartSetupResult = {
  nombre: '',
  descripcion: '',
  direccion: '',
  latitude: null,
  longitude: null,
  tipo: 'otro',
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
  location: 1,
  schedule: 2,
  payments: 3,
};

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

function ContinueButton({ colors, disabled, loading, onPress }: {
  colors: FonderoColors;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.78}
      style={[s.continueButton, { backgroundColor: colors.text }, (disabled || loading) && s.disabled]}>
      {loading
        ? <ActivityIndicator size="small" color={colors.bg} />
        : <Text style={[s.continueText, { color: colors.bg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>Continuar</Text>}
    </TouchableOpacity>
  );
}

export default function PatioSmartScreen() {
  const { theme } = useTheme();
  const colors = fonderoPalette(theme.isDark);
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('name');
  const [loading, setLoading] = useState(false);
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
        const matches = await Location.geocodeAsync(result.direccion.trim());
        const match = matches[0];
        if (match) update({ latitude: match.latitude, longitude: match.longitude });
      } catch {
        // La dirección sigue siendo útil y no bloqueamos el alta por un fallo
        // temporal del geocodificador. El punto puede afinarse después.
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
      await persistSetup();
      setStage('finish');
    } catch (err) {
      if (err instanceof NombreDuplicadoError) {
        Alert.alert(noWidow('Ese nombre ya existe'), noWidow('Ya hay un negocio con ese nombre en Patio. Elige otro.'));
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
    else if (stage === 'location') setStage('name');
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
          accessibilityLabel="Volver"
          onPress={() => setStage('payments')}
          activeOpacity={0.72}
          style={[s.finishBack, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
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
          <Text style={s.finishTitle} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.35}>
            {noWidow('Publica lo de hoy.')}
          </Text>
          <Text style={s.finishBody} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.6}>
            {noWidow('Toma una foto del menú o agrégalo en unos cuantos pasos.')}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/menu')} activeOpacity={0.82} style={s.finishButton}>
            <Text style={s.finishButtonText} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>
              {noWidow('Crear mi primer menú')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage('name')} activeOpacity={0.68} style={s.finishEdit}>
            <Text style={s.finishEditText} numberOfLines={1} maxFontSizeMultiplier={1.3}>{noWidow('Editar datos')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stepIndex = STEP_BY_STAGE[stage];

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.nav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          accessibilityLabel="Volver"
          onPress={goBack}
          activeOpacity={0.7}
          style={[s.close, { backgroundColor: colors.surface }]}>
          <Ionicons name={stage === 'name' ? 'close' : 'chevron-back'} size={20} color={colors.accent} />
        </TouchableOpacity>
        <View style={s.progress} accessibilityLabel={`Paso ${stepIndex + 1} de 4`}>
          {[0, 1, 2, 3].map((step) => (
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
                  setStage('location');
                }}
                maxFontSizeMultiplier={1.4}
                style={[s.fieldInput, { color: colors.text }]}
              />
            </View>
            <ContinueButton
              colors={colors}
              disabled={!result.nombre.trim()}
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
              disabled={locating}
              activeOpacity={0.72}
              style={[s.locationAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.locationIcon, { backgroundColor: colors.iconBg }]}>
                {locating
                  ? <ActivityIndicator size="small" color={colors.text} />
                  : <Ionicons name={hasCoordinates ? 'checkmark' : 'location'} size={18} color={colors.text} />}
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
                onChangeText={(direccion) => update({ direccion, latitude: null, longitude: null })}
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

            <ContinueButton colors={colors} disabled={!hasLocation} loading={locating} onPress={continueFromLocation} />
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
              disabled={selectedDays.length === 0}
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
              disabled={!Object.values(result.pagos).some(Boolean)}
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
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progress: { position: 'absolute', left: 0, right: 0, bottom: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  progressDotCurrent: { width: 18 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 },
  headerBlock: { alignItems: 'center', paddingHorizontal: 10 },
  title: { maxWidth: 340, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.05, textAlign: 'center' },
  subtitle: { maxWidth: 330, marginTop: 10, fontSize: 16, lineHeight: 22, fontWeight: '400', textAlign: 'center' },
  field: { marginTop: 30, minHeight: 76, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 10 },
  fieldLabel: { fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
  fieldInput: { flex: 1, minHeight: 36, padding: 0, fontSize: 19, lineHeight: 25, fontWeight: '500' },
  addressField: { marginTop: 12 },
  continueButton: { minWidth: 154, minHeight: 48, alignSelf: 'center', marginTop: 26, paddingHorizontal: 26, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.2 },
  locationAction: { minHeight: 76, marginTop: 28, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locationCopy: { flex: 1, minWidth: 0 },
  locationTitle: { fontSize: 15, lineHeight: 19, fontWeight: '600' },
  locationHint: { marginTop: 3, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  scheduleEditor: { marginTop: 24 },
  paymentEditor: { marginTop: 30 },
  finishRoot: { flex: 1, backgroundColor: '#0B0B0C' },
  finishBack: { position: 'absolute', left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  finishIdentity: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  finishName: { maxWidth: 350, color: '#fff', fontSize: 46, lineHeight: 51, letterSpacing: -1.6, fontWeight: '900', fontFamily: Fonts.brand, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.28)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 16 },
  finishContent: { position: 'absolute', left: 26, right: 26, bottom: 0, alignItems: 'center' },
  finishTitle: { color: '#fff', fontSize: 25, lineHeight: 30, letterSpacing: -0.5, fontWeight: '700', textAlign: 'center' },
  finishBody: { maxWidth: 340, color: 'rgba(255,255,255,0.74)', marginTop: 8, fontSize: 15, lineHeight: 21, fontWeight: '400', textAlign: 'center' },
  finishButton: { minHeight: 50, marginTop: 22, paddingHorizontal: 24, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { color: '#111214', fontSize: 15, fontWeight: '700' },
  finishEdit: { minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  finishEditText: { color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: '400' },
});
