-- Informational menu alerts are opt-in. Saving a Patio never grants permission
-- to interrupt; the person enables this category explicitly in Perfil > Avisos.
alter table public.notification_preferences
  alter column patio_publications set default false;

-- This notification system has not shipped publicly yet, so no prior true
-- value represents durable user consent.
update public.notification_preferences
set patio_publications = false,
    updated_at = now();
