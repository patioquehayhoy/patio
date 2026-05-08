# Tarea de Diseño para Agente Remoto

> Este documento define la tarea completa que debe ejecutar un agente de diseño de Claude.
> El agente debe leer todos los docs referenciados antes de tocar código.

---

## Contexto del proyecto

Patio es una app de React Native / Expo (SDK 54, TypeScript) con dos lados:
- **Foodie**: descubrir dónde comer, explorar mapa, ver fichas de negocio, guardar favoritos
- **Fondero**: publicar menú del día, gestionar perfil de negocio

El stack visual usa:
- `expo-blur` para superficies glass (BlurView)
- `expo-linear-gradient` para velos sobre mapa
- `react-native-maps` para el mapa principal
- `makeStyles(t: Theme)` pattern en cada pantalla (recibe el tema, nunca hardcodea colores)
- `Fonts.brand` de `lib/theme.tsx` para la fuente de marca

---

## Documentos que DEBES leer antes de cualquier cambio

En este orden:
1. `docs/design/VISUAL_SYSTEM.md` — sistema visual completo: filosofía, glass, color, tipografía, geometría
2. `CLAUDE.md` — reglas de código y diseño no negociables
3. `docs/design/references/STYLE_INDEX.md` — análisis de las referencias visuales (qué extraer y dónde aplicar)
4. `docs/HANDOFF.md` — estado actual y decisiones recientes
5. `docs/STATE.md` — qué está hecho y qué está pendiente

---

## Tarea: Auditoría y mejora visual

### Objetivo
Auditar todas las pantallas del lado Foodie contra el VISUAL_SYSTEM.md y aplicar correcciones concretas. El resultado debe verse más cercano a las referencias REF-001 y REF-002 (minimalismo glass sobre mapa) sin romper la arquitectura de código existente.

### Pantallas a auditar (en orden de prioridad)

#### 1. `app/explorar.tsx` — ALTA prioridad
- Verificar que el bottom sheet usa BlurView (Capa 1: intensity 20 light / 16 dark)
- Verificar que los botones flotantes sobre el mapa usan BlurView (Capa 2: intensity 14 light / 10 dark)
- Verificar borde hairlineWidth en top del bottom sheet con color correcto de VISUAL_SYSTEM.md
- Verificar que el handle del bottom sheet tiene las medidas exactas (36×4, borderRadius 2, color opacity correcto)
- Verificar que los pins tienen el estilo correcto: neutro = dot 8–10pt, seleccionado = ring blanco + dot oscuro
- Verificar que el velo del mapa usa LinearGradient con valores correctos (rgba(0,0,0,0) → rgba(0,0,0,0.18))
- Si hay filtros/pills de categoría: deben seguir el spec de pill (borderRadius 100, hairlineWidth border)

#### 2. `app/patio/[id].tsx` — ALTA prioridad
- Verificar que el título del patio usa `Fonts.brand`
- Verificar que el rating de estrellas es interactivo (ya implementado — solo verificar que el estilo es correcto)
- Verificar jerarquía tipográfica: nombre (900 brand) → metadata horario/zona (300 sistema)
- El mapa inline debe tener height mínimo 180, pin consistente con explorar
- El botón "Cómo llegar" debe ser pill glass (Capa 2) no botón sólido
- Los separadores de sección deben ser StyleSheet.hairlineWidth, nunca height 1

#### 3. `app/index.tsx` — MEDIA prioridad
- Verificar que el tagline usa `Fonts.brand`
- Verificar que los botones de entrada (Busco comida / Tengo un negocio) siguen el spec de botón primario (borderRadius 14, fondo #292929)
- La pantalla de entrada debe sentirse limpia y editorial — no de marketing

#### 4. `app/buscar.tsx` — MEDIA prioridad
- Verificar que el input de búsqueda tiene borderRadius 14 y fondo t.surface
- Resultados deben mostrar nombre de platillo (900) + negocio y precio (300)
- Separadores hairlineWidth

#### 5. `app/favoritos.tsx` — BAJA prioridad
- Verificar empty state: centrado, icon + texto 300, sin botones innecesarios
- Items de lista: nombre (900) + zona/categoría (300), separadores hairlineWidth

---

## Reglas de código que DEBES seguir

1. Todos los estilos en `makeStyles(t: Theme)` — nunca hardcodear colores fuera de la paleta
2. Nunca usar `fontWeight: '400'`, `'500'` o `'600'` salvo las excepciones documentadas en CLAUDE.md
3. Nunca usar `height: 1` en separadores — siempre `StyleSheet.hairlineWidth`
4. Nunca `backgroundColor: 'white'` o `backgroundColor: 'black'` — usar `t.surface`, `t.bg`, `t.text`
5. BlurView import: `from 'expo-blur'`
6. LinearGradient import: `from 'expo-linear-gradient'`
7. `Fonts` import: `from '@/lib/theme'`

---

## Criterio de éxito

Al terminar:
- [ ] `npx tsc --noEmit` pasa en verde (cero errores de TypeScript)
- [ ] Cada pantalla auditada fue verificada contra el checklist de VISUAL_SYSTEM.md sección 9
- [ ] Ningún anti-patrón de la sección 10 de VISUAL_SYSTEM.md fue introducido
- [ ] Las correcciones son incrementales: no reescribir pantallas completas, solo corregir lo que no cumple
- [ ] Commit con mensaje descriptivo de qué se auditó y qué se corrigió

---

## Notas de operación

- El proyecto NO es Next.js ni web — es Expo React Native. Ignorar cualquier sugerencia de hooks de Vercel, "use client", o APIs web.
- La rama activa es `v2-menu-vivo`.
- Siempre hacer `npx tsc --noEmit` antes y después de cualquier cambio.
- Si algo en el código contradice el VISUAL_SYSTEM.md, el código está mal — corregirlo.
- Si algo en las referencias contradicen el VISUAL_SYSTEM.md, el VISUAL_SYSTEM.md tiene precedencia.
