# TASKS — Cola de trabajo para agentes

> Última actualización: 2026-06-03.
> Estado: `[ ]` pendiente | `[x]` hecho | `[~]` en progreso.

## REDISEÑO EDITORIAL — listo, espera aterrizaje visual

- [x] **Dirección editorial completa** producida en `docs/design/EDITORIAL_REDESIGN.md` (Ciclo 2). Naranja=marca confirmado; flujo NO tocado.
- [x] **Paleta confirmada por producto:** se conserva la paleta actual de la app (`lib/colors.ts`) sin introducir amarillo ni un segundo acento cálido.
- [x] Brief de rediseño Figma creado en `docs/design/FIGMA_REDESIGN_BRIEF.md`.
- [x] Blueprint previo a Figma creado en `docs/design/REDESIGN_BLUEPRINT_V1.md`.
- [x] Registro de versiones creado en `docs/design/DESIGN_VERSION_REGISTRY.md` (`Patio Vivo`, `Patio Tahoe`, `Patio Agent`).
- [ ] Aterrizar bases de diseño en Figma: tokens, componentes, jerarquía, glass, corners Tahoe-style y mockups clave.


## CICLO ACTUAL — QA + Claude Design handoff

### Bloqueado por acción humana

- [x] ~~Pasar screenshots/flujo/definición/refs a Claude Design~~ — **resuelto in-session** (Ciclo 2). El rediseño editorial se hizo aquí leyendo los screenshots reales directamente. Ver `docs/design/EDITORIAL_REDESIGN.md`. Ya no hay cuello de botella de "sesión externa".
- [x] ~~Handoff de diseño a herramienta externa~~ — **resuelto vía Figma Make** (Ciclo 4). Diseño completo exportado a `design-source/figma-make/v01/`, aislado del build. Sistema de versiones en `design-source/README.md` + `VERSIONS.md`.
- [~] **Cerrar el diseño en Figma Make** (en progreso, Alejandro). Sigue iterando visual + estructura + copy. La traducción a React Native NO inicia hasta que el diseño quede cerrado.

### QA humano / dispositivo

- [ ] Verificar build iOS en dispositivo real: flujo Fondero -> Foodie completo.
- [ ] Probar magic link Fondero; si falla, capturar texto de diagnóstico visible en `/login-callback`.
- [ ] Probar permisos reales de cámara/galería.
- [ ] Probar GPS real en `perfil.tsx` con "Marcar en el mapa".
- [ ] Registrar UDID de iPhone para builds internos si aplica.
- [ ] Configurar API key Google Maps restringida antes de builds Android reales.

### Puede hacer agente antes de mockups

- [x] Auditoría visual humana realizada: la app está funcional, pero no satisface la dirección premium/minimalista buscada.
- [ ] Preparar sistema visual homologado para rediseño: paleta actual, typography 900/300, glass, spacing, Tahoe-style corners, componentes reutilizables.
- [ ] Investigar si Supabase Dashboard tiene `patio://login-callback` en Redirect URLs si magic link falla.

## POST-SISTEMA VISUAL / FIGMA

> Fuente de diseño: `design-source/figma-make/v01/` (export de Figma Make, web — traducir a `.tsx`).
> **No iniciar hasta que el diseño esté cerrado** (ver tarea "Cerrar el diseño en Figma Make").

Implementar mockups pantalla por pantalla. Orden recomendado:

1. [ ] `app/explorar.tsx` — radar/spinner, top bar, pins, bottom sheet, search-first map.
2. [ ] `app/patio/[id].tsx` — ficha de fondita, menú real, trust signals, acciones.
3. [ ] `app/index.tsx` — entrada limpia sin grid DEV.
4. [ ] `app/foto-menu.tsx` — captura premium y estado de procesamiento.
5. [ ] `app/menu.tsx` — editor con respiro sin tocar bloque de precio.
6. [ ] `app/preview.tsx` / `app/share.tsx` — revisar si `share` sigue siendo ruta necesaria.
7. [ ] `app/cuenta.tsx` / `app/perfil.tsx` — settings con personalidad y baja fricción.

## FEATURES FUTURAS

- [ ] Ruta dentro del mapa en vez de abrir Apple/Google Maps.
- [ ] Zoom-out automático cuando una búsqueda tiene matches dispersos.
- [ ] AGENTE_VOZ MVP texto con búsqueda live de menús.
- [ ] Favoritos: swipe to delete o long press.
- [ ] Explorar: filtro por colonia/zona.
- [ ] Onboarding: enganchar como first-launch real o dejarlo solo dev/beta.
- [ ] Notificaciones push: "hoy hay mole en tu fondita guardada".
- [ ] Estrategia de geoceldas H3/geohash/S2 antes de tracking fino.

## REGISTRO DE BUILDS

| Build | Fecha | Highlights |
|---|---|---|
| 1.0.0 (42) | 2026-05-16 | Primer submit, error duplicate build number |
| 1.0.0 (43) | 2026-05-16 | Role-picker, blur Halo, mic placeholder, foto-menu Fondero |
| 1.0.0 (44) | 2026-05-16 | Cleanup, botones zombi arreglados, cerrar sesión real, email oficial |
| 1.0.0 (45) | 2026-05-17 | Blur baja al filtrar, sheet sobre teclado, dev nav completa, cuenta simplificada, diag magic link |

## REFERENCIAS VISUALES

Las referencias aspiracionales viven en `docs/design/references/`.

- `GRID_PLATILLOS`: futuro, cuando haya fotos reales de platillos.
- `DASHBOARD_FONDERO`: futuro, métricas y dark tech para Fondero.
- `FICHA_EDITORIAL`: futuro, ficha de fondita más editorial cuando haya fotos reales.
- `REDES_LANZAMIENTO`: assets de marketing/lanzamiento.
- `GLASS_ORGANICO`: sistema transversal de texturas/marca.
- `AGENTE_VOZ`: futuro, input natural/orbe cuando haya masa crítica.
- `TINDER_PLATILLO`: futuro, necesita fotos y densidad de platillos.

## REGLAS PARA AGENTES

1. Una tarea a la vez, sin refactor extra.
2. Validar con `npx tsc --noEmit` antes de cerrar cambios de código.
3. No tocar el bloque de precio en `menu.tsx`.
4. No modificar ni parafrasear `"Saaaaaaabes."`.
5. Leer primero `CLAUDE.md`, `docs/GOAL.md`, `docs/STATE.md`, `docs/design/PRODUCT_PRINCIPLES.md` y `docs/design/FLOW_V2.md`.
