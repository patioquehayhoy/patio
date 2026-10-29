import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';
type Reason = { title: string; answer?: string };
type Topic = { id: string; icon: keyof typeof Ionicons.glyphMap; title: string; hint: string; reasons: Reason[]; askFrequency?: boolean };
const OTHER: Reason = { title: 'Otra cosa' };
const FREQUENCY = ['Solo una vez', 'A veces', 'Siempre'];
// Progressive disclosure: tema → motivo → respuesta. Solo si no se resolvió
// se abre el contacto, con una pregunta corta y el comentario opcional.
// Un motivo sin respuesta va directo al contacto con el detalle obligatorio.
const ACCOUNT: Topic = { id: 'cuenta', icon: 'key-outline', title: 'Mi cuenta', hint: 'Código, correo o eliminar cuenta', askFrequency: true, reasons: [
  { title: 'No me llega el código', answer: 'Revisa las carpetas de spam y promociones; el correo puede tardar un par de minutos. Si pasó más tiempo, pide otro código desde la misma pantalla.' },
  { title: 'El código no funciona', answer: 'Usa siempre el código más reciente: cuando pides otro, el anterior deja de servir. Escribe los 8 dígitos sin espacios.' },
  { title: 'Quiero cambiar mi correo', answer: 'El cambio de correo lo hacemos nosotros. Escríbenos desde tu correo actual y dinos cuál quieres usar.' },
  { title: 'Quiero eliminar mi cuenta', answer: 'En Perfil, al final, toca Eliminar cuenta. Se borran tu cuenta y lo que guardaste en ella.' },
] };
const NOTICES: Topic = { id: 'avisos', icon: 'notifications-outline', title: 'Avisos', hint: 'No llegan o llegan de más', askFrequency: true, reasons: [
  { title: 'No me llegan avisos', answer: 'Revisa en Perfil → Avisos que estén activos y que tu teléfono los permita para Patio.' },
  { title: 'Me llegan demasiados', answer: 'Puedes apagarlos en Perfil → Avisos.' },
] };
const SAFETY: Topic = { id: 'seguridad', icon: 'shield-checkmark-outline', title: 'Reseñas y seguridad', hint: 'Reportar contenido o a alguien', reasons: [
  { title: 'Una reseña es ofensiva o falsa', answer: 'Repórtala desde el menú de la reseña. La revisamos y la quitamos si rompe las reglas de Patio.' },
  { title: 'Alguien me molesta', answer: 'Desde el menú de su perfil o de su reseña puedes reportar o bloquear su cuenta; dejarás de ver su contenido.' },
] };
const FOODIE_TOPICS: Topic[] = [
  { id: 'mapa', icon: 'map-outline', title: 'Mapa y búsqueda', hint: 'Encontrar lugares y lo de hoy', askFrequency: true, reasons: [
    { title: 'El mapa no muestra dónde estoy', answer: 'Permite la ubicación en Ajustes → Patio → Ubicación y vuelve a abrir el mapa.' },
    { title: 'No encuentro un lugar', answer: 'Busca por su nombre o por un platillo. Un lugar aparece en el mapa cuando tiene lo de hoy publicado y está abierto.' },
    { title: 'Un lugar tiene datos incorrectos', answer: 'En la ficha del lugar toca ••• → Reportar contenido → Información incorrecta. Lo revisamos con el negocio.' },
  ] },
  { id: 'listas', icon: 'bookmark-outline', title: 'Guardados y listas', hint: 'Guardar, organizar y compartir', askFrequency: true, reasons: [
    { title: 'No veo lo que guardé', answer: 'Entra con el mismo correo que usaste antes: tus guardados y listas viven en tu cuenta.' },
    { title: 'No puedo compartir una lista', answer: 'Abre la lista y toca compartir. Necesitas haber iniciado sesión para generar el enlace.' },
  ] },
  SAFETY, NOTICES, ACCOUNT,
];
const FONDERO_TOPICS: Topic[] = [
  { id: 'menu', icon: 'document-text-outline', title: 'Mi menú', hint: 'Foto, lectura y publicación', askFrequency: true, reasons: [
    { title: 'La foto no se leyó bien', answer: 'Toma la foto de frente, con buena luz y sin reflejos, que se vea el menú completo. Antes de publicar puedes corregir cualquier platillo a mano.' },
    { title: 'Faltan platillos o precios', answer: 'Abre tu menú desde Menús y edítalo: puedes agregar platillos, cambiar precios y ordenar secciones.' },
    { title: 'Mi menú no se ve publicado', answer: 'Lo de hoy se ve mientras estás abierto. Revisa tu horario en Perfil → Editar mi negocio.' },
  ] },
  { id: 'negocio', icon: 'storefront-outline', title: 'Mi negocio', hint: 'Nombre, horario y ubicación', askFrequency: true, reasons: [
    { title: 'Cambiar nombre, horario o ubicación', answer: 'Todo se edita en Perfil → Editar mi negocio. Para la ubicación puedes usar dónde estás o escribir la dirección.' },
    { title: 'No aparezco en el mapa', answer: 'Apareces cuando tienes lo de hoy publicado y estás abierto. Revisa tu horario y tu ubicación en Editar mi negocio.' },
  ] },
  SAFETY, NOTICES, ACCOUNT,
];
const IDEAS: Topic = { id: 'idea', icon: 'bulb-outline', title: 'Sugerencias', hint: 'Ideas para mejorar Patio', reasons: [
  { title: 'Una función nueva' }, { title: 'Algo es confuso' }, { title: 'Un lugar que debería estar' },
] };

