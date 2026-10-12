# Edge Functions de Patio

> El estado de despliegue histórico no acredita los cambios locales de la
> auditoría del 10 de septiembre de 2026. Ver
> `docs/APP_BACKEND_AUDIT_2026-09-10.md` para validación, migraciones previas y
> bloqueos. No se desplegó este corte automáticamente.

Todas las funciones requieren JWT de usuario y vuelven a verificarlo con Auth.
`supabase/config.toml` mantiene `verify_jwt = true`. La app envía su clave pública
en `apikey` y la sesión en `Authorization`; una clave pública sola no concede
acceso al proveedor IA ni a acciones de cuenta.

## `delete-account`

Recibe POST autenticado y devuelve `{ "deleted": true }` solo después del hard
delete. Ignora ids de usuario en el body. Requiere aplicar primero
`20260909_account_deletion.sql`; si falta el trigger, se detiene sin tocar
Storage. Elimina carpetas propias de avatars/business-logos por la API de
Storage y después llama Auth Admin. El trigger y las FK eliminan datos SQL.
Ensayar con cuentas desechables y esquema restaurado antes de producción.

## `search-intent` y `send-publication-notifications`

La búsqueda IA requiere sesión y conserva fallback determinístico en el
cliente. Los anuncios validan dueño, menú existente y día CDMX; Expo se llama
en lotes de hasta 100. El reporte de auditoría documenta reintentos, receipts y
límites operativos que siguen pendientes.

## `read-menu`

Saca la clave de Anthropic del cliente móvil — lee la foto del menú con visión
y normaliza secciones/platillos/precio. Redeploy:

```bash
supabase functions deploy read-menu
supabase secrets set ANTHROPIC_API_KEY=tu_clave
```

La app llama `supabase.functions.invoke('read-menu')`. La función requiere el
secreto `ANTHROPIC_API_KEY`; no uses una variable `EXPO_PUBLIC_*` para esta clave.

## `smart-setup`

Alta conversacional (Patio Smart, `app/patio-smart.tsx`): relato libre →
extracción estructurada → revisión humana editable. Redeploy:

```bash
supabase functions deploy smart-setup
```

Usa el mismo secreto `ANTHROPIC_API_KEY`. Nunca publica directamente — días,
dirección, pagos y otros datos no mencionados quedan pendientes, no se
completan por inferencia.

## Corte 2026-10-09: cuotas IA

Aplicar `20261009100000_ai_request_limits.sql` antes de desplegar read-menu,
smart-setup y search-intent. El RPC es exclusivo de service_role y limita por
usuario/función antes de llamar al proveedor. RPC ausente/error devuelve 503;
cuota agotada devuelve 429. No promete saldo de suscripción. Aplicar también
`20261009110000_review_server_dates.sql` para fechar reseñas en servidor.
Estos cambios solo se ensayaron localmente. Inventario y secuencia de staging:
`scripts/backend/README.md`; cierre: `docs/LAUNCH_CLOSEOUT_2026-10-09.md`.
