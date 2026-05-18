# TASKS — Cola de trabajo para agentes

> Última actualización: 2026-05-17.
> Estado: `[ ]` pendiente | `[x]` hecho | `[~]` en progreso.

## CICLO ACTUAL — QA + Claude Design handoff

### Bloqueado por acción humana

- [ ] **Pasar screenshots reales a Claude Design** en orden de flujo.
  - Usar `assets/screenshots/` + `docs/design/SCREENSHOT_INDEX.md` como fuente vigente.
  - No usar paquetes bajo `docs/design/screenshots/` hasta que existan físicamente en el worktree.
  - Si una captura muestra grid DEV, marcarla como estado dev y pedir mockup limpio.
- [ ] **Pasar flujo escrito en 2 líneas**:
  - Foodie: abre app -> Explorar comida -> mapa/radar -> buscar o tocar pin -> sheet -> ficha fondita -> guardar/compartir/como llegar.
  - Fondero: abre app -> Publicar mi menú -> login -> perfil -> menú -> crear por foto/imagen/plantilla/manual -> preview -> compartir.
- [ ] **Pasar definición de Fondero**:
  - Dueño, encargado, cocinera/cocinero u operador de una fondita/negocio local que publica qué hay hoy.
  - No es influencer, reviewer ni curador.
- [ ] **Pasar referencias de spinner/radar**:
  - Linear / Tesla / Apple system activity / tech glow silencioso.
  - Evitar loader genérico o dots juguetones.

### QA humano / dispositivo

- [ ] Verificar build iOS en dispositivo real: flujo Fondero -> Foodie completo.
- [ ] Probar magic link Fondero; si falla, capturar texto de diagnóstico visible en `/login-callback`.
- [ ] Probar permisos reales de cámara/galería.
- [ ] Probar GPS real en `perfil.tsx` con "Marcar en el mapa".
- [ ] Registrar UDID de iPhone para builds internos si aplica.
- [ ] Configurar API key Google Maps restringida antes de builds Android reales.

### Puede hacer agente antes de mockups

- [ ] Auditar `app/explorar.tsx` contra `docs/design/VISUAL_SYSTEM.md`.
- [ ] Auditar `app/patio/[id].tsx` contra `docs/design/VISUAL_SYSTEM.md`.
- [ ] Reconciliar paleta documentada:
  - Código actual: `lib/colors.ts` usa `#F2612F` light / `#FF6A3D` dark.
  - `VISUAL_SYSTEM.md`: propone `#F5C842` como warm accent de mapa/horarios.
  - Decidir si `#F5C842` entra como token nuevo o si se conserva el naranja actual.
- [ ] Investigar si Supabase Dashboard tiene `patio://login-callback` en Redirect URLs si magic link falla.

## POST-CLAUDE-DESIGN

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
