import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AvatarCircle } from '@/components/avatar-circle';

const MAX_VISIBLE = 3;

// Facepile de quién dio like — corregido 2026-08-30 tras feedback de
// Alejandro: la primera versión apilaba los círculos en una fila horizontal
// (3 círculos overlapeados = un rectángulo ancho), lo que rompía el
// "cuadrado" que ocupa un avatar normal en cualquier otra fila de la lista
// (AvatarCircle, 40×40) y hacía que el corazón se desplazara según la
// cantidad. Ahora el contenedor es SIEMPRE un cuadrado de `size`×`size` —
// igual de ancho que un avatar solo, aunque haya 1, 2 o 3 — y los círculos
// se acomodan en clúster (esquinas), como el ícono de un grupo, no en tira.
// El corazón vive fijo en la esquina inferior derecha del cuadrado, nunca
// de un círculo individual, así que nunca se mueve.
export function LikeAvatarStack({ authors, backgroundColor, textColor, ringColor, accent, size = 40 }: {
  authors: { name: string; avatarUrl?: string }[];
  backgroundColor: string;
  textColor: string;
  ringColor: string;
  accent: string;
  size?: number;
}) {
  if (authors.length === 0) return null;

  const hasOverflow = authors.length > MAX_VISIBLE;
  const avatarCount = hasOverflow ? MAX_VISIBLE - 1 : Math.min(authors.length, MAX_VISIBLE);
  const visible = authors.slice(0, avatarCount);
  const overflowCount = authors.length - avatarCount;
  const badgeSize = Math.round(size * 0.44);

  // Posiciones por clúster (esquinas del cuadrado, no una fila) — igual de
  // ancho sea 1, 2 o 3. La esquina inferior derecha se deja más libre a
  // propósito: ahí vive el corazón.
  const layout: { left: number; top: number; circle: number }[] =
    avatarCount <= 1
      ? [{ left: 0, top: 0, circle: size }]
      : avatarCount === 2
      ? (() => { const c = size * 0.68; return [{ left: 0, top: 0, circle: c }, { left: size - c, top: size - c, circle: c }]; })()
      : (() => { const c = size * 0.58; return [{ left: 0, top: 0, circle: c }, { left: size - c, top: 0, circle: c }, { left: 0, top: size - c, circle: c }]; })();

  return (
    <View style={{ width: size, height: size }}>
      {visible.map((author, index) => {
        const slot = layout[index];
        const ringSize = slot.circle + 4;
        return (
          <View
            key={`${author.name}-${index}`}
            style={[s.ring, {
              left: slot.left - 2, top: slot.top - 2, width: ringSize, height: ringSize, borderRadius: ringSize / 2,
              backgroundColor: avatarCount > 1 ? ringColor : 'transparent', zIndex: index,
            }]}>
            <AvatarCircle name={author.name} avatarUrl={author.avatarUrl} backgroundColor={backgroundColor} textColor={textColor} size={slot.circle} />
          </View>
        );
      })}
      {hasOverflow && (() => {
        const slot = layout[avatarCount];
        const ringSize = slot.circle + 4;
        return (
          <View style={[s.ring, { left: slot.left - 2, top: slot.top - 2, width: ringSize, height: ringSize, borderRadius: ringSize / 2, backgroundColor: ringColor, zIndex: avatarCount }]}>
            <View style={[s.overflowFill, { width: slot.circle, height: slot.circle, borderRadius: slot.circle / 2, backgroundColor }]}>
              <Text style={[s.overflowText, { color: textColor, fontSize: slot.circle * 0.34 }]}>{`+${overflowCount}`}</Text>
            </View>
          </View>
        );
      })()}
      <View style={[s.badge, {
        width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, backgroundColor: ringColor, zIndex: MAX_VISIBLE + 1,
      }]}>
        <View style={[s.badgeFill, { width: badgeSize - 4, height: badgeSize - 4, borderRadius: (badgeSize - 4) / 2, backgroundColor: accent }]}>
          <Ionicons name="heart" size={badgeSize * 0.5} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ring: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  overflowFill: { alignItems: 'center', justifyContent: 'center' },
  overflowText: { fontWeight: '700' },
  badge: { position: 'absolute', right: -2, bottom: -2, alignItems: 'center', justifyContent: 'center' },
  badgeFill: { alignItems: 'center', justifyContent: 'center' },
});
