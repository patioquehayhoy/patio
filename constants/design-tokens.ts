import { Platform } from 'react-native';

export const FontFamily = {
  brand: Platform.select({
    ios: 'StabilGrotesk',
    android: 'StabilGrotesk',
    default: 'StabilGrotesk',
  }),
  ui: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
} as const;

export const FontSize = {
  display: 40,
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  bodyCompact: 15,
  meta: 13,
  caption: 12,
} as const;

export const LineHeight = {
  display: 44,
  h1: 36,
  h2: 28,
  h3: 24,
  body: 22,
  bodyCompact: 20,
  meta: 16,
  caption: 15,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const IconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 34,
} as const;

