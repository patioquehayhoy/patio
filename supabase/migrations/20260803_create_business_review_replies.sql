-- Una sola respuesta oficial por reseña. El negocio no recibe permiso para
-- editar estrellas, texto, estado ni identidad de la reseña del Foodie.
alter table public.reviews
  add column if not exists business_reply text check (char_length(business_reply) <= 600),
  add column if not exists business_replied_at timestamptz;

create or replace function public.reply_to_review(
  target_fondita_id uuid,
  target_user_id uuid,
  reply_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.fonditas f
    where f.id = target_fondita_id
      and lower(f.telefono) = lower(auth.jwt() ->> 'email')
  ) then
    raise exception 'not authorized';
  end if;

  if char_length(trim(reply_text)) not between 1 and 600 then
    raise exception 'invalid reply';
  end if;

  update public.reviews
  set business_reply = trim(reply_text),
      business_replied_at = now()
  where fondita_id = target_fondita_id
    and user_id = target_user_id
    and status = 'published';
end;
$$;

revoke all on function public.reply_to_review(uuid, uuid, text) from public;
grant execute on function public.reply_to_review(uuid, uuid, text) to authenticated;
