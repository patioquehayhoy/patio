# Patio Design Principles

Use this file as the shared product and UI reference for Patio. Prefer these rules over generic app patterns when designing or refining screens in this repo.

> ⚠️ **Separación importante:**
> Las secciones **Core Direction → Role Principles** son principios durables: aplican siempre.
> La sección **Current UI Decisions** son decisiones vigentes y cambiables — pueden replantearse
> en una exploración de diseño (Claude Design u otra) sin violar los principios.
> La biblia fundacional vive en [`design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`](design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md).

## Core Direction

- Prioritize iOS-native patterns and behavior before custom UI.
- Aim for a Tahoe-like feel: calm surfaces, soft hierarchy, crisp spacing, restrained accents.
- Borrow Notion's restraint in secondary actions: low noise, clear hierarchy, simple controls.
- Keep the product feeling warm and approachable, but never cluttered.

## Interaction Rules

- Keep one clear primary action per area.
- Secondary actions should not compete with the primary action.
- Use action sheets or bottom sheets for grouped secondary or destructive actions instead of inline expanded panels when possible.
- Hide destructive actions behind a secondary entry point unless the task explicitly requires always-visible danger actions.
- Prefer simple disclosure patterns:
  - closed state: `chevron.right`
  - open state: `chevron.down`

## Estados de botón y validación (2026-11-01)

Base: heurísticas 1 y 5 de Nielsen (estado visible del sistema, prevención de
errores) y la validación en línea de Luke Wroblewski.

- Las reglas se dicen antes de actuar, junto al campo (p. ej. «Puedes cambiarlo
  una vez cada 15 días»), nunca solo en una alerta después de tocar Guardar.
- La acción principal muestra un estado por momento: falta algo (apagado, dice
  qué: «Falta el nombre», «Elige las estrellas», «Falta un platillo»), listo,
  en curso («Guardando…» con indicador) y hecho («Guardado», que se queda hasta
  que la persona vuelve a editar, nunca se va por tiempo).
- Un error de un campo se muestra debajo de ese campo, no en una alerta.

## Comunidad y seguridad (2026-11-01)

- Todo lo que se ve como acción funciona y se guarda. Los comentarios en
  reseñas viven en Supabase; las reseñas de demostración son solo de desarrollo.
- Comentarios como Instagram: respuestas de un solo nivel, «me gusta», eliminar
  (autor del comentario o de la reseña) y «Reportar». El negocio comenta con su
  nombre y sello en las reseñas de su Patio.
- El servidor filtra insultos y lenguaje ofensivo en todo texto público
  (`moderation_terms`); la jerga cotidiana y las palabras de comida no se
  bloquean. La pantalla explica el rechazo con una frase, nunca como error de red.
- Perfil privado como Instagram: nombre, foto y reseñas visibles; listas y a
  quién sigues, solo para quien apruebas. Las solicitudes viven en Actividad.
- Nombres (negocio y persona): dos cambios cada 14 días, dicho antes de
  escribir. Dos negocios pueden llamarse igual; la colonia los distingue.
- El nombre de quien reseña o comenta abre su perfil: así se encuentra a la
  gente para seguirla.
- Avisos por lugar (2026-11-02), como la campana de YouTube o Instagram:
  seguir no obliga a recibir todo. «Siguiendo ▾» → «Silenciar avisos» /
  «Activar avisos» (el botón muestra la campana tachada si está silenciado);
  Notificaciones → Menú de hoy → «Elegir lugares» para hacerlo de todos a la
  vez. Contra la fatiga de avisos: un aviso de menú por lugar al día y como
  máximo tres al día por persona (servidor). Al tocar «Seguir» aparece una
  barra flotante «Te avisaremos cuando publique · Silenciar»; se va cuando la
  persona la cierra, silencia o se mueve por la ficha, nunca por tiempo.
