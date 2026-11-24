## Corrección de Parco — publicar, nombre y secciones (2026-11-24)

- «Publicar» sale ahora, siempre; «Programar» solo ofrece días. Nunca dos
  botones que abran la misma lista.
- El menú vigente se llama «Lo que ven hoy» (encabezado en negritas,
  `Type.label`) y «Lo ven hoy» en la fila y el editor (Jev 43 %).
- Título de sección: con el teclado cerrado, una capa recibe el toque (el
  texto de iOS cancelaba el arrastre). Detalle y datos:
  `docs/AUDITORIA_JEV_APP_2026-11-24.md`.

## Continuación — lectura y menú público (2026-11-22)

Publicado hoy abre Mi Patio; Editar abre editor. Imagen para compartir está
al deslizar y en acciones VoiceOver. Los menús de biblioteca siguen editables.
Agotados conservan nombre tachado y texto secundario legible en ambas vistas,
con Se acabó explícito en lugar del precio. No opacidad sobre controles.
**Decidido 2026-11-23:** el tachado se queda (Apple, Jev y CDF en
`docs/AGOTADOS_Y_VARIOS_NEGOCIOS_2026-11-23.md`). No volver a proponer
quitarlo sin datos nuevos. Nunca tachar el precio, ni ocultar o reordenar el
platillo, ni dejarlo casi transparente.
Lectura: cancelar corta la red; el teléfono espera hasta 120 s
(`READ_DEADLINE_MS`), más que los 110 s del servidor. Medición en los logs de
`read-menu`.

## Corrección de Parco — sin manijas (2026-11-22)

Parco rechaza los iconos/manijas de arrastre: no los pidió ni los validó.
Retirados; se restaura mantener presionada la fila/título para mover, con
teclado cerrado. Pendiente resolver competencia con selección de texto sin
reintroducir manijas. QA visual exclusivamente de Parco.

## Corte vigente — editor continuo y menú publicado (2026-11-22, Parco/Codex)

Este corte sustituye la forma de tarjetas del 16 nov y programar por toque
sostenido. QA visual y de uso solo por Parco en su iPhone; no correr QA
visual en simulador ni darla por aprobada con pruebas de código.

- Editor continuo: fondo del lienzo, sin borde ni tarjeta por sección.
  Títulos `Type.section`, campos estables y columnas de foto/precio.
  Se conservan `collapsable={false}` y los dueños de los gestos de arrastre.
- «Actualizar» disponible si hay platillos; el detector de cambios solo
  informa y protege al salir, no bloquea el botón.
- Estado separado del botón: borrador (guardando/guardado/error), publicado
  hoy, cambios sin publicar o programado. Nunca confirmar guardado antes
  de la escritura real.
- «Programar» visible junto al estado del borrador. No depender de mantener
  presionado Publicar. Lo programado para hoy conserva su hora al editarlo.
- Menús separa «Publicado hoy» de la biblioteca y ofrece Ver menú y Editar.
  La fecha y `publish_at` determinan qué está publicado, nunca la posición.
- Crear es una sola hoja: grupos por contenido, sin tarjetas independientes.
- VoiceOver: el nombre del platillo y el título de sección ofrecen Subir y
  Bajar cuando hay destino dentro de su lista. Validación en iPhone pendiente.
- «No» a vegetariano se guarda; es distinto de no haber contestado.
- Fecha por defecto y nombre opcional (Parco, 22 nov). El campo lo dice;
  estados del no publicado breves, sin explicar «se guarda solo» cada vez.
- Póster: agotado se expresa como Se acabó en la columna del precio, con
  nombre tachado y de menor énfasis, igual que la ficha. Mantener legibles
  descripción, estado y controles; no bajar la opacidad de la fila completa.
  Refrescar publicación antes de habilitar compartir.
- Conteos positivos junto al corazón también para público. La hojita del
  platillo conserva su significado vegetariano; no reservar casillas vacías
  para atributos que aún no existen.
