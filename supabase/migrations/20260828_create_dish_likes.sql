-- Like por platillo específico (no por Patio completo): micro-señal de
-- compromiso de fricción casi cero, separada de reviews (que sí llevan
-- contenido propio — texto, estrellas, y no deben fusionarse). dish_name
-- guarda la forma canónica (mayúsculas, sin acentos, ver
-- lib/menu-store.ts::canonicalDishName) para que el mismo platillo publicado
-- en días distintos acumule un solo conteo real; dish_name_display conserva
-- la última forma tal cual la escribió el Fondero, para mostrarla legible.
create table if not exists public.dish_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  dish_name text not null,
  dish_name_display text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, fondita_id, dish_name)
);

alter table public.dish_likes enable row level security;

-- Lectura pública: el Fondero necesita ver el agregado de quién likeó qué,
-- mismo nivel de apertura que ya tienen las reseñas publicadas (nombre y
-- avatar visibles, no hay expectativa de anonimato en este flujo).
create policy "dish likes readable" on public.dish_likes for select
using (true);

create policy "own dish likes" on public.dish_likes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
