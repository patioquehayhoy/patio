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

## REGLAS PARA EL AGENTE

1. **Mínimo viable** — una tarea a la vez, sin refactor extra
2. **Validar** — `npx tsc --noEmit` debe pasar antes de marcar done
3. **Reportar** — escribir en `docs/AGENT_STATUS.md` al terminar cada ciclo
4. **No tocar** — bloque de precio en menu.tsx, tagline "Saaaaaaabes.", paleta de colores
5. **Leer primero** — `CLAUDE.md`, `docs/GOAL.md`, `docs/PATIO_DESIGN_PRINCIPLES.md` antes de cualquier cambio de UI
