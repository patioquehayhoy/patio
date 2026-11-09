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
          <Text style={s.name} accessibilityLabel={info.name} allowFontScaling>{noWidow(info.name)}</Text>
          <View style={[s.verification, { height: 21 * fontScale }]} accessible={false}>
            {info.verified && <Ionicons name="checkmark-circle" size={14} color={theme.accent} accessibilityLabel="Negocio verificado" />}
          </View>
        </View>
        {showPrice && <PatioCardPrice patio={patio} style={stackPrice ? s.stackedPrice : [s.trailingPrice, { width: 112 * fontScale }]} />}
      </View>
      <PatioCardLocation area={info.area} distanceLabel={distanceLabel} reserveLine />
      <View style={[s.facts, stackPrice && s.stackedFacts, { minHeight: 18 * fontScale }]}>
        <View style={s.publicRating} accessible accessibilityLabel={ratingAccessibilityLabel}>
          <View style={s.icon}><Ionicons name="star" size={12} color={ratedByMe ? theme.accent : theme.textSecondary} /></View>
          <Text style={[s.meta, s.numeric]} allowFontScaling>{grid ? info.publicRatingValue?.toFixed(1) ?? '—' : info.publicRating}</Text>
        </View>
        {!!info.closingLabel && <Text style={[s.meta, s.numeric, s.closing, stackPrice && s.stackedClosing]} accessibilityLabel={info.closingAccessibilityLabel ?? undefined} allowFontScaling>{noWidow(info.closingLabel)}</Text>}
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
  // Un solo texto que baja de renglón las veces que haga falta: la colonia
  // completa (nunca con «…», ley de casos de largo) y la distancia pegada al
  // final para que jamás quede sola en otro renglón.
  return <View style={[s.location, reserveLine && { minHeight: 18 * fontScale }, style]} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel || undefined}>
    <Text style={[s.area, variant === 'detail' && s.detailLocation]} allowFontScaling>
      {cleanArea ? noWidow(cleanArea) : null}
      {!!distance && <Text style={s.numeric}>{`${cleanArea ? '\u00A0·\u00A0' : ''}${distance.replace(/ /g, '\u00A0')}`}</Text>}
    </Text>
  </View>;
}

/**
 * Published price is a comparison anchor: never truncated, shrunk or hidden
 * (ley de casos de largo, 2026-11-08). A range that does not fit its column
 * splits after the dash into two right-aligned lines: «$12,500–» / «25,000».
 */
export function PatioCardPrice({ patio, style }: { patio: Patio; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const price = patioCardPrice(patio);
  const label = price.source === 'missing' ? noWidow(price.label) : price.label.replace('–', '–\u200B');
  return <View style={[s.priceSlot, style]}>
    <Text style={[s.price, price.source === 'missing' && s.missingPrice]} allowFontScaling accessibilityLabel={price.accessibilityLabel}>
      {label}
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
    // Como Instagram/X: el sello va pegado al nombre; un nombre largo baja de renglón (nunca «…») y el sello conserva su columna.
    name: { flexShrink: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: '700', color: t.text },
    verification: { width: 16, height: 21, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    area: { flexShrink: 1, minWidth: 0, fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, minWidth: 0 },
    locationSeparator: { flexShrink: 0 },
    distance: { flexShrink: 0 },
    detailLocation: { fontSize: 14, lineHeight: 20 },
    facts: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0 },
    // Con letra grande el cierre baja a su propia línea (como ViewThatFits).
    stackedFacts: { flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
    // La calificación es corta y acotada («4.5 (1.3k)»): nunca se encoge. El
    // cierre ocupa lo que queda y baja de renglón si hace falta.
    publicRating: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
    closing: { flex: 1, minWidth: 0, textAlign: 'right' },
    stackedClosing: { flex: 0, textAlign: 'left' },
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
