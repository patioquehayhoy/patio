import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlockedAccounts } from '@/components/blocked-accounts';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Modelo Instagram: el perfil es público y cada lista decide quién la ve; aquí
// solo vive lo que sí se administra, las cuentas bloqueadas.
export default function BlockedAccountsScreen() {
  const { theme } = useTheme();
  const ins = useSafeAreaInsets();
  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: ins.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={s.nav}>
      <TouchableOpacity style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/cuenta')} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={21} color={theme.text} />
      </TouchableOpacity>
      <Text accessibilityRole="header" style={[s.navTitle, { color: theme.text }]}>Cuentas bloqueadas</Text>
      <View style={s.back} />
    </View>
    <ScrollView contentContainerStyle={{ paddingBottom: ins.bottom + 24 }}>
      <BlockedAccounts />
      <Text style={[s.footnote, { color: theme.textSecondary }]}>{noWidow('Para bloquear a alguien, toca ••• en su perfil o en su reseña.')}</Text>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: { height: 52, marginHorizontal: -6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15, fontWeight: '600' },
  footnote: { marginTop: 8, fontSize: 13, lineHeight: 18 },
});
