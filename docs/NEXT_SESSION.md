# Próxima sesión — empieza aquí

Primero leer [HEADS_UP](HEADS_UP_2026-10-12.md) y ejecutar pendientes en
[PENDING_LAUNCH](PENDING_LAUNCH_2026-10-12.md). El usuario hará QA física;
continuar con sus hallazgos concretos y conservar los cambios ya concluidos.

> **Estado vigente — 2026-10-12:** auditoría de diseño aplicada a tarjetas,
> iconos, pills, listas, formularios, tipografía, feedback y copy. Contrato:
> [DESIGN_SYSTEM](DESIGN_SYSTEM.md). Evidencia y checklist físico:
> [DESIGN_AUDIT_2026-10-10](DESIGN_AUDIT_2026-10-10.md).
> Ajuste de distribución con referencia Uber: precio a la derecha, tarjetas
> compactas, paneles sin sombra y margen inferior medido. Ver
> [UBER_LAYOUT_REFINEMENT](UBER_LAYOUT_REFINEMENT_2026-10-10.md).
> Tarjetas compactas concluidas (2026-10-12): nombre de una línea en lista
> y grid, columna fija para el sello, precio y metadata sin saltos por texto.
> Estrella única y «colonia · distancia» conservadas. Fuentes Uber Base/Material,
> ejemplos y medidas en [columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).
> Búsqueda: swipe devuelve la navegación y conserva término/pines; una
> sola salida, reapertura y callbacks de cierre protegidos. Ver
> [SEARCH_SWIPE_FIX](SEARCH_SWIPE_FIX_2026-10-10.md). Cierre nativo reportado
> en iPhone aún sin confirmar. El usuario hará QA física; diagnóstico de
> dispositivo y auditoría amplia/EAS detenidos por su petición.
> TypeScript y lint limpios; **177/177 tests**. Exportaciones nativas del
> corte previo completas; este ajuste se verificó localmente sin EAS.
> El backend ya fue promovido tras staging: no repetir migraciones ni pedir login.
> Pendientes vigentes: [checklist/roadmap](PENDING_LAUNCH_2026-10-12.md).
> Auditoría npm actualizada: 32 paquetes afectados (24 altos, 8 moderados,
> 0 críticos). Heads-up: [continuidad](HEADS_UP_2026-10-12.md).
> Los cortes anteriores siguientes son históricos; sus pendientes no sustituyen
> este estado. Checkpoint en rebuild/patio-final; no implica envío a tiendas.

> **Producción actualizada (2026-10-09):** siete migraciones aplicadas y registradas; cinco funciones ACTIVE con JWT. Datos existentes conservados; correos protegidos. Evidencia: [PRODUCTION_PROMOTION_2026-10-09.md](PRODUCTION_PROMOTION_2026-10-09.md). Lanzamiento aún pendiente de QA móvil y requisitos de distribución.

> **Staging preparado (2026-10-09):** patio-staging creado; siete migraciones
> y cinco funciones instaladas. **15 pruebas reales Auth/RLS/Storage/Edge**
> aprobadas; posteriormente promovidas a producción con autorización explícita. Ver
> [STAGING_REHEARSAL_2026-10-09.md](STAGING_REHEARSAL_2026-10-09.md).


> **Corte histórico — 2026-10-09:** lanzamiento solicitado para iPhone y Android.
> Homologación de bibliotecas implementada; 149 pruebas y 19 comprobaciones SQL
> aisladas aprobadas; exportaciones de ambas plataformas completas. Backend real,
> seguridad restante, configuración Android, QA visual y tiendas siguen abiertos.
> Checklist y contrato: [LAUNCH_CLOSEOUT_2026-10-09.md](LAUNCH_CLOSEOUT_2026-10-09.md).
> Los cortes anteriores se conservan como historial, no como estado de lanzamiento.


## Corte histórico — auditoría 2026-10-01

Trabajo parcial: cards y mover implementados; etapa 1 pendiente de inventario,
contrato, degradado de scroll y QA en iPhone físico. Etapas 2 y 3 sin cierre.
TypeScript, lint y 133 tests aprobados hoy. Release estricto falla por Maps y
Firebase Android; Supabase real y bloqueos de lanzamiento siguen sin certificar.
Siguiente: cerrar pendientes de etapa 1 y después continuar etapa 2.
Evidencia y límites: [PENDING_AUDIT_2026-10-01.md](PENDING_AUDIT_2026-10-01.md).
Los cortes históricos siguientes no sustituyen este estado.


## Continuación histórica — 2026-09-13

