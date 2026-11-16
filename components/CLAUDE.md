## El editor es un pizarrón (menu-composer.tsx, 2026-11-16)

> Decisión de Parco tras probar dos bloques fijos («MENÚ DEL DÍA» / «LA
> CARTA» con su renglón de precio): se sentía parchado. Ahora el editor es
> como el pizarrón: solo secciones, cada una con su título y su precio.

- **Todo es sección:** título + «$» (el mismo chip vacío que el de cada
  platillo; al tocarlo se escribe) + «×» (quitar, se puede deshacer), igual
  que cada platillo. Sin «···» ni flechas (2026-11-16, Parco).
- **Mover = mantener presionado y arrastrar** (`components/board-drag.tsx`,
  gestos nativos de RNGH + Reanimated, sin librerías nuevas): un platillo
  (sosteniendo su nombre) va a cualquier lugar, también a otra sección o a
  la carta; una sección (sosteniendo su título) se mueve completa. Lo que se
  arrastra se levanta; una línea naranja marca dónde caerá; cerca de la
  orilla la lista se desplaza sola. Tocar el nombre o el título sigue
  siendo escribirlo. Con VoiceOver: acciones «Subir» y «Bajar».
  «MENÚ DEL DÍA $100» es una sección, con o sin platillos debajo (un
  encabezado con precio se guarda aunque no tenga platillos); «GUISADOS
  $85», otra; «CARTA $110», otra. Sin etiquetas de bloque, sin renglones de
  «Precio» ni «Incluye» aparte (lo que incluye lo dicen los platillos).
- **La carta se reconoce por su encabezado** (`lib/menu-carta.ts`,
  `cartaByHeading`): desde la sección «CARTA» (o «A LA CARTA», «LO DE
  SIEMPRE») hacia abajo todo es carta y se queda para los días que siguen; lo
  de arriba es lo de hoy. Debajo del título «CARTA», una sola línea lo dice.
  Renombrarla o moverla cambia qué es carta, como en el pizarrón. Se
  agrega con el chip «CARTA» de las sugerencias; después, «Agregar sección»
  al final agrega secciones a la carta.
- **Menús de antes** (`boardFromMenu`): los precios del menú (`precios`,
  también los que lee una foto) pasan a encabezados arriba de lo de hoy; uno
  solo sin nombre bautiza la primera sección como «MENÚ DEL DÍA». Una carta
  guardada sin encabezado recibe «CARTA». «Incluye…» se quita.
- **Sin pasos:** se pensó en un recorrido por pasos y se descartó (el menú se
  publica a diario). La primera sección sugiere su título («MENÚ DEL DÍA» en
  la comida corrida; el del giro en los demás) y, en un menú nuevo hecho a
  mano, el cursor espera en el primer platillo.
- Al publicar: lo de hoy se publica y la carta se guarda en `cartas` solo si
  cambió (`cartaSignature`). Para publicar o guardar hace falta un platillo
  de hoy. Ficha, tarjeta y póster muestran el encabezado con precio; la
  tarjeta toma como precio del menú el de la sección que se llama «MENÚ…» o
  «COMIDA CORRIDA».

## Fotos de platillos (2026-11-15)

- Opcionales. En cada platillo, «Agregar foto» junto a «Agregar
  descripción»; con foto, miniatura de 40 y «Se ve al mantenerlo
  presionado». Tocarla: Tomar foto / Elegir de Fotos / Quitar foto.
- Se sube al elegirla (bucket `dish-photos`, carpeta del dueño,
  `lib/dish-photo.ts`) y la URL va en `Platillo.foto`. La ficha solo muestra
  fotos de ese bucket (`lib/dish-photo-url.ts`).
- Se recuerdan por la identidad del platillo (ver abajo): la carta, los
  menús guardados en el teléfono y los publicados en los últimos 60 días
  (`loadRecentMenus`, servidor: funciona aunque cambie de teléfono) la traen
  sola al escribir el mismo platillo. Quitarla la olvida para ese platillo
  mientras dura la edición.
- Menú: solo el ícono de imagen junto al nombre de cada platillo con fotos;
  sin número ni leyenda («toca / mantén presionado»): era demasiada
  información (Parco, 2026-11-15). Espacios que no se parten: nunca baja solo.
