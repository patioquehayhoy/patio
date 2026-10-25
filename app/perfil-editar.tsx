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
    saveBtnText:        { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    // Card de campos
    fieldCard:          { backgroundColor: t.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 16, paddingVertical: 14 },
    fieldLabel:         { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: t.textMute, marginBottom: 4 },
    fieldValue:         { fontSize: 16, fontWeight: '400', color: t.text, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    fieldDivider:       { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 12 },
    typeRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, paddingBottom: 2 },
    typeChip:           { maxWidth: '100%', minHeight: 40, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    typeChipSelected:   { backgroundColor: t.accent, borderColor: t.accent },
    typeChipText:       { flexShrink: 1, fontSize: 12, fontWeight: '600', color: t.textSecondary },
    typeChipTextSelected:{ color: '#fff' },
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
    setTipoNegocioState,
    setSemanal,
    setUbicacion,
    showPerfilHint,
    tipoNegocio,
    ubicacion,
  } = useFonderoProfileController();

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
              editable={ready}
              returnKeyType="next"
            />
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>{noWidow('Tipo de lugar')}</Text>
            <View style={s.typeRow}>
              {BUSINESS_TYPES.map(([id, label]) => {
                const selected = tipoNegocio === id;
                return (
                  <TouchableOpacity
                    key={id}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    hitSlop={{ top: 5, bottom: 5, left: 3, right: 3 }}
                    onPress={() => setTipoNegocioState(id)}
                    style={[s.typeChip, selected && s.typeChipSelected]}>
                    <Text style={[s.typeChipText, selected && s.typeChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
          <TouchableOpacity
            style={[s.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSaveAll}
            disabled={isSaving || savedFlash}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isSaving ? 'Guardando cambios' : savedFlash ? 'Guardado' : 'Guardar cambios'}
            accessibilityState={{ disabled: isSaving || savedFlash, busy: isSaving }}>
            {savedFlash && <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 6 }} />}
            <Text style={s.saveBtnText} allowFontScaling={true}>
              {isSaving ? 'Guardando…' : savedFlash ? 'Guardado' : 'Guardar cambios'}
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
