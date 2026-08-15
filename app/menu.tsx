import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { useTheme } from '@/lib/theme';

type CreationOption = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
};

export default function NuevoMenuScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(c);

  const options: CreationOption[] = [
    {
      icon: 'camera-outline',
      title: 'Tomar una foto',
      body: 'Patio la lee y prepara el menú para que lo revises.',
      onPress: () => router.push('/foto-menu'),
    },
    {
      icon: 'images-outline',
      title: 'Elegir de Fotos',
      body: 'Usa una imagen que ya tengas en el iPhone.',
      onPress: () => router.push({ pathname: '/foto-menu', params: { source: 'library' } }),
    },
    {
      icon: 'create-outline',
      title: 'Escribirlo',
      body: 'Empieza vacío y agrega sólo lo que vendes hoy.',
      onPress: () => router.push('/menu-editar'),
    },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity
        accessibilityLabel="Cerrar nuevo menú"
        style={s.close}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/historial'))}
        activeOpacity={0.72}>
        <Ionicons name="close" size={22} color={c.text} />
      </TouchableOpacity>

      <View style={s.options}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.title}
            accessibilityLabel={option.title}
            style={[s.option, index === 0 && s.featured]}
            onPress={option.onPress}
            activeOpacity={0.82}>
            <View style={[s.optionIcon, index === 0 && s.featuredIcon]}>
              <Ionicons name={option.icon} size={23} color={index === 0 ? '#fff' : c.text} />
            </View>
            <View style={s.optionCopy}>
              <Text style={s.optionTitle}>{option.title}</Text>
              <Text style={s.optionBody}>{option.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMute} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 20 },
    close: { width: 44, height: 44, marginLeft: -9, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    options: { marginTop: 28, gap: 10 },
    option: { minHeight: 92, padding: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 14 },
    featured: { borderColor: c.accent, backgroundColor: c.surface },
    optionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: c.iconBg, alignItems: 'center', justifyContent: 'center' },
    featuredIcon: { backgroundColor: c.accent },
    optionCopy: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
    optionBody: { marginTop: 4, fontSize: 13, lineHeight: 18, fontWeight: '400', color: c.textSecondary },
  });
}
