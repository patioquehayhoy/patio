import type { ViewStyle } from 'react-native';

/** A stable material behind content; map colors must not compete with text. */
export function sheetSurfaceTint(isDark: boolean): string {
  return isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)';
}

/** Only detached controls cast a shadow; content and docked sheets stay flat. */
export function floatingSurfaceShadow(isDark: boolean): ViewStyle {
  return {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.14 : 0.08, shadowRadius: 12, elevation: 4,
  };
}
