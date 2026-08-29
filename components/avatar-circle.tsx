import { Image, StyleSheet, Text, View } from 'react-native';

// Compartido entre Actividad (Fondero) y Notificaciones (Foodie): avatar
// circular con foto real si existe, iniciales si no — mismo patrón que ya
// usa Instagram para cualquier fila de actividad. Recibe colores sueltos en
// vez de un objeto de paleta completo para no acoplarse a FonderoColors ni
// a Theme — ambos lados tienen su propio tipo de paleta.
export function AvatarCircle({ name, avatarUrl, backgroundColor, textColor, size = 40 }: {
  name: string;
  avatarUrl?: string;
  backgroundColor: string;
  textColor: string;
  size?: number;
}) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (avatarUrl) return <Image source={{ uri: avatarUrl }} style={shape} />;
  return (
    <View style={[shape, styles.fallback, { backgroundColor }]}>
      <Text style={[styles.initial, { color: textColor, fontSize: size * 0.375 }]}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700' },
});
