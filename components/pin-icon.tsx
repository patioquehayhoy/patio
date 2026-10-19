import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';

/** A thumbtack means keep at the top; bookmarks remain exclusive to saving. */
export function PinIcon({ remove = false, size = 20, color }: { remove?: boolean; size?: number; color: string }) {
  return <SymbolView name={remove ? 'pin.slash' : 'pin'} size={size} weight="regular" tintColor={color}
    fallback={<MaterialCommunityIcons name={remove ? 'pin-off-outline' : 'pin-outline'} size={size} color={color} />} />;
}
