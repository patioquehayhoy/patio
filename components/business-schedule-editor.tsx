import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  { id: 1, short: 'L', label: 'Lunes' },
  { id: 2, short: 'M', label: 'Martes' },
  { id: 3, short: 'M', label: 'Miércoles' },
  { id: 4, short: 'J', label: 'Jueves' },
  { id: 5, short: 'V', label: 'Viernes' },
  { id: 6, short: 'S', label: 'Sábado' },
  { id: 0, short: 'D', label: 'Domingo' },
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
  const [pickerRevision, setPickerRevision] = useState<Record<string, number>>({});
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
      Animated.timing(anim, { toValue: 0, duration: 90, useNativeDriver: true }).start(() => {
        setPickerRevision((current) => ({ ...current, [key]: (current[key] ?? 0) + 1 }));
        Animated.timing(anim, { toValue: 1, duration: 140, useNativeDriver: true }).start();
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
              {active && <Ionicons name="checkmark" size={13} color={colors.text} />}
              <Text style={[s.presetText, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.25}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
            return (
              <View
                key={item.id}
                style={[s.scheduleRow, index < selectedDays.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[s.scheduleDay, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.35}>
                  {item.label}
                </Text>
                <View style={s.timeEditors}>
                  {(['abre', 'cierra'] as const).map((field) => {
                    const pickerKey = `${item.id}-${field}`;
                    return (
                      <View style={s.timeEditor} key={field}>
                        <Text style={[s.timeLabel, { color: colors.textMute }]} maxFontSizeMultiplier={1.3}>
                          {field === 'abre' ? 'ABRE' : 'CIERRA'}
                        </Text>
                        <Animated.View
                          style={{
                            opacity: confirmAnim(pickerKey).interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                            transform: [{ scale: confirmAnim(pickerKey).interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
                          }}>
                          <DateTimePicker
                            key={`${pickerKey}-${pickerRevision[pickerKey] ?? 0}`}
                            accessibilityLabel={`${field === 'abre' ? 'Apertura' : 'Cierre'} de ${item.label}`}
                            value={dateFromTime(day[field], field === 'abre' ? '08:00' : '16:00')}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'compact' : 'default'}
                            minuteInterval={15}
                            locale="es-MX"
                            themeVariant={isDark ? 'dark' : 'light'}
                            accentColor={colors.accent}
                            style={s.compactTime}
                            onChange={(_, next) => next && updateTime(item.id, field, next)}
                          />
                        </Animated.View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  preset: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  presetText: { fontSize: 13, fontWeight: '600' },
  dayDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  dayDot: { width: 39, height: 39, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { fontSize: 14, fontWeight: '700' },
  scheduleCard: { marginTop: 20, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, overflow: 'hidden' },
  scheduleRow: { minHeight: 96, paddingVertical: 12 },
  scheduleDay: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  timeEditors: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 20 },
  timeEditor: { flex: 1 },
  timeLabel: { marginBottom: 2, fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
  compactTime: { alignSelf: 'flex-start', marginLeft: -8 },
});