- Ficha del lugar (2026-11-02, cerrado con Parco, revisado en simulador):
  - Identidad sobre la foto, en la misma retícula de 20 que volver y
    compartir: el nombre a todo lo ancho (dos líneas en `Type.screen` o
    `Type.title`, hasta tres en `Type.section`; nunca se encoge a mano) con
    el sello pegado a la última palabra y, a 4 debajo, una línea con «N
    seguidores» a la izquierda y «Seguir» a la derecha (encabezado de X).
    Se probó en dos columnas y con Monument los nombres cortos («Cocina
    Lupita») partían en dos líneas: el nombre necesita todo el ancho. Sin
    «Cómo llegar»: el mapa ya abre indicaciones.
  - La descripción del negocio (Editar mi negocio, hasta 80) va sobre la
    foto, entre el nombre y los seguidores, como la bio de Instagram: un
    renglón y «más» si no cabe; al tocarla se ve completa. Dentro de la
    tarjeta se veía ajena (Parco). La foto mide 320 para que nombre de dos
    renglones y descripción abierta nunca toquen volver y compartir.
  - El estado del día vive en la tarjeta: «Se acabó por hoy» es el primer
    bloque y el menú solo se atenúa (sin caja ni etiqueta «Agotado»).
  - Ritmo en la retícula de 8: tarjeta 24 arriba; ubicación y precio → 24 →
    menú; nombre y descripción a 2; platillos a 12; secciones a 24 sin
    líneas (el espacio separa; línea y espacio a la vez es doble); etiqueta
    de sección `Type.label` en gris, no naranja (un solo acento por
    pantalla: «Seguir»); menú → 32 → detalles; mapa → 32 → reseñas.
  - En desarrollo, los lugares de ejemplo muestran seguidores sintéticos.
- Seguir, como Instagram (2026-11-02): se siguen personas y lugares. Una lista
  pública ofrece «Seguir a [nombre]», la persona que la armó, porque sus listas
  viven en su perfil.
  «Guardar» ya no se usa para lugares. La ficha lleva «Seguir» (naranja) y
  «Siguiendo» (abre Agregar a una lista y Dejar de seguir). La pestaña del
  Foodie se llama «Siguiendo».
- Números públicos como Instagram: el perfil muestra reseñas, «me gusta»
  recibidos, seguidores y siguiendo (personas y lugares); el negocio muestra
  seguidores. Tocar el número abre quién sigue, también en un lugar. En un
  perfil privado que no sigues, los lugares que sigue no se muestran.
- Bloquear vive en el ••• de perfiles y reseñas; «Cuentas bloqueadas» solo
  aparece en Perfil cuando bloqueaste a alguien.

## Bibliotecas: Guardados y Menús (2026-11-01)

- Orden por defecto A–Z, como la biblioteca de Apple Music; con 20 lugares o
  más aparece la barra de letras a la derecha. Menús conserva el orden por
  fecha porque es un historial.
- Las listas se ordenan A–Z (las fijadas primero) en todas las hojas.
- Botón de listas: en Guardados, `list-outline`; en Menús, carpeta. Parco
  duda de que las listas de Menús sirvan al negocio: pendiente decidir si se
  quitan.
- El mapa llega hasta el borde: la barra flotante no lleva degradado encima
  del mapa (sí sobre listas que pasan por debajo).

## Captura de menú (2026-11-01)

- El nombre de un platillo se ve completo mientras se escribe (el campo crece,
  como en un chat) y queda en una línea con «…» al pasar al siguiente.
- Precio propio y descripción son opcionales. El precio vive a la derecha
  del nombre (2026-11-02, Parco): «+ Precio» y ahí mismo nace el campo. Sobre
  el teclado, «Siguiente» pasa al precio del platillo de abajo (llenar varios o
  saltarse uno) y «Listo» cierra (cambiar solo uno). «Agregar descripción»
  sigue debajo del nombre; los cambios del renglón se animan 200 ms. El precio
  del día sigue arriba, sin cambios.
- Al publicar: un solo paso. Se ve el póster de lo publicado con «Publicado»
  arriba, «Editar» junto al menú, «Compartir como imagen» y «Listo».

