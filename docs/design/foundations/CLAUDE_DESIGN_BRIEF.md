# Brief para Claude Design (u otra exploración de rediseño)

> Este es el paquete que se pega en una sesión de Claude Design / cualquier exploración
> visual nueva. Todo aquí es **dominio + principios + referencias** — NO contiene la app
> actual como referencia. La app vigente puede ignorarse durante la exploración.

---

## 1. Qué es Patio (una frase)

App móvil mexicana que conecta a **fonditas de barrio** con **personas buscando dónde comer hoy**, elevando lo cotidiano sin perder su carácter local.

Tagline oficial (no modificable): **"Saaaaaaabes."**

---

## 2. Dos roles, dos JTBDs

### Foodie (busca comida)
- Quiere saber **qué hay hoy, cerca, y vale la pena**, con la mínima carga mental.
- No quiere comparar 12 menús. Quiere una sugerencia de confianza.
- Decide en segundos, no en minutos.

### Fondero (publica menú)
- Quiere **publicar su menú del día** sin fricción y sin saber de tecnología.
- Suele tener menú escrito a mano o en pizarrón — la app debe respetar eso.
- Su éxito es: más gente sabe lo que vendo hoy.

**Regla:** los dos flujos están **separados**. Un Foodie no debe ver ni entender el modo Fondero; un Fondero entra por una puerta discreta.

---

## 3. Filosofía de producto

- **No entregamos datos para que la gente decida** — entregamos la **siguiente acción ya resuelta**.
- **Decisión guiada > captura abierta.**
- **Progressive disclosure:** solo pedir más cuando es necesario.
- **IA como reducción de fricción**, no como adorno editorial.
- **Curaduría humana, simple, útil** — Patio no es un generador de contenido.

---

## 4. Identidad visual — "Lo cotidiano elevado"

Metáfora central: **una planta del mercado vista a través de vidrio esmerilado.** Lo local, rugoso y real, filtrado por algo cuidado y contemporáneo.

- **Orgánico por dentro, sofisticado por fuera.**
- Tono: humano, local, editorial — nunca genérico ni de marketing.
- Densidad tipográfica tipo Apple Music (jerarquía por contraste, no por color).
- Glass / blur / botánica CDMX como lenguaje visual.

---

## 5. Los 12 principios fundacionales

Apégate a [ESSENTIAL_DESIGN_PRINCIPLES.md](ESSENTIAL_DESIGN_PRINCIPLES.md) (WWDC17 Mike Stern):

1. Wayfinding
2. Feedback
3. Visibility
4. Consistency
5. Mental Model
6. Proximity
7. Grouping
8. Mapping
9. Affordance
10. Progressive Disclosure
11. 80/20 Rule
12. Symmetry

Y la premisa: **diseñamos para humanos, no usuarios** — que necesitan sentirse seguros, entender, lograr y experimentar belleza.

---

## 6. Referencias visuales aspiracionales (slugs)

| Slug                 | Aplicación esperada                                |
|----------------------|----------------------------------------------------|
| `GLASS_ORGANICO`     | Sistema transversal — glass + botánica CDMX        |
| `FICHA_EDITORIAL`    | Ficha de fondita estilo Hanbut (serif, crema/rojo) |
| `GRID_PLATILLOS`     | Catálogo visual de platillos                       |
| `TINDER_PLATILLO`    | Swipe sí/no sobre platillos cercanos               |
| `DASHBOARD_FONDERO`  | Dashboard oscuro tech (métricas grandes)           |
| `AGENTE_VOZ`         | Orbe + lenguaje natural ("Serena style")           |
| `REDES_LANZAMIENTO`  | Posts de Instagram, dos modos visuales             |

Detalle de cada slug en [`../../TASKS.md`](../../TASKS.md) sección "REFERENCIAS VISUALES".

---

## 7. Pantallas a rediseñar (orden por valor)

1. **explorar.tsx** — descubrimiento Foodie (mapa + búsqueda + sheet)
2. **patio/[id].tsx** — ficha de fondita (estilo `FICHA_EDITORIAL`)
3. **foto-menu.tsx** — captura de menú por foto (gran botón premium)
4. **menu.tsx** — editor de menú (más respiro entre secciones)
5. **cuenta.tsx + perfil.tsx** — settings con personalidad
6. **preview.tsx + share.tsx** — cartel exportable estilo editorial

---

## 8. Reglas no negociables

1. `"Saaaaaaabes."` — tagline literal, no parafrasear.
2. Roles Foodie y Fondero **separados** — no contaminar flujos.
3. Tono **humano y local** — nada genérico, nada corporativo.
4. **Progressive disclosure** en todo — simple primero.
5. **IA discreta** — operativa, no editorial.

---

## 9. Qué entregar de vuelta

Para cada pantalla rediseñada:
- Mockup (estado idle + estados clave).
- Tres frases que justifiquen la decisión en términos de principios (wayfinding, mental model, etc.).
- Si proponen cambiar el sistema (paleta, tipografía, glass), justificar contra los principios — NO contra la app actual.

---

## 10. Archivos a pegar en la sesión de Claude Design

1. Este brief (`CLAUDE_DESIGN_BRIEF.md`)
2. [`ESSENTIAL_DESIGN_PRINCIPLES.md`](ESSENTIAL_DESIGN_PRINCIPLES.md) — biblia fundacional
3. [`../../GOAL.md`](../../GOAL.md) — filosofía de producto
4. [`../../PATIO_PRD.md`](../../PATIO_PRD.md) — PRD detallado
5. 13 screenshots de TestFlight build 1.0.0 (45)
6. Imágenes de referencias aspiracionales (los 7 slugs)
