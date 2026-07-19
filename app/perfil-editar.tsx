import { BlurView } from 'expo-blur';

import { HintSheet } from '@/components/hint-sheet';
import { useRef } from 'react';
import {
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
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { GlassIconButton } from '@/components/glass-button';
import { BusinessPaymentSelector } from '@/components/business-payment-selector';
import { BusinessScheduleEditor } from '@/components/business-schedule-editor';

// Paleta oscura fija estilo Figma FonderoFonda (flujo Fondero siempre oscuro).
const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.08)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  border: 'rgba(255,255,255,0.10)',
  sep: 'rgba(255,255,255,0.06)',
  accent: '#FF6A3D',
  accentLight: 'rgba(255,106,61,0.15)',
};

const MAX_NOMBRE      = 30;
const MAX_DESCRIPCION = 80;
const MAX_UBICACION   = 80;

function makeStyles(theme: Theme) {
  const t: Theme = { ...theme, ...DARK, isDark: true };
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.bg },
    scroll:             { flex: 1 },
    scrollContent:      { paddingHorizontal: 20, paddingBottom: 120 },
    // Hero
    heroBlock:          { paddingTop: 8, paddingBottom: 6 },
    titleRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eyebrowOrange:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    screenTitle:        { fontSize: 34, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, marginBottom: 6, fontFamily: Fonts.brand },
    screenSub:          { fontSize: 14, fontWeight: '300', lineHeight: 19, color: t.textSecondary, marginBottom: 4 },
    // Barra Guardar fija abajo (glass)
    saveBar:            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, overflow: 'hidden' },
    saveBarBorder:      { position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    saveBtn:            { height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    saveBtnText:        { fontSize: 16, fontWeight: '700', color: '#111214' },
    // Card de campos
    fieldCard:          { backgroundColor: t.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 16, paddingVertical: 14 },
    fieldLabel:         { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: t.textMute, marginBottom: 4 },
    fieldValue:         { fontSize: 16, fontWeight: '300', color: t.text, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    fieldDivider:       { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 12 },
    locationBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, paddingBottom: 2, alignSelf: 'flex-start' },
    locationBtnText:    { fontSize: 13, fontWeight: '300', color: t.textSecondary },
    // Sections
    block:              { paddingTop: 24 },
    blockFirst:         { paddingTop: 32 },
    blockLabel:         { fontSize: 11, fontWeight: '900', color: t.textSecondary, marginBottom: 8, paddingLeft: 2 },
    blockHelp:          { marginTop: -2, marginBottom: 14, paddingLeft: 2, fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.textSecondary },
    // Cards planas (horario)
    plainCard:          { backgroundColor: t.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    opSection:          { paddingHorizontal: 16, paddingVertical: 16 },
    divider:            { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    pickerWrapper:      { marginTop: 12, backgroundColor: t.bg, borderRadius: 12, overflow: 'hidden' },
    // Horario — cápsulas de → a
    horarioRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeCapsule:        { flex: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.bg },
    timeCapsuleActive:  { borderColor: t.accent, backgroundColor: t.accentLight },
    timeCapsuleHint:    { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: t.textMute, marginBottom: 3 },
    timeCapsuleVal:     { fontSize: 18, fontWeight: '900', color: t.text, fontFamily: Fonts.brand },
    // Horario semanal
    // Resumen agrupado (filas día → horas)
    resumenCard:        { marginBottom: 12, gap: 2 },
    resumenFila:        { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: 4 },
    resumenDias:        { fontSize: 14, fontWeight: '900', color: t.text, fontFamily: Fonts.brand, minWidth: 70 },
    resumenHoras:       { fontSize: 14, fontWeight: '300', color: t.textSecondary, flex: 1, textAlign: 'right' },
    resumenCerrado:     { color: t.textMute },
    cerradoNota:        { fontSize: 12.5, fontWeight: '300', color: t.accent, marginBottom: 10 },
    horarioSep:         { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 16 },
    editingContext:     { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
    editingContextLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textMute },
    editingContextValue:{ fontSize: 15, fontWeight: '900', color: t.accent, fontFamily: Fonts.brand },
    diasHint:           { fontSize: 11.5, fontWeight: '300', color: t.textMute, marginBottom: 10 },
    dayChipsRow:        { flexDirection: 'row', gap: 6 },
    dayChip:            { flex: 1, aspectRatio: 1, maxWidth: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dayChipDot:         { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent },
    dayChipException:   { borderColor: t.accent, backgroundColor: t.accentLight },
    dayChipClosed:      { borderColor: t.accent, backgroundColor: t.accentLight, opacity: 0.6 },
    dayChipSelected:    { borderColor: t.accent, backgroundColor: t.accent },
    dayChipText:        { fontSize: 13, fontWeight: '900', color: t.textSecondary, fontFamily: Fonts.brand },
    exceptionBar:       { flexDirection: 'row', gap: 6, marginTop: 16 },
    exceptionAction:    { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    exceptionDone:      { backgroundColor: t.accent, borderColor: t.accent },
    exceptionActionText:{ fontSize: 12.5, fontWeight: '700', color: t.text },
    dayRow:             { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
    dayRowBorder:       { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    dayName:            { flex: 1, fontSize: 16, fontWeight: '600', color: t.text },
    dayHours:           { fontSize: 14, fontWeight: '300', color: t.textSecondary },
    dayEditor:          { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: t.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    closedRow:          { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    closedLabel:        { fontSize: 14, fontWeight: '500', color: t.text },
    timeRow:            { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    timeRowLabel:       { fontSize: 14, color: t.textSecondary },
    timeRowValue:       { fontSize: 17, fontWeight: '700', color: t.text },
    applyAll:           { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
    applyAllText:       { fontSize: 13, fontWeight: '600', color: t.accent },
    // Payments
    paymentChips:       { flexDirection: 'row', gap: 8 },
    paymentChip:        { flex: 1, flexDirection: 'row', minHeight: 44, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface },
    paymentChipActive:  { backgroundColor: t.accent, borderColor: t.accent },
    paymentChipText:    { fontSize: 12.5, fontWeight: '700', color: t.text },
    paymentChipTextActive: { color: '#fff' },
    // Settings
    settingGroup:       { marginTop: 2, backgroundColor: t.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    settingRow:         { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 14 },
    rowLabel:           { flex: 1, fontSize: 17, fontWeight: '300', color: t.text },
    emailText:          { flex: 1, fontSize: 16, fontWeight: '300', color: t.textSecondary },
    settingIcon:        { marginRight: 12, opacity: 0.42 },
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
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
    isSaving,
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
    ubicacion,
  } = useFonderoProfileController();

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <View style={{ marginLeft: 14, marginBottom: 4 }}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={handleBack} size={38} iconSize={19} />
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.heroBlock}>
          <Text style={s.eyebrowOrange} allowFontScaling={true}>Mi Patio</Text>
          <Text style={s.screenTitle} allowFontScaling={true}>Editar mi lugar</Text>
          <Text style={s.screenSub} allowFontScaling={true}>Así te encuentran quienes andan cerca.</Text>
        </View>

        {/* ── IDENTIDAD ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>IDENTIDAD</Text>
          <View style={s.fieldCard}>
            <Text style={s.fieldLabel} allowFontScaling={true}>Nombre</Text>
            <TextInput
              ref={nombreInputRef}
              style={s.fieldValue}
              value={nombre}
              onChangeText={(v) => setNombre(v.slice(0, MAX_NOMBRE))}
              placeholder="Nombre de tu negocio"
              placeholderTextColor={DARK.textSecondary}
              selectionColor={DARK.accent}
              autoCapitalize="words"
              editable={ready}
              returnKeyType="next"
            />
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>Descripción</Text>
            <TextInput
              style={s.fieldValue}
              value={descripcion}
              onChangeText={(v) => setDescripcion(v.slice(0, MAX_DESCRIPCION))}
              placeholder="Comida corrida, antojitos…"
              placeholderTextColor={DARK.textSecondary}
              selectionColor={DARK.accent}
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
              placeholderTextColor={DARK.textSecondary}
              selectionColor={DARK.accent}
              autoCapitalize="sentences"
              editable={ready}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={s.locationBtn}
              onPress={handleMarkLocation}
              disabled={isSavingLocation}
              activeOpacity={0.7}>
              <Ionicons
                name={locationSaved ? 'checkmark-circle' : 'location-outline'}
                size={14}
                color={locationSaved ? DARK.accent : DARK.textSecondary}
              />
              <Text style={[s.locationBtnText, locationSaved && { color: DARK.accent }]}>
                {isSavingLocation ? 'Ubicando…' : locationSaved ? 'En el mapa' : 'Marcar en el mapa'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HORARIO ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>HORARIO</Text>
          <Text style={s.blockHelp} allowFontScaling={true}>Toca los días que abres y ajusta cada hora.</Text>
          <BusinessScheduleEditor colors={DARK} value={semanal} onChange={setSemanal} isDark />
        </View>

        {/* ── PAGOS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>CÓMO COBRAS</Text>
          <Text style={s.blockHelp} allowFontScaling={true}>Marca todas las formas que aceptas.</Text>
          <BusinessPaymentSelector
            colors={DARK}
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
          <View style={s.settingGroup}>
            <View style={s.settingRow}>
              <Ionicons name="mail-outline" size={20} color={DARK.textSecondary} style={s.settingIcon} />
              <Text style={s.emailText} numberOfLines={1} allowFontScaling={true}>{email || 'Sin correo'}</Text>
            </View>
            <View style={s.divider} />
            <TouchableOpacity style={s.settingRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={DARK.textSecondary} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Cerrar sesión</Text>
              <Ionicons name="chevron-forward" size={15} color={DARK.textMute} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Guardar: barra fija abajo, glass, solo con cambios pendientes.
          Visibility + 80/20: la acción principal del Fondero siempre al alcance. */}
      {isDirty && (
        <View style={[s.saveBar, { paddingBottom: insets.bottom || 16 }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={s.saveBarBorder} />
          <TouchableOpacity
            style={[s.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSaveAll}
            disabled={isSaving}
            activeOpacity={0.85}>
            <Text style={s.saveBtnText} allowFontScaling={true}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
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
