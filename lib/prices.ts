export function publicPrice(price?: string | null): string {
  const clean = price?.trim() ?? '';
  return clean === '$' ? '' : clean;
}

export function publicCurrency(price?: string | null): string {
  const clean = publicPrice(price);
  if (!clean) return '';
  return clean.startsWith('$') ? clean : `$${clean}`;
}
