# TASKS — Cola de trabajo para agentes

> Formato: cada tarea tiene estado [ ] pendiente | [x] done | [~] en progreso
> El agente toma la primera tarea pendiente, la ejecuta, valida con `npx tsc --noEmit`, y marca done.
> Agregar nuevas tareas al final de la sección correspondiente.

---

## CICLO ACTUAL

### Limpieza y depuración
- [x] Eliminar componentes Expo boilerplate sin uso (hello-wave, parallax-scroll, themed-text, themed-view, external-link, loading-indicator, collapsible)
- [x] Migrar share.tsx de ThemedText/ThemedView a Text/View + useTheme
- [ ] Auditar navigation-state.ts — verificar si `setUserNavigatedFromLogin` se usa en algún flujo real o es código muerto
- [ ] Revisar lib/colors.ts — verificar si Colors se usa o si todo ya va por Theme
- [ ] Revisar haptic-tab.tsx — confirmar si se usa en bottom-tab-bar o es residual

### Rediseño (pendiente brief del usuario)
- [ ] [BLOQUEADO — esperando brief de rediseño de Alejandro]

---

## BACKLOG

- [ ] favoritos.tsx — agregar soporte para eliminar favorito (swipe o long press)
- [ ] explorar.tsx — pill de filtro por colonia/zona
- [ ] patio/[id].tsx — botón de compartir ficha
- [ ] perfil.tsx — validar que lat/lng se guarda correctamente en dispositivo real

---

## REFERENCIAS VISUALES (para versiones futuras)

### REF-001 — interfaz-swipe (v03/v04)
Grid de platillos con foto grande, nombre, fondita y precio. Categorías horizontales arriba (pills con emoji). Bottom tab bar con pill activo. Estética: blanco, bordes suaves, tipografía bold negra.
- **Cuándo ejecutar**: cuando haya fotos reales de platillos en Supabase y suficientes fonditas activas
- **Componente clave**: skeleton/shimmer loading para imágenes (estilo ChatGPT image load) — ver `components/agent-spinner.tsx` como base o implementar nuevo con `Animated` + interpolate opacity 0.3↔1

### REF-003 — agente de antojo con lenguaje natural (v05+)
Orbe animado central (blur + color vivo, pulsa cuando escucha). Input "Ask anything" abajo. El usuario describe en lenguaje libre: "algo salado, no tan picoso, saludable" → el agente cruza con perfil de usuario + fonditas cercanas + menús del día → devuelve sugerencia concreta con fondita y platillo.
- **Stack**: Claude API (Anthropic SDK) como backend, streaming de respuesta, función `searchLiveMenus()` como tool call
- **Cuándo ejecutar**: cuando haya masa crítica de fonditas reales con menús y fotos. Requiere ANTHROPIC_API_KEY en el servidor (no en cliente)
- **Componente clave**: orbe animado con `Animated` + `BlurView` radial, similar a agent-spinner pero como hero element

### REF-002 — modo antojo / tinder-food (v03)
Swipe left/right sobre platillos de fonditas cercanas. Right = me late, Left = no hoy. Al acumular 2-3 rights → sugerir la fondita. Vive dentro de explorar.tsx o pantalla propia.
- **Cuándo ejecutar**: cuando REF-001 esté implementado (necesita fotos)

---

## REGLAS PARA EL AGENTE

1. **Mínimo viable** — una tarea a la vez, sin refactor extra
2. **Validar** — `npx tsc --noEmit` debe pasar antes de marcar done
3. **Reportar** — escribir en `docs/AGENT_STATUS.md` al terminar cada ciclo
4. **No tocar** — bloque de precio en menu.tsx, tagline "Saaaaaaabes.", paleta de colores
5. **Leer primero** — `CLAUDE.md`, `docs/GOAL.md`, `docs/PATIO_DESIGN_PRINCIPLES.md` antes de cualquier cambio de UI
