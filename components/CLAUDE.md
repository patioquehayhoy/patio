## El editor del menú: tarjetas con todo a la vista (menu-composer.tsx, 2026-11-16)

> Tres versiones ese día: el pizarrón con «×» (la «×» del título confundía),
> herramientas solo en el renglón activo (todo se movía y el teclado tapaba)
> y «como una nota» (la descripción y la foto dejaron de verse). La que queda
> sale de cómo lo hacen Square, Google, Uber Eats, DoorDash, Recordatorios y
> Contactos (docs/EDITOR_MENU_INVESTIGACION_2026-11-16.md).

- **Cada sección es una tarjeta** (radio 18, superficie, sin recortar para
  que lo que se arrastra salga de ella): arriba su título y su precio,
  adentro sus platillos y, al final, «＋ Platillo». Debajo de la última
  tarjeta de hoy, «＋ Sección» (y otro al final de la carta).
- **Cada platillo tiene siempre sus cuatro lugares:** el cuadro de la foto a
  la izquierda (foto o cámara gris), el nombre, la descripción debajo
  («Descripción» en gris) y el precio a la derecha («$» en gris). Los íconos
  forman una columna y los precios otra; las líneas entre platillos empiezan
  donde empieza el texto.
- **Nada se mueve al escribir:** cada campo está siempre montado (nada de
  cambiar texto por campo); solo se anima lo que llega o se va. Las
  sugerencias del sistema («Mover a la descripción», «¿Es el mismo
  platillo?») salen con el teclado cerrado. El renglón que escribes nunca
  queda bajo el teclado (`automaticallyAdjustKeyboardInsets` y
  `ensureVisible`).
- **Llenar en cualquier orden** (Parco: «se brinca de sopa a guisado»):
  - «＋ Platillo» de cualquier tarjeta escribe ahí mismo;
  - «siguiente» en un nombre abre un renglón justo debajo (de corrido o a la
    mitad); en un renglón vacío termina;
  - «siguiente» en una descripción pasa a la del platillo de abajo; en un
    precio, al precio de abajo («Siguiente» sobre el teclado);
  - «siguiente» en un título va a su primer platillo;
  - escribir «$» en un nombre lleva a su precio («Pastor $25»).
- **«siguiente»** (Parco, 16 nov; Jev proponía depender del giro y no le
  convenció): del nombre a su descripción; de la descripción al platillo de
  abajo, o a uno nuevo al final de la tarjeta. El precio va aparte, de precio
  en precio por todo el menú en el orden en que se ve (el de cada sección y
  los de sus platillos). El teclado de números no trae «siguiente»: lo da
  «Siguiente» en la barra, siempre visible; después del último precio abre
  un platillo nuevo. En un nombre vacío, «siguiente» termina.
- **Barra sobre el teclado, una por tipo de campo** (`BAR_TEXT`,
  `BAR_PRICE`, `BAR_TITLE`), con sus botones fijos; lo que hacen se lee del
  campo con el cursor en ese momento (`barActions`), así no dependen de que la
  barra se redibuje. En un platillo, «Eliminar · Listo» (pasa el cursor al
  de abajo, para limpiar el menú de ayer de corrido); en un precio,
  «Siguiente · Listo», siempre; en un título vacío, los títulos del giro y
  «CARTA» si no hay; en un título con nombre, «Eliminar · Listo».
- **Arriba, como una barra de iOS** (HIG, Toolbars; segunda vuelta del 16
  nov, docs/EDITOR_MENU_INVESTIGACION_2026-11-16.md §9): a la izquierda «‹»
  (vidrio, sin texto) y el nombre del menú; a la derecha «Ordenar» y la
  única acción destacada, la cápsula naranja «Publicar». Sin un platillo de
  hoy, «Publicar» se ve apagado. Ya no hay «Publicar menú» al final de la
  lista ni «Listo» que guarda.
- **Guardar no es un botón** (como Notas): el borrador se guarda solo al
  hacer una pausa (`AUTOSAVE_MS`), al irse la app al fondo y al salir; «‹»
  sale sin preguntar, y deslizar para regresar también guarda. Lo que el
  sistema completa al abrir (fotos conocidas, la carta) no cuenta como cambio
  (`setDataQuietly`): abrir un menú y salir sin tocar nada no crea otro en
  Menús. Si sales sin platillos, el borrador se va (como una nota vacía). El
  autoguardado nunca escribe encima de un menú ya publicado.
