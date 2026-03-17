import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/lib/theme';

const TABS = [
  { path: '/perfil',  label: 'Perfil',    symbolActive: 'person.fill',         symbolInactive: 'person'                },
  { path: '/menu',    label: 'Menú',       symbolActive: 'list.bullet',          symbolInactive: 'list.bullet'           },
  { path: '/preview', label: 'Compartir', symbolActive: 'square.and.arrow.up',  symbolInactive: 'square.and.arrow.up'  },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.surface,
        borderTopColor: theme.sep,
        paddingBottom: insets.bottom || 10,
      },
    ]}>
      {TABS.map(({ path, label, symbolActive, symbolInactive }) => {
        const active = pathname === path;
        return (
          <TouchableOpacity
            key={path}
            style={styles.tab}
            onPress={() => router.navigate(path)}>
            <View style={{ opacity: active ? 1 : 0.4 }}>
              <SymbolView
                name={active ? symbolActive : symbolInactive}
                size={24}
                tintColor={active ? theme.orange : '#9E3F00'}
              />
            </View>
            <Text style={[styles.label, { color: active ? theme.orange : theme.gray }]}>{label}</Text>
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
