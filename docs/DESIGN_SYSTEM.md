# Patio — sistema de diseño vigente

Actualizado el 2026-10-12. Sustituye los valores y contratos anteriores de
este archivo. Fundamentos: [ESSENTIAL_DESIGN_PRINCIPLES](design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md).
Alcance y verificación: [auditoría de diseño](DESIGN_AUDIT_2026-10-10.md) y
[ajuste de distribución con referencia Uber](UBER_LAYOUT_REFINEMENT_2026-10-10.md).
Refinamiento posterior de verificación, estrellas y panel de Mapa:
[estabilidad de tarjetas](CARD_STABILITY_2026-10-10.md).
Agrupación compacta y botón de ubicación, con versión anterior guardada:
[ajuste reversible](COMPACT_CARDS_LOCATION_2026-10-10.md).
Estrella única, colonia/distancia y comparación de nombres en cuadrícula:
[ajuste final de tarjetas](SINGLE_STAR_CARDS_2026-10-12.md).
Contrato posterior de columnas y elipsis, tras auditar Uber Base/Material:
[columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).

## Identidad y agrupación

Patio conserva su identidad local, editorial, botánica y sobria. El par
«¿Qué hay hoy?» / «Saaaaaaabes.» permanece íntegro. Foodie y Fondero tienen
tareas y contenido propios; las tareas equivalentes comparten componentes.

La proximidad agrupa nombre y colonia/distancia, y etiqueta y campo. El precio
tiene una posición estable a la derecha para comparar lugares.
Los grupos se separan con espacio. Evitar bordes, placas y títulos que
repitan información. Una acción prominente por pantalla, controles
secundarios neutros y selección inequívoca.

## Colores

Fuente: lib/colors.ts, lib/theme.tsx y lib/fondero-palette.ts.
No copiar una paleta antigua a una pantalla.

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Fondo | #F8F8F5 | #0A0B0D |
| Superficie | #FFFFFF | #1B1C20 |
| Superficie secundaria | #F6F4EE | #24262C |
| Texto principal | #111214 | #F8F8F5 |
| Texto secundario | #4A4A47 | rgba(248,248,245,0.7) |
| Texto discreto | #8A8A85 | rgba(248,248,245,0.5) |
| Acento | #F2612F | #FF6A3D |
| Borde | rgba(17,18,20,0.08) | rgba(255,255,255,0.10) |

Naranja: acción prominente, selección y navegación activa.
Disponibilidad: verde #1F9D55, cierre próximo #B88600 y cerrado theme.textMute.
No usar verde para «tiene menú». Accesibilidad comunica el significado.

## Tipografía y texto

Fonts.brand es Plus Jakarta Sans ExtraBold para identidad y títulos.
Cuerpo y controles usan la fuente del sistema de cada plataforma.
No declarar SF Pro Display como fuente cargada de Patio.

| Rol | Tamaño base | Tratamiento |
| --- | --- | --- |
| Título de pantalla | 30–38 pt | Marca, 900, interletraje moderado negativo |
| Nombre en tarjeta | 16 pt / 21 de línea | Sistema, 700 |
| Cuerpo, campo y control | 14–16 pt | 400–500; botones y etiquetas principales 700 |
| Colonia | 13 pt / 18 de línea | 400 |
| Precio publicado | 14 pt / 20 de línea | 700, cifras tabulares, alineado a la derecha |
| Métrica compacta | 12 pt / 18 de línea | 400, cifras tabulares |
| Etiqueta de sección | 11–13 pt | 700; mayúsculas cuando aportan jerarquía |

300 se conserva donde se necesita una voz ligera; no se impone a todo el
cuerpo pequeño. No reducir texto para forzarlo dentro de un botón. Usar
alturas mínimas, padding y crecimiento. Campos con etiqueta persistente.
Copy editorial por noWidow(); no insertar saltos manuales en nombres.

## Tarjetas de lugar

PatioCardInfo, PatioIdentityIcon y patioCardAccessibilityLabel comparten
jerarquía en Guardados, resultados de Mapa, Vistos y colección privada.
La colección pública no inventa métricas que su consulta no obtiene.

