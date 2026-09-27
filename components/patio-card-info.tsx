import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import { getPatioCardInfo } from '@/lib/patio-card-info';
import type { Patio } from '@/lib/patios';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type PatioCardInfoProps = {
  patio: Patio;
  variant?: 'list' | 'grid';
  distanceLabel?: string | null;
  personalRating?: number | null;
  /** Reserve the personal-rating row throughout a personal library. */
  showPersonalRating?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Shared content only: the parent owns navigation, selection and materials. */
export function PatioCardInfo({
  patio, variant = 'list', distanceLabel, personalRating, showPersonalRating = false, style,
}: PatioCardInfoProps) {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const s = makeStyles(theme);
  const info = getPatioCardInfo(patio, { distanceLabel, personalRating });
  // Layout responds to available width / text size, never to the text value.
  // Large text grows vertically instead of stealing space from adjacent data.
  const stack = fontScale > 1.3 || (width > 0 && width < 180 * fontScale);
  const nameLines = variant === 'grid' || fontScale > 1.3 ? 2 : 1;
  const cellLines = stack ? undefined : 1;

  return (
    <View style={[s.content, style]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={[s.identity, { minHeight: 21 * fontScale * nameLines }]}>
        <Text style={s.name} numberOfLines={nameLines} allowFontScaling>{noWidow(info.name)}</Text>
        <View style={s.verification}>
          {info.verified && <Ionicons name="checkmark-circle" size={14} color={theme.accent} accessibilityLabel="Negocio verificado" />}
        </View>
      </View>
      <Text style={s.area} numberOfLines={fontScale > 1.3 ? undefined : 1} allowFontScaling>{noWidow(info.area)}</Text>

      <View style={[s.facts, { minHeight: 18 * fontScale }]}>
        <Text style={s.price} numberOfLines={fontScale > 1.3 ? undefined : 1} allowFontScaling accessibilityLabel={info.price.accessibilityLabel}>
          {noWidow(info.price.label)}
        </Text>
      </View>
      <View style={[s.facts, stack && s.stacked]}>
        <View style={[s.cell, stack && s.stackedCell]}>
          <Text style={[s.meta, info.open === true && s.open]} numberOfLines={cellLines} allowFontScaling>{noWidow(info.openLabel)}</Text>
        </View>
        <View style={[s.cell, stack && s.stackedCell]}>
          <Text style={s.meta} numberOfLines={cellLines} allowFontScaling>{noWidow(info.menuLabel)}</Text>
        </View>
      </View>
      <View style={[s.facts, stack && s.stacked]}>
        <View style={[s.cell, stack && s.stackedCell]} accessible accessibilityLabel={info.publicRatingAccessibilityLabel}>
          <View style={s.icon}><Ionicons name="star" size={12} color={theme.textSecondary} /></View>
          <Text style={[s.meta, s.numeric]} numberOfLines={cellLines} allowFontScaling>{info.publicRating}</Text>
        </View>
        <View style={[s.cell, stack && s.stackedCell]} accessible accessibilityLabel={info.distanceAccessibilityLabel}>
          <View style={s.icon}><Ionicons name="navigate-outline" size={12} color={theme.textSecondary} /></View>
          <Text style={[s.meta, s.numeric]} numberOfLines={cellLines} allowFontScaling>{info.distance}</Text>
        </View>
      </View>
      {showPersonalRating && (
        <View style={s.facts} accessible accessibilityLabel={info.personalRatingAccessibilityLabel}>
          <Text style={[s.meta, s.numeric]} numberOfLines={fontScale > 1.3 ? undefined : 1} allowFontScaling>{noWidow(info.personalRating)}</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    content: { flex: 1, minWidth: 0 },
    identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    name: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: '700', color: t.text },
    verification: { width: 16, height: 21, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    area: { fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.textSecondary, marginTop: 2 },
    facts: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 2, minWidth: 0 },
    stacked: { flexDirection: 'column', alignItems: 'stretch', gap: 2 },
    cell: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
    stackedCell: { flex: 0 },
    icon: { width: 16, height: 18, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    meta: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontWeight: '300', color: t.textSecondary },
    numeric: { fontVariant: ['tabular-nums'] },
    price: { minWidth: 0, flexShrink: 1, fontSize: 13, lineHeight: 18, fontWeight: '700', color: t.text, fontVariant: ['tabular-nums'] },
    open: { color: t.accent, fontWeight: '700' },
  });
}
