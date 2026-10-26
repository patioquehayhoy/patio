import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { getPatioCardInfo, patioCardPrice } from '@/lib/patio-card-info';
import type { Patio } from '@/lib/patios';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type PatioCardInfoProps = {
  patio: Patio;
  variant?: 'list' | 'grid';
  distanceLabel?: string | null;
  personalRating?: number | null;
  /** Accent the public-rating star when this person has rated the place. */
  showPersonalRating?: boolean;
  /** Grid cards place the same price in their leading icon row. */
  showPrice?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Shared content only: the parent owns navigation, selection and materials. */
export function PatioCardInfo({
  patio, variant = 'list', distanceLabel, personalRating, showPersonalRating = false, showPrice = true, style,
}: PatioCardInfoProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const { fontScale, width } = useWindowDimensions();
  const grid = variant === 'grid';
  const stackPrice = fontScale > 1.4 && width < 600;
  const info = getPatioCardInfo(patio, { distanceLabel, personalRating });
  const ratedByMe = showPersonalRating && info.personalRatingValue !== null;
  const ratingAccessibilityLabel = [info.publicRatingAccessibilityLabel,
    ratedByMe ? info.personalRatingAccessibilityLabel : null].filter(Boolean).join('. ');

  return (
    <View style={[s.content, style]}>
      <View style={[s.heading, stackPrice && s.stackedHeading]}>
        <View style={[s.identity, stackPrice && s.stackedIdentity, { minHeight: 21 * fontScale }]}>
          <Text style={s.name} numberOfLines={1} ellipsizeMode="tail" accessibilityLabel={info.name} allowFontScaling>{noWidow(info.name)}</Text>
          <View style={[s.verification, { height: 21 * fontScale }]} accessible={false}>
            {info.verified && <Ionicons name="checkmark-circle" size={14} color={theme.accent} accessibilityLabel="Negocio verificado" />}
          </View>
        </View>
        {showPrice && <PatioCardPrice patio={patio} style={stackPrice ? s.stackedPrice : [s.trailingPrice, { width: 112 * fontScale }]} />}
      </View>
      <PatioCardLocation area={info.area} distanceLabel={distanceLabel} reserveLine />
      <View style={[s.facts, { minHeight: 18 * fontScale }]}>
        <View style={s.publicRating} accessible accessibilityLabel={ratingAccessibilityLabel}>
          <View style={s.icon}><Ionicons name="star" size={12} color={ratedByMe ? theme.accent : theme.textSecondary} /></View>
          <Text style={[s.meta, s.numeric]} numberOfLines={1} allowFontScaling>{grid ? info.publicRatingValue?.toFixed(1) ?? '—' : info.publicRating}</Text>
        </View>
        {!!info.closingLabel && <Text style={[s.meta, s.numeric, s.closing]} numberOfLines={1} ellipsizeMode="tail" accessibilityLabel={info.closingAccessibilityLabel ?? undefined} allowFontScaling>{noWidow(info.closingLabel)}</Text>}
      </View>
    </View>
  );
}

/** Location is one readable group; distance stays intact when the area is long. */
export function PatioCardLocation({ area, distanceLabel, reserveLine = false, variant = 'card', style }: {
  area: string;
  distanceLabel?: string | null;
  reserveLine?: boolean;
  variant?: 'card' | 'detail';
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const s = makeStyles(theme);
  const cleanArea = area.trim();
  const distance = distanceLabel?.trim();
  if (!cleanArea && !distance && !reserveLine) return null;
  const accessibilityLabel = [cleanArea, distance ? `Distancia, ${distance}` : null].filter(Boolean).join('. ');
  return <View style={[s.location, reserveLine && { minHeight: 18 * fontScale }, style]} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel || undefined}>
    {!!cleanArea && <Text style={[s.area, variant === 'detail' && s.detailLocation]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling>{noWidow(cleanArea)}</Text>}
    {!!cleanArea && !!distance && <Text style={[s.area, s.locationSeparator, variant === 'detail' && s.detailLocation]} accessible={false}>·</Text>}
    {!!distance && <Text style={[s.area, s.distance, s.numeric, variant === 'detail' && s.detailLocation]} numberOfLines={1} allowFontScaling>{noWidow(distance)}</Text>}
  </View>;
}

/** Published price is a comparison anchor; never truncate or shrink the amount. */
export function PatioCardPrice({ patio, compact = true, style }: { patio: Patio; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const s = makeStyles(theme);
  const price = patioCardPrice(patio);
  // A very large amount opens its full published prices instead of displaying
  // an incomplete currency range. The expanded place page keeps the exact value.
  const limit = fontScale > 2 && width < 400 ? 9 : 12;
  const label = compact && price.source !== 'missing' && price.label.length > limit ? 'Ver precios' : price.label;
  return <View style={[s.priceSlot, style]}>
    <Text style={[s.price, (price.source === 'missing' || label === 'Ver precios') && s.missingPrice]} numberOfLines={compact ? 1 : undefined} ellipsizeMode="tail" allowFontScaling accessibilityLabel={price.accessibilityLabel}>
      {noWidow(label)}
    </Text>
  </View>;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    content: { flex: 1, minWidth: 0 },
    heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    stackedHeading: { flexDirection: 'column', gap: 3 },
    stackedIdentity: { flex: 0, width: '100%' },
    identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    // Como Instagram/X: el sello va pegado al nombre; un nombre largo se corta con «…» antes del sello.
    name: { flexShrink: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: '700', color: t.text },
    verification: { width: 16, height: 21, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    area: { flexShrink: 1, minWidth: 0, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, minWidth: 0 },
    locationSeparator: { flexShrink: 0 },
    distance: { flexShrink: 0 },
    detailLocation: { fontSize: 14, lineHeight: 20 },
    facts: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0 },
    publicRating: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
    closing: { flexShrink: 0, marginLeft: 'auto', maxWidth: '60%', textAlign: 'right' },
    icon: { width: 16, height: 18, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    meta: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    numeric: { fontVariant: ['tabular-nums'] },
    priceSlot: { minWidth: 0, alignItems: 'flex-end' },
    trailingPrice: { flexShrink: 0 },
    stackedPrice: { alignSelf: 'flex-end', maxWidth: '100%' },
    price: { fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'right', color: t.text, fontVariant: ['tabular-nums'] },
    missingPrice: { fontSize: 12, fontWeight: '400', color: t.textSecondary },
  });
}
