import { supabase } from './supabase';
import type { PatioMenuSection } from './patios';

export async function fetchMenuForFondita(fonditaId: string): Promise<PatioMenuSection[]> {
  const { data: sections, error } = await supabase
    .from('menu_sections')
    .select('id, name, sort_order, menu_items(id, name, price, sort_order)')
    .eq('fondita_id', fonditaId)
    .order('sort_order');

  if (error || !sections) return [];

  return sections.map((s) => ({
    section: s.name,
    items: ((s.menu_items as { name: string; price?: string }[]) ?? [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item) => ({ name: item.name, price: item.price ?? undefined })),
  }));
}
