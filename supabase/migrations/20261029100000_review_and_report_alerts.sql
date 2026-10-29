-- Avisos de una sola vez: reseña nueva al dueño del Patio y reporte nuevo a
-- soporte. La marca de tiempo deja que la función reclame cada aviso de forma
-- atómica y no lo repita.
alter table public.reviews add column if not exists owner_notified_at timestamptz;
alter table public.content_reports add column if not exists notified_at timestamptz;
