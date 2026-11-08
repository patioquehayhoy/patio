-- Cobro directo con App Store y Google Play (sin RevenueCat). Cada compra se
-- liga a una cuenta la primera vez que el servidor la verifica; después nadie
-- más puede reclamarla. Solo las funciones verify-purchase y
-- store-notifications escriben aquí. La app no lee esta tabla: lee
-- business_plans.
create table if not exists public.store_purchases (
  platform text not null check (platform in ('ios', 'android')),
  store_ref text not null check (char_length(store_ref) between 1 and 500),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  expires_at timestamptz,
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (platform, store_ref)
);
create index if not exists store_purchases_user_idx on public.store_purchases(user_id);
alter table public.store_purchases enable row level security;
revoke all on public.store_purchases from public, anon, authenticated;
grant select, insert, update, delete on public.store_purchases to service_role;

comment on table public.business_plans is
  'Pro del negocio. Lo escriben verify-purchase y store-notifications (tienda) o Alejandro a mano (Fundadores).';
