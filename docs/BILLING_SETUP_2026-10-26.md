# Planes y compras — 2026-10-26

Catálogo aprobado en `lib/plans.ts`, pantalla en `app/plan.tsx`.

| Plan | Mensual MXN | Anual MXN | Cupo propuesto |
|---|---:|---:|---|
| Foodie | 0 | 0 | Explorar, guardar, listas y reseñas |
| Creador | 199 | 1,990 | Listas destacadas, estadísticas, sello e invitación |
| Negocio Gratis | 0 | 0 | 10 lecturas con foto/mes; captura manual sin límite |
| Negocio Pro | 99 | 990 | 60 lecturas y 8 avisos especiales/mes |

Fundadores: primeros 100 negocios por colonia, invitación, 6 meses Pro;
sello numerado ganado al publicar 4 semanas.

## Implementado

- SDK `react-native-purchases` 9.15.3 instalado, carga diferida para conservar
  la apertura del cliente DEV actual, que no tiene este módulo nativo.
- Configuración por plataforma; identidad RevenueCat = UUID autenticado de Supabase.
- Ofertas `patio_pro` y `patio_creator`; paquetes mensual/anual; precio de la tienda
  cuando existe oferta. Sin oferta se muestra el precio propuesto y «Próximamente».
- Compra y restauración comprueban el entitlement correspondiente. Producto ajeno
  a la oferta y cuenta cambiada durante la compra se rechazan.
- Sin cambios locales para simular acceso Pro; ningún cobro habilitado.

## Falta antes de habilitar cobros

1. Crear/conectar RevenueCat a App Store Connect y Google Play para
   `com.parcomx.patio`. Configurar productos y precios reales en México.
2. Entitlements: `patio_pro`, `patio_creator`; offerings con esos mismos IDs.
   Cada offering contiene los paquetes estándar `$rc_monthly` y `$rc_annual`.
3. Implementar y ensayar la sincronización de entitlements en servidor, cuotas
   mensuales atómicas y beneficios reales. Hoy `consume_ai_request` sigue siendo
   un límite antiabuso de 20 lecturas/día; **no aplica los cupos comerciales**.
   El aviso diario gratuito de menú publicado no es un aviso especial Pro.
4. Publicar HTTPS de aviso y condiciones. Variables públicas de build:
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`,
   `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL`.
   Solo usar claves SDK públicas, nunca una clave secreta RevenueCat.
5. Nuevo build nativo, compras sandbox, restauración, cambio de cuenta,
   cancelación/vencimiento y comprobación de cuotas desde servidor.
6. Solo después: `EXPO_PUBLIC_PAID_PLANS_ENABLED=true`.

La bandera sigue ausente/apagada. La pantalla no permite comprar mientras
faltan esos requisitos. No confundir preparación del checkout con suscripciones
operativas ni con funciones premium terminadas.

Documentación oficial: https://www.revenuecat.com/docs/getting-started/installation/expo
