# Edge Functions de Patio

> Ambas funciones están **desplegadas y operando** desde 2026-07-18 (ver
> `docs/ROADCONTROLLER.md`). Los comandos de abajo son de referencia para
> redeploy tras un cambio, no un pendiente.

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
