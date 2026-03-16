import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ─── Palettes ─────────────────────────────────────────────────────────────────
export type Theme = {
  bg: string;
  surface: string;   // capa sobre bg (bottom bar, cards)
  surface2: string;  // capa elevada (segmented control, modales)
  text: string;
  orange: string;
  sep: string;
  gray: string;      // texto secundario / placeholders
  bone: string;      // always #FFF7E0 — thumbs y elementos que no invierten
  isDark: boolean;
};

export const lightTheme: Theme = {
  bg:       '#FFF7E0',
  surface:  '#F5EDD0',
  surface2: '#EDE3C4',
  text:     '#3D1F00',
  orange:   '#FF5E00',
  sep:      '#EDE8DC',
  gray:     '#9E3F00',
  bone:     '#FFF7E0',
  isDark:   false,
};

export const darkTheme: Theme = {
  bg:       '#0E0C09',
  surface:  '#1A1610',
  surface2: '#241E16',
  text:     '#FFF7E0',
  orange:   '#FF5E00',
  sep:      'rgba(255,247,224,0.08)',
  gray:     'rgba(255,247,224,0.55)',
  bone:     '#FFF7E0',
  isDark:   true,
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
