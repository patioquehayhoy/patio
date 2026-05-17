# TASKS — Cola de trabajo para agentes

> Formato: cada tarea tiene estado [ ] pendiente | [x] done | [~] en progreso
> El agente toma la primera tarea pendiente, la ejecuta, valida con `npx tsc --noEmit`, y marca done.
> Agregar nuevas tareas al final de la sección correspondiente.

---

## CICLO ACTUAL — Rediseño visual con Claude Design

### Bloqueado por el usuario (acción humana)
- [ ] **Tomar 13 screenshots** de TestFlight build 1.0.0 (45) — uno por pantalla:
  - index (role-picker), explorar idle, explorar buscando, patio/[id], favoritos, cuenta
  - foto-menu, menu editor, preview, share, perfil, manifiesto, onboarding
- [ ] **Sesión Claude Design** en claude.ai web — pegar `docs/PATIO_PRD.md` + `docs/DESIGN_SYSTEM.md` + screenshots + imágenes de referencias aspiracionales (`GRID_PLATILLOS`, `TINDER_PLATILLO`, `AGENTE_VOZ`, `DASHBOARD_FONDERO`, `FICHA_EDITORIAL`, `REDES_LANZAMIENTO`, `GLASS_ORGANICO`)
- [ ] **Volver con mockups** de Claude Design para implementar pantalla por pantalla

### Mientras llega Claude Design (puede hacer agente)
- [ ] Verificar bug del magic link Supabase Fondero — necesita reproducción + screenshot del diag visible (ver `~/.claude/.../memory/supabase_magic_link.md`)
- [ ] Investigar si Supabase Dashboard tiene `patio://login-callback` en Redirect URLs

---

## POST-CLAUDE-DESIGN (siguiente ciclo)

### Implementar mockups pantalla por pantalla
Orden recomendado por valor:
1. [ ] **explorar.tsx** — radar dots → animación tech glow, top bar unificada, sheet limpio
2. [ ] **patio/[id].tsx** — ficha estilo `FICHA_EDITORIAL` con resumen + menú menos jerárquico + botones circulares
3. [ ] **foto-menu.tsx** — botón gigante más premium (no dashed genérico)
4. [ ] **menu.tsx** — editor con más respiro entre secciones/platillos
5. [ ] **cuenta.tsx + perfil.tsx** — settings con personalidad
6. [ ] **preview.tsx + share.tsx** — cartel exportable estilo editorial

### Features
- [ ] **Ruta dentro del mapa** (no bouncear a Apple Maps) — `react-native-maps-directions` + polyline
- [ ] **Zoom-out automático** del mapa al haber matches de búsqueda
- [ ] **AGENTE_VOZ MVP texto** — input texto + Claude API + búsqueda live de menús (sin voz aún)
  - Gating: cada 5 búsquedas → "prueba Pro" (ver `~/.claude/.../memory/monetization_strategy.md`)

---

## BACKLOG

- [ ] favoritos.tsx — swipe to delete o long press
- [ ] explorar.tsx — pill filtro por colonia/zona
- [ ] patio/[id].tsx — botón compartir ficha (ya existe handleShare, solo wirear visible)
- [ ] perfil.tsx — validar lat/lng en device real
- [ ] onboarding.tsx — enganchar como first-launch experience (hoy está huérfano)
- [ ] Notificaciones push — Expo Notifications, "hoy hay mole en tu fondita guardada"

---

## REGISTRO DE BUILDS

| Build | Fecha | Highlights |
|-------|-------|------------|
| 1.0.0 (42) | 2026-05-16 | Primer submit, error duplicate build number |
| 1.0.0 (43) | 2026-05-16 | Role-picker, blur Halo, mic placeholder, foto-menu Fondero |
| 1.0.0 (44) | 2026-05-16 | Cleanup, botones zombi arreglados, cerrar sesión real, email oficial |
| 1.0.0 (45) | 2026-05-17 | Blur baja al filtrar, sheet sobre teclado, dev nav completa, /cuenta simplificada, diag magic link |

---

## REFERENCIAS VISUALES (slugs funcionales para versiones futuras)

### `GRID_PLATILLOS` — grid de catálogo de platillos (v03/v04)
Grid de platillos con foto grande, nombre, fondita y precio. Categorías horizontales arriba (pills con emoji). Bottom tab bar con pill activo. Estética: blanco, bordes suaves, tipografía bold negra.
- **Cuándo ejecutar**: cuando haya fotos reales de platillos en Supabase y suficientes fonditas activas
- **Componente clave**: skeleton/shimmer loading para imágenes (estilo ChatGPT image load) — ver `components/agent-spinner.tsx` como base o implementar nuevo con `Animated` + interpolate opacity 0.3↔1

