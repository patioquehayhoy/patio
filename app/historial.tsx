import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { dateLabel, defaultHistoryTitle, useMenuHistoryController } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme } from '@/lib/theme';

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const { closeRename, draftName, editing, loading, menus, openRename, reuse, saveName, setDraftName } = useMenuHistoryController();
  // Acciones por menú detrás de "···", homologado con el patrón de secciones
  // del composer: un solo gesto para descubrir acciones en toda la app.
  const [actionsFor, setActionsFor] = useState<string | null>(null);

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: c.accent }]}>PUBLICACIONES</Text>
        <Text style={[s.title, { color: c.text }]}>Historial</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }]}>Vuelve a usar cualquiera de tus menús publicados.</Text>

        {!loading && menus.length === 0 ? (
          <View style={[s.empty, { borderColor: c.border }]}>
            <Ionicons name="receipt-outline" size={28} color={c.textMute} />
            <Text style={[s.emptyTitle, { color: c.text }]}>Todavía no hay menús</Text>
            <Text style={[s.emptyBody, { color: c.textSecondary }]}>Cuando publiques uno aparecerá aquí para volver a usarlo.</Text>
            <TouchableOpacity style={[s.emptyButton, { backgroundColor: c.accent }]} onPress={() => router.replace('/menu')} activeOpacity={0.84}>
              <Text style={s.emptyButtonText}>Crear menú</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.list, { borderColor: c.border }]}>
            {menus.map((menu, index) => {
              const key = `${menu.fecha}-${index}`;
              const actionsOpen = actionsFor === key;
              return (
                <View
                  key={key}
                  style={index > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }}>
                  <View style={s.row}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => reuse(menu.secciones)} activeOpacity={0.74}>
                      <Text style={[s.date, { color: c.accent }]}>
                        {dateLabel(menu.fecha)}
                      </Text>
                      <Text style={[s.summary, { color: c.text }]} numberOfLines={2}>{menu.nombre || defaultHistoryTitle(menu)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel="Acciones del menú"
                      style={[s.iconBtn, { backgroundColor: c.iconBg }]}
                      onPress={() => setActionsFor(actionsOpen ? null : key)}
                      activeOpacity={0.72}>
                      <Ionicons name="ellipsis-horizontal" size={17} color={c.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {actionsOpen && (
                    <View style={[s.actionsRow, { backgroundColor: c.iconBg }]}>
                      <TouchableOpacity onPress={() => { setActionsFor(null); reuse(menu.secciones); }} style={s.action}>
                        <Ionicons name="create-outline" size={15} color={c.text} />
                        <Text style={[s.actionText, { color: c.text }]}>Editar y usar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setActionsFor(null); openRename(menu); }} style={s.action}>
                        <Ionicons name="text-outline" size={15} color={c.text} />
                        <Text style={[s.actionText, { color: c.text }]}>Nombrar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={closeRename}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[s.modalTitle, { color: c.text }]}>Nombrar menú</Text>
            <TextInput
              value={draftName}
              onChangeText={(value) => setDraftName(value.slice(0, 48))}
              style={[s.nameInput, { color: c.text, borderColor: c.border }]}
              placeholder="Ej. Viernes de pozole"
              placeholderTextColor={c.textMute}
              selectionColor={c.accent}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: c.border }]} onPress={closeRename} activeOpacity={0.75}>
                <Text style={[s.modalBtnText, { color: c.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.modalPrimary, { backgroundColor: c.accent }]} onPress={saveName} activeOpacity={0.82}>
                <Text style={s.modalPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.3, fontFamily: Fonts.brand },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  empty: { marginTop: 34, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  emptyButton: { minHeight: 48, marginTop: 20, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  list: { marginTop: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 84, paddingHorizontal: 17, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 14 },
  date: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  summary: { marginTop: 5, fontSize: 15, lineHeight: 20, fontWeight: '500' },
  iconBtn: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { alignSelf: 'flex-end', flexDirection: 'row', gap: 4, padding: 5, borderRadius: 12, marginRight: 17, marginBottom: 12 },
  action: { minHeight: 34, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, fontWeight: '500' },
  modalBackdrop: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  modalTitle: { fontSize: 22, fontWeight: '900', fontFamily: Fonts.brand },
  nameInput: { marginTop: 16, minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  modalBtn: { minHeight: 44, minWidth: 104, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  modalPrimary: { borderWidth: 0 },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
