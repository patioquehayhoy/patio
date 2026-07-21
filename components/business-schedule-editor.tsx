import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { HorarioSemanal } from '@/lib/horario';

export type ScheduleEditorColors = {
  accent: string;
  border: string;
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMute: string;
};

type TimeField = 'abre' | 'cierra';

const DAYS = [
  { id: 1, short: 'LU', label: 'Lunes' },
  { id: 2, short: 'MA', label: 'Martes' },
  { id: 3, short: 'MI', label: 'Miércoles' },
  { id: 4, short: 'JU', label: 'Jueves' },
  { id: 5, short: 'VI', label: 'Viernes' },
  { id: 6, short: 'SÁ', label: 'Sábado' },
  { id: 0, short: 'DO', label: 'Domingo' },
];

const PRESETS = [
  { label: 'Lun–Vie', days: [1, 2, 3, 4, 5] },
  { label: 'Fin de semana', days: [6, 0] },
  { label: 'Todos', days: [0, 1, 2, 3, 4, 5, 6] },
];

function dateFromTime(value: string | null, fallback: string): Date {
  const [hours, minutes] = (value ?? fallback).split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function timeFromDate(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function displayTime(value: string | null, fallback: string): string {
  return dateFromTime(value, fallback)
    .toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true });
}

type Props = {
  colors: ScheduleEditorColors;
  value: HorarioSemanal;
  onChange: (value: HorarioSemanal) => void;
  isDark?: boolean;
};

/**
 * Editor canónico de Patio para días y horarios.
 *
 * El selector compacto permanece junto al día. Al dejar de mover la ruleta,
 * se remonta el control para confirmar el valor y cerrar el popover nativo.
 */
