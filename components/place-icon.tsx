import { Ionicons } from '@expo/vector-icons';

/** A place is a location; optional category symbols use the same icon family. */
export function PlaceIcon({ name = 'location-outline', size = 18, color }: {
  name?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