- **El menú publicado hoy se cambia en su lugar** (`localLive`): se abre así
  desde Menús (`editorSeed`) y desde «Editar» después de publicar. Arriba
  lleva «×» y «Actualizar», que se enciende cuando algo cambió; no se guarda
  solo (lo que cambias no se ve en la calle hasta «Actualizar»). «×» con
  cambios pregunta ahí mismo «Actualizar menú» o «Descartar cambios», y
  deslizar para regresar se desactiva. Actualizar no vuelve a avisar a
  quienes te siguen (el servidor avisa una vez al día) y la confirmación dice
  «Actualizado». Un menú publicado otro día se abre como copia nueva.
- **Foto:** tocar el cuadro abre ahí mismo Tomar foto, Elegir de Fotos y
  Quitar foto (anclado al cuadro).
- **En prueba (Parco, 16 nov): sin modo Ordenar, como Recordatorios.** En el
  panel mismo, con el teclado cerrado: mantener presionado un platillo o un
  título (`HOLD_IN_PLACE_MS`, 450 ms, el medio segundo de iOS; con 280 un
  toque lento ya levantaba y se sentía atorado) lo levanta y se mueve igual
  que en Ordenar (huecos, copia que sigue al dedo); soltarlo donde estaba lo
  regresa al instante. Deslizarlo a la izquierda abre
  «Eliminar» y hasta el fondo lo elimina (`components/swipe-row.tsx`;
  mantener y deslizar compiten con `Gesture.Race`).
- **Deslizar, como las listas de iOS al pie de la letra** (`SwipeRow`, el
  mismo en el editor y en Menús): se desliza la fila completa con su fondo
  (`background`: el lienzo y encima la tarjeta; la tarjeta recorta sus
  esquinas) y las acciones aparecen detrás, a todo lo alto. Los botones están
  quietos detrás de la fila y ella los destapa (cortina): las palabras no se
  mueven ni se estiran, y cada botón mide lo que su palabra (mínimo 76; así
  «Eliminar» no se corta). Más allá de los botones solo crece el color. En
  Menús la fila cruza la orilla de la lista (`outerStyle`) para que los
  botones lleguen al borde de la pantalla; el texto y la línea no se mueven.
  Al soltar se abre o se cierra, nunca a medias. Una sola fila abierta a la vez: tocar
  otra fila, tocar fuera, desplazar o arrastrar la cierra, y tocar la fila
  abierta solo la cierra. Hasta el fondo (`fullSwipe`, solo donde hay
  «Deshacer») hace «Eliminar» con un golpecito al pasar el punto; si la
  acción no se pudo, la fila regresa. En Menús no hay «···»: deslizar
  muestra «Más» (lo demás, en el mismo menú anclado) y «Eliminar» (pide
  confirmar: no tiene «Deshacer»); mantener presionado sigue seleccionando
  varios, igual que en Guardados. Con VoiceOver, «Más acciones» y
  «Eliminar» son acciones de la fila. Si la app se va al fondo a medio
  arrastre, todo regresa a su lugar. Con el teclado abierto no
  hay gestos (se selecciona texto; «Eliminar» está en la barra). No apagar
  los gestos a medio arrastre: apagar un gesto activo lo cancela. El botón
  «Ordenar» está oculto (`SHOW_ORDER_MODE`); su modo sigue en el código por
  si se regresa.
