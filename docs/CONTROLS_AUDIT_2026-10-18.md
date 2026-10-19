# Controles e iconografía — auditoría 2026-10-18

Cierre posterior a las capturas: columnas de Filtros corregidas y
BottomContentFade compartido en navegación y selección de ambos roles,
Listas y Mover lugares. La última fila conserva margen completo. Validación:
TypeScript/lint, 188 pruebas y [24 casos de Yoga](design/experiments/filter-row-yoga-2026-10-18.txt).
La prueba de Yoga usa medición de texto de macOS; no certifica rasterizado en
iPhone. El inventario y los cortes inferiores se conservan como historial.

Entrada: dos capturas del usuario, panel Filtros y selección de listas.

## Alcance y evidencia

Inventario de las 69 fuentes TSX de app/ y components/: 241 declaraciones de
controles y 206 lugares de renderizado de iconos. Incluye ramas condicionales,
estados vacíos, errores y menús contextuales; las cifras son sitios de código,
no instancias visibles ni recorridos aceptados en dispositivo.

[Inventario de fuentes](design/experiments/controls-inventory-2026-10-18.json).
No se encontraron nombres literales de Ionicons inexistentes ni manejadores
de toque vacíos. Esto no prueba que los servicios externos funcionen.

## Hallazgos corregidos

| Hallazgo | Corrección |
| --- | --- |
| Espacio sin información arriba de Tipo de lugar y listas | La cabecera reservada muestra Filtros/Listas. Se conserva agrupación entre cabecera y contenido. |
| 0 seleccionadas parece un resultado o un estado sin contexto | Seleccionar listas cuando está vacío; 1 lista seleccionada / N listas seleccionadas después. Mismo criterio para Guardados y Menús. |
| Cancelar y X compiten en selección | Cancelar sale del modo selección; se omite la X en ese modo. Fondo y arrastre mantienen cierre. |
| Fijar usa el marcador de Guardar | Chincheta para fijar y chincheta tachada para desfijar; el indicador de fila usa el mismo símbolo. Glifos de fallback inspeccionados antes de aplicar. |
| Añadir a lista usa marcador | Carpeta en el menú contextual de Menús. |
| Menú tiene recibo en soporte/preview y hoja en biblioteca | Hoja con texto también en esos contextos. |
| Restaurante usa libro abierto como si fuera una biblioteca | Pin de lugar en mapa y alta. |
| Reintentos de perfil/lista pública y bloqueados sin nombre explícito | Etiquetas accesibles por tarea; se conservan sus rutas de reintento reales. |
| Reportar/bloquear y ubicación del alta no anuncian carga | Estado busy/disabled comunicado a accesibilidad. |
| Alta de categorías anuncia selected en un checkbox | checked con etiqueta persistente; se respeta el máximo existente. |
| Responder/Publicar respuesta y zonas de intro sin rol/nombre explícitos | Nombres, roles y área mínima de publicación de respuesta. |

## Recorrido de código por flujo

| Flujo | Estados y acciones inspeccionados |
| --- | --- |
| Entrada y acceso | Intro, navegación por zonas, DEV, magic link, error y solicitar otro enlace. |
| Mapa y búsqueda | Abierto/horario, filtros, pago, tipos, listas, centrar, buscando, sin coincidencias, cierre y reapertura. |
| Bibliotecas de lugares | Vista/orden, selección vacía/individual/múltiple, todos, fijar, compartir, renombrar, mover, eliminar, lista vacía. |
| Guardar/mover | Origen, destino, nueva lista, selección mixta, confirmación, pendiente, fallo y reintento. |
| Publicar | Crear, cámara/flash/fotos/permisos, cancelar lectura, editor, secciones, eliminar, guardar y publicar, preview y compartir. |
| Menús | Crear, listas, reutilizar/publicar igual, renombrar, selección y acciones en lote. |
| Perfil y ajustes | Ambos roles, edición, apariencia, plan, soporte, privacidad, sesión y eliminación de cuenta. |
| Comunidad y seguridad | Seguir, guardar lista pública, error/no disponible, reseñas, respuesta, likes, avisos, reportar, bloquear y desbloquear/reintentar. |

