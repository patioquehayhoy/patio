# Planes y compras — 2026-10-26 (actualizado 2026-11-02)

Catálogo en `lib/plans.ts`, pantalla en `app/plan.tsx`. Solo el negocio tiene
planes ([decisión](PLANES_CREADORES_Y_RED_2026-11-02.md)).

| Plan | Mensual MXN | Anual MXN | Cupo |
|---|---:|---:|---|
| Negocio Gratis | 0 | 0 | 20 lecturas con foto al día; captura manual sin límite |
| Negocio Pro | 99 | 990 | 60 lecturas con foto al día, 8 avisos especiales al mes, platillo destacado, día y hora con más interés |

Fundadores: primeros negocios de cada colonia, por invitación, alta en persona
y 6 meses de Pro.

## Implementado

- SDK `react-native-purchases` 9.15.3, carga diferida. Identidad RevenueCat =
  UUID autenticado de Supabase.
- Oferta `patio_pro` con paquetes mensual/anual. Compra y restauración
  comprueban el entitlement `patio_pro`.
- **Pro en servidor** (`supabase/migrations/20261102120000_business_pro.sql`):
  - `business_plans`: quién tiene Pro y hasta cuándo. La app solo lee la suya.
  - `consume_ai_request`: 20 lecturas al día en Gratis, 60 con Pro.
  - `special_notices` + función `send-special-notice`: 8 avisos al mes, con
    filtro de lenguaje; llegan a quien guardó el lugar y activó Promociones y
    se ven 24 horas en la ficha.
  - `negocios.featured_dish`: solo se puede fijar con Pro; la ficha lo marca
    como «Recomendado» mientras el dueño tenga Pro (`patio_highlights`).
  - `business_peak_times`: guardados y «me gusta» de 90 días por día y hora.
- Función `revenuecat-webhook` (sin JWT, encabezado secreto): compras,
  renovaciones y vencimientos actualizan `business_plans`. Conserva los meses
  de Fundador si duran más que la compra.
- Pantalla: Pro se ofrece solo con el cobro encendido. Con Pro activo
  (Fundador) se muestra como «Tu plan» con su fecha de vencimiento.

## Dar Pro a un Fundador

En el editor SQL de Supabase, con el correo de su cuenta:

```sql
insert into public.business_plans (user_id, plan, source, expires_at)
select id, 'pro', 'founder', now() + interval '6 months' from auth.users where email = 'correo@negocio.com'
on conflict (user_id) do update set source = 'founder', expires_at = excluded.expires_at, updated_at = now();
```

## Falta antes de habilitar cobros

1. Aplicar la migración y desplegar funciones:
   `npx supabase db push --yes` y
   `npx supabase functions deploy send-special-notice revenuecat-webhook`.
2. Crear/conectar RevenueCat a App Store Connect y Google Play para
   `com.parcomx.patio`, con productos y precios reales en México.
   Entitlement y offering `patio_pro` con `$rc_monthly` y `$rc_annual`.
3. Webhook en RevenueCat → `https://<proyecto>.supabase.co/functions/v1/revenuecat-webhook`
   con un encabezado Authorization secreto; el mismo valor en
   `npx supabase secrets set REVENUECAT_WEBHOOK_AUTH=...`.
4. Publicar HTTPS de aviso y condiciones. Variables públicas de build:
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`,
   `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL`.
5. Nuevo build nativo, compras sandbox, restauración, cambio de cuenta,
   cancelación/vencimiento y cupos comprobados desde servidor.
6. Solo después: `EXPO_PUBLIC_PAID_PLANS_ENABLED=true`.

Documentación oficial: https://www.revenuecat.com/docs/getting-started/installation/expo
