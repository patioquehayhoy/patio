# Patio — Rediseño Editorial (v2)

> **Alcance:** dirección **editorial** (tipografía, jerarquía, glass, color, copy, ritmo, densidad).
> **Fuera de alcance:** flujo, navegación y estructura de pantallas — eso NO se toca.
> **Decisión de paleta confirmada (2026-06-03):** se **mantiene el naranja de marca** (`#F2612F` light / `#FF6A3D` dark).
> **Fuente:** screenshots reales en `assets/screenshots/` + `docs/design/VISUAL_SYSTEM.md` + `ESSENTIAL_DESIGN_PRINCIPLES.md`.
>
> Cada pantalla entrega: **(1)** diagnóstico contra "lo cotidiano elevado", **(2)** dirección editorial concreta, **(3)** justificación contra los 12 principios WWDC17.

---

## 0. Decisión de sistema previa — paleta cerrada, jerarquía por sistema

La paleta está cerrada: se conserva la paleta actual de la app (`lib/colors.ts`). El rediseño no debe introducir amarillo ni un segundo acento cálido. La mejora viene de jerarquía, glass, geometría, composición, ritmo y uso más intencional del naranja.

| Color | Rol permitido | Dirección |
|---|---|---|
| **Naranja `#F2612F` / `#FF6A3D`** | Acento Patio: marca, selección, estados activos, acciones que necesitan firma | Usarlo con intención, no como decoración en cada label |
| **Negro/texto `#1C1C1E` / `#F5F5F0`** | Acción primaria, jerarquía tipográfica, texto | Cargar más jerarquía en peso/escala, menos en color |
| **Neutros `bg/surface/border`** | Profundidad, glass, separación, calma | Dar premium por capas y ritmo, no por más colores |

**Regla editorial:** el naranja existe, pero no debe hacer todo el trabajo. El contraste **900 vs 300**, la escala, el glass y la proximidad cargan la jerarquía. Esto es *Consistency* + *Visibility*: un acento que significa algo es legible; un acento decorativo es ruido.

---

## 1. `explorar.tsx` — Descubrimiento Foodie (mapa + sheet)
*Refs: `03_explorar_mapa`, `04_explorar_busqueda`, `15 Interación mapa 02`, `06_detalle_patio`*

### Diagnóstico
- El mapa **sí** es la superficie heroica — bien. Pero la lista "CERCA DE TI" llega con **demasiada información por fila**: nombre + tipo + dirección + precio + rating + horario. Cinco datos compiten; ninguno gana.
- El rating `★ 5.0` se repite en **cada** fila y además en el encabezado de sección. Ruido. Si todo es 5.0, el rating no informa — decora.
- El pill `5.0` naranja arriba a la derecha de la sección no tiene función clara (¿filtro? ¿promedio?). *Visibility* roto.
- La numeración `1 2 3 4` en círculos compite con el nombre por el primer golpe de vista.

### Dirección editorial
- **Una fila = una decisión.** Jerarquía por peso, no por cantidad:
  - **Nombre** (`fontWeight 900`, 17pt, `Fonts.brand`) — el héroe de la fila.
  - **Línea meta** (`300`, 13pt, `t.gray`): `Taquería · Presa las Vírgenes` — tipo y calle fundidos, densidad Apple Music.
  - **Precio** a la derecha, `900`, alineado — es la segunda decisión real ("¿me alcanza hoy?").
- **Matar el rating de las filas.** Si vuelve, que sea **un solo trust signal editorial** ("Recomendado", "Nuevo hoy") — no una estrella fría. (El brief: *confía en curaduría humana, no en estrellas*.)
- **Horario** solo cuando es accionable: badge contenido "Abierto · cierra 5pm" usando neutros/glass y, si necesita énfasis, el naranja actual con baja presencia.
- Quitar el pill `5.0` del header de sección. El header dice solo `CERCA DE TI` (label 11pt/900/UPPER/1.8 spacing).
- Numeración: o desaparece, o baja a `300` gris pequeño antes del nombre — nunca círculo sólido que compita.

