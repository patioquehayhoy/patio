import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { Colors } from './colors';

// ─── Palettes ─────────────────────────────────────────────────────────────────
export type Theme = {
  bg: string;
  iconBg: string;         // controles neutros, compartidos entre roles
  surface: string;        // capa sobre bg (bottom bar, cards)
  surface2: string;       // capa elevada (segmented control, modales)
  text: string;
  orange: string;
  sep: string;
  gray: string;           // texto secundario / placeholders
  bone: string;           // always #EFEFEF — thumbs y elementos que no invierten
  accent: string;         // acento principal (botones, CTAs)
  accentLight: string;    // acento con baja opacidad (fondos sutiles)
  textSecondary: string;  // texto secundario
  border: string;         // bordes y separadores
  // ── Tokens v02 (Figma Make) ──
  textMute: string;       // ink-mute — captions/metadata
  accentSoft: string;     // fondos tibios, chip "elige uno"
  glass: string;          // capas glass (sheets, search bars)
  isDark: boolean;
};

export const lightTheme: Theme = {
  bg:            Colors.bg,
  iconBg:        'rgba(17,18,20,0.04)',
  surface:       Colors.surface,
  surface2:      Colors.surface2,
  text:          Colors.text,
  orange:        Colors.accent,
  sep:           Colors.border,
  gray:          Colors.textSecondary,
  bone:          Colors.bg,
  accent:        Colors.accent,
  accentLight:   Colors.accentSoft,
  textSecondary: Colors.textSecondary,
  border:        Colors.border,
  textMute:      Colors.textMute,
  accentSoft:    Colors.accentSoft,
  glass:         Colors.glass,
  isDark:        false,
};

export const darkTheme: Theme = {
  bg:            Colors.bgDark,
  iconBg:        'rgba(255,255,255,0.06)',
  surface:       Colors.surfaceDark,
  surface2:      Colors.surface2Dark,
  text:          Colors.textDark,
  orange:        Colors.accentDark,
  sep:           Colors.borderDark,
  gray:          Colors.textSecondaryDark,
  bone:          Colors.bgDark,
  accent:        Colors.accentDark,
  accentLight:   Colors.accentSoftDark,
  textSecondary: Colors.textSecondaryDark,
  border:        Colors.borderDark,
  textMute:      Colors.textMuteDark,
  accentSoft:    Colors.accentSoftDark,
  glass:         Colors.glassDark,
  isDark:        true,
};

export const DARK_MODE_KEY = '@lafondita_dark_mode';

// Marca: Monument (momentos de marca). Interfaz: Neue Montreal (todo lo demás).
// Hoy cargan las pruebas de uso personal (assets/fonts/prueba, fuera de git);
// con la licencia se cambia Monument-Black por Monument Semibold aquí.
export const Fonts = {
  brand: 'Monument-Black',
  text: 'NeueMontreal-Regular',
  textSemibold: 'NeueMontreal-Semibold',
} as const;

// ─── Escala tipográfica ─────────────────────────────────────────────────────────
// Un solo lugar para tamaño, interlineado y espaciado por rol. Cambiar la fuente
// de marca (Monument, con licencia) se hace aquí: las pantallas usan el rol.
// Apple: letras más juntas en grande, más abiertas en chico; interlineado más
// apretado en grande. La fuente de marca no lleva fontWeight: solo se carga 800.
export const Type = {
  // Monument trae su propio espaciado: 0, como Pangram. Interlineado de títulos ~1.05.
  celebration: { fontFamily: Fonts.brand, fontSize: 44, lineHeight: 46, letterSpacing: 0 },
  hero:        { fontFamily: Fonts.brand, fontSize: 38, lineHeight: 40, letterSpacing: 0 },
  screen:      { fontFamily: Fonts.brand, fontSize: 32, lineHeight: 34, letterSpacing: 0 },
  number:      { fontFamily: Fonts.brand, fontSize: 32, lineHeight: 34, letterSpacing: 0 },
  title:       { fontFamily: Fonts.brand, fontSize: 26, lineHeight: 28, letterSpacing: 0 },
  section:     { fontFamily: Fonts.brand, fontSize: 21, lineHeight: 24, letterSpacing: 0 },
  // Neue Montreal: el peso lo resuelve components/app-text (600+ → Semibold).
  headline:    { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body:        { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  subhead:     { fontSize: 13, lineHeight: 17, fontWeight: '400' },
  caption:     { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  label:       { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
} as const;

// ─── Escalas de diseño (Figma Make v02) ─────────────────────────────────────────
// Radios: chip 14 · card 18 · sheet 28 · phone 44
export const Radius = {
  chip: 14,
  card: 18,
  sheet: 28,
  phone: 44,
} as const;

// Espaciado base-4 con pasos editoriales
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,   // gutter de pantalla
  xxl: 32,  // sección
  hero: 56, // hero
} as const;

// Espaciado semántico: evita elegir números distintos para la misma función.
export const Layout = {
  screen: 20,
  editorial: 22,
  modal: 24,
  card: 16,
  compact: 12,
  touchTarget: 44,
  row: 56,
} as const;

// Motion — spring iOS, sin distracciones
export const Motion = {
  sheetSpring:  { stiffness: 380, damping: 32 },
  pressScale:   { scale: 0.96, durationMs: 120 },
  enterEditorial: { translateY: 12, durationMs: 320 },
  pinPulse:     { from: 1, to: 1.08, durationMs: 1800 },
} as const;

// ─── Context ──────────────────────────────────────────────────────────────────
type ThemeCtx = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then((val) => {
      if (val === 'true') setIsDark(true);
      setReady(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(DARK_MODE_KEY, next ? 'true' : 'false');
  };

  // No renderizar hasta saber el tema guardado — evita flash de color en el primer frame
  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