- Ficha, vistazo (`components/dish-peek.tsx`): mantener presionado abre UNA
  foto (la mejor) en la mitad contraria al dedo; soltar la cierra. Dentro de
  la foto, fundidos abajo, como en el carrusel: quién la subió y «1/5» si
  hay varias.
- Ficha, fotos en su lugar (`components/dish-gallery.tsx`): tocar un platillo
  con fotos las abre ahí mismo, debajo de él, dentro del menú (una a la vez);
  tocarlo otra vez las cierra. Sin hoja encima: con una hoja de pantalla
  completa se perdía el contexto (dónde estabas en el menú).
  - Cada foto a todo lo ancho; se probó dejar asomar la siguiente (~10 %) y
    no gustó.
  - Sobre la foto, fundidos abajo (velo, sin cápsulas), solo quién la subió
    (lleva a su perfil; en desarrollo la gente de prueba abre un perfil de
    prueba) y «3/12» a la derecha. Número y diagonal, sin «fotos» ni puntos:
    los puntos dejan de servir pasadas 7–8 fotos (Baymard, «Page Control
    UI», 2026). VoiceOver dice «3 de 12».
  - Sin frases sobre la foto (Parco, 2026-11-15): la foto queda limpia y la
    historia vive en la reseña (600). Se probaron una frase de 140 debajo
    (dejaba un hueco bajo la foto del negocio) y dentro de la foto con «… más»
    (cargaba la foto de texto). La reseña ya no pide frase de la foto.
  - Debajo, un solo renglón fijo, igual en todas: la fecha («15 nov 2026», como su
    reseña) a la izquierda y el corazón a la derecha. Si ninguna foto es de cliente, no
    hay renglón. Nada brinca al deslizar (web.dev, CLS: deslizar no cuenta
    como aviso de un cambio de diseño).
  - Tocar la foto de un cliente abre sus opciones con «Ver la reseña»
    primero (la tuya: Corregir platillo, Quitar; la de otro: «No es de este
    platillo», Reportar). Dos toques: me gusta. Mantenerla presionada abre
    lo mismo.
  - El corazón va en la MISMA columna que el de cada platillo del menú: caja
    de 21 pegada al borde derecho, ícono de 17, y el número a su izquierda
    («10 ♡»). Igual en la vista del negocio («3 ♥»). Un corazón fuera de esa
    columna se nota de inmediato (Parco, 2026-11-15).
  - Lo tuyo lleva tu nombre, nunca «Tú» (como Facebook o Instagram): en tus
    fotos, tu reseña y tus comentarios. Se sabe que es tuyo por tu nombre y
    porque sus opciones son corregir o quitar. Las respuestas del negocio
    llevan el nombre del negocio.
    Tu nombre vive en memoria desde que abre la app (`lib/my-public-name.ts`)
    y en las reseñas reales llega con la reseña: nunca aparece tarde.
  - «Me gusta» = el de la reseña de donde sale la foto (una visita, un «me
    gusta»): corazón o dos toques en la foto; responde al instante y la
    ficha se pone al día después (`startTransition`). Sin corazón en las del
    lugar ni en las tuyas.
- Foto en la reseña (`components/review-photo.tsx`): se abre grande ahí
  mismo, dentro de la reseña; «Ver en el menú» es opcional. Todo salto dentro
  de la ficha (reseña → platillo, foto → reseña) deja una cápsula «Volver a
  la reseña» / «Volver al platillo» en el lugar de «Volver arriba»; se va al
  tocarla o si regresas desplazándote.
- Perfil de una persona (`app/foodie/[id].tsx`, 2026-11-15): además de sus
  lugares y listas, «SUS FOTOS» (cuadrícula de 3; tocar una abre el lugar
  con ese platillo abierto: parámetro `platillo` de la ficha) y «SUS
  RESEÑAS» completas (`getReviewsByAuthor`). Si el perfil es privado y no lo
  sigues, no se ven. En desarrollo, la gente de prueba muestra lo suyo
  (`demoReviewsByAuthor`).
- Lo que un negocio NO puede hacer: borrar ni ocultar reseñas, fotos o
  comentarios de clientes (las reseñas no se reescriben). Puede responder
  en público y reportar lo que rompa las reglas. Borrar un platillo del menú
  solo quita la entrada desde el menú: la reseña y su foto se quedan.
