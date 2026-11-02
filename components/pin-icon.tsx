import { SymbolView } from 'expo-symbols';

import { ANDROID_ICONS, TintIcon } from '@/components/tint-icon';

/** A thumbtack means keep at the top; bookmarks remain exclusive to saving. */
export function PinIcon({ remove = false, size = 20, color }: { remove?: boolean; size?: number; color: string }) {
  return <SymbolView name={remove ? 'pin.slash' : 'pin'} size={size} weight="regular" tintColor={color}
    fallback={<TintIcon source={remove ? ANDROID_ICONS.pinOff : ANDROID_ICONS.pin} size={size} color={color} />} />;
}
