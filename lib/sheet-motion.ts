// Movimiento compartido por las hojas que se pueden descartar hacia abajo.
// Mantener estos valores en un solo lugar evita que cada panel se sienta
// como un componente distinto al seguir el dedo o volver a su posición.
export const SHEET_DISMISS_MS = 190;
export const SHEET_DRAG_ACTIVATION = 8;
export const SHEET_DISMISS_DISTANCE = 64;
export const SHEET_DISMISS_VELOCITY = 0.85;
export const SHEET_SPRING = {
  stiffness: 320,
  damping: 30,
  mass: 0.75,
  useNativeDriver: true,
} as const;

export function isVerticalSheetDrag(dx: number, dy: number) {
  return dy > SHEET_DRAG_ACTIVATION && Math.abs(dy) > Math.abs(dx);
}

export function shouldDismissSheet(dy: number, vy: number) {
  return dy > SHEET_DISMISS_DISTANCE || vy > SHEET_DISMISS_VELOCITY;
}
