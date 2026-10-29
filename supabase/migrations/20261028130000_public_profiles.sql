-- Decisión explícita de Alejandro: los perfiles existentes y nuevos son públicos.
-- La privacidad de listas se conserva y no se modifica con esta migración.
alter table public.user_profiles alter column visibility set default 'public';
update public.user_profiles set visibility = 'public' where visibility <> 'public';
