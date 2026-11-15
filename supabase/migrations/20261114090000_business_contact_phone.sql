-- Número del negocio en la ficha (decisión de Parco, 2026-11-11): opcional,
-- solo el número, sin redes ni chat. La gente lo toca para llamar o, si el
-- negocio lo marca, para escribirle por WhatsApp. Diez dígitos de México,
-- sin espacios ni lada internacional (la app agrega +52 al abrir WhatsApp).
-- Es un dato público del negocio y está declarado en el aviso de privacidad.

alter table public.negocios add column if not exists contacto_telefono text
  check (contacto_telefono is null or contacto_telefono ~ '^[0-9]{10}$');
alter table public.negocios add column if not exists contacto_whatsapp boolean not null default false;

-- La lectura pública de `negocios` va por columnas (20261009130000): las
-- columnas nuevas necesitan su propio permiso.
grant select (contacto_telefono, contacto_whatsapp) on public.negocios to anon, authenticated;
