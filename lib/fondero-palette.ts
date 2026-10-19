import { darkTheme, lightTheme } from './theme';

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

// Compatibility adapter: role never selects a different UI palette.
export function fonderoPalette(isDark: boolean): FonderoColors {
  const theme = isDark ? darkTheme : lightTheme;
  return {
    bg: theme.bg,
    surface: theme.surface,
    surface2: theme.surface2,
    border: theme.border,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMute: theme.textMute,
    accent: theme.accent,
    iconBg: theme.iconBg,
    green: isDark ? '#5BCB8B' : '#2E9E63',
    danger: isDark ? '#FF453A' : '#FF3B30',
  };
}