### Principios
- **80/20:** el 80% de las veces el Foodie decide por nombre + precio + "¿está abierto?". Esos 3 mandan; el resto se esconde (*Progressive Disclosure*).
- **Proximity / Grouping:** tipo+calle son un grupo (meta); precio+horario son otro (viabilidad). Espaciado, no líneas, los separa.
- **Mental Model:** la pregunta es "¿qué hay hoy?", no "¿quién tiene mejor rating?" — el layout debe responder la primera.

---

## 2. `patio/[id].tsx` — Ficha de fondita
*Ref: `06_detalle_patio` (sheet expandido sobre mapa)*

### Diagnóstico
- El sheet expandido es bueno estructuralmente (nombre grande, meta, acciones Ver/compartir/guardar). Pero es **plano**: nombre, tipo, precio y rating viven al mismo nivel tipográfico aplanado.
- `Cochitacos` (nombre) y `$100-120` (precio) tienen casi el mismo peso visual → no hay héroe.
- "Tacos cerca de Irrigación" como subtítulo es genérico — desperdicia el momento editorial.

### Dirección editorial
- **Estilo `FICHA_EDITORIAL` (Hanbut):** el nombre del negocio es el titular. `Fonts.brand`, 28pt, `900`, `letterSpacing -0.3`. Todo lo demás recede.
- **Precio como dato editorial grande** pero *subordinado*: `$100–120` a 22pt/900, con label `300` "rango de hoy" encima a 11pt. El número es protagonista del bloque-precio, no de la pantalla.
- **El menú del día ES la ficha.** Lo primero bajo el nombre no debe ser metadata sino **qué hay hoy** — 2-3 platillos en lista densa (nombre `500`, descripción `300`). Eso responde el JTBD literal.
- Acciones (Ver / guardar / compartir): negro `900`, glass Capa 2 sobre el mapa. Una primaria sólida ("Cómo llegar" / "WhatsApp"), las demás outline o icono.
- Naranja **solo** en el pin asociado y, si acaso, en el rating si se decide conservarlo como firma.

### Principios
- **Wayfinding:** entras y en 1 segundo sabes *dónde estás* (nombre titular) y *qué hay* (menú), no *qué calificación tiene*.
- **Mapping:** el orden vertical mapea la decisión real: quién → qué hay → cuánto → cómo llego.
- **Affordance:** la acción primaria sólida grita "tócame"; las secundarias se ven secundarias.

---

## 3. `foto-menu.tsx` — Captura de menú (Fondero)
*Ref: `13_foto_menu`*

### Diagnóstico
- Card bien centrada, copy correcto ("Empieza tu menú" / "Sube una foto y Patio lo llena al instante"). El botón circular naranja **Tomar foto** es el gesto premium correcto.
- **Problema de color:** el naranja se usa aquí como accent de UI (logo ✦, botón, tab "Menú" activa). Según el sistema, el naranja es marca — y este *es* un momento de marca Fondero, así que **aquí sí es válido**. Pero conviene que sea **el único** naranja: hoy compite con la tab inferior también naranja.
- "Usar plantilla" flota suelto abajo, con peso visual ambiguo (¿es importante? ¿es escape?).

### Dirección editorial
- **Mantener el botón naranja como héroe** — es el momento "✦ IA que reduce fricción". Un solo naranja en pantalla: el botón. La tab activa baja a negro `900` (consistencia con el resto de la app); el naranja se reserva para el gesto, no para el chrome.
- **Jerarquía de las 3 entradas:** Tomar foto (héroe, naranja sólido) > Elegir imagen (outline negro) > Usar plantilla (texto `300` discreto, como tercera opción real). *Progressive Disclosure* del esfuerzo: lo más fácil primero, lo más manual al fondo.
- Copy: respetar el tono. "Sube una foto y Patio lo llena al instante" es perfecto — IA operativa, no editorial.
- Glass: la card NO es glass (no está sobre mapa) — `t.surface` sólido, `borderRadius 20`, hairline. Correcto como está.

