/** Geometry shared by floating navigation and its scrollable content. */
export const BOTTOM_TAB_HEIGHT = 48;
export const BOTTOM_ACTION_OFFSET = 8;
export const CONTENT_CONTROL_GAP = 16;

/** Keep location and rating/closing rows readable with card padding. */
export function patioGridColumns(width: number, fontScale: number): 1 | 2 {
  return fontScale > 1.4 || (width - 44) / 2 < 140 * fontScale + 24 ? 1 : 2;
}

export function bottomTabOffset(safeBottom: number): number {
  return Math.max(10, safeBottom) + 4;
}

export function bottomTabClearance(safeBottom: number): number {
  return bottomTabOffset(safeBottom) + BOTTOM_TAB_HEIGHT + CONTENT_CONTROL_GAP;
}

export function bottomActionClearance(safeBottom: number, measuredHeight: number): number {
  return safeBottom + BOTTOM_ACTION_OFFSET + Math.max(60, measuredHeight) + CONTENT_CONTROL_GAP;
}

/** Keep the footer outside the primary scroll and leave a usable content row.
 * The available viewport wins on small displays and when the keyboard opens. */
export function librarySheetHeight({ available, preferred, natural, header, footer, safeBottom, fontScale }: {
  available: number; preferred: number; natural: number; header: number;
  footer: number; safeBottom: number; fontScale: number;
}): number {
  const minimum = header + footer + (footer ? safeBottom : 0) + 52 * fontScale;
  const desired = Math.max(minimum, Math.min(preferred + safeBottom + Math.max(0, fontScale - 1) * 180, natural));
  return Math.max(0, Math.min(available, desired));
}

export function libraryFooterMaxHeight(visibleHeight: number, headerHeight: number, safeBottom: number, fontScale: number): number {
  const remaining = Math.max(0, visibleHeight - headerHeight - safeBottom);
  return Math.max(0, remaining - Math.min(52 * fontScale, remaining / 2));
}
