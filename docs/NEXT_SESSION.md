# Próxima sesión — empieza aquí

## Continuación vigente — 2026-09-13

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