- Rapidez de la ficha: abrir el vistazo o las fotos de un platillo no repinta
  la ficha entera; viven en su propio estado (`lib/tiny-store.ts`). Las
  fotos de cada platillo se ordenan una sola vez (`dishPhotosByKey`).
- Sin botón para subir fotos en el menú (se probó «Agregar tu foto» y no
  gustó): las fotos se suben en la reseña.
- Carga de fotos (que nunca se sienta lenta):
  - Vista previa instantánea: ThumbHash de ~25 bytes calculado al subir
    (`lib/photo-hash.ts`, en hexadecimal) que viaja con el menú y la reseña;
    se pinta difuminado mientras baja la foto.
  - Prioridad: la foto en pantalla primero; el carrusel solo monta la actual
    y sus vecinas.
  - Precarga: al poner el dedo en un platillo, y las portadas de los
    platillos en pantalla cuando dejas de desplazarte.
  - Fotos de reseñas solo cuando las reseñas están cerca.
  - Caché en memoria y disco; al subir, 1200 px por el lado largo y calidad
    0.72 (~150 KB).
- Orden: `lib/dish-photos-order.ts` — negocio, luego clientes de 90 días
  (una por persona primero), luego las viejas. Las estrellas no ordenan.

## Identidad del platillo (2026-11-15, `lib/dish-identity.ts`)

Un platillo se reconoce por quién es, no por el texto exacto. TODO lo que se
cuelga de un platillo usa esta identidad: su foto (editor), las fotos de
clientes (ficha), sus «me gusta», el recomendado, el enlace de una reseña a
su platillo en el menú y la búsqueda (los otros nombres viajan en el menú).

1. **Misma llave, se junta sola** (`dishKey`): solo cambian plurales,
   acentos, mayúsculas, relleno («de», «con», «orden de»…) u orden. «Taco al
   pastor» = «Tacos de pastor»; «Mole con pollo» = «Pollo con mole».
2. **Parecido, se pregunta una vez** (`compareDishNames` → 'maybe'): uno
   agrega palabras («Pozole» / «Pozole rojo») o hay errata («Pzole»). En el
   editor, bajo el platillo: «¿Es el mismo platillo que «Pozole»? Se juntan
   su foto y 12 fotos de clientes.» → «Sí, es el mismo» / «No». Solo sale
   si el otro trae foto o fotos de clientes. «No» se recuerda por par
   (`lib/dish-links.ts`) y no vuelve a salir.
3. **Confirmado**: el platillo guarda sus otros nombres (`Platillo.antes`,
   en la ficha `aliases`) y viajan con el menú publicado; la ficha junta lo
   de todos (`dishKeysOf`). Los nombres de un mismo platillo forman una sola
   familia en la memoria del editor: escribir cualquiera trae foto y nombres.

Nunca se juntan solos ni se sugieren dos platillos con palabras distintas
(«Pozole rojo» y «Pozole verde»): quien cocina decide. Pendiente: las
estadísticas de «me gusta» por platillo del negocio (Actividad) todavía
separan nombres.

El precio por platillo es el mismo chip; si se cambia uno, se cambia el otro.

## Retícula del editor (2026-11-03)

- Un solo borde izquierdo (20): nombre de sección, platillo, descripción,
  «Agregar platillo» y «Agregar sección».
- Sin ocultar secciones (2026-11-08, decisión de Parco): todas abiertas, como
  la ficha; para moverse en menús largos está la barra de secciones. (Se
  probaron la flecha en «···», la flecha visible y el índice lateral tipo
  Contactos: ninguno se sintió fácil.)
- Con 4 secciones o más, **barra de secciones** bajo la barra de navegación
  (`components/section-bar.tsx`, la misma de la ficha): nombre completo, la
  sección en pantalla marcada, tocar lleva a ella; se esconde con el teclado.
- Un solo borde derecho: «×» y los chips de precio en su columna.
- Toda acción «agregar»: ícono `add` 18 + texto 15/700 en acento.
- Cierre: «Publicar menú» cápsula naranja de 54 a todo el ancho del
  contenido; «Guardar sin publicar» texto 16/400 debajo.