- **Ordenar** (Jev: 61 % frente a mantener presionado 38 %): es el modo
  edición de las listas de iOS. «Ordenar» arriba y, mientras ordenas, arriba
  solo queda «Listo» (el lugar de «‹» se guarda vacío para que el nombre no
  se mueva). Cada platillo (con su foto, en su columna) y cada título se
  recorren a la derecha para mostrar el botón rojo; a la derecha, su manija
  (≡). Eliminar pide dos toques, como en iOS: el botón rojo gira y abre
  «Eliminar» en lugar de la manija; desplazar, levantar algo u otro botón
  rojo lo cierran. Como en Ordenar no se escribe, arrastrar ya no pelea con
  el texto: desde la manija, al instante (`handleFor`), o desde cualquier
  parte del renglón con un toque sostenido corto (`rowFor`, 180 ms; deslizar
  sigue desplazando la lista).
  Al arrastrar, como en iOS: lo levantado sube y sigue al dedo (una copia
  encima de la lista, recortada a ella) y los demás se recorren para abrirle
  su hueco; sin línea de «aquí cae». El renglón original sigue montado
  (invisible y encogido) porque su gesto vive en él, y los huecos son vistas
  siempre montadas que solo cambian de alto (si algo se desmonta a medio
  arrastre, el gesto se cancela). El lugar se elige con lo medido al
  levantar (`slots`), así el hueco no brinca. Al soltar, la copia se asienta
  y el menú cambia en el mismo instante que se cierran los huecos (sin
  animación de por medio).
  Levantar y soltar (16 nov): la copia es idéntica al renglón (mismas líneas,
  «Descripción» y «$» en gris, misma columna de precio, mismo fondo de la
  tarjeta) y no crece: al levantar solo aparece la sombra (`LIFT_MS`) y al
  soltar la copia se desliza a su lugar mientras la sombra se apaga
  (`SETTLE_MS`); ninguna letra brinca. Si lo sueltas donde estaba o el toque
  se cancela, su lugar se vuelve a abrir mientras regresa. Las fotos del
  editor van con `cachePolicy="memory-disk"`: al pasar a otra tarjeta no
  parpadean.
  **La regla que lo rompía** («presiono el platillo y al segundo se
  resetea», 16 nov): en el camino del dedo a la lista (el renglón, su
  envoltorio, la tarjeta y la sección) ninguna vista puede pasar de
  «aplanada» a no aplanada a medio arrastre. React Native no le da vista
  propia a un View sin color ni efectos; en cuanto recibe opacidad,
  transform, zIndex o recorte, saca a sus hijos y los vuelve a meter, y iOS
  cancela el toque. Por eso esas vistas llevan `collapsable={false}` desde
  el principio: no quitarlo ni agregar estilos de arrastre a una vista sin
  él. Un toque cancelado regresa todo a su lugar (`onEnd` con `success`).
  La lista es el `ScrollView` de gesture-handler y cada arrastre lo bloquea
  (`blocksExternalGesture`): la lista espera a que el arrastre falle antes de
  desplazarse. Sin esa relación la lista empezaba a moverse y cancelaba el
  arrastre (no quitarla). Si la lista aún no se midió, se usa la pantalla.
  Cerca de la orilla la lista se desplaza sola. «Listo» termina. Mientras
  escribes no hay gestos sobre el texto. Con VoiceOver, la manija se ajusta
  con «Subir» y «Bajar».
- **Eliminar** (la palabra de iOS): «Eliminar» de la barra del teclado o el
  botón rojo de Ordenar y su «Eliminar», o deslizar; siempre con «Deshacer»
  (con el teclado abierto, el aviso va arriba de él). «Deshacer» se va solo a
  los 6 s (`UNDO_MS`, como el aviso de Mail); con VoiceOver no se va solo.
  Excepción pedida por Parco a la regla de no quitar avisos con temporizador:
  esa regla es para confirmaciones; un «Deshacer» pegado estorba.
  Lo que se queda vacío se va solo al salir de él (un renglón; una sección
  nueva sin título ni platillos).
- Un menú leído de una foto se guarda solo en cuanto llega (la lectura
  cuesta); arriba de la primera tarjeta, «Tomar otra foto».
- **La carta se reconoce por su encabezado** (`lib/menu-carta.ts`,
  `cartaByHeading`): desde la sección «CARTA» (o «A LA CARTA», «LO DE
  SIEMPRE») hacia abajo todo es carta y se queda para los días que siguen.
- **Menús de antes** (`boardFromMenu`): los precios del menú pasan a
  encabezados arriba de lo de hoy; una carta guardada sin encabezado recibe
  «CARTA». «Incluye…» se quita.
- Al publicar: lo de hoy se publica y la carta se guarda en `cartas` solo si
  cambió (`cartaSignature`, que cuenta también fotos y otros nombres).

## «Crear» del negocio (new-menu-sheet.tsx, 2026-11-16)

- El «＋» de la barra del negocio es «Crear»: arriba «MENÚ DE HOY» (Tomar
  foto, Elegir de Fotos, Escribir a mano); abajo «AVISOS» (Avisar a quienes
  te siguen y, con Pro, Aviso especial con los que quedan). Actividad queda
  solo con lo que pasó.

## Fotos de platillos (2026-11-15)

- Opcionales. En el editor, el cuadro de la izquierda de cada platillo (foto
  o cámara gris), sin leyenda. Tocarlo: Tomar foto / Elegir de Fotos /
  Quitar foto.
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
- «Publicar» / «Actualizar» vive arriba a la derecha: cápsula naranja de 36
  (radio 18, texto 15/700). Ya no va al final del contenido (con el teclado
  arriba no se veía).
