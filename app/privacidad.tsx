import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlockedAccounts } from '@/components/blocked-accounts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToggleSwitch } from '@/components/toggle-switch';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export default function Privacy() {
  const { theme } = useTheme();
  const focused = useIsFocused();
  const ins = useSafeAreaInsets();
  const [publicProfile, setPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!focused) return;
    let active = true;
    setLoading(true);
    setLoadError(false);
    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
      if (!auth.user) return;
      const { data, error } = await supabase.from('user_profiles').select('visibility').eq('user_id', auth.user.id).maybeSingle();
      if (error) throw error;
      if (active) setPublic(data?.visibility === 'public');
    })().catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [focused, retry]);

  const toggle = async (value: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!auth.user) { router.push({ pathname: '/comunidad-acceso', params: { returnTo: '/privacidad' } }); return; }
      if (authError) throw authError;
      const { error } = await supabase.from('user_profiles')
        .update({ visibility: value ? 'public' : 'private' }).eq('user_id', auth.user.id).select('user_id').single();
      if (error) throw error;
      // The switch only confirms a setting that was actually saved.
      setPublic(value);
    } catch {
      Alert.alert(noWidow('No pudimos cambiar la privacidad'), noWidow('Tu configuración anterior se conserva. Revisa tu conexión e inténtalo de nuevo.'));
    } finally { inFlight.current = false; setSaving(false); }
  };

  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: ins.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <TouchableOpacity style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/cuenta')} accessibilityRole="button" accessibilityLabel="Volver">
      <Ionicons name="chevron-back" size={22} color={theme.text} />
    </TouchableOpacity>
    <ScrollView contentContainerStyle={{ paddingBottom: ins.bottom + 24 }}>
    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowTitle, { color: theme.text }]}>{noWidow('Perfil de Foodie visible')}</Text>
          <Text style={[s.sub, { color: theme.textSecondary }]}>{noWidow('Muestra tu nombre, presentación y colecciones que decidas publicar.')}</Text>
        </View>
        {loading ? <ActivityIndicator color={theme.textSecondary} /> :
          <ToggleSwitch value={publicProfile} onValueChange={toggle} disabled={saving || loadError} accessibilityLabel="Perfil de Foodie visible" />}
      </View>
      {loadError && <TouchableOpacity style={s.retry} onPress={() => setRetry((value) => value + 1)} accessibilityRole="button" accessibilityLabel="Reintentar cargar privacidad">
        <Text style={{ color: theme.accent }}>{noWidow('No pudimos cargar tu configuración. Reintentar.')}</Text>
      </TouchableOpacity>}
      <View style={[s.note, { borderTopColor: theme.border }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
        <Text style={[s.noteText, { color: theme.textSecondary }]}>{noWidow('Tus reseñas publicadas permanecen visibles aunque ocultes tu perfil. Puedes reportar contenido desde el menú de cada reseña o perfil.')}</Text>
      </View>
    </View>
    <BlockedAccounts />
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 }, back: { width: 44, height: 54, justifyContent: 'center' },
  card: { marginTop: 20, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 90, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 16, fontWeight: '700' }, sub: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  note: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 }, retry: { padding: 16 },
});
