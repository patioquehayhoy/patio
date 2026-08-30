import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AvatarCircle } from '@/components/avatar-circle';

const MAX_VISIBLE = 3;
const OVERLAP_RATIO = 0.42;

// Facepile de quién dio like, estilo Instagram: círculos apilados con un
// anillo del color de fondo de la pantalla para que se "recorten" entre
// ellos, y el corazón como badge sobrepuesto en vez de ícono suelto aparte
// (pedido de Alejandro 2026-08-30, sobre app/resenas.tsx).
//
// El ancho del contenedor es SIEMPRE el del caso de 3 slots, sin importar
// cuántos dieron like de verdad — si crecía con la cantidad (1 vs 3
// círculos), el texto de la fila y el corazón caían en un x distinto en
// cada fila y todo se veía descuadrado fila a fila. El corazón, en cambio,
// sí seva al último círculo real (avatar u óvalo "+N"), no a la esquina
// fija del contenedor, para quedar pegado a él con 1 o con 3 likes por
// igual (corrección pedida por Alejandro 2026-08-30).
export function LikeAvatarStack({ authors, backgroundColor, textColor, ringColor, accent, size = 34 }: {
  authors: { name: string; avatarUrl?: string }[];
  backgroundColor: string;
  textColor: string;
  ringColor: string;
  accent: string;
  size?: number;
}) {
  if (authors.length === 0) return null;

  const overlap = size * OVERLAP_RATIO;
  const step = size - overlap;
  const ringSize = size + 4;
  const hasOverflow = authors.length > MAX_VISIBLE;
  const avatarCount = hasOverflow ? MAX_VISIBLE - 1 : Math.min(authors.length, MAX_VISIBLE);
  const visible = authors.slice(0, avatarCount);
  const overflowCount = authors.length - avatarCount;
  const lastSlotIndex = hasOverflow ? avatarCount : avatarCount - 1;
  const badgeSize = Math.round(size * 0.52);
  const width = size + (MAX_VISIBLE - 1) * step;

  return (
    <View style={{ width, height: ringSize }}>
      {visible.map((author, index) => (
        <View
          key={`${author.name}-${index}`}
          style={[s.ring, { left: index * step, width: ringSize, height: ringSize, borderRadius: ringSize / 2, backgroundColor: ringColor, zIndex: index }]}>
          <AvatarCircle name={author.name} avatarUrl={author.avatarUrl} backgroundColor={backgroundColor} textColor={textColor} size={size} />
        </View>
      ))}
      {hasOverflow && (
        <View
          style={[s.ring, { left: avatarCount * step, width: ringSize, height: ringSize, borderRadius: ringSize / 2, backgroundColor: ringColor, zIndex: avatarCount }]}>
          <View style={[s.overflowFill, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
            <Text style={[s.overflowText, { color: textColor, fontSize: size * 0.3 }]}>{`+${overflowCount}`}</Text>
          </View>
        </View>
      )}
      <View style={[s.badge, {
        left: lastSlotIndex * step + size - badgeSize * 0.65,
        top: size - badgeSize * 0.65,
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
  ring: { position: 'absolute', top: -2, alignItems: 'center', justifyContent: 'center' },
  overflowFill: { alignItems: 'center', justifyContent: 'center' },
  overflowText: { fontWeight: '700' },
  badge: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  badgeFill: { alignItems: 'center', justifyContent: 'center' },
});