### Principios
- **Feedback / IA discreta:** el ✦ promete magia sin gritarla; tras la foto debe venir estado de procesamiento claro (spinner tech silencioso — Linear/Tesla, no dots juguetones).
- **80/20:** la foto es el 80% del caso Fondero (tienen pizarrón/papel). Es el botón más grande. Plantilla/manual son el 20%.

---

## 4. `menu.tsx` — Editor de menú (Fondero)
*Ref: `12_menu_editor 01`*  ⚠️ **NO TOCAR el bloque de precio** (CLAUDE.md)

### Diagnóstico
- Lista densa de platillos con nombre `900` + descripción `300` — la densidad Apple Music **ya está bien lograda** aquí. Buen ejemplo del sistema funcionando.
- **Falta respiro entre secciones.** Las secciones se pegan; el ojo no descansa entre "Sección 3" y "Sección 4".
- `+ agregar` y `+ Agregar sección` están **ambos en naranja** → otra vez naranja como UI, no como marca. Compiten entre sí y con la tab activa.
- El handle de drag (`⠿`) a la izquierda de cada fila añade ruido visual permanente.

### Dirección editorial
- **Más aire entre secciones:** `marginTop 32` entre bloques de sección; dentro del bloque, `marginBottom 2` entre campos (regla de campos agrupados de CLAUDE.md). Respiro entre grupos, densidad dentro del grupo.
- **`+ agregar` deja el naranja:** pasa a `t.gray` `300` o negro discreto. El naranja no es para acciones de edición rutinaria. `+ Agregar sección` puede ser el único botón con un toque de énfasis (outline negro), por ser la acción estructural.
- **Drag handle:** reducir opacidad (aparece full solo en modo reordenar) o mover a swipe. Ruido cero.
- **Bloque de precio:** intacto. `$` 22/900, input 22/900, sin paddingVertical. **Verificar antes de cualquier commit.**

### Principios
- **Grouping / Proximity:** secciones = grupos; el espaciado debe declararlo, no las líneas.
- **Consistency:** un Fondero que aprendió "naranja = acción mágica de IA" no debe ver naranja en un `+ agregar` trivial.
- **Visibility:** menos chrome permanente (handles), más contenido (los platillos, que es lo que importa).

---

## 5. `cuenta.tsx` + `perfil.tsx` — Settings con personalidad
*Refs: `08_cuenta` (Foodie), `11_perfil_fondero` (Fondero)*

### Diagnóstico
- **Cuenta (Foodie):** filas con icono + label `900` + chevron. Limpio pero **genérico** — parece settings de cualquier app. La tab "Perfil" activa en naranja (otra vez UI naranja).
- "Explorador / Patio Foodie" como identidad está bien — humaniza. Mantener.
- **Perfil (Fondero):** los pills de categoría (Fondita/Taquería/...) y métodos de pago (Efectivo/Transferencia/Tarjeta) usan el patrón pill negro-activo correcto. Bien. Pero "Apertura 8am / Cierre 4pm" se ven como filas de settings, no como **el horario editorial** que el Foodie usará.

### Dirección editorial
- **Personalidad sin ruido:** los labels de sección (`CUENTA`, `PREFERENCIAS`, `APLICACIÓN`) a 11pt/900/UPPER/1.8 — ya casi están; reforzar el spacing. Eso es lo que da el tono "editorial cuidado" sin decorar.
- **Naranja fuera de settings.** Tab activa → negro `900`. Settings es interfaz pura: cero marca, máxima legibilidad. Esto es lo más anti-"genérico" que se puede hacer: *un* acento que significa algo.
- **Horario Fondero como dato editorial:** `8am` / `4pm` a peso `900` grande, alineados a la derecha — leen como el dato que son, no como un toggle. (Refuerza que el Fondero está *declarando qué hay hoy*.)
- Iconos de fila: `t.gray`, hairline, nunca naranja. Que el ojo vaya al label, no al icono.