Las acciones convencionales conservan su significado: marcador guardar,
carpeta organizar, lápiz editar, compartir, papelera eliminar, flecha centrar,
pin lugar y chincheta fijar. No se cambia un símbolo solo por variar el diseño.

## Validación y límites

- TypeScript y lint aprobados.
- 179 pruebas aprobadas: incluye cabecera con una sola salida explícita y
  variantes nativas/fallback de Fijar; pruebas existentes cubren selección,
  movimiento confirmado, errores/reintentos y viewport con teclado/letra grande.
- scripts/design/controls-preview.cjs genera seis ejemplos desde LibrarySheet,
  LibraryListRow y SelectionActions reales en React Native Web: claro, oscuro,
  sin selección, con selección y ancho 320 con letra al 160%. Datos sintéticos;
  filas de Filtros ilustrativas. Animación fijada abierta, blur y símbolos adaptados.
- La vista HTML se generó, pero la inspección en navegador quedó bloqueada por
  su política de acceso a file://. No se declara aprobación visual de ese HTML.
- Las capturas iniciales sí se revisaron. Falta aceptación visual y táctil en
  iPhone/Android; no se ejecutaron servicios, borrados, permisos ni publicaciones
  reales para comprobar iconos. No se tocó el precio del día protegido.

## Verificación de entrega tras captura 16:42

La captura conserva el desfase horizontal anterior. El bundle iOS descargado
directamente de Metro contiene disclosureLabel flex:1, valor sin flex:1 y
chevron fijo16; el proceso sirve este checkout. Se envió reload por /message
al único cliente nativo conectado y Metro registró un nuevo bundle iOS.
No se atribuye definitivamente la captura a caché ni se certifica el resultado
visual hasta verlo en el dispositivo. No se introdujo otro ajuste de layout
sin evidencia; Yoga con erratas de compatibilidad también da24/24.

## Captura de Listo partido, 16:43

Este fallo sí estaba en el código: la medición se hacía dentro de su propio
ancho limitado de 44 pt. Se retiraron esas restricciones; grupos naturales y
título absoluto independiente. Listo/Organizar/Limpiar crecen con su texto.
Reproducido el fallo anterior y comprobados 12 casos nuevos en Yoga:
[resultados](design/experiments/header-current-yoga-2026-10-18.txt).
La aceptación visual de la corrección en iPhone continúa pendiente.

## Error al abrir Listas tras ajuste del encabezado

Registro real de Metro: TypeError Cannot read property layout of null,
setLeadingMeasures en LibrarySheet. Los dos onLayout capturaban el evento
sintético dentro del updater; React Native libera nativeEvent antes de que
ese updater necesariamente se ejecute. Ambos handlers ahora capturan el
ancho numérico sincrónicamente y solo conservan ese valor.

Se añadió una regresión con actualizaciones diferidas y nativeEvent anulado:
falló antes con el mismo TypeError y pasa después; verifica las dos medidas y
el título centrado. La suite previa solo ejecutaba actualizaciones inmediatas,
por lo que no ejercitaba el ciclo de vida real de los eventos.

Validación del arreglo: TypeScript/lint y 189 pruebas aprobados; bundle iOS
verificado. No se pudo enviar recarga de recuperación: cero clientes conectados
a Metro al terminar. La apertura real de Listas después del arreglo aún no
se ha observado en el dispositivo.

## Confirmación del usuario y cierre

Después de corregir el error de eventos liberados, Alejandro respondió
«ya quedó me parece» y autorizó actualizar continuidad, pendientes, commit y
push. Se cierra el hallazgo reciente de Listas; no se extiende esa confirmación
a todos los estados, plataformas ni candidato firmado. `npm run check` del
2026-10-18: 189 pruebas, TypeScript/lint y control de release aprobados,
29 comprobaciones, 0 errores y 2 configuraciones Android pendientes.
