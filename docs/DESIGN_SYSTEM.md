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

Paneles iniciales sin título redundante «Filtros» / «Tus listas»; conservan
cerrar y acciones. Subpantallas identifican criterio o tarea: Tipo de lugar,
Pago, Destino o Nueva lista.

## Listas, selección y feedback

LibrarySheet, LibraryListRow, SelectionActions y RenameDialog son comunes.
«Todos los lugares» usa la misma selección izquierda que las demás filas.
Nombres largos: dos líneas, cuenta legible y nombre completo accesible.
Fijar usa marcador; renombrar, lápiz sólido.

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