export function BusinessScheduleEditor({ colors, value, onChange, isDark = false }: Props) {
  const [activePicker, setActivePicker] = useState<{ dia: number; field: TimeField } | null>(null);
  const dismissTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => () => {
    Object.values(dismissTimers.current).forEach(clearTimeout);
  }, []);

  const selectedDays = useMemo(
    () => DAYS.filter(({ id }) => !value.find((entry) => entry.dia === id)?.cerrado),
    [value],
  );

  const isPresetActive = (days: number[]) => {
    const selected = selectedDays.map(({ id }) => id);
    return selected.length === days.length && days.every((day) => selected.includes(day));
  };

  const applyPreset = (days: number[]) => {
    void Haptics.selectionAsync();
    onChange(value.map((day) => {
      const open = days.includes(day.dia);
      return {
        ...day,
        cerrado: !open,
        abre: open ? day.abre ?? '08:00' : day.abre,
        cierra: open ? day.cierra ?? '16:00' : day.cierra,
      };
    }));
  };

  const toggleDay = (dia: number) => {
    void Haptics.selectionAsync();
    onChange(value.map((day) => {
      if (day.dia !== dia) return day;
      const open = day.cerrado;
      return {
        ...day,
        cerrado: !open,
        abre: open ? day.abre ?? '08:00' : day.abre,
        cierra: open ? day.cierra ?? '16:00' : day.cierra,
      };
    }));
  };

  const confirmAnims = useRef<Record<string, Animated.Value>>({});
  const confirmAnim = (key: string) => {
    if (!confirmAnims.current[key]) confirmAnims.current[key] = new Animated.Value(1);
    return confirmAnims.current[key];
  };

  const confirmAfterPause = (key: string) => {
    clearTimeout(dismissTimers.current[key]);
    dismissTimers.current[key] = setTimeout(() => {
      delete dismissTimers.current[key];
      const anim = confirmAnim(key);
      Animated.timing(anim, {
        toValue: 0,
        duration: 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setActivePicker((current) => current && `${current.dia}-${current.field}` === key ? null : current);
        requestAnimationFrame(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });
      });
    }, 1100);
  };

  const updateTime = (dia: number, field: TimeField, next: Date) => {
    onChange(value.map((day) => day.dia === dia
      ? { ...day, [field]: timeFromDate(next) }
      : day));
    confirmAfterPause(`${dia}-${field}`);
  };

  return (
    <>
      <View style={s.presets}>
        {PRESETS.map((preset) => {
          const active = isPresetActive(preset.days);
          return (
            <TouchableOpacity
              key={preset.label}
              onPress={() => applyPreset(preset.days)}
              activeOpacity={0.72}
              style={[s.preset, { borderColor: active ? colors.text : colors.border, backgroundColor: colors.surface }]}>
              <Text style={[s.presetText, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.25}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.sectionHeading}>
        <Text style={[s.sectionLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>
          DÍAS QUE ABRES
        </Text>
        <Text style={[s.selectionStatus, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {selectedDays.length === 1 ? '1 abierto' : `${selectedDays.length} abiertos`}
        </Text>
      </View>
      <View style={s.dayDots}>
        {DAYS.map((item) => {
          const day = value.find((entry) => entry.dia === item.id)!;
          const open = !day.cerrado;
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityLabel={`${item.label}: ${open ? 'abierto' : 'cerrado'}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: open }}
              onPress={() => toggleDay(item.id)}
              activeOpacity={0.72}
              style={[s.dayDot, { backgroundColor: open ? colors.accent : colors.surface, borderColor: open ? colors.accent : colors.border }]}>
              <Text style={[s.dayDotText, { color: open ? '#fff' : colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                {item.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDays.length > 0 && (
        <View style={[s.scheduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {selectedDays.map((item, index) => {
            const day = value.find((entry) => entry.dia === item.id)!;
            const renderPicker = (field: TimeField) => {
              const pickerKey = `${item.id}-${field}`;
              return (
                <Animated.View
                  key={field}
                  style={[s.timeColumn, {
                    opacity: confirmAnim(pickerKey).interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                    transform: [{ scale: confirmAnim(pickerKey).interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
                  }]}>
                  <TouchableOpacity
                    accessibilityLabel={`${field === 'abre' ? 'Apertura' : 'Cierre'} de ${item.label}`}
                    accessibilityRole="button"
                    activeOpacity={0.72}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setActivePicker({ dia: item.id, field });
                    }}
                    style={[s.compactTime, { backgroundColor: colors.bg }]}>
                    <Text style={[s.compactTimeText, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
                      {displayTime(day[field], field === 'abre' ? '08:00' : '16:00')}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            };
            return (
              <View
                key={item.id}
                style={[s.scheduleRow, index < selectedDays.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[s.scheduleDay, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.35}>
                  {item.label}
                </Text>
                <View style={s.timeLabels}>
                  <View style={s.timeSide}>
                    <Text style={[s.columnLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>ABRE</Text>
                  </View>
                  <View style={s.rangeConnector} />
                  <View style={s.timeSide}>
                    <Text style={[s.columnLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>CIERRA</Text>
                  </View>
                </View>
                <View style={s.timeRange}>
                  <View style={s.timeSide}>{renderPicker('abre')}</View>
                  <View style={s.rangeConnector}>
                    <Ionicons name="arrow-forward" size={13} color={colors.textMute} />
                  </View>
                  <View style={s.timeSide}>{renderPicker('cierra')}</View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setActivePicker(null)}>
        <View style={s.pickerOverlay}>
          <Pressable
            accessibilityLabel="Cerrar selector de hora"
            style={StyleSheet.absoluteFill}
            onPress={() => setActivePicker(null)}
          />
          {activePicker && (() => {
            const item = DAYS.find(({ id }) => id === activePicker.dia)!;
            const day = value.find((entry) => entry.dia === activePicker.dia)!;
            const field = activePicker.field;
            return (
              <View style={[s.pickerSurface, { borderColor: colors.border }]}>
                <BlurView intensity={92} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <Text style={[s.pickerTitle, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                  {item.label.toUpperCase()} · {field === 'abre' ? 'APERTURA' : 'CIERRE'}
                </Text>
                <DateTimePicker
                  key={`${activePicker.dia}-${field}`}
                  accessibilityLabel={`Ruleta de ${field === 'abre' ? 'apertura' : 'cierre'} de ${item.label}`}
                  value={dateFromTime(day[field], field === 'abre' ? '08:00' : '16:00')}
                  mode="time"
                  display="spinner"
                  minuteInterval={15}
                  locale="es-MX"
                  themeVariant={isDark ? 'dark' : 'light'}
                  accentColor={colors.accent}
                  style={s.pickerWheel}
                  onChange={(_, next) => next && updateTime(item.id, field, next)}
                />
              </View>
            );
          })()}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  preset: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  presetText: { fontSize: 13, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  sectionHeading: { marginTop: 22, marginBottom: 8, minHeight: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 0.9 },
  selectionStatus: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  dayDots: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDot: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  scheduleCard: { marginTop: 20, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, overflow: 'hidden' },
  columnLabel: { fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
  scheduleRow: { minHeight: 112, paddingVertical: 14 },
  scheduleDay: { fontSize: 15, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  timeLabels: { marginTop: 9, flexDirection: 'row', alignItems: 'center' },
  timeRange: { marginTop: 2, flexDirection: 'row', alignItems: 'center' },
  timeSide: { flex: 1, alignItems: 'center' },
  timeColumn: { width: 104, alignItems: 'center' },
  rangeConnector: { width: 24, alignItems: 'center', justifyContent: 'center' },
  compactTime: { width: 104, minHeight: 44, borderRadius: 12, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  compactTimeText: { fontSize: 17, lineHeight: 22, fontWeight: '500', letterSpacing: -0.3, textAlign: 'center' },
  pickerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pickerSurface: { width: 320, minHeight: 236, borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 18 },
  pickerTitle: { position: 'absolute', top: 18, left: 24, right: 24, zIndex: 1, fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 0.9, textAlign: 'center' },
  pickerWheel: { width: 288, height: 190, marginTop: 24, alignSelf: 'center' },
});
