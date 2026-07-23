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
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  accent: '#FF6A3D',
  iconBg: 'rgba(255,255,255,0.06)',
  green: '#5BCB8B',
  danger: '#FF453A',
};

const LIGHT: FonderoColors = {
  bg: '#F8F8F5',
  surface: '#FFFFFF',
  border: 'rgba(17,18,20,0.08)',
  text: '#111214',
  textSecondary: '#4A4A47',
  textMute: '#8A8A85',
  accent: '#F2612F',
  iconBg: '#F1EFE9',
  green: '#2E9E63',
  danger: '#FF3B30',
};

export function fonderoPalette(isDark: boolean): FonderoColors {
  return isDark ? DARK : LIGHT;
}
