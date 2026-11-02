import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';

// Un solo dibujo por forma de pago en toda la app: ficha, alta, Editar mi
// negocio y filtros. En iOS, los símbolos del sistema (billete, tarjeta,
// flechas); en Android, sus equivalentes de Ionicons. El billete de «Ordenar
// por precio» es otro ícono a propósito: precio y forma de pago no se mezclan.
export const PAYMENT_ORDER = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;
export type PaymentMethod = (typeof PAYMENT_ORDER)[number];

const SYMBOLS: Record<PaymentMethod, { symbol: SFSymbol; fallback: keyof typeof Ionicons.glyphMap; scale: number }> = {
  Efectivo: { symbol: 'banknote', fallback: 'cash-outline', scale: 1 },
  Tarjeta: { symbol: 'creditcard', fallback: 'card-outline', scale: 0.94 },
  Transferencia: { symbol: 'arrow.left.arrow.right', fallback: 'swap-horizontal-outline', scale: 0.86 },
};

export function PaymentIcon({ method, size = 18, color }: { method: PaymentMethod; size?: number; color: string }) {
  const icon = SYMBOLS[method];
  const scaled = Math.round(size * icon.scale * 10) / 10;
  return (
    <SymbolView
      name={icon.symbol}
      size={scaled}
      weight="regular"
      tintColor={color}
      fallback={<Ionicons name={icon.fallback} size={scaled} color={color} />}
    />
  );
}