- Segunda revisión de Parco (22 nov): nombre editable a todo el ancho al
  inicio del contenido, con título por fecha si no tiene uno; Publicar y
  Programar juntos en navegación. Publicado hoy es una sección continua
  (tercera revisión, 22 nov): encabezado discreto y Editar a la derecha;
  nombre en fila navegable, sin marco, barra lateral ni fondo propio. Sus
  ejes coinciden con la biblioteca. Los menús anteriores abren una copia sin contexto vivo;
  el editor se reinicia con el menú elegido al recuperar foco.
- Disponibilidad: la conversión DEV usa `menuDataToSections`, igual que el
  menú público. La ficha recarga al recuperar foco. Deslizar un platillo
  deja 12 pt entre el contenido desplazado y los botones revelados.
- Negocio sin registro en DEV: Hoy, Actividad y seguidores comparten
  `business-demo.ts`, con rótulos de datos de ejemplo. No crear sesión ni
  enviar esos números al servidor; las cuentas reales conservan sus RPC.
- Las opciones de la campana muestran su explicación visualmente y a
  lectores de pantalla. No basta con una ayuda de accesibilidad invisible.

Auditoría y casos pendientes: `docs/QA_Y_FLUJOS_2026-11-22.md`.

## Referencia histórica — editor con tarjetas (2026-11-16)

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
  (vidrio, sin texto) y el nombre del menú; a la derecha la única acción
  destacada, la cápsula naranja «Publicar». Sin un platillo de
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
- **Mover y quitar ahí mismo, como Recordatorios** (Parco, 16 nov). En el
  panel mismo, con el teclado cerrado: mantener presionado un platillo o un
  título (`HOLD_IN_PLACE_MS`, 500 ms, el medio segundo de iOS; con 280 un
  toque lento ya levantaba y se sentía atorado) lo levanta (huecos, copia que
  sigue al dedo); soltarlo donde estaba lo regresa al instante. El modo aparte
  «Ordenar» (botón rojo y manija ≡) estuvo oculto desde el 16 y se quitó el
  21 nov; si se necesita, está en git en el commit 7c036a0. Deslizarlo a la izquierda abre
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
  Al soltar se abre o se cierra, nunca a medias.
  **Rapidez:** los gestos se crean una vez por renglón (`useMemo` en
  `SwipeRow`, caché por renglón en `board-drag`) y llaman a lo de ese momento
  por un `ref`. Crearlos en cada render hacía que gesture-handler los volviera
  a mandar al hilo de la interfaz en cada letra, renglón por renglón (el
  editor se sentía lento). Prender o apagar un gesto cambia su configuración
  en su lugar (`.enabled()`), sin crear otro. Una sola fila abierta a la vez: tocar
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
  los gestos a medio arrastre: apagar un gesto activo lo cancela.