## Tablero del negocio (2026-11-02)

- Actividad abre con seguidores y «me gusta» en platillos (total y esta
  semana) y lo que más gusta. Tocar seguidores abre quién te sigue.
- Cada platillo muestra su número de «me gusta» junto al corazón, para todos.
- En un perfil, tocar «seguidores» o «siguiendo» abre la lista (como
  Instagram). En uno privado que no sigues, no se abre.
- Filtro por giro en el mapa: siempre la lista completa de giros
  (`lib/patio-categories.ts`); en Guardados, solo los giros que guardaste.
- Un solo nombre por giro en alta, edición, filtros y mapa («Tacos», «Café»).

## Navigation Rules — Ley de Jakob (2026-11-01)

La gente pasa casi todo su tiempo en otras apps y espera que Patio funcione
igual (Jakob Nielsen, Nielsen Norman Group). Por eso:

- Barra inferior con 5 destinos como máximo.
- Inicio a la izquierda y Perfil a la derecha.
- Crear va al centro de la barra, nunca escondido arriba en una pantalla.
  Negocio: `Menús · Actividad · + · Mi Patio · Perfil`: cinco para que el «+»
  quede al centro exacto (Parco eligió esto sobre los 4 que prefería Jev). Foodie
  no crea en el día a día, así que su barra no lleva «+».
- Deslizar desde el borde izquierdo regresa; no se desactiva.
- Jalar hacia abajo actualiza toda lista que viene del servidor.
- Perfil en un solo nivel, como Claude y la mayoría de apps: quién eres
  arriba (negocio: nombre, estado de hoy, Editar mi negocio y Plan; Foodie:
  perfil, perfil público, Actividad y Plan) y abajo los ajustes compartidos
  (`components/account-settings.tsx`): Preferencias, Ayuda y, al final,
  Cuenta con Cuentas bloqueadas, Cerrar sesión y Eliminar. Nunca ajustes
  dentro de ajustes ni un engrane que esconda otra pantalla de ajustes.
- El giro del negocio se elige en el alta y en Editar solo se muestra; el
  cambio se pide a soporte (protege mapa, reseñas por giro y datos).

## Layout Rules

- Add generous vertical breathing room between action groups.
- Avoid making unrelated controls look like equal siblings.
- Keep CTA groups visually separated:
  - primary action first
  - secondary escape hatch after visible spacing
- Prefer centered, contained controls over full-width controls when the action is secondary or optional.
- Avoid jumpy layouts. If content switches between variants, stabilize height or width so the screen does not visibly shift.

## Escala homologada (2026-11-02)

Una medida por función en toda la app. Si algo no cabe, cambia el contenido,
no la medida.

- **Confirmación:** cápsula de 54 de alto, radio 27, texto 16/700. La acción
  que la acompaña usa la misma cápsula.
- **Estados:** falta algo → superficie con borde fino y texto gris que dice
  qué falta; listo → naranja; en curso → naranja con indicador; desactivado
  sin explicación → opacidad 0.4. Al tocar: 0.7 en controles, 0.85 en botones
  con fondo.
- **Barra de navegación:** 52 de alto; volver es una caja de 44 a 14 del borde
  (en pantallas con margen de 20 la barra lleva `marginHorizontal: -6`),
  chevron de 21 en color de texto, etiqueta «Volver». Íconos de barra y de
  encabezado de sheet: 21. Título 17/22/700; acciones de texto («Listo»,
  «Editar», «Limpiar») 16/700.
- **Vidrio:** `GlassIconButton` en su tamaño por defecto (40, ícono 20); sobre
  la foto de la ficha, círculo de 44.
- **Seguir compacto (ficha):** cápsula de 112 × 32 (radio 16), texto 15/700,
  objetivo táctil de 44. Mismo ancho en sus dos estados, como Instagram, para
  que el nombre no se mueva al seguir. «Seguir» en naranja; «Siguiendo ▾» en
  el mismo vidrio que los botones de la foto (campana tachada en lugar de ▾
  si los avisos están silenciados).