Primero corregir el menú compartido de **Mapa y Guardados**. La versión actual
usa un botón en cada pantalla, pero abre experiencias distintas y Alejandro
no la aprobó. Mantener una sola entrada y unificar el menú, sin volver a los
botones superiores Menú hoy/Abiertos. Checklist y evidencia en el primer corte
de [HANDOFF](HANDOFF.md). Validar después en iPhone físico, sin simulador.
El último cierre fue documental: esta corrección de código sigue pendiente.

## Pendientes de lanzamiento — corte 2026-09-11

Después del ajuste de menú, retomar auditoría de lanzamiento. Leer `CLAUDE.md`, el corte superior
de [HANDOFF](HANDOFF.md), [STATE](STATE.md) y la
[auditoría actual](APP_AUDIT_2026-09-10.md). El worktree contiene las
correcciones locales de esta auditoría; conservarlas.

El siguiente trabajo es resolver las dependencias pendientes, autenticar el
CLI de Supabase para inventariar y restaurar el esquema en un entorno de
ensayo, comprobar aislamiento/cascadas, configurar Maps/Firebase/firma Android
y cerrar privacidad/moderación. Después, completar los recorridos de
[tiendas](STORE_RELEASE_READINESS.md) en iPhone y Android reales.

Validación local: `npm run check` y `npm run check:release:strict`. El segundo
seguirá fallando mientras falte configuración externa. Mantener también
`npm audit --audit-level=high` como control bloqueante. Las cifras, evidencia
y límites actuales están en la auditoría; el smoke de
[Maestro](../maestro/README.md) sólo cubre navegación pública.

Conservar el P0 de propiedad neutral de infraestructura. No se autorizó borrar
proyectos ni enviar builds a tiendas. Los estados de julio siguientes se
conservan como historial y no describen el código, despliegue ni QA actuales.

## Corte histórico — 2026-07-19

> Última actualización: 2026-07-19 — onboarding panorámico guardado y publicado.

> Handoff principal para Claude: leer primero `docs/HANDOFF.md`, sección
> **EMPIEZA AQUÍ — corte exacto 2026-07-19 · guardado remoto**.

## Dónde estamos

Patio es un MVP funcional con controllers separados. La rama `rebuild/patio-final`
está limpia y sincronizada con GitHub; incluye el baseline funcional `d0a5e8d` y
el commit posterior de cierre/reinicio. La introducción visual ahora termina en una
puerta por intención: explorar lleva a avisos opcionales y al mapa; publicar lleva
al correo, alta de nombre/ubicación/horarios/pagos, celebración y primer menú.
Figma Make quedó únicamente como referencia histórica.

## Qué hacer al continuar

1. Leer la sección superior de `docs/HANDOFF.md`.
2. Levantar Metro con `npx expo start --dev-client --host lan` y hacer el recorrido
   panorámico indicado en la sección superior del handoff.
3. Rotar la clave Anthropic que antes estuvo expuesta como variable pública.
4. Ejecutar `supabase login`, desplegar `supabase/functions/read-menu` y cargar la
   nueva `ANTHROPIC_API_KEY` como secreto.
5. Hacer barrido humano en iPhone de magic link, cámara, GPS, share, push y mapas.
6. Corregir solo hallazgos reproducibles y decidir después si se distribuye build.

## Baseline verificado

- `npm run typecheck`: verde.
- `npm run lint`: verde.
- Git: local y `origin/rebuild/patio-final` coinciden; `d0a5e8d` es el baseline
  funcional anterior al commit documental de cierre.
- GitHub CLI: autenticado como `patioquehayhoy` en el llavero de macOS.
- `npx expo install --check`: verde.
- Exports iOS y Android: verdes.
- Maestro: detalle y publicación E2E verdes; evidencia en `maestro/screenshots/`.
- `lib/vision.ts` ya no ejecuta Anthropic desde el cliente.
- `npm run typecheck` y `npm run lint` volvieron a pasar el 2026-07-16.
- Los bordes punteados incompatibles fueron retirados; el warning queda listo para
  confirmación en simulador/device.
- La antigua variable pública fue eliminada del `.env` local.

## Reglas no negociables

- No modificar ni parafrasear `Saaaaaaabes.`.
- No usar “Foodie” o “Fondero” en copy visible.
- No convertir Patio en delivery, reservas, pedidos o marketplace.
- No lanzar EAS build sin confirmación.
- No sustituir comportamiento real por una maqueta web.
- Validar con TypeScript y lint antes de cerrar cada ciclo.

## QA externo todavía necesario

- Magic link y deep link real.
- Cámara/galería.
- Lectura IA con fotografías reales.
- GPS.
- Poster/share.
- Push y apertura de mapas.