- Nombre: una línea con elipsis tanto en lista como en cuadrícula.
  Completo en accesibilidad y ficha. Eliminar la variante de dos líneas de
  las tarjetas compactas; su longitud no modifica la altura de la fila.
- Colonia: una línea. Sin giro ni categoría. Si falta, no sustituirla con
  «CDMX», una categoría o una colonia inferida.
- Lista: nombre a la izquierda y precio a la derecha en la cabecera. Con
  letra grande en ancho menor de 600 pt, el precio pasa debajo y mantiene
  alineación derecha. Cada importe compacto ocupa una línea. Los rangos
  extraordinarios muestran «Ver precios»; accesibilidad y ficha conservan
  el valor publicado completo. No mostrar una cifra parcialmente recortada.
- El precio reserva 112 pt × fontScale en lista. La verificación tiene una
  columna independiente de 16 pt al final del bloque de nombre, reservada
  también cuando no hay sello. El nombre ocupa el ancho restante; nombre
  corto, largo o precio distinto no desplazan el sello.
- Grid: precio arriba a la derecha, junto a la caja del icono. Esa fila
  reserva 40 pt; debajo hay tres líneas de texto: nombre, ubicación y
  calificación/cierre. Las reservas escalan con la letra. La zona superior
  podrá incorporar una foto real del local en una iteración futura.
- Ficha: nombre completo; debajo, colonia/distancia a la izquierda y precio a la derecha.
- Guardados pasa a una columna con fontScale > 1.4 o si las dos columnas no
  dejan 140 pt × fontScale de contenido y 24 pt de padding por card.
  No fijar una altura total.
- Ubicación: «colonia · distancia», sin flecha. Separador solo si ambos datos
  existen. Colonia larga con elipsis; conservar legible la distancia. El
  componente es compartido por cards y ficha. Sin permiso ya concedido o
  coordenadas válidas, omitir distancia sin pedir ubicación al abrir la ficha.
- Una estrella junto al promedio público. Si hay calificación propia conocida,
  usar naranja para indicar participación; sin ella, estrella neutra. El número
  sigue siendo el promedio público; no reemplazarlo por el voto propio.
  Accesibilidad nombra ambos datos cuando existen. Sin segundo número ni estrella.
  Lista muestra conteo de reseñas compacto; grid lo conserva en accesibilidad y
  ficha para dejar espacio al cierre. La estrella es información; la fila abre la ficha.
- Nombre, ubicación y métricas son tres filas estables. Reservar ubicación
  aunque falte el dato. Cada texto compacto ocupa una sola línea; los campos
  secundarios usan elipsis si no caben, manteniendo la información completa
  en accesibilidad. No usar flexWrap dentro de estas filas.
- Cuando está abierto y tiene horario fiable: «Cierra HH:MM» a la derecha
  del grupo de calificaciones; turno publicado de 24 h: «Abierto 24 h».
  En grid, promedio sin conteo visible y cierre comparten la tercera línea.
  Las medidas de la cuadrícula permiten reorganizar a una columna con letra
  grande. Cerrado/sin horario: omitir la hora.
- Sin «Menú de hoy» ni «Sin horario» como líneas de metadata. Horario,
  publicación e inventario son conceptos independientes.
- Icono neutral en caja **transparente de 36 pt**. Un punto sólido de 7 pt en
  su esquina superior derecha indica disponibilidad, sin placa, anillo ni
  contorno. Cierre próximo: faltan 30 minutos o menos. Sin horario fiable:
  sin punto. Nunca sobre el glifo, junto al nombre ni en los pines del mapa.
- Horarios semanales en la ficha mantienen texto explícito por día.

En Mapa, deslizar los resultados hacia abajo conserva búsqueda y pines,
recupera la navegación cuando no hay teclado y permite reabrir con foco o
confirmar el término. El panel saliente no captura toques ni accesibilidad;
solo la transición actual puede retirarlo. Evidencia y límite de diagnóstico
nativo: [SEARCH_SWIPE_FIX](SEARCH_SWIPE_FIX_2026-10-10.md).

## Barra de Mapa y Guardados