- **Texto (Neue Montreal: 600 o más se dibuja Semibold, lo demás Regular):**
  17 títulos de barra y sheet · 16 botones · 15 cuerpo · 14 filas y notas ·
  13 secundario · 12 metadatos y horas · 11 etiquetas en mayúsculas (700,
  espaciado 0.8) · 10 solo en la barra de pestañas. Sin medios puntos. Pesos en
  código: 400 y 700 (300 y 500 solo donde ya existían).
- **Marca (Monument):** de 20 en adelante y siempre por `Type`; sin
  `fontWeight`. Títulos de vacío y de celebración secundaria: `Type.section`.
- **Radios:** 14 campos, opciones y controles compactos · 18 tarjetas, listas
  agrupadas y diálogos · 28 sheets · mitad de la altura en cápsulas y círculos.
- **Márgenes:** 20 pantallas · 16 bibliotecas y sheet del mapa · 22 póster ·
  24 alta y acceso · 28 entrada de marca.
- **Vacío de pantalla completa:** ícono de 32 en caja de 68 (radio 20), título
  `Type.section`, texto 15/21 y una acción.
- **Color:** el naranja sale de la paleta (`Colors.accent`, `t.accent`).

## Visual Style

- Use light, clean backgrounds with subtle warmth.
- Keep borders soft and low-contrast.
- Use shadows lightly; depth should feel airy, not heavy.
- Prefer rounded geometry and smooth radii, especially for sheets, cards, and pills.
- Accent color should be used sparingly and mostly for clear calls to action.
- For map/exploration surfaces, use the shared logistics-dashboard references as structural direction: pale desaturated map, thin route/pin language, floating controls, translucent panels, dense list rows, and calm hierarchy. Do not copy the neon green palette; keep Patio's warmer accent system.
- Prefer full-bleed map composition with overlays instead of placing a small map inside a decorative card.
- Bottom sheets and floating panels should feel like glassy operational surfaces: large radius, low border contrast, restrained shadow, enough transparency/softness to keep map context visible.
- Lists inside Foodie/Map flows should be dense but breathable: strong item name, concise metadata, right-aligned key value, and one clear affordance.

## Copy Rules

- Use short, direct labels.
- Prefer generic verbs when the action applies to multiple content types.
- Avoid over-explaining in persistent UI.
- Put explanatory detail in sheets, helper text, or follow-up surfaces instead of the main layout.
- Prefer already learned icon grammars for dense social action bars. Keep visible
  labels out when icons and counters are conventional, but always provide complete
  accessibility labels.
- Synthetic product data may exercise edge cases; synthetic editorial commentary
  must not appear as if it were a fact about a real business.

## Recognition and trust surfaces

- Recognition is represented by compact icon medals, never promotional pills.
- A medal must be derived from a named, measurable signal; it is not decoration.
- Multiple medals may coexist without competing with the menu or primary action.
- Explanations reuse a stable information surface instead of expanding the layout.
- Operational facts immediately above the map use three aligned columns: schedule,
  accepted payments, and real opening year.
- Popularity, republication, corroboration and verification are different concepts;
  never collapse them into one score.

## Current UI Decisions (cambiables)

> Estas son decisiones de la versión actual. Una exploración de rediseño puede proponer
> cambiarlas siempre que respete los principios de arriba.

- In menu editing, `Agregar sección` is the persistent primary action.
- Menu utilities like changing source, re-choosing a template, or deleting should live under `Más opciones`.
- For menu item creation, use `Agregar` instead of content-specific labels when the item could be a platillo, bebida, guarnición, postre, salsa, or similar.
- Template picking should feel like a quick starting point, not a branching workflow.

## Role Principles

- `Fondero` tools should optimize for speed, confidence, and low-friction editing.
- `Foodie` tools should optimize for clarity, discovery, and trust.
- Shared components may reuse styling, but each role should preserve its own primary job to be done.
