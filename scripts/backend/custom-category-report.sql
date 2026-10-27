-- Read-only operational report: custom categories from the last 30 days.
-- Run only in the authorized Patio SQL Editor. No email/owner identifiers.
select trim(category) as giro, count(distinct f.id) as negocios,
       min(f.created_at) as primera_alta, max(f.created_at) as ultima_alta
from public.fonditas f
cross join lateral unnest(f.categorias) as category
where f.created_at >= now() - interval '30 days'
  and length(trim(category)) > 0
  and lower(trim(category)) not in (
    'fondita', 'taquería', 'taqueria', 'postres', 'postres y pan', 'repostería',
    'reposteria', 'mariscos', 'antojitos', 'elotes', 'botanas', 'bebidas',
    'jugos y fruta', 'cafetería', 'cafeteria', 'restaurante', 'otro'
  )
group by trim(category)
order by negocios desc, ultima_alta desc;
