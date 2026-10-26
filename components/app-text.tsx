import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/lib/theme';

// Neue Montreal en toda la interfaz. Las fuentes de archivo no tienen pesos
// sintéticos: un fontWeight de 600 o más usa el archivo Semibold y el resto el
// Regular. Un estilo que ya trae fontFamily (la marca, Monument) se respeta.
export function withAppFont(style: TextProps['style']): TextProps['style'] {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  if (flat.fontFamily) return style;
  const weight = flat.fontWeight === 'bold' ? 700 : Number(flat.fontWeight ?? 400);
  return [style, { fontFamily: weight >= 600 ? Fonts.textSemibold : Fonts.text, fontWeight: 'normal' }];
}

export function Text(props: TextProps) {
  return <RNText {...props} style={withAppFont(props.style)} />;
}

export function TextInput(props: TextInputProps) {
  return <RNTextInput {...props} style={withAppFont(props.style) as TextInputProps['style']} />;
}
