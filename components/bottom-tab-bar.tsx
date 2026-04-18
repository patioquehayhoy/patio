import { router, usePathname } from 'expo-router';
import { Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/lib/theme';

const TABS = [
  { path: '/perfil',  label: 'Perfil',    iconActive: 'person'        as const, iconInactive: 'person-outline'       as const },
  { path: '/menu',    label: 'Menú',       iconActive: 'list'          as const, iconInactive: 'list-outline'         as const },
  { path: '/preview', label: 'Compartir', iconActive: 'share'         as const, iconInactive: 'share-outline'        as const },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.bg,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom || 10,
      },
    ]}>
      {TABS.map(({ path, label, iconActive, iconInactive }) => {
        const active = pathname === path;
        return (
          <TouchableOpacity
            key={path}
            style={styles.tab}
            onPress={() => { Keyboard.dismiss(); router.replace(path as any); }}>
            <Ionicons
              name={active ? iconActive : iconInactive}
              size={22}
              color={active ? theme.accent : theme.textSecondary}
              style={{ opacity: active ? 1 : 0.6 }}
            />
            <Text style={[styles.label, { color: active ? theme.accent : theme.textSecondary }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
  },
});
