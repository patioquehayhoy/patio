import { SymbolView, type SFSymbol } from 'expo-symbols';

import { ANDROID_ICONS, TintIcon } from '@/components/tint-icon';

// Un solo dibujo por forma de pago en toda la app: ficha, alta, Editar mi
// negocio y filtros. En iOS, los símbolos del sistema (billete, tarjeta,
// flechas); en Android, dibujos equivalentes del mismo estilo. El billete de
// «Ordenar por precio» es otro ícono a propósito: precio y pago no se mezclan.
export const PAYMENT_ORDER = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;
export type PaymentMethod = (typeof PAYMENT_ORDER)[number];

const SYMBOLS: Record<PaymentMethod, { symbol: SFSymbol; android: keyof typeof ANDROID_ICONS; scale: number }> = {
  Efectivo: { symbol: 'banknote', android: 'cash', scale: 1 },
  Tarjeta: { symbol: 'creditcard', android: 'card', scale: 0.94 },
  Transferencia: { symbol: 'arrow.left.arrow.right', android: 'transfer', scale: 0.86 },
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
      fallback={<TintIcon source={ANDROID_ICONS[icon.android]} size={scaled} color={color} />}
    />
  );
}