### `DASHBOARD_FONDERO` — Fondero dashboard dark tech (v04+)
Dashboard oscuro con acentos naranja/burnt orange. Cards de métricas con números grandes bold, grid de stats. Dark mode con superficies #1A1A1A y acento #E05C2A. Tipografía extrabold en títulos + light en subtítulos.
- **Aplica a**: pantalla Fondero — métricas (vistas del menú, clicks, fonditas activas)
- **Paleta a extraer**: burnt orange + negro profundo + crema para dark mode de Patio
- **Generación de assets**: Higgsfield + ChatGPT cuando haya foto de la fondita real
- **Cuándo ejecutar**: v04 — después de `GRID_PLATILLOS` (fotos) y masa crítica de fonditas

### `FICHA_EDITORIAL` — ficha de fondita estilo Hanbut (v03+)
Crema + rojo editorial, serif display gigante que sangra fuera del frame. Fotos de platillo con mucho aire, composición vertical. Menú con foto + nombre + precio como lista editorial.
- **Aplica a**: `patio/[id].tsx` ficha de fondita — cuando haya fotos reales de platillos
- **Tipografía**: serif display (equivalente a Playfair/Didot) para nombre de fondita en hero
- **Generación de assets**: Higgsfield para fotos de platillos estilo editorial con fondo neutro
- **Cuándo ejecutar**: v03 — a la par de `GRID_PLATILLOS`

### `REDES_LANZAMIENTO` — assets de redes sociales para lanzamiento
Estética: minimalista flat + tech. Poco color (negro, crema, un acento). Tipografía bold grande que ocupa todo el frame. Grid de 3 o 6 posts coherentes. Dos modos: oscuro (tech) y claro (editorial food).
- **Herramientas**: ChatGPT image gen + Higgsfield para variantes con foto/video
- **Cuándo producir**: antes del lanzamiento público — paralelo a v02.5/v03
- **Nota**: en conjunto con `DASHBOARD_FONDERO` (dark) + `FICHA_EDITORIAL` (editorial) forman el sistema visual completo de marca

### `GLASS_ORGANICO` — sistema visual transversal (activo desde v02.5)
Tres texturas de vidrio distintas que en conjunto definen el lenguaje de superficies de Patio:

**A) Frosted con grano** — objeto botánico emergiendo de superficie glass arenada. Verde oliva + rosa. Textura como sand-blasted, no digital. Aplica a: sheets, bottom bars, overlays sobre mapa.

**B) Vidrio estriado / fluted** — lineas verticales finas que distorsionan lo que hay detrás. Tono beige/taupe. Aplica a: separadores, fondos de cards especiales, transiciones entre pantallas.

**C) Refractive distortion** — objeto visto a través de vidrio que lo refracta en ondas/glitch. Azul lavanda. Aplica a: estados de loading, transición al abrir una ficha, animación del agente (`AGENTE_VOZ`).

**Paleta extraída**: olive `#6B7255`, taupe `#C4AFA0`, lavender `#B8C4D4`, rose-burgundy `#8B3A52`
**Principio unificador**: lo orgánico (natural, local, CDMX) visto a través de material sofisticado (glass) — metáfora de Patio: lo cotidiano elevado.
**Generación de assets**: Higgsfield con prompt "botanical [subject] through frosted ribbed glass, muted [color], hyperrealistic material"
**Cuándo aplicar**: desde v02.5 en BlurView (intensidad + grain overlay sutil) — completo en v03+

### `AGENTE_VOZ` — orbe + lenguaje natural tipo Serena (v05+)
Orbe animado central (blur + color vivo, pulsa cuando escucha). Input "Ask anything" abajo. El usuario describe en lenguaje libre: "algo salado, no tan picoso, saludable" → el agente cruza con perfil de usuario + fonditas cercanas + menús del día → devuelve sugerencia concreta con fondita y platillo.
- **Stack**: Claude API (Anthropic SDK) como backend, streaming de respuesta, función `searchLiveMenus()` como tool call
- **Cuándo ejecutar**: cuando haya masa crítica de fonditas reales con menús y fotos. Requiere ANTHROPIC_API_KEY en el servidor (no en cliente)
- **Componente clave**: orbe animado con `Animated` + `BlurView` radial, similar a agent-spinner pero como hero element

### `TINDER_PLATILLO` — swipe left/right sobre platillos cercanos (v03)
Swipe sobre platillos de fonditas cercanas. Right = me late, Left = no hoy. Al acumular 2-3 rights → sugerir la fondita. Vive dentro de `explorar.tsx` o pantalla propia.
- **Cuándo ejecutar**: cuando `GRID_PLATILLOS` esté implementado (necesita fotos)

---

## REGLAS PARA EL AGENTE

1. **Mínimo viable** — una tarea a la vez, sin refactor extra
2. **Validar** — `npx tsc --noEmit` debe pasar antes de marcar done
3. **Reportar** — escribir en `docs/AGENT_STATUS.md` al terminar cada ciclo
4. **No tocar** — bloque de precio en menu.tsx, tagline "Saaaaaaabes.", paleta de colores
5. **Leer primero** — `CLAUDE.md`, `docs/GOAL.md`, `docs/PATIO_DESIGN_PRINCIPLES.md` antes de cualquier cambio de UI
