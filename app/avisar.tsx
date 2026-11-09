import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBusinessStats } from '@/lib/business-stats';
import { getFonditaId, getFonditaName } from '@/lib/menu-store';
import {
  dateFromTime, OPERATION_OPTIONS, operationHourLabel, operationNoticeText, sendOperationNotice, timeFromDate, type OperationKind,
} from '@/lib/operation-notice';
import { Radius, Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// «Avisar a quienes te siguen» (v4 §4): avisos de operación gratis, uno al
// día. El negocio elige qué pasa hoy y la hora; ve cómo les llega y avisa.
export default function AvisarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<OperationKind>('late');
  const [times, setTimes] = useState<Record<string, string>>({});
  const [androidPicker, setAndroidPicker] = useState(false);
  const [followers, setFollowers] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    const id = getFonditaId();
    if (id) getBusinessStats(id).then((stats) => setFollowers(stats?.saves ?? 0)).catch(() => setFollowers(null));
  }, []));

  const option = OPERATION_OPTIONS.find((item) => item.kind === kind)!;
  const time = option.needsTime ? times[kind] ?? option.defaultTime ?? '12:00' : null;
  const text = operationNoticeText(kind, time) ?? '';
  const name = getFonditaName().trim() || 'Tu negocio';
  const sendLabel = state === 'sending' ? 'Avisando…'
    : state === 'sent' ? 'Avisado'
      : followers ? `Avisar a ${followers.toLocaleString('es-MX')} ${followers === 1 ? 'persona' : 'personas'}` : 'Publicar en tu ficha';

  const choose = (next: OperationKind) => {
    Haptics.selectionAsync().catch(() => {});
    setKind(next);
    setError('');
  };
  const changeTime = (date?: Date) => {
    setAndroidPicker(false);
    if (date) setTimes((current) => ({ ...current, [kind]: timeFromDate(date) }));
  };
  const send = async () => {
    const id = getFonditaId();
    if (!id || state !== 'idle') return;
    setState('sending');
    setError('');
    try {
      await sendOperationNotice(id, kind, time);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setState('sent');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Inténtalo de nuevo.');
      setState('idle');
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={s.title} accessibilityRole="header">{noWidow('Avisar a quienes te siguen')}</Text>
        <Text style={s.help}>{noWidow('Les llega como aviso y se ve en tu ficha hoy.')}</Text>

        <View style={s.chips} accessibilityRole="radiogroup">
          {OPERATION_OPTIONS.map((item) => {
            const on = item.kind === kind;
            return (
              <TouchableOpacity
                key={item.kind}
                onPress={() => choose(item.kind)}
                disabled={state !== 'idle'}
                activeOpacity={0.7}
                style={[s.chip, on && s.chipOn]}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, disabled: state !== 'idle' }}>
                <Text style={[s.chipText, on && s.chipTextOn]}>{noWidow(item.label)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {option.needsTime && !!time && (
          <View style={s.timeRow}>
            <Text style={s.timeLabel}>{kind === 'late' ? 'Abrimos a las' : 'Cerramos a las'}</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={dateFromTime(time)}
                mode="time"
                display="compact"
                minuteInterval={15}
                locale="es-MX"
                themeVariant={theme.isDark ? 'dark' : 'light'}
                accentColor={theme.accent}
                disabled={state !== 'idle'}
                onChange={(_, date) => changeTime(date)}
                accessibilityLabel="Hora"
              />
            ) : (
              <TouchableOpacity style={s.timeChip} onPress={() => setAndroidPicker(true)} disabled={state !== 'idle'} accessibilityRole="button" accessibilityLabel={`Hora, ${operationHourLabel(time)}`}>
                <Text style={s.timeChipText}>{operationHourLabel(time)}</Text>
              </TouchableOpacity>
            )}
            {androidPicker && (
              <DateTimePicker value={dateFromTime(time)} mode="time" minuteInterval={15} onChange={(_, date) => changeTime(date)} />
            )}
          </View>
        )}

        <Text style={s.label}>ASÍ LES LLEGA</Text>
        <View style={s.preview} accessible accessibilityLabel={`Así les llega: ${name}. ${text}`}>
          <Image source={require('../assets/images/p-icon.png')} style={s.previewIcon} />
          <View style={s.previewBody}>
            <View style={s.previewHead}>
              <Text style={s.previewTitle}>{noWidow(name)}</Text>
              <Text style={s.previewTime}>ahora</Text>
            </View>
            <Text style={s.previewText}>{noWidow(text)}</Text>
          </View>
        </View>

        {!!error && <Text accessibilityLiveRegion="polite" style={s.error}>{noWidow(error)}</Text>}
        <TouchableOpacity
          style={[s.send, state === 'sent' ? s.sendDone : { backgroundColor: theme.accent }]}
          disabled={state !== 'idle' || !text}
          activeOpacity={0.85}
          onPress={() => { void send(); }}
          accessibilityRole="button"
          accessibilityState={{ disabled: state !== 'idle', busy: state === 'sending' }}>
          {state === 'sending' && <ActivityIndicator color="#FFFFFF" />}
          {state === 'sent' && <Ionicons name="checkmark" size={18} color={theme.textSecondary} />}
          <Text style={[s.sendText, { color: state === 'sent' ? theme.textSecondary : '#FFFFFF' }]}>{noWidow(sendLabel)}</Text>
        </TouchableOpacity>
        <Text style={s.foot}>{noWidow(state === 'sent' ? 'Ya se ve en tu ficha. Mañana puedes avisar otra vez.' : 'Gratis. Uno al día.')}</Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    title: { ...Type.title, color: t.text },
    help: { marginTop: 8, fontSize: 15, lineHeight: 20, fontWeight: '400', color: t.textSecondary },
    chips: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: t.text },
    chipTextOn: { color: t.accent },
    timeRow: { marginTop: 16, minHeight: 52, paddingHorizontal: 16, borderRadius: Radius.card, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    timeLabel: { flexShrink: 1, fontSize: 16, lineHeight: 21, fontWeight: '400', color: t.text },
    timeChip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10, borderCurve: 'continuous', backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center' },
    timeChipText: { fontSize: 16, fontWeight: '600', color: t.text, fontVariant: ['tabular-nums'] },
    label: { ...Type.label, marginTop: 28, marginBottom: 8, marginLeft: 4, color: t.textSecondary },
    preview: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 22, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    previewIcon: { width: 38, height: 38, borderRadius: 9, borderCurve: 'continuous' },
    previewBody: { flex: 1, minWidth: 0 },
    previewHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    previewTitle: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontWeight: '700', color: t.text },
    previewTime: { fontSize: 13, lineHeight: 18, color: t.textMute },
    previewText: { marginTop: 1, fontSize: 15, lineHeight: 20, fontWeight: '400', color: t.text },
    error: { marginTop: 12, fontSize: 13, lineHeight: 18, color: t.accent },
    send: { minHeight: 54, marginTop: 24, paddingHorizontal: 16, borderRadius: 27, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendDone: { backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    sendText: { fontSize: 16, fontWeight: '700' },
    foot: { marginTop: 10, fontSize: 13, lineHeight: 18, color: t.textSecondary, textAlign: 'center' },
  });
}
