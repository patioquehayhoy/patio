-- Qué notificaciones recibir: además de menús de hoy, reseñas y novedades,
-- promociones (avisos especiales de lugares guardados) y lugares nuevos cerca.
-- Ambas apagadas por defecto: las promociones push requieren que la persona
-- las active (App Review 4.5.4), también en cuentas existentes.
alter table public.notification_preferences
  add column if not exists special_notices boolean not null default false,
  add column if not exists new_places boolean not null default false;
