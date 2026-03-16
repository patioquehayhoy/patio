import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ─── Palettes ─────────────────────────────────────────────────────────────────
export type Theme = {
  bg: string;
  text: string;
  orange: string;
  sep: string;
  gray: string;
  bone: string;   // always #FFF7E0 — para thumbs y elementos que no invierten
  isDark: boolean;
};

export const lightTheme: Theme = {
  bg:     '#FFF7E0',
  text:   '#3D1F00',
  orange: '#FF5E00',
  sep:    '#EDE8DC',
  gray:   '#9E3F00',
  bone:   '#FFF7E0',
  isDark: false,
};

export const darkTheme: Theme = {
  bg:     '#1F1700',
  text:   '#FFF7E0',
  orange: '#FF5E00',
  sep:    '#3D2800',
  gray:   '#9E3F00',
  bone:   '#FFF7E0',
  isDark: true,
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