FoodieFilterBar: una fila **Abierto · Filtros · Listas · …**.
Tres casillas flexibles idénticas y un espacio fijo de 40 pt para acciones.
Mapa usa ese último espacio para «Centrar en mi ubicación». Guardados mantiene
los tres puntos. Sin scroll horizontal ni segunda fila.
Cuentas y títulos no cambian posiciones.

Ubicación: permiso al tocar, indicador durante la búsqueda y mapa centrado
al obtener coordenadas válidas. Si falla, conserva el mapa y permite reintentar;
si se negó el permiso, ofrece Ajustes. Oculta resultados conservando término
y pines, recupera navegación y muestra el punto de ubicación nativo.
No activar seguimiento automático de cámara ni permiso en segundo plano.

Abierto se activa con un toque, sin número. Mantener presionado permite
horario específico; etiqueta visible siempre Abierto. Filtros y Listas
resumen selecciones con insignias absolutas de notificación.

Paneles iniciales con título visible «Filtros» / «Listas»; la cabecera
identifica el contexto y agrupa cerrar y acciones. No reservar una fila vacía. Subpantallas identifican criterio o tarea: Tipo de lugar,
Pago, Destino o Nueva lista.

## Listas, selección y feedback

LibrarySheet, LibraryListRow, SelectionActions y RenameDialog son comunes.
«Todos los lugares» usa la misma selección izquierda que las demás filas.
Nombres largos: dos líneas, cuenta legible y nombre completo accesible.
Fijar usa chincheta y Desfijar, chincheta tachada; guardar usa marcador.
Renombrar usa lápiz sólido y añadir a una lista, carpeta.

Mover requiere selección, origen inequívoco, destino y confirmación. Cuando
falta selección, la explicación aparece junto a las acciones. Fallos
conservan el trabajo y ofrecen reintento. Spinner solo durante trabajo real;
vacío solo tras consulta exitosa. No presentar una falla como lista vacía.
La fila de selección usa feedback de superficie al presionar y conserva
legible su texto; el estado seleccionado se muestra con el control izquierdo.

Ordenar Guardados: reciente, distancia, precio publicado ascendente,
calificación propia y alfabético. Desconocidos al final. Ubicación al elegir
distancia; negar conserva el orden previo. No suponer ticket promedio.

## Geometría y superficies

Márgenes 16–24 pt, separación interna 2–8 y entre grupos 16–32 según contenido.
Cards normales: radio 18; sheets: 28–32; cápsulas: radio redondo.
Controles: área efectiva mínima de 44 pt; ajustes mínimo 56 y listas 52,
permitiendo crecimiento. Iconos de navegación 18–22 pt, compactos 12–18.
Acciones de selección se reorganizan con letra grande; pills mantienen sus
posiciones. Formularios desplazables con teclado y safe areas.
El contenido reserva el alto de navegación compartido y 16 pt de separación;
con selección usa el alto real medido de la barra, no un margen fijo supuesto.
LibrarySheet limita su altura al viewport: editor dentro del scroll principal,
cabecera fija y footer con scroll propio cuando no cabe. No forzar 120 pt
por encima de un espacio disponible menor. Guardar/Mover sigue este criterio.
El panel filtrado del Mapa se extiende al borde físico: el área segura se
reserva dentro del contenido. El teclado usa el frame compartido para evitar
descontar dos veces adjustResize de Android. El detent medio suma las alturas
reales de las primeras tres filas; no multiplica la altura de la primera.

Contenido sobre superficies normales. Vidrio en navegación y capas
flotantes con fondo temático legible; reutilizar los valores por contexto
de los componentes. Cards de contenido y paneles inferiores sin sombra.
Menús y controles separados del fondo usan floatingSurfaceShadow: negro,
offset 0/4, radio 12, opacidad 0.08 claro / 0.14 oscuro, elevación 4.
Mapa, LibrarySheet y Guardar/Mover comparten sheetSurfaceTint para proteger
la lectura. Sus listas usan indicador de scroll nativo; eliminada la capa
ScrollEdgeFade de estos flujos y de Guardados/Menús porque añadía franjas.
Sin sombras naranjas repetidas en cada CTA. La
introducción conserva fotografía botánica y acciones de vidrio.

