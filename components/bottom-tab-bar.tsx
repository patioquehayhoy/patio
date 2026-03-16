import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/lib/theme';

const TABS = [
  { path: '/perfil',  label: 'Perfil',       icon: 'person'  },
  { path: '/menu',    label: 'Menú',          icon: 'list'    },
  { path: '/preview', label: 'Vista previa',  icon: 'eye'     },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.bg,
        borderTopColor: theme.sep,
        paddingBottom: insets.bottom || 10,
      },
    ]}>
      {TABS.map(({ path, label, icon }) => {
        const active = pathname === path;
        const color = active ? theme.orange : theme.gray;
        return (
          <TouchableOpacity
            key={path}
            style={styles.tab}
            onPress={() => router.navigate(path)}>
            <Ionicons
              name={active ? icon : `${icon}-outline` as any}
              size={24}
              color={color}
            />
            <Text style={[styles.label, { color }]}>{label}</Text>
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