### Principios
- **Consistency:** mismo patrón de fila/label en ambos roles → un solo lenguaje de settings.
- **Mental Model:** Fondero edita *su negocio público*; Foodie ajusta *su app*. Mismos componentes, copy distinto — los flujos no se contaminan (regla no negociable).
- **80/20:** lo más usado (Buscar, Favoritos / Menú, Compartir) arriba; lo raro (Calificar app, Manifiesto) abajo.

---

## 6. `preview.tsx` + `share.tsx` — Cartel exportable editorial
*Refs: `14_compartir 02_lleno leido por ia`, `15_preview lista imagen`*

### Diagnóstico
- El preview es el **artefacto de marketing orgánico** de Patio: lo que el Fondero comparte a WhatsApp es publicidad gratis. Debe verse *editorial*, no "captura de app".
- Hoy luce como lista de la app exportada. Funcional, no aspiracional.

### Dirección editorial
- **Cartel, no screenshot.** El export debe tener: nombre del negocio (`Fonts.brand`, grande), "QUÉ HAY HOY" como kicker editorial (11/900/UPPER), menú denso, y la firma **"Saaaaaaabes."** (literal, intocable) como cierre de marca.
- **Naranja como firma de marca aquí sí** — es el momento donde Patio *se ve* hacia afuera. Pin/logo/firma pueden llevarlo.
- Glass NO aplica (es imagen estática exportable). Fondo `t.bg` o crema editorial, tipografía haciendo todo el trabajo.
- Botón WhatsApp: única excepción de peso `700` y verde de marca externa (documentado). Mantener.
- **`share.tsx`:** evaluar si sigue siendo ruta necesaria o si `preview` + acción de compartir la absorbe. (Decisión de estructura → fuera de este doc; marcar para revisión.)

### Principios
- **Feedback:** el Fondero ve *exactamente* lo que va a compartir antes de hacerlo (WYSIWYG).
- **Symmetry / Aesthetic:** belleza = retención. Un cartel bonito se comparte; una captura fea, no. Esto es crecimiento, no decoración.
- **Mental Model:** el Fondero piensa "voy a avisar qué hay hoy" — el cartel debe *verse* como un aviso del día, no como un volcado de base de datos.

---

## 7. Resumen transversal (lo que toca todas las pantallas)

1. **Naranja = marca, no interfaz.** Se gana en: pin, rating-firma, gesto IA Fondero (Tomar foto), cartel de share. Se calla en: tabs, settings, `+ agregar`, chrome general → ahí va negro `900`.
2. **Sin segundo acento cálido.** Estados activos, horarios y selección usan la paleta actual con intención y baja competencia visual.
3. **Jerarquía por peso (900 vs 300), nunca por color.** Eliminar todo `400/500/600` salvo las dos excepciones documentadas.
4. **Respiro entre grupos, densidad dentro del grupo** (Apple Music). Aplica a listas de explorar, menú y secciones.
5. **Ruido cero:** matar ratings repetidos, handles permanentes, pills sin función, iconos que compiten con labels.
6. **El contenido (menú del día) sube; el chrome baja.** En ficha y preview, lo primero debe ser *qué hay hoy*.

---

## 8. Para implementar (post-aprobación) — orden recomendado

Coincide con `TASKS.md > POST-CLAUDE-DESIGN`. Cada pantalla: cambio editorial → `npx tsc --noEmit` verde → no tocar bloque de precio → respetar "Saaaaaaabes.".

1. Sistema de color (regla naranja=marca) — token-level, desbloquea el resto.
2. `explorar.tsx` — filas de una decisión.
3. `patio/[id].tsx` — ficha editorial, menú primero.
4. `foto-menu.tsx` — un solo naranja (el botón).
5. `menu.tsx` — respiro entre secciones, `+agregar` sin naranja.
6. `cuenta.tsx` + `perfil.tsx` — settings sin naranja, horario editorial.
7. `preview.tsx` + `share.tsx` — cartel exportable.

> Ninguna de estas tareas cambia flujo ni navegación. Son tipografía, color, peso, espaciado y copy.
