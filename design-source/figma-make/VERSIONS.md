# Registro de versiones — Figma Make

> Cada fila es un snapshot congelado exportado desde Figma Make. No se sincronizan ni se
> mergean entre sí: cada `vNN/` es independiente. Ver `design-source/README.md` para el flujo.

| Versión | Fecha       | Estado          | Qué cambió / notas |
|---------|-------------|-----------------|--------------------|
| v01     | 2026-06-12  | base — congelado | Primer export completo. Sistema de diseño visual de Patio: pantallas Foodie + Fondero, modo claro/oscuro, tokens (`theme.css`), motion, brand moments, widgets iOS, imágenes hero de flores. Cada pantalla tenía su menú embebido (sin modelo de datos común). |
| v02     | 2026-06-14  | base — congelado | Ajustes centrados en el **menú**. **Aporta arquitectura de datos** (vale la pena): nuevo `src/app/data/menu.ts` (modelo `MenuOfDay` único para publicar/compartir/historial/foodie), `MenuCard.tsx` (renderer único: detalle/póster/miniatura), `MenuPoster.tsx` (tarjeta compartible WhatsApp/stories). Secciones cerradas incluyen `Tacos`, `Antojito`, `Especial del día` → soporta más que fondas. Datos separan `businessName`/`businessType`. **Modificó:** FoodieDetail (-74L, saca menú a MenuCard), FoodieDetailDark, FoodieMap, FonderoPublish (+155L), FonderoSuccess. **PENDIENTE (arreglar en código, no en Figma):** copy con "fondero/a" sigue presente ("Para fonderos", `variant="fondero"`) — viola identidad verbal. Ajuste visual fino del menú quedó inconcluso. |

## Intento v03 — no adoptado

El 2026-07-09 se intentó producir una Fase 1 nueva en Figma Make con Entrada,
Explorar, Detalle y Publicar. El resultado cubrió estados y creó componentes nuevos,
pero perdió la identidad visual de Patio y se sintió como una plantilla genérica.
No se importó como `v03/` y no es fuente de implementación. La estrategia activa es
cerrar Patio directamente en React Native sobre una línea separada.

## Comparación v01 → v02

- **Lo que mejoró en v02:** arquitectura de datos del menú (lo más difícil y útil para la app real). Modelo soporta tacos/antojitos, no solo fondas.
- **Lo que NO se resolvió:** copy "fondero/a" (mata-IA pendiente), pulido visual del menú.
- **Decisión (2026-06-14):** dejar de iterar en Figma (costoso/peores resultados). Cerrar el diseño AQUÍ. Tomar de v02 el modelo de datos `menu.ts` + MenuCard/MenuPoster como base; corregir copy en código contra `docs/design/foundations/IDENTITY_VERBAL.md`.

## Estado del diseño

- **Cerrado:** ❌ aún no — se cierra ahora en código (no más Figma Make para ajustes).
- **Base elegida:** v02 (arquitectura) + correcciones de copy aquí.
- **Traducción a React Native:** ⏸️ arranca al cerrar copy y validar pantallas clave.
