# PATIO — Sistema de Diseño v02.5

> Documento vivo. El agente lo lee antes de cualquier cambio visual.
> Última actualización: 2026-05-16

---

## Filosofía visual

**Lo cotidiano elevado.** Patio muestra fonditas de barrio con la misma dignidad que un restaurante de autor. El diseño no grita — insinúa. Orgánico por dentro, sofisticado por fuera.

Metáfora central: **una planta del mercado vista a través de vidrio esmerilado** — lo local, rugoso y real, filtrado por algo cuidado y contemporáneo.

---

## Paleta

| Token       | Hex / rgba                    | Uso                                      |
|-------------|-------------------------------|------------------------------------------|
| BG          | `#EFEFEF`                     | Fondo principal                          |
| BLACK       | `#292929`                     | Texto principal, botones primarios       |
| WHITE       | `#FFFFFF`                     | Superficie, cards, inputs                |
| BLACK60     | `rgba(41,41,41,0.5)`          | Texto secundario, placeholders           |
| ACCENT      | Naranja/tierra (del tema)     | CTAs, dots pulsantes, estrella activa    |

### Paleta orgánica — assets y redes (Higgsfield)
Extraída de GLASS_ORGANICO (glass botánico):
- Olive `#6B7255` — fondos de escenas exteriores
- Taupe `#C4AFA0` — superficies neutras, crema
- Lavender `#B8C4D4` — overlay de transiciones, agente
- Rose-burgundy `#8B3A52` — acento cálido, plantas de mercado

---

## Tipografía

- **Títulos ≥20pt**: SF Pro Display
- **Cuerpo ≤19pt**: SF Pro Text
- **Pesos permitidos**: `'900'` (énfasis) y `'300'` (cuerpo) únicamente
  - Excepción documentada: `'500'` en nombres de platillo en preview, `'700'` en botón WhatsApp
- **Contraste 900 vs 300** es el mecanismo principal de jerarquía — no usar pesos intermedios

### Jerarquía
| Rol              | fontSize | fontWeight | Notas                        |
|------------------|----------|------------|------------------------------|
| Título pantalla  | 32       | 900        | letterSpacing -0.5           |
| Nombre fondita   | 22-24    | 900        | Fonts.brand (Plus Jakarta)   |
| Label sección    | 11       | 900        | UPPERCASE, letterSpacing 1.8 |
| Cuerpo           | 15       | 300        |                              |
| Metadata         | 13       | 300        | opacity 0.6                  |
| Precio           | 22       | 900        |                              |

---

## Superficies y glass

### BlurView (expo-blur)
Todos los paneles flotantes, sheets y overlays usan BlurView — nunca fondo sólido.

| Contexto              | intensity claro | intensity oscuro | tint    |
|-----------------------|-----------------|------------------|---------|
| Top bar / botones     | 20              | 16               | light/dark |
| Sheet principal       | 22              | 16               | light/dark |
| Buscador centrado     | 24              | 20               | light/dark |
| Mapa blur (idle)      | 40              | 38               | light/dark |
| Hint sheets           | 22              | 16               | light/dark |

### Texturas glass (GLASS_ORGANICO) — para assets Higgsfield, no en UI nativa
1. **Frosted / sand-blasted** — objeto emergiendo de superficie arenada. Aplica en hero de redes.
2. **Fluted / estriado** — líneas verticales que distorsionan. Aplica en separadores editoriales.
3. **Refractive** — distorsión en ondas. Aplica en loading del agente (v05+).

---

## Espaciado y geometría

- Múltiplos de 8px: `8 | 16 | 24 | 32 | 40 | 48`
- `gap` entre elementos: `4` (compacto) o `8` (normal)
- `borderRadius` por tipo:
  | Elemento                    | borderRadius |
  |-----------------------------|--------------|
  | Botones y cápsulas          | 14           |
  | Sheets y panels grandes     | 28-32        |
  | Botones flotantes cuadrados | 16           |
  | Pills y estado              | 100          |
  | Cards de contenido          | 20           |
- Separadores: `StyleSheet.hairlineWidth` siempre — nunca `height: 1`

---

## Componentes clave

### Botones
- **Primario**: `borderRadius 14`, bg `#292929`, texto blanco, `fontWeight '900'`
- **Contorno**: `borderWidth 1.5`, `borderColor BLACK`, fondo transparente

### Gradientes (LinearGradient)
- Velo sobre mapa: `rgba(0,0,0,0)` → `rgba(0,0,0,0.18)` bottom-to-top
- Hero/header: mismo color del bg ±6% luminosidad
- Nunca gradiente visible en cards ni inputs

### Separadores
- Color claro: `rgba(0,0,0,0.08)` | oscuro: `rgba(255,255,255,0.10)`
- `borderWidth 1` solo en botones primarios de contorno

---

## Estado idle de explorar (v02.5)

Tres capas al abrir la app por primera vez:
1. **Fondo**: mapa vivo con `BlurView intensity 40` (~74% blur)
2. **Medio**: radar de dots concéntricos (5 anillos, accent color) que pulsan desde el centro
3. **Frente**: buscador glass centrado `"¿Qué se te antoja?"`, sin botones de nav

Al interactuar: blur desaparece (opacity → 0), dots desaparecen, layout normal.

---

## Referencias visuales activas (ver docs/TASKS.md para detalle)

| Slug funcional        | Aplicación                                | Versión   | Estado     |
|-----------------------|-------------------------------------------|-----------|------------|
| `GRID_PLATILLOS`      | Grid de catálogo de platillos con foto    | v04       | Backlog    |
| `TINDER_PLATILLO`     | Swipe sí/no sobre platillos cercanos      | v03       | Backlog    |
| `AGENTE_VOZ`          | Orbe + lenguaje natural ("Serena style")  | v05+      | Backlog    |
| `DASHBOARD_FONDERO`   | Dark tech, métricas grandes (Momentum)    | v04+      | Backlog    |
| `FICHA_EDITORIAL`     | Ficha fondita estilo Hanbut (serif)       | v03+      | Backlog    |
| `REDES_LANZAMIENTO`   | Grid de posts Instagram, dos modos        | pre-launch | Pendiente |
| `GLASS_ORGANICO`      | Texturas glass + botánica CDMX (sistema)  | v02.5+    | Activo     |

---

## Ingredientes botánicos CDMX — para assets Higgsfield

Sujetos preferidos para fotos/videos de marca en estilo glass orgánico:
- Epazote, cebollita cambray, hoja santa, chile de árbol seco
- Nopales, flor de calabaza, hierba santa, tomate milpero
- Prompt base: `"[ingrediente] through frosted ribbed glass, muted [olive/taupe], hyperrealistic material, centered composition"`

---

## Reglas no negociables

1. `"Saaaaaaabes."` — tagline oficial, no modificar ni parafrasear
2. Fondero y Foodie son flujos separados — nunca contaminar uno con el otro
3. Bloque de precio en `menu.tsx` — NO tocar (estructura exacta documentada en CLAUDE.md)
4. Sin letterSpacing excepto en labels de sección (1.8) y títulos de pantalla (-0.5)
5. Sin colores hardcodeados — siempre via `makeStyles(t: Theme)`