## Veracidad y protección

Plan explica Patio Gratis y disponibilidad futura de Pro. No simular compra,
precio, renovación o verificación adquirida sin implementación real.
Fechas visibles proceden de datos reales; datos sintéticos se limitan a DEV.

El bloque dayPriceField / dayPriceCurrency / dayPriceInput de
components/menu-composer.tsx conserva la geometría protegida en
[components/CLAUDE.md](../components/CLAUDE.md). Esta auditoría no lo edita.
Código y exportaciones no equivalen a aprobación visual ni lanzamiento.

## Referencias primarias

Las decisiones concretas anteriores son de Patio, orientadas por
[Layout de Apple](https://developer.apple.com/design/human-interface-guidelines/layout),
[Typography de Apple](https://developer.apple.com/design/human-interface-guidelines/typography),
[The details of UI typography](https://developer.apple.com/videos/play/wwdc2020/10175/)
y [Privacy de Apple](https://developer.apple.com/design/human-interface-guidelines/privacy/).
Apple no prescribe los tamaños, colores ni composición exactos de Patio.
La referencia Uber es [Base: List item](https://base.uber.com/6d2425e9f/p/96ccc3-list-item),
[States](https://base.uber.com/6d2425e9f/p/65ae6d) y
[Transitions](https://base.uber.com/6d2425e9f/p/312fab-transitions).
La posición concreta del precio y la elección de sheets son decisiones de Patio.

## Homologación Menús/editor — 2026-10-18

- Menús: crear y Listas en círculos de 40 pt, iconos de 20–22 y área
  táctil de 44; Listas usa carpeta como Guardados. Filas continuas con
  separador fino, padding vertical 12 y sin cajas blancas separadas.
- GlassIconButton: superficie temática bajo el vidrio para distinguirse
  sobre fondos claros; intensidad 20 claro / 16 oscuro.
- Editor: navegación 40 pt, títulos de sección 14/20 y peso 700;
  grupos separados por 12 pt. Guardar es secundario neutro; Publicar
  naranja sin glow. Cápsulas de alto mínimo 50 que crecen con el texto;
  acciones pueden pasar a otra fila. Confirmación de guardado reserva espacio.
- Identidad genérica de lugar: pin (location-outline). Menús: libro
  (book-outline/book). Publicar mi menú: create-outline
  tanto en DEV como en acceso normal. Navegación y acciones usan Ionicons. Obtener/centrar
  ubicación: flecha (navigate-outline); Cómo llegar conserva flecha de dirección.
- El bloque protegido de precio del día permanece intacto.
- Validación visual en dispositivo pendiente; no equivale a aceptación móvil.

### Giros y detalle del mapa — 2026-10-25

Se conserva la galería original Ionicons en los giros. Por corrección explícita
solo Tacos y Elotes usan `taco` y `corn` de la fuente propia `PatioGiros`
(`assets/fonts/PatioGiros.ttf`), dibujados sobre la retícula Ionicons: 512,
trazo 32, puntas redondas, sin relleno. Fuentes SVG en `design-source/patio-giros/`;
regenerar con `scripts/design/build-patio-giros-font.py` (picosvg + fontTools).
Nunca mezclar glifos de otro pack: cambian grosor y relleno.
Mapa y onboarding mantienen sus metáforas anteriores para todos los demás
casos. `lib/business-category-icons.ts` centraliza esas dos excepciones;
navegación, listas y tarjetas genéricas no cambian.

Mapa: span de latitud mayor de 0.018 agrupa lugares como puntos **sin números**;
medio muestra puntos individuales; span hasta 0.006 muestra iconos del giro.
Un lugar seleccionado conserva su detalle individual mientras no se agrupa.
Los umbrales son decisiones de Patio para QA, no requisitos de Apple.
Las búsquedas excluyen no coincidentes también de los puntos agrupados y
usan el acento para sus puntos. Los puntos representan lugares, no horarios.
Marcadores nativos conservan sus claves; al cambiar detalle se solicita un
redibujado puntual en lugar de desmontarlos o dejarlos redibujando sin límite.

## Paleta compartida entre perfiles — 2026-10-18

Theme es la fuente de fondo, superficie, borde, texto, acento e iconBg para
ambos roles. fonderoPalette adapta esos mismos tokens; no mantiene una paleta
independiente. Perfil, Cuenta, Editar negocio y Avisos usan settingsColors
compartido. Se elimina el beige exclusivo de iconos del negocio. El botón
Listas de Menús usa la misma superficie neutra de los controles de Guardados.
El mapa conserva vidrio por su contexto flotante. Verificación visual móvil
pendiente.

## Paneles y selección — 2026-10-18

Filtros y Listas muestran título en su cabecera existente. Selección vacía:
«Seleccionar listas/lugares/menús»; con selección, cuenta y tipo de contenido.
La cabecera de selección de listas ofrece Cancelar para volver a explorar
listas y omite la X duplicada; arrastre/fondo siguen cerrando el panel.
Se mantienen las cinco posiciones de acciones y su estado deshabilitado sin
selección. PinIcon representa Fijar/Desfijar y el indicador de lista fijada:
SF Symbols pin/pin.slash, fallback de chincheta MaterialCommunityIcons.
Es una excepción semántica explícita: Ionicons pin es un alfiler, no chincheta.
Auditoría e inventario: CONTROLS_AUDIT_2026-10-18.md.

## Prueba reversible de cabeceras — 2026-10-18

Decisión del usuario: probar y volver atrás si no convence. LibrarySheet centra
el título con columnas laterales simétricas medidas. Cerrar/Volver/Cancelar a
la izquierda; acciones a la derecha. Si falta espacio o fontScale supera 1.4,
el título tiene una fila propia, sin superponerse a botones. Controles mínimos
44 pt. Listas muestra Seleccionar directamente y +; se elimina el menú global
que solo contenía Seleccionar listas. Los menús de cada lista permanecen.

Nueva lista se edita dentro de la misma LibrarySheet en iOS y Android, con
tokens del tema y teclado acorde. Evita que Alert.prompt adopte un modo de
sistema diferente del tema de Patio. Campo 16 pt/400, etiqueta 13/18 y Crear
15/600. Al fallar conserva texto; al cancelar vuelve a listas; no modifica
filtros por crear una lista vacía. Editor con identidad de scroll propia.

Fundamentos consultados: Apple Sheets, Toolbars, Layout y Buttons. Centrar el
título y los umbrales son decisiones de Patio, no medidas obligatorias de Apple.
Rollback exclusivo de esta prueba:
`git apply --reverse --check docs/design/experiments/centered-sheet-header-2026-10-18.patch`
y, solo si el check pasa y se solicita volver, aplicar sin --check. No revierte
los ajustes previos de colores, iconos o paneles. Aceptación móvil pendiente.

## Ajuste fino tras capturas — 2026-10-18

Sustituye el umbral fijo de 128 pt de la prueba anterior: el ancho del título
se mide con su tipografía real mediante un texto de medición oculto también
para accesibilidad. Las columnas de controles siguen siendo simétricas para
centrar geométricamente el título. Listas, Organizar y + permanecen en una fila
cuando caben; solo se separa el título por falta de espacio real o letra grande.

Filtrar listas y organizarlas son tareas diferentes: la acción se llama
Organizar. Dentro, título estable Organizar listas; ayuda inicial Elige las
listas que quieres organizar. y luego conteo seleccionado en el mismo lugar.
Listo, a la derecha, termina la organización; no guarda ni aplica filtros.
Las acciones de organización ya efectuadas siguen su comportamiento inmediato.

Rollback de este ajuste fino: design/experiments/fine-sheet-header-2026-10-18.patch.
El patch centered-sheet-header-2026-10-18.patch también se actualiza para poder
revertir toda la prueba de cabeceras, incluido este refinamiento. Aplicar solo
el patch correspondiente y siempre comprobar primero --reverse --check.
TypeScript/lint y 181 pruebas; falta aceptación visual en dispositivo.

## Cierre de pulido de Filtros/Listas — 2026-10-18

Este corte sustituye la ayuda «Elige las listas…» y las instrucciones de los
pies de Mover/Organizar. No se agregan notas de implementación ni instrucciones
permanentes: título del contexto, nombres de controles/campos, datos reales y
estados vacíos breves. Los errores reales conservan respuesta y reintento.

- Organizar listas sin selección; al seleccionar, cuenta en el título. Listo
  termina el modo. No hay subtítulo instructivo.
- SelectionActions: cápsula de mínimo 52 pt, objetivos mínimos 48, iconos 20,
  chincheta SF Symbols regular 18 y cajas ópticas 24. Etiqueta 11/14; con letra
  grande crece y reorganiza sus acciones. Fijar se distingue de Guardar.
- Footer flotante sobre el scroll con gradiente inferior pasivo según theme.bg;
  el scroll reserva su alto real para que la última fila quede alcanzable.
  El alto natural no vuelve a sumar la reserva del footer. La capa no intercepta
  toques ni aparece en accesibilidad. Compatible con teclado y área segura.
- Mover deshabilitado sin lugares; Renombrar requiere una lista exacta. Sin
  notas que expliquen después de tocar una acción inválida. Seleccionar todas
  comunica estado mixto cuando corresponde.
- Crear/Renombrar listas comparten editor dentro de LibrarySheet en ambos roles,
  con teclado y colores del tema. Error conserva texto; cambio de vista reinicia
  scroll. Renombrar desde Organizar conserva el alto de esa vista al regresar.
- Menú por lista: limitado al espacio disponible, scroll propio, fondo fuera del
  recorrido de VoiceOver y escape/Back cierran primero el menú.
- Guardar en lista conserva datos de origen para evitar mover desde una lista
  ambigua; su campo de creación usa también teclado temático y título Nueva lista.

Fuentes consultadas: Apple HIG Sheets, Toolbars, Layout y Buttons. Medidas y
composición exactas son decisiones de Patio. Alcance verificado: TypeScript,
lint y 186 pruebas locales; revisión adicional de código independiente.
La captura del usuario guía el ajuste, pero la aceptación visual final en
celular sigue pendiente. No se certifican blur/fuentes nativas con tests JS.

Rollback de este último pulido: design/experiments/final-filter-lists-polish-2026-10-18.patch.
Comprobar con git apply --reverse --check antes de aplicar. Los patches de
pruebas anteriores se conservan como historial y no se aplican sobre este corte.

Ajuste óptico posterior: en SelectionActions, la chincheta SF de iPhone se
traslada 1.5 pt hacia abajo dentro de su caja de 24 pt. Tamaño 18, etiquetas y
objetivos táctiles intactos; Android conserva su posición. Aceptación visual
pendiente en dispositivo.

## Nueva lista: transición sin rebote — 2026-10-18

Usuario reportó parpadeo al crear y rechazó etiqueta visible duplicada.
Crear/Renombrar en Foodie y Menús conservan solo el placeholder del campo y
su accessibilityLabel; se retira el texto visible repetido por autorización
expresa. El título sigue indicando Nueva lista o Renombrar lista.

LibrarySheet conserva medidas de contenido y controles por viewKey. Naming
usa un tamaño preferido compacto y stabilizeEditor conserva el alto físico
previo cuando aparece el teclado; solo amplía si hace falta para el campo.
No reutiliza Organizar/+ en la primera medición del formulario y recupera las
medidas de Listas al volver. No se agregan timeouts ni animaciones por onLayout.
Prueba de regresión: montaje, medición de campo, teclado y regreso mantienen
el alto cuando hay espacio. TypeScript, lint y 187 pruebas locales. Verificación
del parpadeo reportado sigue pendiente en el dispositivo del usuario.
Rollback exclusivo: design/experiments/new-list-transition-2026-10-18.patch.
El patch final-filter-lists-polish también incluye este ajuste; comprobar
--reverse --check y usar solo el corte que corresponda.

## Columnas de Filtros y desvanecido compartido — 2026-10-18

En Tipo de lugar/Pago, el nombre absorbe el espacio sobrante; el valor se
ajusta hasta 45% y la flecha ocupa una caja fija de 16 pt. Las dos flechas
terminan en la misma columna con resúmenes cortos/largos. Comprobado en Yoga
con 24 combinaciones, anchos 320/393 y letra 100/160%; la medición de texto usa
SF de macOS, no una captura de iPhone. Evidencia: [resultados](design/experiments/filter-row-yoga-2026-10-18.txt) y
[fuente](design/experiments/filter-row-yoga-2026-10-18.mm).

BottomContentFade comparte theme.bg en claro/oscuro, independientemente del
rol. Se usa detrás de navegación Foodie/Fondero, acciones de selección de
Guardados/Menús y footer de LibrarySheet (Listas de ambos roles). El inicio
queda 16 pt por encima del control, igual a la reserva de scroll, para que
la última fila salga sin teñirse al llegar al final. Guardar/Mover tiene una
transición de 24 pt antes del footer y reserva 32 pt de scroll.

La capa es pasiva y oculta para accesibilidad; no se añaden bandas en cada
extremo de listas ni instrucciones auxiliares. Conserva indicador de scroll
nativo. No se cambian tamaños de botones por agregar el efecto.

TypeScript, lint y 188 pruebas locales aprobados; revisión independiente de
geometría de scroll. No equivale a aceptación visual/táctil en dispositivo.
Rollback puntual: design/experiments/filter-align-fade-2026-10-18.patch.
El patch final-filter-lists-polish incluye también este corte. Comprobar
--reverse --check antes de revertir y aplicar solo el corte correspondiente.

## Acciones de cabecera con ancho natural — 2026-10-18

La captura mostró Listo partido. La columna inicial de 44 pt restringía su
medición y onLayout devolvía ese ancho ya limitado; el texto recibía 28 pt y
no podía recuperarse. Reproducido con Yoga y SF mediante AppKit/macOS.

Las acciones se distribuyen con ancho natural y minHeight de 44 pt. Sus medidas
solo determinan insets simétricos para el título absoluto; nunca restringen
al grupo que se mide. Listo/Organizar/Limpiar tienen una línea, tipo 15/20 y
peso 600. El título pasa a otra fila cuando no cabe. Durante la primera
medición, el título absoluto está oculto para evitar solapamiento transitorio;
no se agregan timeouts. Las medidas se conservan por vista al regresar.

[Reproducción anterior](design/experiments/header-yoga-2026-10-18.txt) y
[geometría actual](design/experiments/header-current-yoga-2026-10-18.txt):
12 casos aprobados, anchos de 320/393 pt y letra al 100/160/200%. Es una comprobación de
geometría, no aprobación de renderizado nativo de iPhone.
Rollback puntual: design/experiments/natural-header-actions-2026-10-18.patch.
El combinado final-filter-lists-polish incluye este ajuste; los cortes anteriores
se conservan como historial. Siempre comprobar --reverse --check antes de aplicar.

### Escala tipográfica `Type` — 2026-10-25

`lib/theme.tsx` exporta `Type`: un rol por uso, con tamaño, interlineado y
espaciado. Todos los estilos que usaban la fuente de marca ya la usan
(`...Type.screen`, etc.); cambiar a Monument cuando haya licencia se hace solo
en `Fonts`/`Type`.

| Rol | Uso | Tamaño / interlineado / espaciado |
|---|---|---|
| `celebration` | nombre al terminar el alta | 46 / 51 / −1.6 |
| `hero` | onboarding | 40 / 42 / −1.2 |
| `screen` | título de pantalla, nombre del lugar, póster | 34 / 38 / −1 |
| `number` | calificación grande | 34 / 38 / −1 |
| `title` | vacíos grandes, sheets, perfil de foodie | 28 / 32 / −0.8 |
| `section` | títulos de sección, vacíos chicos, nombre de plan | 22 / 27 / −0.5 |
| `headline`, `body`, `subhead`, `caption`, `label` | texto del sistema | 17/22 · 15/22 · 13/18 · 12/16 · 11/14 (+1.6, mayúsculas) |

La fuente de marca no lleva `fontWeight` (solo se carga el peso 800). Texto menor
de 20 pt nunca en la fuente de marca. Mapa en oscuro: puntos naranjas sin
contorno con sombra leve.
