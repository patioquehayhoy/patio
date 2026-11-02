import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProStatus, sendSpecialNotice } from '@/lib/business-pro';
import { getFonditaId } from '@/lib/menu-store';
import { PLANS } from '@/lib/plans';
import { Radius, Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const MAX = 140;

// Aviso especial (Pro): una promoción corta que llega a quien guardó el lugar
// y activó Promociones, y que la ficha muestra durante 24 horas.
export default function AvisoEspecialScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [left, setLeft] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    const id = getFonditaId();
    if (id) getProStatus(id).then((status) => setLeft(status?.proUntil ? status.noticesLeft : 0)).catch(() => setLeft(0));
  }, []));

  const clean = text.replace(/\s+/g, ' ').trim();
  const missing = !clean ? 'Escribe tu aviso' : left === 0 ? 'Sin avisos este mes' : '';
  const send = async () => {
    const id = getFonditaId();
    if (!id || missing || state !== 'idle') return;
    setState('sending');
    setError('');
    try {
      await sendSpecialNotice(id, clean);
      setLeft((value) => (value === null ? value : Math.max(0, value - 1)));
      setState('sent');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Inténtalo de nuevo.');
      setState('idle');
    }
  };
  const edit = (value: string) => { setText(value.slice(0, MAX)); setError(''); if (state === 'sent') setState('idle'); };
  const label = state === 'sending' ? 'Enviando…' : state === 'sent' ? 'Enviado' : missing || 'Enviar aviso';
  const ready = !missing && state !== 'sent';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" numberOfLines={1} style={[s.navTitle, { color: theme.text }]}>Aviso especial</Text>
        <View style={s.back} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={[s.help, { color: theme.textSecondary }]}>
          {noWidow('Llega a tus seguidores que activaron Promociones y se ve en tu ficha durante 24 horas.')}
        </Text>
        <Text style={[s.label, { color: theme.textSecondary }]}>Tu aviso</Text>
        <View style={[s.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            accessibilityLabel="Tu aviso"
            value={text}
            onChangeText={edit}
            multiline
            autoFocus
            placeholder="Hoy el café va gratis con la comida corrida"
            placeholderTextColor={theme.textMute}
            style={[s.input, { color: theme.text }]}
          />
          <Text style={[s.counter, { color: theme.textMute }]}>{text.length}/{MAX}</Text>
        </View>
        {!!error && <Text accessibilityLiveRegion="polite" style={[s.error, { color: theme.accent }]}>{noWidow(error)}</Text>}
        {left !== null && <Text style={[s.left, { color: theme.textSecondary }]}>{noWidow(`Te quedan ${left} de ${PLANS.pro.specialNotices} este mes`)}</Text>}
        <TouchableOpacity
          style={[s.send, ready ? { backgroundColor: theme.accent } : { backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}
          disabled={!ready || state === 'sending'}
          activeOpacity={0.85}
          onPress={() => { void send(); }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready, busy: state === 'sending' }}>
          {state === 'sending' && <ActivityIndicator color="#FFFFFF" />}
          {state === 'sent' && <Ionicons name="checkmark" size={18} color={theme.textSecondary} />}
          <Text style={[s.sendText, { color: ready ? '#FFFFFF' : theme.textSecondary }]}>{noWidow(label)}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  help: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  label: { ...Type.label, marginTop: 24, marginBottom: 6, marginLeft: 4 },
  field: { minHeight: 140, padding: 16, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth },
  input: { minHeight: 90, fontSize: 15, lineHeight: 20, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 11 },
  error: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  left: { marginTop: 16, fontSize: 13, lineHeight: 18 },
  send: { minHeight: 54, marginTop: 16, paddingHorizontal: 16, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendText: { fontSize: 16, fontWeight: '700' },
});
