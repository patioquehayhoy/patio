import { Colors } from './colors';

// Paleta del lado Fondero, sensible al tema (claro/oscuro).
//
// Antes cada pantalla Fondero tenía una constante `DARK` hardcodeada y SIEMPRE
// se veía oscura, ignorando el toggle de modo claro/oscuro. Eso rompía la
// experiencia: cambiar el tema en Foodie no afectaba al Fondero, y elementos que
// SÍ leen el tema (la tab bar) quedaban desfasados.
//
// Ahora el Fondero también respeta el tema. `fonderoPalette(isDark)` devuelve la
// paleta correcta. Los tokens claros reutilizan el lenguaje del lado Foodie
// (lib/colors.ts) para mantener consistencia visual, no colores inventados.

export type FonderoColors = {
  bg: string;
  surface: string;
  surface2: string;      // capa elevada opaca (modales) — surface normal es casi transparente en oscuro
  border: string;
  text: string;
  textSecondary: string;
  textMute: string;
  accent: string;
  iconBg: string;        // fondo de los círculos de ícono
  green: string;         // tendencia positiva (historial)
  danger: string;        // acciones destructivas (eliminar)
};

const DARK: FonderoColors = {
  bg: Colors.bgDark,
  surface: Colors.surfaceDark,
  surface2: Colors.surface2Dark,
  border: Colors.borderDark,
  text: Colors.textDark,
  textSecondary: Colors.textSecondaryDark,
  textMute: Colors.textMuteDark,
  accent: Colors.accentDark,
  iconBg: 'rgba(255,255,255,0.06)',
  green: '#5BCB8B',
  danger: '#FF453A',
};

const LIGHT: FonderoColors = {
  bg: Colors.bg,
  surface: Colors.surface,
  surface2: Colors.surface2,
  border: Colors.border,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  textMute: Colors.textMute,
  accent: Colors.accent,
  iconBg: '#F1EFE9',
  green: '#2E9E63',
  danger: '#FF3B30',
};

export function fonderoPalette(isDark: boolean): FonderoColors {
  return isDark ? DARK : LIGHT;
}