- **Arrastrar** (`components/board-drag.tsx`, `rowFor`). Como en iOS: lo levantado sube y sigue al dedo (una copia
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
  La copia se arma con los mismos campos que el renglón (`TextInput` sin
  editar, mismos marcadores) para que cada letra caiga en el mismo pixel, y
  se coloca con `top` (React, en el mismo instante en que aparece) más un
  `delta` del dedo que al levantar vale 0: así nunca se dibuja un cuadro en
  otro lado que luego brinca (el «juego» vertical al mantener presionado).
- **Tiempos de Apple** (Parco: «basarse 100 % en Apple»; excepción a los
  200 ms generales de Patio). Lo que Apple documenta: mantener presionado
  0.5 s (`HOLD_IN_PLACE_MS`, UILongPressGestureRecognizer); lo que sigue al
  dedo (abrir o cerrar una fila, soltar lo levantado) es un resorte sin
  rebote que arranca con la velocidad del dedo (WWDC23, «Animate with
  springs»; `withSpring` con `dampingRatio: 1`); lo que se recorre solo, la
  duración estándar de UIKit, 0.25 s. Con Reducir movimiento (HIG,
  Accessibility) nada se desliza solo: los huecos y lo que sueltas cambian
  de una vez y las filas cierran rápido y sin resorte.
  Lo que Apple NO documenta y es número de Patio: 350 ms del resorte
  (`SNAP_MS`, `SETTLE_MS`), 120 ms con Reducir movimiento (`QUICK`), 200 ms
  al salir la fila eliminada (`OUT`) y el ancho mínimo de 76 de cada botón. Los 0.25 s son la duración
  por defecto de UIKit (`CATransaction`), no una cifra de la HIG.
  Prender o apagar un gesto memorizado con `.enabled()` sí llega al nativo:
  `GestureDetector` (gesture-handler 2.28) vuelve a mandar la configuración
  en cada render; lo caro que se evita es reconstruir los manejadores del
  hilo de la interfaz. Los gestos de `board-drag` se sueltan solos cuando su
  platillo o sección ya no existe.
  **Nada se queda flotando** (21 nov; en el rastro de Parco solo las
  secciones se quedaron levantadas, de 5 a 15 s, hasta que la app se fue al
  fondo):
  - Solo el gesto que levantó algo lo mueve y lo suelta (`owner`): otro
    renglón o un segundo dedo no lo tiran ni lo cancelan.
  - Si el dedo se levanta y el gesto no avisa en 120 ms
    (`TOUCH_UP_GRACE_MS`), cae donde está.
  - Si el gesto se perdió (400 ms sin avisos, `ORPHAN_MS`), el siguiente
    toque en la lista, o levantar otra cosa, lo suelta.
  - Levantar algo mientras lo anterior se asienta lo acomoda de una vez.
  - Un error al mover nunca deja la copia encima.

  Los 120 y 400 ms son números de Patio. Cada final deja en Metro
  `[ordenar] suelta|cancela … por: <motivo>`; si vuelve a pasar, ese motivo
  dice qué camino falló. Pruebas: `scripts/tests/board-drag.test.cjs`.
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
  Cerca de la orilla la lista se desplaza sola. Mientras escribes no hay
  gestos sobre el texto. Pendiente: con VoiceOver aún no hay «Subir» y
  «Bajar» en el panel (vivían en la manija de «Ordenar»).
- **Eliminar** (la palabra de iOS): «Eliminar» de la barra del teclado o
  deslizar; siempre con «Deshacer»
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

## Menús anclados (action-sheet.tsx, 2026-11-16)

- Como los menús de iOS: el texto a la izquierda y el símbolo a la derecha,
  en su columna; lo que borra va en rojo (texto y símbolo, `danger`). La
  palomita solo reserva su columna a la izquierda si el menú elige algo
  (`selected`). Antes el símbolo iba primero y dejaba un hueco a la derecha
  (Parco: «mucho padding a la derecha»).

## Avisos del negocio: a dónde llevan (lib/notification-routes.ts, 2026-11-21)

- Cada aviso abre donde se hace lo que pide, sin pasos de más:
  «¿Ya publicaste lo de hoy?» → el editor con tu último menú ya listo
  (`/menu-editar?desde=ultimo`, `latestMenuSeed`): cambias lo que no hay y
  «Publicar». «Nueva reseña · Toca para responder» → Actividad (`/resenas`).
  «Hoy: N personas vieron tu menú» → Hoy.
- Nunca «publicar igual que ayer» de un toque: un menú viejo publicado sin
  mirar manda a alguien por un guisado que ya no hay (se rompe la confianza
  en «¿Qué hay hoy?»). El trabajo se reduce a revisar y cambiar.
- El recordatorio (`syncPublishReminder`, plan en `planPublishReminders`)
  solo sale los días que no has publicado, una hora antes de abrir (entre 7 y
  12; sin horario, a las 10) y nunca los días que cierras ni los que avisaste
  «Hoy no abrimos» (`lib/closed-days.ts`). Jev
  (docs/research/jev-publicar-avisos-2026-11-21.json), solo negocios:
  - Tras 3 días que abres sin publicar, uno que pregunta («¿Te seguimos
    avisando a diario?») y luego uno por semana (pausa 53 %, semanal 45 %,
    diario 3 %). Publicar o «Avísame a diario» lo regresa a diario; no
    cuentan los días antes de prender el aviso.
  - Botón «Hoy no abro» en el aviso (99 %): abre «Avisar» y manda «Hoy no
    abrimos» de un toque (al momento a «Todas»; en el resumen de los demás).
  - Publicar ya cerrado: el menú queda, pero a quienes te siguen no les llega
    aviso (61 %; servidor, `_shared/publication-window.ts`). Sin horario, no
    hay avisos de 9 pm a 7 am.
  - «Ayer · N personas vieron tu menú» llega en la mañana, a la hora del
    aviso de publicar (61 % frente a 22 % a las 6 pm); si aún no publicas,
    tocarlo abre tu último menú. Migración 20261121100000, cada hora de 7 a 12.
  - «Abrí hoy, mismo menú» de un toque: descartado. Un menú que no cambia es
    carta fija y se ve siempre sin publicar (81 %); que la app lo publique
    sola cada día a las 9: 3 %. Hechos: dejar listo el menú de otro día
    (fonda 3.75 de 4) y «Se acabó» por platillo (fonda 3.2 de 4); un día que
    ya tiene menú programado no lleva aviso.

## Vegetariano en el editor (2026-11-21)

- Solo la hojita, nunca la palabra (Parco): junto al nombre del platillo en
  el editor y en la ficha. Se marca o se quita con la hojita de la barra del
  teclado mientras escribes el platillo, o contestando «¿Es vegetariano?»
  cuando el nombre lo parece (`lib/dish-diet.ts`). No va en deslizar:
  deslizar es para quitar o «Se acabó».

## Notificaciones de los lugares que sigues (2026-11-21)

- Modelo completo, ritmos de negocio y casos pendientes:
  `docs/NOTIFICATION_ARCHITECTURE.md`, «Modelo vigente».
- La campana de YouTube tal cual: «Todas», «Personalizadas» (por defecto) y
  «Ninguna» (`PATIO_NOTIFY_LABELS`, íconos y ayudas en
  `lib/community-notifications.ts`). En la ficha, «Siguiendo» lleva la campana
  del estado en lugar de la flecha y abre NOTIFICACIONES (las tres) y LUGAR
  (lista, dejar de seguir). «Elegir lugares» usa el mismo menú anclado.
- Nunca inventar nombres para estas opciones: usar las palabras que la gente
  ya conoce de las redes (Parco rechazó «Cada vez»).
- «Hoy no abro» (botón del aviso de publicar) abre «Avisar» y lo manda solo
  (`auto=1`): al momento a «Todas», en el resumen de los demás.

## Publicar más tarde y «Se acabó» (menu-composer.tsx, 2026-11-21)

- Como «Enviar más tarde» de Mail: mantener presionado «Publicar» (0.5 s)
  abre «Publicar ahora» y «Mañana a las 9 am» (`nextPublishSlot`,
  `lib/publish-timing.ts`: el siguiente día que abre, 1 h antes de abrir). Ya
  pasado el servicio de hoy (`isAfterService`), tocar «Publicar» ofrece
  primero mañana. El póster dice «Programado» y cuándo sale; en Menús,
  «Programado · fecha»; abrirlo lo cambia en su lugar y sigue programado
  («Sale solo mañana a las 9 am» arriba de la primera tarjeta).
- En el menú publicado (o programado), deslizar un platillo de hoy muestra
  «Se acabó» (gris) junto a «Eliminar»; se guarda al instante solo esa marca
  (`setSoldOut`), sin «Actualizar» y sin avisar a nadie. En el renglón dice
  «Se acabó»; en la ficha, el nombre en gris y «Se acabó» en la columna del
  precio. Una copia para otro día empieza sin marcas (`withoutSoldOut`).

## Dónde vende (business-where-editor.tsx, punto-editar.tsx, 2026-11-21)

- Modelo y tabla de casos: `docs/NOTIFICATION_ARCHITECTURE.md`, «Dónde
  vende». Las reglas viven en `lib/puntos.ts` (`positionsFor`); los datos se
  leen aparte en `lib/patios.ts` (`fetchWhereTheySell`): si el servidor no
  tiene las tablas, el mapa y la ficha salen como antes.
- El pin principal es donde está hoy (`latitude`/`longitude` ya ajustados);
  otras sucursales van en `extraPositions` y el mapa las dibuja aparte
  (`extraMarkerElements`): mismos colores, abren la misma ficha y se esconden
  al agrupar.
- El cliente solo ve lo vigente: el menú de hoy o, sin él, la carta. Nunca
  fechas ni menús anteriores (`fetchPublicMenus` lee solo `fecha = hoy`). La
  fecha solo va en el póster que el negocio comparte.

## «Crear» y publicar (crear.tsx, 2026-11-24, segunda vuelta)

- Sin hoja de abajo y sin cámara de golpe (Parco). «＋» abre `app/crear.tsx`
  a pantalla completa: foto del menú (grande), Fotos (varias hojas), a mano,
  «Partir del último menú» y avisos. La cámara se pide al tocar la foto.
- Cámara: Fotos, tomar foto y «Leer» con las hojas tomadas (hasta 6).
- «Publicar» publica de una vez y regresa a Menús (`router.dismissTo`) con el
  aviso arriba; nunca una pantalla «Publicado» aparte. «Vista previa» es un
  `Modal` encima del editor (no una ruta: `menu-editar` se reinicia al
  recuperar foco). El póster vive en `components/menu-poster-card.tsx`.
- Menús: tocar «Lo que ven hoy» lo edita; deslizar: Ficha, Imagen, Eliminar.
- `TapToEdit`: con el teclado cerrado, título, platillo y descripción reciben
  el toque en una capa; el toque largo mueve. No quitarla.
- Decisión, datos y fuentes: `docs/CREAR_Y_PUBLICAR_2026-11-24.md`.

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
- **Varias fotos por reseña (2026-11-21):** hasta 5 por visita
  (`MAX_REVIEW_PHOTOS`), cada una con su platillo opcional. Jev
  (docs/research/jev-fotos-por-resena-2026-11-21.json): clientes 61 % «varias,
  platillo opcional» frente a 22 % «una»; negocios 85 % «varias, cada una con
  su platillo». Se resolvió así: el platillo es opcional para quien sube, y en
  el menú solo salen las fotos que lo tienen (las demás, en su reseña).
  - Base: tabla `review_photos` (migración 20261121090000); `publish_review`
    publica reseña y fotos en un solo paso: o sale todo o nada. Si una foto
    no sube, no se publica y las que sí subieron se borran. Las columnas
    `reviews.foto_*` quedan solo para versiones viejas de la app.
  - Al reseñar: «Fotos opcionales · hasta 5»; de Fotos se eligen varias de
    una vez. Cada foto es una fila (foto y «¿De qué platillo es? (opcional)»);
    tocarla abre ahí mismo sus platillos (palomita en el elegido; tocarlo otra
    vez lo quita) y «Quitar foto».
  - En la reseña: con una foto, como siempre; con varias, una tira de
    miniaturas (máximo 72, se reparten el ancho); tocar una la abre grande.
  - Corregir y quitar son por foto (`update_my_review_photo_item`,
    `remove_my_review_photo_item`); el «me gusta» sigue siendo de la reseña.
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