export default function SoporteScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const topics = role === 'fondero' ? FONDERO_TOPICS : FOODIE_TOPICS;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [reason, setReason] = useState<Reason | null>(null);
  const [writing, setWriting] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [detail, setDetail] = useState('');
  const required = !!reason && !reason.answer;
  const contact = writing || required;
  const canSend = !required || detail.trim().length >= 10;
  const encodedMail = useMemo(() => {
    const subject = `Patio · ${topic?.title ?? 'Soporte'} · ${reason?.title ?? ''}`;
    const body = `Tema: ${topic?.title ?? ''}\nMotivo: ${reason?.title ?? ''}${frequency ? `\nPasa: ${frequency}` : ''}\n\nDetalle:\n${detail.trim() || '—'}\n\nEnviado desde Patio`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [detail, frequency, reason, topic]);

  const pickReason = (next: Reason) => { setReason(next); setWriting(false); setCommentOpen(false); setDetail(''); setFrequency(null); };
  const goBack = () => {
    if (writing) setWriting(false);
    else if (reason) setReason(null);
    else if (topic) setTopic(null);
    else router.back();
  };
  const navTitle = contact ? 'Escríbenos' : reason ? topic?.title : topic ? topic.title : 'Ayuda';
  const iconBg = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)';
  const optionRow = (key: string, title: string, onPress: () => void, index: number, hint?: string, icon?: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity key={key} style={[s.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={hint ? `${title}, ${hint}` : title}>
      {icon && <View style={[s.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={theme.textSecondary} />
      </View>}
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, { color: theme.text }]}>{noWidow(title)}</Text>
        {hint && <Text style={[s.rowHint, { color: theme.textSecondary }]}>{noWidow(hint)}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={17} color={theme.textMute} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={goBack} accessibilityRole="button" accessibilityLabel={topic ? 'Volver' : 'Regresar'}>
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" numberOfLines={1} style={[s.navTitle, { color: theme.text }]}>{navTitle}</Text>
        <View style={s.back} />
      </View>

      {!topic ? (
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
          <Text style={[s.groupLabel, { color: theme.textSecondary, marginTop: 0 }]}>Algo no funciona</Text>
          <View style={[s.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {topics.map((item, index) => optionRow(item.id, item.title, () => setTopic(item), index, item.hint, item.icon))}
          </View>
          <Text style={[s.groupLabel, { color: theme.textSecondary }]}>Ideas</Text>
          <View style={[s.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {optionRow(IDEAS.id, IDEAS.title, () => setTopic(IDEAS), 0, IDEAS.hint, IDEAS.icon)}
          </View>
          <Text style={[s.credits, { color: theme.textMute }]}>{noWidow('Icono de tacos: Freepik en Flaticon.')}</Text>
        </ScrollView>
      ) : !reason ? (
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={[s.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {(topic.id === IDEAS.id ? [...topic.reasons, { title: 'Otra idea' }] : [...topic.reasons, OTHER]).map((item, index) => optionRow(item.title, item.title, () => pickReason(item), index))}
          </View>
        </ScrollView>
      ) : !contact ? (
        <View style={[s.content, { flex: 1, paddingBottom: insets.bottom + 24 }]}>
          <View style={[s.answer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.answerTitle, { color: theme.text }]}>{noWidow(reason.title)}</Text>
            <Text style={[s.answerBody, { color: theme.textSecondary }]}>{noWidow(reason.answer ?? '')}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[s.send, { backgroundColor: theme.text }]} onPress={() => router.back()} accessibilityRole="button">
            <Text style={[s.sendText, { color: theme.bg }]}>{noWidow('Ya quedó, gracias')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.send, s.outline, { borderColor: theme.border }]} onPress={() => setWriting(true)} accessibilityRole="button">
            <Text style={[s.sendText, { color: theme.text }]}>{noWidow('Necesito más ayuda')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[s.content, { flex: 1, paddingBottom: insets.bottom + 24 }]}>
          <View style={[s.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.row}>
              <View style={[s.icon, { backgroundColor: iconBg }]}>
                <Ionicons name={topic.icon} size={18} color={theme.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowTitle, { color: theme.text }]}>{noWidow(reason.title)}</Text>
                <Text style={[s.rowHint, { color: theme.textSecondary }]}>{noWidow(topic.title)}</Text>
              </View>
            </View>
          </View>
          {topic.askFrequency && <>
            <Text style={[s.groupLabel, { color: theme.textSecondary }]}>¿Cada cuánto pasa?</Text>
            <View style={s.chips}>{FREQUENCY.map((item) => {
              const on = frequency === item;
              return <TouchableOpacity key={item} onPress={() => setFrequency(on ? null : item)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={[s.chip, { borderColor: on ? theme.text : theme.border, backgroundColor: on ? theme.text : 'transparent' }]}>
                <Text style={[s.chipText, { color: on ? theme.bg : theme.text }]}>{item}</Text>
              </TouchableOpacity>;
            })}</View>
          </>}
          {required || commentOpen ? (
            <View style={[s.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                accessibilityLabel={required ? 'Qué pasó' : 'Comentario opcional'}
                value={detail}
                onChangeText={(value) => setDetail(value.slice(0, 300))}
                multiline
                autoFocus={commentOpen}
                placeholder={required ? 'Cuéntanos qué pasó. Sin contraseñas ni códigos.' : 'Agrega un detalle. Sin contraseñas ni códigos.'}
                placeholderTextColor={theme.textMute}
                style={[s.input, { color: theme.text }]}
              />
              <Text style={[s.counter, { color: theme.textMute }]}>{detail.length}/300</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.addComment} onPress={() => setCommentOpen(true)} accessibilityRole="button">
              <Ionicons name="add" size={18} color={theme.textSecondary} />
              <Text style={[s.addCommentText, { color: theme.textSecondary }]}>{noWidow('Agregar un comentario')}</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[s.send, { backgroundColor: theme.accent }, !canSend && { opacity: 0.35 }]}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend }}
            onPress={() => { void Linking.openURL(encodedMail).catch(() => Alert.alert(noWidow('No pudimos abrir el correo'), noWidow(`Puedes escribirnos a ${SUPPORT_EMAIL}.`))); }}>
            <Text style={[s.sendText, { color: '#FFFFFF' }]}>{noWidow('Enviar por correo')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 22, paddingTop: 16 },
  groupLabel: { ...Type.label, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '500' },
  list: { borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 64, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  rowHint: { marginTop: 2, fontSize: 13, lineHeight: 17, fontWeight: '400' },
  credits: { marginTop: 24, fontSize: 12, fontWeight: '400', textAlign: 'center' },
  answer: { padding: 16, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth },
  answerTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  answerBody: { marginTop: 4, fontSize: 15, lineHeight: 20, fontWeight: '400' },
  addComment: { minHeight: 48, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addCommentText: { fontSize: 15, fontWeight: '400' },
  field: { minHeight: 160, marginTop: 16, padding: 16, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth },
  input: { minHeight: 110, fontSize: 15, lineHeight: 20, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 11 },
  send: { minHeight: 52, marginTop: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1.5 },
  sendText: { fontSize: 15, fontWeight: '700' },
});
