# Planes y compras — 2026-10-26 (actualizado 2026-11-07)

## Cobro directo — vigente desde 2026-11-07

RevenueCat se retiró. La app compra con `expo-iap` (StoreKit 2 / Play
Billing) y el servidor confirma con Apple y Google. Decisión y explicación en
[DECISIONES_2026-11-07](DECISIONES_2026-11-07.md) §1.

| Pieza | Dónde |
|---|---|
| Cliente | `lib/billing.ts` (apagado salvo `EXPO_PUBLIC_PAID_PLANS_ENABLED=true` y URLs legales) |
| Productos | `patio_pro_mensual`, `patio_pro_anual` — mismos IDs en ambas tiendas |
| Verificación | función `verify-purchase` (con sesión) |
| Renovación, cancelación, reembolso | función `store-notifications` (sin JWT) |
| Registro de compras | `store_purchases` (`20261107120000_store_purchases.sql`) |
| Plan vigente | `business_plans` (la app solo lee esto) |

### Lo que hace Parco (en este orden)

1. **App Store Connect → Business:** firmar el Paid Apps Agreement y llenar
   banco y datos fiscales. Inscribirse al Small Business Program (15 %).
2. **Play Console → Configuración → Perfil de pagos:** completarlo.
3. Cuando los planes estén definidos (día de planes): crear los productos con
   los IDs de arriba. Apple: grupo «Patio Pro» + oferta de introducción de 30
   días gratis. Google: suscripción con plan base mensual + oferta de prueba.
4. **App Store Connect → Users and Access → Integrations → In-App Purchase:**
   generar una llave. Guardar Key ID, Issuer ID y el `.p8`.
5. **Google Cloud (proyecto `patio-eas`):** cuenta de servicio con acceso a
   Play Console (permiso «Ver datos financieros y administrar pedidos y
   suscripciones») y su JSON.
6. **Pub/Sub:** tema `play-rtdn`, suscripción push a
   `https://<proyecto>.supabase.co/functions/v1/store-notifications?token=<STORE_NOTIFICATIONS_TOKEN>`;
   ponerlo en Play Console → Monetización → Notificaciones en tiempo real.
7. **App Store Connect → App → App Store Server Notifications V2:** la misma
   URL, sin token (Apple firma y el servidor re-consulta).

### Secretos de Supabase

`APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY`,
`APPLE_BUNDLE_ID`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`,
`GOOGLE_PLAY_PACKAGE=com.parcomx.patio`, `STORE_NOTIFICATIONS_TOKEN`.

### Para encender

`npx supabase db push` (tabla `store_purchases`) → `npx supabase functions
deploy verify-purchase store-notifications --use-api` → borrar la función
`revenuecat-webhook` del panel → probar en sandbox → en EAS production
`EXPO_PUBLIC_PAID_PLANS_ENABLED=true` y URLs de privacidad y términos.

---

## Histórico (RevenueCat, retirado)

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

## Decisión de Parco (2026-11-03): sin intermediarios

Nada de software de cobro de terceros. Dentro de la app el cobro es el de
Apple (StoreKit) y Google Play Billing, como lo exigen sus tiendas para
funciones digitales; se conectan directo (p. ej. `react-native-iap`, código
abierto) y la validación de recibos vive en una función propia de Supabase.
RevenueCat se retira al encender el cobro. Los Fundadores reciben Pro a mano.

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
