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
  accentLight:   Colors.accentLight,
  textSecondary: Colors.textSecondary,
  border:        Colors.border,
  isDark:        false,
};

export const darkTheme: Theme = {
  bg:            '#141414',
  surface:       '#2A2A2A',
  surface2:      '#333333',
  text:          '#F0F0F0',
  orange:        '#F0F0F0',
  sep:           'rgba(240,240,240,0.12)',
  gray:          'rgba(240,240,240,0.75)',
  bone:          '#141414',
  accent:        '#F0F0F0',
  accentLight:   'rgba(240,240,240,0.08)',
  textSecondary: 'rgba(240,240,240,0.75)',
  border:        'rgba(240,240,240,0.15)',
  isDark:        true,
};

export const DARK_MODE_KEY = '@lafondita_dark_mode';

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
