import { Image, type ImageSourcePropType } from 'react-native';

// Íconos de Android que reemplazan a los símbolos del sistema de Apple, que
// Apple solo permite en sus equipos. Dibujos de Lucide (licencia ISC, ver
// assets/icons/android/LICENSE-lucide.txt), del mismo estilo que los de iOS.
export const ANDROID_ICONS = {
  cash: require('../assets/icons/android/cash.png'),
  card: require('../assets/icons/android/card.png'),
  transfer: require('../assets/icons/android/transfer.png'),
  verified: require('../assets/icons/android/verified.png'),
  send: require('../assets/icons/android/send.png'),
  pin: require('../assets/icons/android/pin.png'),
  pinOff: require('../assets/icons/android/pin-off.png'),
} satisfies Record<string, ImageSourcePropType>;

export function TintIcon({ source, size, color }: { source: ImageSourcePropType; size: number; color: string }) {
  return <Image source={source} style={{ width: size, height: size, tintColor: color }} accessibilityIgnoresInvertColors />;
}
