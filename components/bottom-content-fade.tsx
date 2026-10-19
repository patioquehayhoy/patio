import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';

/** Passive transition behind fixed controls; scroll content supplies clearance. */
export function BottomContentFade({ height, bottom = 0, inset = 0 }: { height: number; bottom?: number; inset?: number }) {
  const { theme } = useTheme();
  return <LinearGradient pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    colors={[`${theme.bg}00`, theme.bg, theme.bg]} locations={[0, 0.65, 1]}
    style={{ position: 'absolute', left: -inset, right: -inset, bottom, height }} />;
}
