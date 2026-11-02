import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

import { HintSheet } from '@/components/hint-sheet';
import { useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFonderoProfileController } from '@/lib/controllers/useFonderoProfileController';
import { sanitizeNombreInput } from '@/lib/fondita-name';
import { noWidow } from '@/lib/typography';
import { useTheme, type Theme } from '@/lib/theme';
import { GlassIconButton } from '@/components/glass-button';
import { BusinessPaymentSelector } from '@/components/business-payment-selector';
import { BusinessScheduleEditor } from '@/components/business-schedule-editor';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';

const MAX_DESCRIPCION = 80;
const MAX_UBICACION   = 80;
const BUSINESS_TYPES = [
  ['fondita', 'Fondita'],
  ['taqueria', 'Tacos'],
  ['antojitos', 'Antojitos'],
  ['elotes', 'Elotes'],
  ['reposteria', 'Postres'],
  ['cafeteria', 'Café'],
  ['mariscos', 'Mariscos'],
  ['bebidas', 'Bebidas'],
  ['jugos', 'Jugos y fruta'],
  ['restaurante', 'Restaurante'],
  ['otro', 'Otro'],
] as const;

function makeStyles(theme: Theme) {
  const t = theme;
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.bg },
    scroll:             { flex: 1 },
    scrollContent:      { paddingHorizontal: 20, paddingBottom: 120 },
    // Barra Guardar fija abajo (glass)
    saveBar:            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, overflow: 'hidden' },
    saveBarBorder:      { position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    saveBtn:            { height: 52, borderRadius: 26, flexDirection: 'row', backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    saveBtnIdle:        { backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    fieldNote:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    fieldNoteText:      { marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    saveBtnText:        { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    // Card de campos
    fieldCard:          { backgroundColor: t.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 16, paddingVertical: 14 },
    fieldLabel:         { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: t.textMute, marginBottom: 4 },
    fieldValue:         { fontSize: 16, fontWeight: '400', color: t.text, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    fieldDivider:       { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 12 },
    lockedRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 },
    lockedHint:         { fontSize: 13, fontWeight: '400', color: t.textSecondary },
    locationBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12, paddingBottom: 2, alignSelf: 'flex-start' },
    locationBtnText:    { fontSize: 13, fontWeight: '400', color: t.textSecondary },
    // Sections
    block:              { paddingTop: 24 },
    blockLabel:         { fontSize: 11, fontWeight: '900', color: t.textSecondary, marginBottom: 8, paddingLeft: 2 },
    blockHelp:          { marginTop: -2, marginBottom: 14, paddingLeft: 2, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
  });
}


// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const nombreInputRef     = useRef<TextInput>(null);
  const {
    descripcion,
    email,
    handleBack,
    handleMarkLocation,
    handleSaveAll,
    handleSignOut,
    isDirty,
    missing,
    nameError,
    nameLockedUntil,
    isSaving,
    savedFlash,
    isSavingLocation,
    locationSaved,
    markPerfilHintDone,
    nombre,
    pagosEfectivo,
    pagosTarjeta,
    pagosTrans,
    ready,
    semanal,
    setDescripcion,
    setNombre,
    setPagosEfectivoState,
    setPagosTarjetaState,
    setPagosTransState,
    setSemanal,
    setUbicacion,
    showPerfilHint,
    tipoNegocio,
    ubicacion,
  } = useFonderoProfileController();
  const blockedBy = !savedFlash && missing.length ? `Falta ${missing.join(' y ')}` : null;
  const saveLabel = isSaving ? 'Guardando…' : savedFlash ? 'Guardado' : blockedBy ?? 'Guardar cambios';

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <View style={{ marginLeft: 14, marginBottom: 4 }}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={handleBack} size={38} iconSize={19} />
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── IDENTIDAD ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>IDENTIDAD</Text>
          <View style={s.fieldCard}>
            <Text style={s.fieldLabel} allowFontScaling={true}>Nombre</Text>
            <TextInput
              ref={nombreInputRef}
              style={s.fieldValue}
              value={nombre}
              onChangeText={(v) => setNombre(sanitizeNombreInput(v))}
              placeholder="Nombre de tu negocio"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.accent}
              autoCapitalize="words"
              editable={ready && !nameLockedUntil}
              returnKeyType="next"
              accessibilityHint={nameLockedUntil ? 'El nombre no se puede cambiar todavía' : undefined}
            />
            {/* La regla se dice antes de escribir, no al tocar Guardar. */}
            {nameError ? (
              <View style={s.fieldNote}>
                <Ionicons name="alert-circle" size={14} color={theme.accent} />
                <Text style={[s.fieldNoteText, { marginTop: 0, flexShrink: 1, color: theme.text }]} accessibilityLiveRegion="polite">{noWidow(nameError)}</Text>
              </View>
            ) : (
              <Text style={s.fieldNoteText}>{noWidow(nameLockedUntil
                ? `Podrás cambiarlo a partir del ${nameLockedUntil.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}.`
                : 'Puedes cambiarlo una vez cada 15 días.')}</Text>
            )}
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>{noWidow('Tipo de lugar')}</Text>
            {/* El giro se elige en el alta y aquí solo se muestra: cambiarlo
                mueve dónde aparece el lugar y rompe la lectura de sus
                reseñas por giro. Como en Uber Eats y Rappi, el cambio se pide
                a soporte y se revisa. */}
            <TouchableOpacity
              style={s.lockedRow}
              onPress={() => router.push({ pathname: '/soporte', params: { role: 'fondero' } })}
              accessibilityRole="button"
              accessibilityLabel={`Tipo de lugar, ${BUSINESS_TYPES.find(([id]) => id === tipoNegocio)?.[1] ?? 'Otro'}. Pedir un cambio a soporte`}>
              <Text style={s.fieldValue}>{BUSINESS_TYPES.find(([id]) => id === tipoNegocio)?.[1] ?? 'Otro'}</Text>
              <Text style={s.lockedHint}>{noWidow('Pedir cambio')}</Text>
            </TouchableOpacity>
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>Descripción</Text>
            <TextInput
              style={s.fieldValue}
              value={descripcion}
              onChangeText={(v) => setDescripcion(v.slice(0, MAX_DESCRIPCION))}
              placeholder="Comida corrida, antojitos…"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.accent}
              autoCapitalize="sentences"
              editable={ready}
              returnKeyType="next"
            />
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>Dirección</Text>
            <TextInput
              style={s.fieldValue}
              value={ubicacion}
              onChangeText={(v) => setUbicacion(v.slice(0, MAX_UBICACION))}
              placeholder="Calle y colonia"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.accent}
              autoCapitalize="sentences"
              editable={ready}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={s.locationBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              onPress={handleMarkLocation}
              disabled={isSavingLocation}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={locationSaved ? 'En el mapa' : 'Marcar en el mapa'}
              accessibilityState={{ disabled: isSavingLocation, busy: isSavingLocation }}>
              <Ionicons
                name={locationSaved ? 'checkmark-circle' : 'navigate-outline'}
                size={14}
                color={locationSaved ? theme.accent : theme.textSecondary}
              />
              <Text style={[s.locationBtnText, locationSaved && { color: theme.accent }]}>
                {isSavingLocation ? 'Ubicando…' : locationSaved ? 'En el mapa' : 'Marcar en el mapa'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HORARIO ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>HORARIO</Text>
          <Text style={s.blockHelp} allowFontScaling={true}>{noWidow('Toca los días que abres y ajusta cada hora.')}</Text>
          <BusinessScheduleEditor colors={theme} value={semanal} onChange={setSemanal} isDark={theme.isDark} />
        </View>

        {/* ── PAGOS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>{noWidow('CÓMO COBRAS')}</Text>
          <Text style={s.blockHelp} allowFontScaling={true}>{noWidow('Marca todas las formas que aceptas.')}</Text>
          <BusinessPaymentSelector
            colors={theme}
            value={{ efectivo: pagosEfectivo, transferencia: pagosTrans, tarjeta: pagosTarjeta }}
            onChange={(pagos) => {
              setPagosEfectivoState(pagos.efectivo);
              setPagosTransState(pagos.transferencia);
              setPagosTarjetaState(pagos.tarjeta);
            }}
          />
        </View>

        {/* ── CUENTA: correo + cerrar sesión ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>CUENTA</Text>
          <SettingsGroup c={sc}>
            <SettingsRow c={sc} icon="mail-outline" title={email || 'Sin correo'} />
            <SettingsRow c={sc} icon="log-out-outline" title="Cerrar sesión" divider onPress={handleSignOut} />
          </SettingsGroup>
        </View>

      </ScrollView>

      {/* Guardar: barra fija abajo, glass, solo con cambios pendientes.
          Visibility + 80/20: la acción principal del Fondero siempre al alcance. */}
      {(isDirty || savedFlash) && (
        <View style={[s.saveBar, { paddingBottom: insets.bottom || 16 }]}>
          <BlurView intensity={40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={s.saveBarBorder} />
          {/* Un estado por momento: falta algo (gris, dice qué), listo
              (naranja), guardando, guardado (hasta que vuelvas a editar). */}
          <TouchableOpacity
            style={[s.saveBtn, (blockedBy || savedFlash) && s.saveBtnIdle]}
            onPress={handleSaveAll}
            disabled={isSaving || savedFlash || !!blockedBy}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            accessibilityState={{ disabled: isSaving || savedFlash || !!blockedBy, busy: isSaving }}>
            {isSaving && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
            {savedFlash && <Ionicons name="checkmark" size={16} color={theme.text} style={{ marginRight: 6 }} />}
            <Text style={[s.saveBtnText, (blockedBy || savedFlash) && { color: theme.textSecondary }, savedFlash && { color: theme.text }]} allowFontScaling={true}>
              {noWidow(saveLabel)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <HintSheet
        visible={showPerfilHint}
        icon="storefront"
        title="Ponle nombre a tu negocio"
        body="Nombre, ubicación, horario y formas de pago. Eso es todo para aparecer en Patio."
        primaryLabel="Empezar"
        onPrimary={() => {
          markPerfilHintDone();
          setTimeout(() => nombreInputRef.current?.focus(), 300);
        }}
        onDismiss={markPerfilHintDone}
      />
    </View>
  );
}
