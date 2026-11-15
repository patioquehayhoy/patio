## Precios y carta en menu-composer.tsx

> Reescrito 2026-11-15 con el pizarrón real de Parco: «MENÚ $100» arriba (lo
> que cambia cada día) y «CARTA $110» abajo (lo de siempre), con solo las
> excepciones con precio propio (filete $125, arrachera $150). El precio va
> pegado a su bloque; la lista suelta de «varios precios» del 14 nov
> confundía (se terminaba escribiendo la carta como un precio).

- **Menú del día:** un solo precio, bloque «PRECIO DEL MENÚ» arriba de las
  secciones (`MenuData.precios[0]`). Ya no se agregan más precios; un menú
  de antes con varios los conserva con su nombre para no perderlos.
- **La carta va en el mismo editor, debajo de lo de hoy**, con título «La
  carta». Son secciones marcadas `carta` (`lib/menu-carta.ts`). La carta
  guardada se carga sola al abrir el editor; si la foto del pizarrón ya trae
  «CARTA», manda la de la foto (desde ese encabezado hacia abajo todo es
  carta: `markCartaSections`).
- La primera sección de la carta nace como «CARTA» con su precio abierto.
  Cada platillo solo lleva precio si cambia.
- Al publicar: lo de hoy se publica y la carta se guarda en `cartas` solo si
  cambió (`cartaSignature`). Si la carta falla, el menú ya quedó publicado y
  se avisa. «Guardar sin publicar» guarda el borrador completo, con carta.
- Las secciones se suben/bajan dentro de su bloque; nunca cruzan.
- Ficha y póster: «La carta» con su precio en el título cuando su primera
  sección se llama «CARTA»; las demás secciones muestran su precio común.
- Precio de sección («GUISADOS $85»): chip junto al nombre; se agrega desde
  «···» → «Precio de la sección». Vacío o «0» al salir nunca se guarda.

## Fotos de platillos (2026-11-15)

- Opcionales. En cada platillo, «Agregar foto» junto a «Agregar
  descripción»; con foto, miniatura de 40 y «Se ve al mantenerlo
  presionado». Tocarla: Tomar foto / Elegir de Fotos / Quitar foto.
- Se sube al elegirla (bucket `dish-photos`, carpeta del dueño,
  `lib/dish-photo.ts`) y la URL va en `Platillo.foto`. La ficha solo muestra
  fotos de ese bucket (`lib/dish-photo-url.ts`).
- Se recuerdan por nombre (`canonicalDishName`): la carta y los menús
  anteriores la traen sola al escribir el mismo platillo. Quitarla la olvida
  para ese nombre mientras dura la edición.
- Ficha: `components/dish-peek.tsx`. Mantener presionado abre la foto en la
  mitad contraria al dedo; soltar la cierra. Ícono junto al nombre solo si
  algunos tienen foto; con todos, solo la línea de arriba.

El precio por platillo es el mismo chip; si se cambia uno, se cambia el otro.

## Retícula del editor (2026-11-03)

- Un solo borde izquierdo (20): nombre de sección, platillo, descripción,
  «Agregar platillo», «Agregar sección», «Precio del menú» y «La carta».
- Sin ocultar secciones (2026-11-08, decisión de Parco): todas abiertas, como
  la ficha; para moverse en menús largos está la barra de secciones. (Se
  probaron la flecha en «···», la flecha visible y el índice lateral tipo
  Contactos: ninguno se sintió fácil.)
- Con 4 secciones o más, **barra de secciones** bajo la barra de navegación
  (`components/section-bar.tsx`, la misma de la ficha): nombre completo, la
  sección en pantalla marcada, tocar lleva a ella; se esconde con el teclado.
- Un solo borde derecho: «···», «×» y los chips de precio en su columna.
- Toda acción «agregar»: ícono `add` 18 + texto 15/700 en acento.
- Cierre: «Publicar menú» cápsula naranja de 54 a todo el ancho del
  contenido; «Guardar sin publicar» texto 16/400 debajo.
