import { Fonts } from '@/lib/theme';

// Alineación óptica: cada letra trae un margen propio a la izquierda (la
// «sangría» del dibujo dentro de su caja). En un título grande ese margen
// crece con el tamaño y la letra parece metida respecto al texto chico de
// abajo. Esto mide la tinta, no la caja, para que los bordes visibles queden
// en la misma vertical. Valores en fracción del tamaño (em), medidos de los
// archivos de Monument y Neue Montreal; ver docs/PATIO_DESIGN_PRINCIPLES.md.
const SIDE_BEARING: Record<string, Record<string, number>> = {
  [Fonts.brand]: { 'A': 0.027, 'B': 0.05, 'C': 0.036, 'D': 0.05, 'E': 0.05, 'F': 0.05, 'G': 0.036, 'H': 0.05, 'I': 0.05, 'J': 0.039, 'K': 0.05, 'L': 0.05, 'M': 0.05, 'N': 0.05, 'O': 0.036, 'P': 0.05, 'Q': 0.036, 'R': 0.05, 'S': 0.019, 'T': 0.03, 'U': 0.045, 'V': 0.027, 'W': 0.027, 'X': 0.027, 'Y': 0.026, 'Z': 0.04, 'a': 0.031, 'b': 0.046, 'c': 0.031, 'd': 0.031, 'e': 0.031, 'f': 0.027, 'g': 0.031, 'h': 0.046, 'i': 0.046, 'j': -0.014, 'k': 0.046, 'l': 0.046, 'm': 0.046, 'n': 0.046, 'o': 0.031, 'p': 0.046, 'q': 0.031, 'r': 0.046, 's': 0.03, 't': 0.028, 'u': 0.044, 'v': 0.024, 'w': 0.02, 'x': 0.024, 'y': 0.024, 'z': 0.039, '0': 0.036, '1': 0.033, '2': 0.039, '3': 0.034, '4': 0.038, '5': 0.033, '6': 0.04, '7': 0.038, '8': 0.038, '9': 0.038, 'Á': 0.027, 'É': 0.05, 'Í': 0.006, 'Ó': 0.036, 'Ú': 0.045, 'Ñ': 0.05, 'Ü': 0.045, 'á': 0.031, 'é': 0.031, 'í': -0.001, 'ó': 0.031, 'ú': 0.044, 'ñ': 0.046, '¿': 0.033, '¡': 0.04 },
  [Fonts.text]: { 'A': 0.007, 'B': 0.074, 'C': 0.038, 'D': 0.074, 'E': 0.074, 'F': 0.074, 'G': 0.038, 'H': 0.074, 'I': 0.074, 'J': 0.018, 'K': 0.074, 'L': 0.074, 'M': 0.074, 'N': 0.076, 'O': 0.038, 'P': 0.074, 'Q': 0.038, 'R': 0.074, 'S': 0.025, 'T': 0.015, 'U': 0.069, 'V': 0.008, 'W': 0.016, 'X': -0.003, 'Y': 0.009, 'Z': 0.021, 'a': 0.029, 'b': 0.058, 'c': 0.03, 'd': 0.031, 'e': 0.03, 'f': 0.021, 'g': 0.033, 'h': 0.058, 'i': 0.05, 'j': -0.026, 'k': 0.058, 'l': 0.058, 'm': 0.058, 'n': 0.058, 'o': 0.03, 'p': 0.058, 'q': 0.031, 'r': 0.058, 's': 0.022, 't': 0.014, 'u': 0.054, 'v': 0.009, 'w': 0.01, 'x': -0.007, 'y': 0.001, 'z': 0.019, '0': 0.045, '1': 0.013, '2': 0.029, '3': 0.035, '4': 0.025, '5': 0.036, '6': 0.046, '7': 0.01, '8': 0.04, '9': 0.042, 'Á': 0.007, 'É': 0.074, 'Í': 0.074, 'Ó': 0.038, 'Ú': 0.069, 'Ñ': 0.076, 'Ü': 0.069, 'á': 0.029, 'é': 0.03, 'í': 0.058, 'ó': 0.03, 'ú': 0.054, 'ñ': 0.058, '¿': 0.017, '¡': 0.061 },
  [Fonts.textSemibold]: { 'A': -0.001, 'B': 0.065, 'C': 0.032, 'D': 0.065, 'E': 0.065, 'F': 0.065, 'G': 0.032, 'H': 0.065, 'I': 0.065, 'J': 0.017, 'K': 0.065, 'L': 0.065, 'M': 0.065, 'N': 0.065, 'O': 0.032, 'P': 0.065, 'Q': 0.032, 'R': 0.065, 'S': 0.021, 'T': 0.015, 'U': 0.059, 'V': 0.004, 'W': 0.01, 'X': -0.007, 'Y': 0.004, 'Z': 0.025, 'a': 0.023, 'b': 0.048, 'c': 0.024, 'd': 0.026, 'e': 0.024, 'f': 0.02, 'g': 0.027, 'h': 0.048, 'i': 0.046, 'j': -0.04, 'k': 0.048, 'l': 0.048, 'm': 0.048, 'n': 0.048, 'o': 0.024, 'p': 0.048, 'q': 0.026, 'r': 0.048, 's': 0.019, 't': 0.014, 'u': 0.045, 'v': 0.004, 'w': 0.004, 'x': -0.011, 'y': -0.005, 'z': 0.02, '0': 0.039, '1': 0.014, '2': 0.027, '3': 0.027, '4': 0.029, '5': 0.03, '6': 0.04, '7': 0.011, '8': 0.034, '9': 0.036, 'Á': -0.001, 'É': 0.065, 'Í': 0.065, 'Ó': 0.032, 'Ú': 0.059, 'Ñ': 0.065, 'Ü': 0.059, 'á': 0.023, 'é': 0.024, 'í': 0.048, 'ó': 0.024, 'ú': 0.045, 'ñ': 0.048, '¿': 0.019, '¡': 0.051 },
};
const FALLBACK = 0.04;

/** Puntos de margen propio de la primera letra de `text` en esa fuente y tamaño. */
export function leadingInk(text: string, fontFamily: string, fontSize: number): number {
  const first = text.trim().charAt(0);
  const table = SIDE_BEARING[fontFamily];
  return (table?.[first] ?? FALLBACK) * fontSize;
}

/** Corrimiento a la izquierda para que la tinta de `text` empiece en el borde. */
export function opticalIndent(text: string, fontFamily: string, fontSize: number): number {
  return -Math.round(leadingInk(text, fontFamily, fontSize) * 2) / 2;
}
