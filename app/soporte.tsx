import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, useTheme } from '@/lib/theme';

const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';
const TOPICS = [
  { id: 'acceso', icon: 'key-outline', title: 'No puedo entrar', hint: 'Correo, enlace o sesión' },
  { id: 'menu', icon: 'receipt-outline', title: 'Mi menú', hint: 'Foto, lectura, guardado o publicación' },
  { id: 'lugar', icon: 'location-outline', title: 'Mi Patio', hint: 'Nombre, horario o ubicación' },
  { id: 'avisos', icon: 'notifications-outline', title: 'Avisos', hint: 'Permisos y recordatorios' },
  { id: 'resena', icon: 'star-outline', title: 'Reseñas y seguridad', hint: 'Reportar contenido o una experiencia' },
  { id: 'idea', icon: 'bulb-outline', title: 'Sugerencia', hint: 'Algo que Patio podría mejorar' },
] as const;

export default function SoporteScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [topic, setTopic] = useState<(typeof TOPICS)[number] | null>(null);
  const [detail, setDetail] = useState('');
  const canSend = detail.trim().length >= 10;
  const encodedMail = useMemo(() => {
    const subject = `Patio · ${topic?.title ?? 'Soporte'}`;
    const body = `Tema: ${topic?.title ?? ''}\n\nQué pasó:\n${detail.trim()}\n\nEnviado desde Patio`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [detail, topic]);

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => topic ? setTopic(null) : router.back()}>
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text }]}>Ayuda</Text>
        <View style={s.back} />
      </View>

      {!topic ? (
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
          <Text style={[s.eyebrow, { color: theme.accent }]}>SOPORTE GUIADO</Text>
          <Text style={[s.title, { color: theme.text }]}>¿Con qué te ayudamos?</Text>
          <Text style={[s.subtitle, { color: theme.textSecondary }]}>Elige el tema para llevar tu mensaje al lugar correcto.</Text>
          <View style={[s.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {TOPICS.map((item, index) => (
              <TouchableOpacity key={item.id} style={[s.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]} onPress={() => setTopic(item)}>
                <View style={[s.icon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={item.icon} size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[s.rowHint, { color: theme.textSecondary }]}>{item.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={theme.textMute} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={[s.content, { flex: 1, paddingBottom: insets.bottom + 24 }]}>
          <Text style={[s.eyebrow, { color: theme.accent }]}>{topic.title.toUpperCase()}</Text>
          <Text style={[s.title, { color: theme.text }]}>Cuéntanos qué pasó</Text>
          <Text style={[s.subtitle, { color: theme.textSecondary }]}>Incluye lo necesario para reproducirlo. No escribas contraseñas ni códigos.</Text>
          <View style={[s.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              value={detail}
              onChangeText={(value) => setDetail(value.slice(0, 300))}
              multiline
              autoFocus
              placeholder="Por ejemplo: abrí el enlace del correo y volví al inicio…"
              placeholderTextColor={theme.textMute}
              style={[s.input, { color: theme.text }]}
            />
            <Text style={[s.counter, { color: theme.textMute }]}>{detail.length}/300</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[s.send, { backgroundColor: theme.text }, !canSend && { opacity: 0.35 }]}
            disabled={!canSend}
            onPress={() => Linking.openURL(encodedMail)}>
            <Text style={[s.sendText, { color: theme.bg }]}>Continuar en Mail</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 22, paddingTop: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 7 },
  title: { fontSize: 34, lineHeight: 37, fontWeight: '900', letterSpacing: -1, fontFamily: Fonts.brand },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: '400', maxWidth: 330 },
  list: { marginTop: 26, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowHint: { marginTop: 3, fontSize: 12, fontWeight: '400' },
  field: { minHeight: 180, marginTop: 24, padding: 16, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth },
  input: { minHeight: 130, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 11 },
  send: { minHeight: 52, borderRadius: Radius.card, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 15, fontWeight: '700' },
});
