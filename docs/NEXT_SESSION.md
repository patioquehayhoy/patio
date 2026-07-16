# Próxima sesión — empieza aquí

> Última actualización: 2026-07-16 — limpieza autónoma comprobada.

> Handoff principal para Claude: leer primero `docs/HANDOFF.md`, sección
> **CLAUDE: EMPIEZA AQUÍ — corte exacto 2026-07-16**.

## Dónde estamos

Patio es un MVP funcional con controllers separados. La rama `rebuild/patio-final`
contiene la estabilización; Figma Make quedó únicamente como referencia histórica.
Los recorridos esenciales ya pasaron en simulador, incluido publicar y compartir.

## Qué hacer al continuar

1. Leer la sección superior de `docs/HANDOFF.md`.
2. Rotar la clave Anthropic que antes estuvo expuesta como variable pública.
3. Ejecutar `supabase login`, desplegar `supabase/functions/read-menu` y cargar la
   nueva `ANTHROPIC_API_KEY` como secreto.
4. Hacer barrido humano en iPhone de magic link, cámara, GPS, share, push y mapas.
5. Corregir solo hallazgos reproducibles y decidir después si se distribuye build.

## Baseline verificado

- `npm run typecheck`: verde.
- `npm run lint`: verde.
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
