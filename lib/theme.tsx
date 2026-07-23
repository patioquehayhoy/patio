import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { Colors } from './colors';

// ─── Palettes ─────────────────────────────────────────────────────────────────
export type Theme = {
  bg: string;
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

export const Fonts = {
  brand: 'PlusJakartaSans_800ExtraBold',
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
