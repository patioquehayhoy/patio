# Pendientes y roadmap de lanzamiento — actualizado 2026-11-07

## Corte 2026-11-21 (Claude)

- [x] Campana por lugar como YouTube («Todas», «Personalizadas» por defecto,
  «Ninguna») y resumen de seguidores a las 8:00, 11:30 y 17:30.
- [x] Aviso de publicar 1 h antes de abrir, sin días cerrados, con pausa y
  «Hoy no abro»; resumen del negocio en la mañana; publicar ya cerrado no
  avisa.
- [x] Publicar más tarde y menú de la semana (programado, sale solo).
- [x] «Se acabó» por platillo, al instante y sin avisar.
- [x] Dónde vende: sucursales, tianguis o sobre ruedas, solo a domicilio,
  «Pedidos hasta».
- [x] Hasta 5 fotos por reseña con platillo opcional
  ([FOTOS_Y_RED](FOTOS_Y_RED_2026-11-15.md): «varias fotos por visita»).
- [x] **Producción (21 nov):** migraciones `20261121090000`–`20261121130000`
  y 6 funciones desplegadas.
- [ ] **Parco, QA en el iPhone:** entrar como Foodie y reseñar con 2–3 fotos;
  campana en «Siguiendo»; mantener presionado «Publicar» → mañana; «Se
  acabó»; Editar mi negocio → DÓNDE VENDES (sucursal y día de tianguis).
- [ ] Ver llegar el primer resumen real (8:00 desayunos / 11:30) y el anuncio
  de un menú programado a su hora.
- [ ] Carta fija: «¿Siguen igual tus precios?» al mes (falta decidir cómo se
  ve en la ficha).
- [ ] Siguiente build: la app instalada sin esta versión no muestra varias
  fotos por reseña.
- [x] Resumen en dos notificaciones: menús (con «no abre hoy») y, aparte,
  promociones (Parco). `send-follower-digest` desplegada.
- [x] **Producción:** `20261121140000_rhythm_prices_fresh` aplicada (ritmo,
  `cartas.precios_al`, `confirm_carta_prices`, aviso `fresh`); la app aún no
  lo usa.
- [x] **Bloque 2 · Carta fija** (hecho 21 nov, noche): en Editar mi negocio «Cambia cada día» /
  «Casi siempre es el mismo» (por defecto según el giro; `negocios.ritmo`);
  «Precios de noviembre» en la ficha (`cartas.precios_al`); con ritmo
  carta, el aviso diario pasa a uno al mes «¿Siguen igual tus precios?» con
  botón «Siguen igual» (`confirm_carta_prices`).
- [ ] **Bloque 3 · Recién salido:** en Avisar, elegir un platillo de tu menú
  → «Recién salido: Bolillo.»; servidor (`send-operation-notice` y
  `_shared/operation-notice.ts`, kind `fresh`) valida que el platillo esté en
  su menú de hoy o su carta, hasta 3 al día aparte del aviso del día, al
  momento solo a «Todas»; ficha con su ícono (`patio_highlights`).
- [ ] **Bloque 4 · Vegetariano:** `Platillo.vegetariano`; el editor pregunta
  «¿Es vegetariano?» si el nombre lo parece (sin palabras de carne) y se marca
  deslizando; hojita en la ficha; filtro «Vegetariano» en el mapa.
- [ ] **Bloque 5 · Artifact** «Patio — De documentación dispersa a un sistema»
  (https://claude.ai/artifact/5fZC3DQNCeADkGwdchW8Q9): secciones de
  notificaciones (dos), ritmos, Dónde vendes y lo que sigue.
- [ ] **Bloque 6 · Varias marcas en una cuenta — decide Parco antes de
  construir:** hoy un negocio por cuenta (`fonditas_one_per_owner_idx`) y los
  menús guardados viven en el teléfono; falta diseñar cambiar de negocio y si
  Pro va por cuenta o por negocio.

## Corte 2026-11-16 (Claude)

- [x] Fotos en su lugar dentro del menú (sin hoja encima) y vistazo limpio:
  autor y «3/12» dentro de la foto; fecha y corazón debajo, en la columna de
  los del menú; «me gusta» = el de su reseña; tocar la foto de un cliente
  abre «Ver la reseña», corregir/quitar la tuya o reportar.
- [x] Sin frases sobre la foto: la reseña ya no pide «Algo del platillo».
- [x] Foto en la reseña: se abre ahí mismo; «Ver en el menú» con cápsula
  «Volver a la reseña» / «Volver al platillo».
- [x] Rapidez de fotos y de la ficha (vista previa, prioridad, precarga,
  carga diferida, caché, estado aparte, nombre en memoria).
- [x] Lo tuyo con tu nombre, nunca «Tú». Perfil con «Sus fotos» y «Sus
  reseñas»; perfiles de prueba en desarrollo.
- [x] Identidad del platillo: se junta solo lo mismo escrito distinto; lo
  parecido se pregunta una vez en el editor; la foto vuelve aunque cambie
  de teléfono.
- [x] Editor como pizarrón: solo secciones con título, «$» y «×»; la carta
  es lo que queda abajo de su título «CARTA»; sin bloques ni «Incluye»;
  menús de antes convertidos solos. Cursor en el primer platillo de un menú
  nuevo. Cabecera de selección compartida (Guardados y Menús) y auditoría
  de encimados.
- [x] Mantener presionado y arrastrar platillos (a cualquier sección o a la
  carta) y secciones completas; sin «···» ni flechas.
- [ ] **Parco, QA en el iPhone:** arrastrar platillos y secciones (que
  deslizar siga desplazando y que un toque corto siga escribiendo).
- [x] **Producción:** `20261115120000_review_photo_hash` ya estaba aplicada.
- [ ] [FOTOS_Y_RED](FOTOS_Y_RED_2026-11-15.md): Parco aprobó las seis
  (16 nov). Orden: Jev revisa la foto → «Hoy hay» → varias fotos por visita
  → foto de cliente en el menú → visita verificada.
- [x] Reseñas por partes: la ficha baja 20 y «Ver más»; promedio, total y
  estrellas salen del servidor (`review_summary`); las fotos de clientes del
  menú se bajan aparte; «Ver la reseña» desde una foto trae las que falten.
- [x] **Producción (16 nov):** `20261116120000_review_summary` aplicada.
- [x] Editor con tarjetas: «＋ Platillo» en cada tarjeta; foto, nombre,
  descripción y precio siempre en su lugar; «Listo» guarda y cierra;
  «siguiente» nombre → descripción → platillo de abajo, y los precios de
  precio en precio («Siguiente» fijo en la barra)
  ([investigación](EDITOR_MENU_INVESTIGACION_2026-11-16.md) §8).
- [x] El arrastre ya no se resetea (Parco lo confirmó el 16 nov). Causa: al levantar, el renglón (o la tarjeta)
  recibía opacidad o transform y React Native sacaba y volvía a meter lo que
  estaba bajo el dedo; iOS cancelaba el toque (en el log, cada arrastre
  terminaba en su mismo lugar). Arreglo: `collapsable={false}` en ese camino
  (regla en `components/CLAUDE.md`). El log de Metro ahora dice `suelta` o
  `cancela` y los milisegundos desde que se levantó.
- [ ] **Parco, QA en el iPhone — guardar, publicar y modificar como Apple**
  ([investigación](EDITOR_MENU_INVESTIGACION_2026-11-16.md) §9): se guarda
  solo y «‹» sale; «Publicar» arriba a la derecha; el menú de hoy se abre con
  «×» y «Actualizar».
- [ ] **Parco, QA en el iPhone — mover y eliminar sin modo Ordenar** (como
  Recordatorios, en prueba): mantener presionado y soltar sin que brinque
  nada; deslizar a la izquierda en el editor y en Menús («Más» y
  «Eliminar»); «Deshacer» se va a los 6 s. Si no convence, el modo Ordenar
  vuelve con `SHOW_ORDER_MODE`.
- [ ] Si se queda: deslizar para quitar un lugar en Guardados (mismo
  `SwipeRow`), para que las dos bibliotecas se sigan pareciendo.
- [ ] En su momento (Parco, 16 nov): probar separar las secciones del editor
  con tipografía (título de marca y aire) en lugar de tarjetas.
- [x] Arreglado: la foto o los otros nombres de un platillo de la carta, sin
  más cambios, no se guardaban (`cartaSignature`). Fuera el «Incluye…» de
  prueba de ficha y póster.
- [ ] **Parco, QA — Perfil y «Crear»**: la pestaña Perfil es
  tu perfil público (`Fotos · Reseñas · Listas`, campana de Actividad y
  engrane de Ajustes, `app/ajustes.tsx`); el «＋» del negocio es «Crear»
  (menú de hoy y avisos), Actividad queda solo con lo que pasó y la
  última pestaña del negocio se llama «Ajustes» (Jev)
  ([navegación](NAVEGACION_Y_PERFILES_2026-11-16.md) §0).
- [ ] Estadísticas de «me gusta» por platillo (Actividad) por identidad del
  platillo; hoy separan nombres.

## Corte 2026-11-15 (Claude)

- [x] La carta va en el mismo editor que el menú del día, debajo, como en el
  pizarrón: «MENÚ $100» arriba y «CARTA $110» abajo, con solo las
  excepciones con precio propio. Se guarda al publicar si cambió. Se quitó
  «Agregar otro precio» y la pantalla aparte de Perfil → «La carta».
- [x] Ficha: el contacto queda como un solo ícono de WhatsApp a la derecha de
  la dirección (sin número ni «Llamar»). Logros: los componentes de abajo ya
  no se mueven. Barra de secciones: baja desde arriba con su curva.
- [x] Fotos de platillos: mantener presionado un platillo en la ficha abre su
  foto con nombre, precio y descripción; nunca queda bajo el dedo. Si solo
  algunos tienen foto, un ícono discreto dice cuáles. El negocio la sube
  desde el editor («Agregar foto») y se recuerda por nombre del platillo.
- [x] Jev ([datos](research/jev-fotos-platillos-2026-11-15.json)): la
  descripción la escribe el negocio (91–99 %); la foto, los dos (primero la
  del negocio y aparte las de clientes); los clientes le creen más a la foto
  de otro cliente. Fotos de clientes: segunda versión, desde sus reseñas.
- [x] Correos de acceso rediseñados (código primero, sin tarjeta, letra
  chica en dos renglones) — [README](../supabase/templates/README.md).
- [x] Fotos de clientes: en la reseña, después de la foto, «¿De qué
  platillo es?»; en la ficha, si el negocio no tiene foto de ese platillo,
  sale la del cliente con su nombre; si sí tiene, abajo «De clientes».
- [x] «Incluye…» (prueba) en editor, ficha y póster; el editor ahora tiene
  dos bloques con la misma etiqueta: MENÚ DEL DÍA y LA CARTA. Ficha: el
  botón Seguir ya no parpadea de naranja a «Siguiendo».
- [x] **Producción (15 nov):** migraciones de contacto, `dish-photos`,
  `review-photos` y correcciones de fotos aplicadas; `read-menu` desplegada.
- [ ] **Parco, Supabase:** logo `p-icon-correo.png` ya subido a «Patio ID»;
  falta, en Authentication → Email Templates, pegar los
  6 correos de `supabase/templates/` con el asunto que trae cada uno
  (acceso: «{{ .Token }} es tu código para entrar a Patio») y mandarse un
  código de prueba (Gmail en el cel, Mail en la compu, modo oscuro).
- [ ] Aviso de privacidad: en cuanto exista su URL pública
  (`EXPO_PUBLIC_PRIVACY_URL`), la línea «Al continuar aceptas el Aviso de
  privacidad» aparece sola en los dos accesos.
- [x] Piloto de menús reales (96 lugares de 12 giros, 1,371 fotos, 1.45 USD):
  [hallazgos](research/MENUS_REALES_2026-11-15.md). El precio por platillo
  es la base; en las fondas, «precio por guisado con sopa y arroz
  incluidos»; el 82 % de las fotos de platillos en Maps las suben clientes.
- [x] Apple: banco Nu, impuestos de México y W-8BEN enviados (Active);
  banco y Paid Apps en Processing.
- [ ] Parco con su contador: actividad de software en el SAT y declaraciones
  mensuales de RESICO desde abril 2026.
- [ ] Estudio completo (≈8 USD, el mes que entra) con las dos opciones
  nuevas de precio y 20 fotos revisadas a mano.

## Corte 2026-11-14 (Claude)

- [x] Número del negocio: opcional en «Editar mi negocio» (CONTACTO), con
  «Este número tiene WhatsApp». En la ficha, «Llamar» y «WhatsApp» bajo la
  dirección. Declarado en el aviso de privacidad y en
  [consolas](STORE_CONSOLES_2026-11-11.md) §1.
- [x] Varios precios del menú del día («Comida corrida $95», «Solo guisado
  $70») en editor, ficha, tarjeta y póster. Corregido: tocar el precio del
  menú borraba los precios de sección que leía la foto.
- [x] Precio de sección («CARTA $110») editable desde «···».
- [x] La carta (lo de siempre): Perfil → «La carta». Se guarda sin publicar;
  la ficha la muestra debajo de lo de hoy.
- [x] Lectura de foto: `max_tokens` 2,200 → 12,000 (un menú largo se cortaba
  y fallaba) y espera de 45 s → 110 s; ahora devuelve varios precios.
- [x] Jev ([datos](research/jev-menu-precios-2026-11-14.json)): la mayoría
  cobra un solo precio (57–81 %), varios 10–27 %; la carta aparte gana en los
  4 negocios (87–92 %); la palabra que más usan es «Comida corrida».
- [ ] **Parco, producción:** `npx supabase db push` (contacto del negocio) y
  `npx supabase functions deploy read-menu`.
- [ ] Parco: QA en el iPhone con Metro: varios precios, carta, número en la
  ficha y leer un menú desde Fotos.
- [x] Alta del negocio: el número va en el paso de pagos (mismo `BusinessContactEditor`, opcional; 2026-11-15).

## Corte 2026-11-11 (Claude)

- [x] Decidido por Parco: datos legales y candidato firmado van al final,
  con la app completa. Colonia piloto: Polanco («las favelas»; falta fijar
  las calles exactas).
- [x] DENUE (INEGI, edición mayo 2026) descargado y filtrado: 449 negocios
  chicos de comida en Polanco, Granada, Anáhuac, Pensil e Irrigación.
- [x] `quehayhoy.mx` y `quehayhoy.com.mx` libres (NIC México, 2026-11-11).
- [ ] Parco: firmar Paid Apps (Apple) y perfil de pagos (Play); no requiere
  planes definidos. Después, inscribirse al Small Business Program.
- [ ] Cuenta de revisión con código fijo en servidor (ver
  [consolas](STORE_CONSOLES_2026-11-11.md) §7).
- [ ] Decidir: WhatsApp del negocio en la ficha (recomendado) y documento de
  estrategia (piloto, Fundadores, creadores, redes).
- [x] Piloto ubicado: «las favelas de Polanco» (así las llama Lalo Villar) son
  la **Cerrada Lago Andrómaco**, Ampliación Granada (≈ 19.4421, −99.2008),
  detrás de Plaza Carso y junto a las vías. DENUE: 8 cocinas económicas en la
  cerrada (TikTok de Azteca: 14 cocinas y 50 familias). Tianguis a 230 m los
  viernes y lunes (Miguel de Cervantes Saavedra).
- [x] Tianguis: Sedeco publica 1,367 tianguis con colonia, calles, día,
  horario y punto (datos abiertos CDMX, actualizado 2026-08-28). No hace
  falta API: se importa una vez al año.
- [x] Nombre de la «tarjeta de Pro»: patrón «Prueba Premium» de LinkedIn.
  Como el plan se llama Pro, el texto visible propuesto es «Prueba Pro».
- [x] Logros: solo automáticos con datos. Reconocimientos de marcas
  registradas (Michelin) solo con convenio.
- [x] Dominios (NIC México y whois, 2026-11-11): ocupados `patio.com`,
  `patio.com.mx`, `patio.mx`, `mipatio.mx`; libres `patiomx.com`,
  `patiomx.mx`, `patioapp.mx`, `holapatio.mx`, `quehayhoy.mx`, `patio.lat`.
- [x] Chat dentro de Patio contra WhatsApp: consulta de Jev
  (`docs/research/jev-chat-2026-11-11.json`, asesoría, no aprobación). Solo
  chat dentro de la app es lo peor para los 4 negocios (contestan menos, más
  carga, menos clientes; lo eligen 1–15 %). WhatsApp gana en 3 de 4 negocios
  (52–83 %), incluido el del callejón. Foodies: «ambos» los hace volver un
  poco más (+0.27 de 4); solo chat, menos (−0.21).
- [x] Contacto del negocio (Parco, 2026-11-11): solo su número, opcional y
  declarado en privacidad. Sin redes sociales ni chat. En la ficha, el
  número abre llamar o WhatsApp (el que tenga el negocio, personal o
  Business). Chat propio solo cuando exista «apartar» o «pedir».
- [ ] Dominio: pendiente de Parco con la lista de 10 opciones (11 nov).
- [ ] Small Business Program de Apple: solicitud aparte, después de aceptar
  Paid Apps; no se activa sola ni se pierde al aceptar el contrato.
- [x] Dominio: Jev (`docs/research/jev-dominio-2026-11-11.json`) elige
  `quehayhoy.mx` en las 5 personas (56–84 %); es el que más se recuerda y el
  que menos se asocia con «Patio». `holapatio.com` lo usa otra empresa llamada
  Patio (software para obras y veterinarias, registrado 2026-09-21).
- [ ] Parco: comprar `quehayhoy.mx` (principal), `quehayhoy.com.mx` y un
  dominio con el nombre (`alpatio.mx` o `patiomx.com`) para redirigir.
- [x] Documento único: `artifacts/patio-sistema.html` (marca, tipografía,
  pantallas y flujos, promociones, calle y piezas). Reemplaza al catálogo.
- [x] Artifacts anteriores y `docs/design/previews/` borrados (aprobado por
  Parco); recuperables desde Git, ver `artifacts/README.md`.
- [x] Paid Apps: datos legales actualizados y contrato aceptado por Parco.
- [ ] Parco: cuenta bancaria en App Store Connect y perfil de pagos en Play.
- [ ] Build Android con «Tus visitas» (junto con el siguiente build que haga
  falta) y video de 30 s para Google.

## Corte 2026-11-09 (Claude)

- [x] Ficha: nada se corta, precio típico, «Qué tan lleno» sin título,
  «Volver arriba» al centro (commits del 8 nov).
- [x] Esquina continua de Apple en tarjetas, hojas, chips y botones.
- [x] Foto del lugar: paso nuevo del alta y bloque en «Editar mi negocio».
- [x] Avisos de operación gratis: `app/avisar.tsx` y `send-operation-notice`.
- [x] «Hoy» del negocio (`app/hoy.tsx`) y resumen de las 18:00
  (`send-business-digest` con pg_cron). El recordatorio de las 10:00 ya lo
  programa el teléfono.
- [x] «Pausar todo» y «Resumen de hoy» en Avisos.
- [x] Build iOS development (para Metro, con visitas y cobro):
  https://expo.dev/accounts/patio-quehayhoy/projects/lafondita/builds/f78a296a-4a85-4e6c-bba8-5e7ca4dc9358
- [x] Build Android QA (APK con todo lo del 9 nov), terminado (verificado
  2026-11-11): https://expo.dev/artifacts/eas/sk-X9sDvN2mBC7A1dIArzQb9YdLlP6_2LeZTfcAAjwQ.apk
- [x] Respuestas para App Privacy, Data Safety, clasificación y notas del
  revisor: [STORE_CONSOLES_2026-11-11](STORE_CONSOLES_2026-11-11.md).
- [x] «Tus visitas» también en Android (decisión de Parco): se quitó el
  bloqueo de `ACCESS_BACKGROUND_LOCATION`, el control de release lo exige y
  hay un aviso propio antes del permiso. 270 pruebas y 31 verificaciones.
- [ ] Parco: grabar el video de 30 s con el build Android nuevo (guion en
  consolas §5) y subirlo a YouTube como «No listado».
- [x] Producción del 9 nov aplicada por Parco (verificado 16:42 UTC): las 5
  migraciones (existe `cron_secret`) y las 7 funciones nuevas o cambiadas.
- [ ] **Parco, producción, en este orden** (sin SQL a mano: la migración
  20261109120000 genera y guarda el secreto del resumen en Vault):
  1. `npx supabase db push --yes` (place_photo, operation_notices,
     today_views, daily_schedule, cron_secret_in_db).
  2. `npx supabase functions deploy send-operation-notice send-business-digest send-special-notice send-publication-notifications send-review-notification send-community-notification notify-content-report`
     (las tres últimas porque cambió `_shared/expo-push.ts`).
- [ ] Falta construir: flyers de Pro, mostrar en caja (fase 1), «me gusta» a
  tu reseña, tarjeta de Pro en «Hoy», sesión anónima, textos para App
  Privacy, Data Safety y la declaración de ubicación en segundo plano.

## Corte 2026-11-07 (Claude)

Decisiones y aterrizaje completos en [DECISIONES_2026-11-07](DECISIONES_2026-11-07.md).

- [x] Auditoría npm en **0**: overrides `glob` 14.0.4 y `minimatch` 11.0.5;
  `deepmerge` 4.3.1 con guarda `__proto__` en `vendor/deepmerge` (sustituir por
  la oficial cuando publiquen parche). 241 pruebas, `expo-doctor` 18/18.
- [x] Android: EAS production con Maps, `google-services.json` y FCM V1. Perfil
  `android-qa` (entorno production, APK instalable) y `.easignore`.
- [x] Build Android QA terminado 2026-11-07 (versionCode 14, perfil `android-qa`):
  https://expo.dev/artifacts/eas/swT7mWxgPTmqhatU1j5p5U2ynVqwMREDaIViMlzR2kA.apk
- [ ] Parco: instalar el APK y probar push (FCM), mapa, cámara y publicar.
- [x] Cobro directo en código: `expo-iap`, `verify-purchase`,
  `store-notifications`, tabla `store_purchases`; RevenueCat retirado.
  Pasos de Parco (contratos, llaves, productos) en [billing](BILLING_SETUP_2026-10-26.md).
- [ ] Parco: firmar Paid Apps Agreement y perfil de pagos de Play.
- [x] Producción (Parco, 2026-11-08 02:49 UTC): `store_purchases` aplicada;
  `verify-purchase` (con sesión) y `store-notifications` (sin JWT) activas.
  Prueba sin efectos: aviso vacío → 200 «ignored»; compra sin sesión → 401.
- [x] `revenuecat-webhook` borrada de producción (2026-11-07, Claude, a
  pedido de Parco; el código queda en el historial de git).
- [ ] Día de planes: definir y crear productos en ambas tiendas.
- [ ] Avisos que faltan, en orden: aviso de operación a seguidores (gratis) →
  resumen «Hoy» de las 18:00 → me gusta a tu reseña. Diseño en la v4.
- [x] Copy de avisos homologado (título = quién, cuerpo = el hecho; nunca
  «Aviso:» ni «en Patio»). Parco desplegó 4 funciones el 2026-11-08 01:21 UTC.
- [x] `send-special-notice` (v5) y `notify-content-report` (v4) desplegadas
  con el copy final (2026-11-08 02:49 UTC).
- [x] Propuesta v4 (`artifacts/propuesta-2026-11-07-v4.html`): Parco la ve
  mejor; mañana afina detalles y se empieza a ver en la app.
- [ ] Afinar detalles de la v4 con Parco: Hoy, notificaciones, aviso gratis,
  flyers, mostrar en caja y sellos, onboarding, foto del lugar, ficha y marca.
- [x] Onboarding estilo Leica construido (2026-11-08); falta verlo en el
  teléfono (iPhone con Metro; Android necesita build nuevo).
- [x] Visitas reales, «¿Qué te pareció…?» y «Qué tan lleno» construidos
  (2026-11-08, DECISIONES §19).
- [x] Parco: `npx supabase db push` (place_visits) — verificado en producción el 2026-11-09.
- [ ] Builds nuevos iOS y Android (ubicación en segundo plano, task manager).
- [ ] Google Play: declaración de ubicación en segundo plano con video.
- [ ] App Store Connect, App Privacy: ubicación aproximada, no vinculada.
- [x] Editor: flecha para ocultar platillos de vuelta e índice lateral de
  secciones (2026-11-08).
- [ ] Parco: QA del onboarding nuevo en el iPhone (en curso, 8 nov).
- [ ] Construir en la app, en orden: foto del lugar (alta y
  Editar) → Hoy (incluye quitar el «…» del platillo en Tu racha) → aviso de
  operación y resumen 18:00 → notificaciones simplificadas → flyers →
  mostrar en caja (fase 1). `borderCurve: 'continuous'` en tarjetas y botones.
  Botón de vidrio de `entrada.tsx` a 54/27.
- [ ] Sesión anónima (registro no obligatorio).
- [ ] Parco: comprar dominio (`quehayhoy.mx`).
- [ ] Concurrencia real con visitas (plan en DECISIONES §17), primera
  actualización tras el lanzamiento.
- [x] Listas de Menús se quedan por ahora.
- [ ] Al final: revocar la clave antigua de Anthropic (una sola vez).

## Siguiente (2026-11-02 noche)

- [x] Onboarding revisado en simulador (13 pantallas) y corregido por reglas
  vigentes: estados de «Continuar», giro obligatorio, CTA naranja en la
  celebración, acceso Foodie con «Seguir».
- [x] Onboarding decidido y aplicado (2026-11-03): una sola pantalla, alta
  centrada (Jev), acceso del negocio que invita, celebración que vende la
  foto, dirección confirmada en el mapa.
- [ ] Rediseñar el flujo de publicar (terminar → revisar → ver como imagen →
  publicar y compartir → ir a tu ficha); propuesta antes de construir.
- [x] «De quienes sigues»: fila arriba de Guardados (el panel del mapa no se
  abre sin búsqueda). Función `following_activity` (14 días, sin bloqueos,
  respeta perfiles privados). **Falta `npx supabase db push --yes`.**
- [x] «Hoy de los que sigues»: menús del día de los lugares que sigues, en
  scroll arriba de Guardados.
- [x] Giro «Venta en casa» (Jev: 72–75 % lo quiere; el nombre le ganó a «Dark
  kitchen», 65–85 % entre quienes venden). Pide solo edificio o unidad.
- [x] Después de publicar, «Listo» lleva a Mi Patio.
- [x] `db push` de `following_activity` (aplicado por Parco).
- [ ] Comprar dominio (sugerido `quehayhoy.mx`) → página web por lugar sin
  app ni cuenta, póster como vista previa, universal links, privacidad y
  condiciones. Luego Compartir de la ficha = póster + enlace.
- [x] Pestaña Foodie: «Patios» (decidido).
- [x] Precio del menú del día de vuelta (editor y póster) y editor alineado.
- [x] «Tu racha» con números del negocio, pantalla completa.
- [ ] Cobro sin RevenueCat: StoreKit y Play Billing directo + validación propia.
- [ ] QA en el cel de la ficha: Seguir/Siguiendo, barra de avisos, silenciar,
  «Elegir lugares», lista de seguidores, descripción; precio del platillo con
  «Siguiente»/«Listo».

## Planes, creadores y red (2026-11-02)

Propuesta completa en [PLANES_CREADORES_Y_RED](PLANES_CREADORES_Y_RED_2026-11-02.md).

**Lado difícil hoy:** el negocio que publica su menú diario.

- [x] Planes decididos y aplicados: solo el negocio tiene planes, Gratis y
  Fundadores con beneficios reales, Pro oculto hasta existir.
- [x] Pro construido (2026-11-02): lecturas por plan, avisos especiales,
  platillo destacado, día y hora con más interés, webhook de RevenueCat.
- [x] Seguir en lugar de Guardar (2026-11-02): botón «Seguir» en la ficha,
  pestaña «Siguiendo», lista de seguidores de cada lugar y lugares que sigue
  cada perfil (migración `20261102130000_patio_followers.sql`).
- [x] Avisos por lugar y tope de 3 menús al día por persona (2026-11-02).
  Requiere desplegar de nuevo `send-publication-notifications`.
- [x] Límites de texto en un solo lugar (`lib/text-limits.ts`): nombre del
  negocio 30 (cabe en dos renglones en la ficha), descripción y dirección 80,
  platillo 60, descripción de platillo 140, sección 40, precio 7, reseña 600.
  La base repite los del negocio (`20261102140000_text_limits.sql`).
- [x] Aplicadas en producción (verificado 2026-11-02 con `db push --dry-run`):
  Pro y seguidores; funciones `send-special-notice` y `revenuecat-webhook`
  activas.
- [x] Alejandro aplicó `20261102140000_text_limits` y redesplegó
  `send-publication-notifications` (verificado 2026-11-02: base al día,
  función versión 6).
- [x] Todas las migraciones nuevas ensayadas con `npm run db:rehearse`,
  con escenarios de Pro, seguidores, avisos especiales y límites de texto.
- [ ] Dar Pro a los Fundadores con el SQL de [billing](BILLING_SETUP_2026-10-26.md).
- [ ] QA en el cel con una cuenta Pro: aviso especial (llega y se ve en la
  ficha 24 h), estrella de platillo destacado en Mi Patio, «Cuándo hay más
  interés» en Actividad, Promociones en Notificaciones del Foodie.
- [ ] Creadores Fundadores: elegir 5–10 creadores de la colonia piloto y
  escribirles antes de abrir.
- [x] «Sus lugares» en cada perfil (2026-11-02): hasta 10, primero los que
  mejor calificó y luego los que sigue; respeta el perfil privado.
- [x] «De quienes sigues» arriba de Patios (falta `db push`).
- [ ] Van Westendorp con los negocios Fundadores antes de fijar precios en tienda.
- [ ] Piloto: medir qué parte de las vistas de una ficha termina en «Seguir»
  (vistas registradas + `saved_patios`). Si es baja, probar un «Seguir» más
  grande; la composición actual se eligió por principios y Jev la prefirió
  (51–61 %; registro en `docs/research/jev-ficha-seguir-2026-11-02.json`).

## Experiencia del negocio — pendientes de paneles (2026-11-02)

- [ ] Ver en dispositivo Menús sin tour y Editar mi negocio con ayuda integrada;
  comprobar letra grande, oscuro, teclado y guardar/volver.
- [ ] Validar visualmente el cambio con Alejandro. La
  [comparación entregada](../artifacts/patio-paneles-antes-despues.png) es
  ilustrativa y todavía no tiene aprobación explícita.
- [ ] Decidir si se conservan las listas de Menús antes de crear una biblioteca
  dedicada. La propuesta de migración queda condicionada a esa decisión.
- [ ] Si se conservan: comparar administración en pantalla y selección en panel
  corto, protegiendo selección, errores y cambios sin guardar.
- [ ] Revisar perfil público como pantalla propia y retorno al mapa/enlaces.
- [x] Lista de likes de platillo: ya hace scroll dentro del panel (2026-11-02).
- [ ] Revisar el acabado de Nuevo menú y los paneles restantes.

Alcance y evidencia: [auditoría](design/SURFACE_AUDIT_2026-11-01.md).
Estos puntos son de UX; no sustituyen los pendientes técnicos/de operación abajo.

> **Cierre vigente 2026-10-28:** Expo transferido a `patio-quehayhoy`, con UUID
> y firmas conservados; acceso temporal Parco retirado. Auth usa 8 dígitos y
> entrega/lectura IA real ya verificadas. `node-forge` actualizado a 1.4.2:
> npm reporta 0 altas, 0 críticas y 16 bajas de la cadena deepmerge/Expo,
> todavía sin parche publicado en deepmerge. No aplicar migración mayor forzada.
> Firebase `patio-25a52` borrado, no restaurar. Supabase es el backend;
> decisión sobre FCM/push Android en `FIREBASE_DECISION_2026-10-28.md`.
> Los cortes anteriores se conservan como historial y no describen el estado actual.

> **Pendientes vigentes — 2026-10-29 (sustituye listas anteriores de esta sección):**
>
> *Producción (Alejandro)*
> - [x] `20261029100000_review_and_report_alerts.sql` aplicada y registrada;
>   funciones `send-review-notification` y `notify-content-report` activas.
> - [ ] Entrar a Patio con `quehayhoy.patio@gmail.com` en un teléfono con
>   notificaciones para recibir avisos de reportes.
>
> *Técnico*
> - [ ] Cobro: RevenueCat, productos en tiendas y cuotas en servidor.
> - [ ] Versión firmada para tiendas (depende de tipografía).
> - [x] Envío de Promociones: avisos especiales de Pro (2026-11-02).
> - [ ] Lugares nuevos (requiere ubicación del Foodie) y Novedades (envío
>   manual): ocultos hasta existir.
> - [x] Historial de migraciones conciliado: `20260816` registrada (la columna
>   `categorias` ya existía) y el rollback `20260817` movido a `supabase/rollbacks/`.
>   `db push --dry-run`: «Remote database is up to date».
>
> *Diseño y producto*
> - [ ] **Onboardings (primer pendiente de diseño):** propuesta en
>   `docs/design/ONBOARDING_PROPOSAL_2026-11-02.md`; falta aprobación de Parco.
> - [ ] Panel o flyer de promociones del plan Pro.
> - [ ] Tipografía: licencia de Monument/Neue Montreal o Plus Jakarta Sans.
>
> *Auditoría 2026-11-01* (`docs/APP_AUDIT_2026-11-01.md`)
> - [x] Comentarios guardados, filtro de contenido, perfil privado, avisos de
>   comunidad, reglas de nombre y giro, y sin columna de teléfono (código listo).
> - [x] **Publicar en producción (Parco):** `npx supabase db push` (siete
>   migraciones del 1 nov, incluye `fonditas` → `negocios`; responder «Y») y
>   `npx supabase functions deploy send-community-notification
>   notify-content-report send-publication-notifications
>   send-review-notification --use-api`. Ensayadas completas con
>   `npm run db:rehearse` (Postgres embebido, 34 migraciones, 23 escenarios).
> - [x] Ícono de Mi Patio: puestito con piso (elegido por Parco 2026-11-02),
>   `assets/icons/mi-patio*.svg|png`. Falta verlo en el teléfono.
> - [x] Publicar el tablero del negocio: `npx supabase db push`
>   (`20261102100000_business_insights`, ensayada con `npm run db:rehearse`).
> - [ ] Listas en Menús: Parco duda de su utilidad; decidir si se quitan
>   (Codex estaba por rediseñarlas).
> - [ ] Resúmenes diarios (likes, te guardaron, me gusta en platillos) y hora
>   elegible de recordatorios.
>
> *Pruebas*
> - [ ] Prueba física de los cambios del 28–29 (manifiesto en iPhone chico,
>   Ayuda, Planes, Notificaciones, reseña por giro, avisos push).
> - [ ] TestFlight y prueba cerrada de Play (12 participantes, 14 días).
>
> *Cuentas y accesos*
> - [ ] Cuenta de revisión para Apple y Google.
> - [x] Escritura en GitHub: push de `c577059` aceptado (2026-10-29).
> - [ ] Google Maps Android: facturación y clave restringida.
> - [ ] Revocar la clave antigua de Anthropic.
>
> *Legal*
> - [x] Borradores en `docs/legal/`: aviso de privacidad, términos y página de
>   eliminación de cuenta (2026-11-01), basados en los datos que la app recoge hoy.
> - [ ] Completar nombre y domicilio, revisión legal y publicarlos en una URL pública.
>
> *Decisiones*
> - [x] Jev consultado 2026-11-01 (asesoría, no aprobación; registro en
>   `docs/research/jev-patio-2026-11-01.json`): misma cuenta (65–76 %),
>   lanzar gratis con plan opcional después (95–99 %), beneficio más valorado
>   «aparecer antes en el mapa» (81–95 %).
> - [x] Barra de negocio: Jev prefiere 4 botones (56–70 %) sobre 5 (28–42 %);
>   Parco eligió 5 para conservar Mi Patio y el «+» al centro exacto.
> - [x] Perfil privado como Instagram (2026-11-01), como pidió la lectura de Jev.
> - [ ] Filtro de lista Mapa/Guardados: compartido o separado.
>
> *Siguiente sesión*
> - [ ] Cobro: decidir RevenueCat, tiendas directas o Stripe web (recomendación:
>   lanzar gratis y cobrar en una actualización).
> - [ ] Grok como agente revisor: reglas listas en `AGENTS.md` (solo escribe
>   en `docs/reviews/`). Falta que Parco instale Grok Build
>   (`curl -fsSL https://x.ai/cli/install.sh | bash`), inicie sesión y le
>   dé su primera revisión.
> - [x] Barra de negocio según Ley de Jakob: `Menús · Actividad · + · Mi Patio · Perfil`.
> - [x] Perfil modelo Instagram en los dos roles, con Ajustes detrás del engrane.
> - [ ] QA físico: «+» desde las 4 pestañas, Mi Patio, Ajustes y los dos
>   recordatorios (10:00 negocio, se salta el día ya publicado; 13:00 Foodie).
> - [ ] Avisos por servidor que faltan, en orden: respuestas y me gusta a tu
>   reseña (Foodie); te guardaron / me gusta a tus platillos (negocio);
>   Novedades de Patio (opt-in, envío manual); Promociones (plan Pro);
>   Lugares nuevos (requiere guardar una zona).
> - [x] Jalar para actualizar en Guardados, Menús, Actividad y Notificaciones.

> **Referencia obligatoria de infraestructura — 2026-10-27:**
> [inventario de credenciales comprobado](CREDENTIALS_INVENTORY_2026-10-27.md).
> Play ya tiene Patio 8 (1.0.0) en prueba interna; hay firmas, EAS Submit,
> certificado/perfil iOS y APNs existentes. No volver a crearlos ni sustituirlos.
> Pendientes acotados: FCM V1 en Expo, conexión Maps/Firebase del candidato,
> prueba cerrada Play (12 participantes/14 días, hoy 0 aceptados), QA y escritura GitHub.
> El Firebase `patio-25a52` fue añadido por Codex en esta sesión, no es la
> infraestructura histórica ni está conectado a Expo. No iniciar más altas/builds.


> **Actualización 2026-10-27:** producción Supabase restaurada (ACTIVE_HEALTHY),
> plantillas de alta/acceso aplicadas conservando el diseño remoto. Entrega de
> correo, verificación OTP y una lectura IA real aprobadas con menú sintético.
> El servidor usa **8 dígitos**; app ajustada a esa longitud, sin reducir Auth.
> Google ya está en `quehayhoy.patio@gmail.com`: no requiere el cambio 2FA
> de la cuenta personal. Firebase creado: `patio-25a52`, plan Spark, cuenta de Patio.
> GitHub sigue pendiente de autenticar cuenta con escritura. Domicilio al final.
> Los bloqueos descritos en el corte anterior se conservan solo como historial.


## Ejecución solicitada por Alejandro — 2026-10-26

- Domicilio y cierre/publicación del aviso quedan **al final**, por petición del usuario.
- Monument + Neue Montreal se conservan en la rama actual; Alejandro prefiere
  posponer el pago. La licencia disponible sigue siendo de prueba/uso personal;
  no se registra compra ni autorización comercial inexistente.
- [x] Implementar acceso por código de 6 dígitos en ambos roles y preparar
  las dos plantillas de correo. [Detalle y límites](REVIEWER_ACCESS_2026-10-26.md).
- [x] Verificar que «Otro» persiste el texto en `categorias`; regresión automatizada.
  Consulta de recopilado preparada en `scripts/backend/custom-category-report.sql`.
- [x] Llevar el catálogo aprobado y cuotas propuestas a la pantalla Tu plan;
  preparar SDK/checkout/restauración, con cobro apagado.
- [ ] Aplicar plantillas Auth, verificar entrega y crear acceso real de revisión.
- [ ] Conectar tiendas/RevenueCat e implementar cuotas y beneficios en servidor.
  Los límites antiabuso actuales no equivalen a planes. [Detalle](BILLING_SETUP_2026-10-26.md).
- [ ] Google: activar 2FA en la cuenta de Patio; Firebase bloquea la consola
  de `contacto.parco@gmail.com` hasta completarlo. No hay sesión de gcloud.
  EAS production consultado: sin variables; Maps/Firebase siguen sin configurar.
- [ ] GitHub: cuenta `T1Alejandro` sin permiso `push`, confirmado por conector
  y dry-run HTTP 403. Hace falta autenticar cuenta con escritura.
- [ ] Supabase: CLI reporta producción y staging INACTIVE; hosts públicos no
  resolvieron. Panel sin sesión. No afirmar IA, push ni Auth real validados hoy.
- [ ] Gmail: conexión propuesta, no completada. Rutina diaria preparada en
  [soporte](SUPPORT_OPERATIONS_2026-10-26.md), sin automatización activa.
- [x] Corregir las 3 alertas moderadas: `decode-uri-component` 0.5.0 oficial,
  override de query-string y adaptación CJS/ESM por patch-package.
- [ ] Cerrar las 5 alertas altas heredadas de `node-forge` 1.4.0: sin versión
  corregida publicada. Auditoría final: **5 altas, 0 moderadas, 0 críticas**.
  CI conserva su gate. No se aplicó `audit fix --force`.
- [ ] Revocar clave legada en el proveedor: no confirmado. El código actual
  solo usa `ANTHROPIC_API_KEY` del servidor; eso no prueba revocación.

El detalle histórico siguiente se conserva como referencia; este bloque actualiza
su estado. El build firmado y QA física siguen pendientes.

Objetivo: iPhone y Android. Este es el checklist vigente; reemplaza pendientes
operativos de los cortes históricos. El lanzamiento público sigue pendiente.

**Lo que de verdad bloquea la publicación (repriorizado 2026-10-26 con Alejandro):**
1. URL pública de privacidad (obligatoria en ambas tiendas).
2. Acceso del revisor: código de 6 dígitos además del enlace y cuenta de revisión.
3. Candidato firmado y su QA en TestFlight/Google Play.
4. Tipografía publicable: salir con Plus Jakarta Sans (gratis, `rebuild/patio-final`)
   o comprar Monument/Neue Montreal antes. Nunca publicar las fuentes de prueba.
Lo demás (auditoría npm, push, IA real, branding) puede cerrarse después con
actualizaciones; no frenar el lanzamiento por ello.

Último cierre técnico: [prebuild](PREBUILD_CLOSEOUT_2026-10-24.md) y
[continuidad del 25 de octubre](HEADS_UP_2026-10-12.md). **196 pruebas de app**,
19 SQL y 12 de esquema aislado aprobadas. Exportaciones iOS/Android y builds
locales Release/Debug realizadas; DEV restaurado en iPhone. Eso no es un
candidato de tienda ni aceptación del recorrido completo. Auditoría npm y
configuración Android siguen pendientes.

## Completado

- [x] Supabase bajo la cuenta Patio como único Owner; proyecto visible `patio`.
- [x] Staging real preparado y 15 pruebas Auth/RLS/Storage/Edge aprobadas.
- [x] Producción actualizada con siete migraciones y cinco funciones con JWT.
- [x] Bibliotecas, mover/renombrar, filtros, selección y estados homologados.
- [x] Cards con columnas estables, estrella única y colonia · distancia.
- [x] Centrar ubicación en Mapa y recuperar navegación al cerrar resultados.
- [x] TypeScript/lint y 196 pruebas locales aprobados el 2026-10-25.
- [x] Cámara con pellizco para zoom; último corte sin título ni pastilla 1×.
- [x] Pulido compartido de Filtros/Listas, encabezados, iconos, colores y desvanecido.
- [x] Error al abrir Listas corregido con regresión; el usuario confirmó «ya quedó me parece».
- [x] Precio por platillo sin + y panel Nuevo menú con oscurecimiento sincronizado.
- [x] Elegir de Fotos corregido en código: cierre nativo antes del picker,
  recuperación sin cámara y regresiones automatizadas. QA física pendiente.
- [x] Zoom progresivo sin números; giros finales de Claude/Jev en PatioGiros
  junto con Ionicons (taco 2A y catálogo documentado).
- [x] Borrador de fichas preparado; soporte `quehayhoy.patio@gmail.com`.

Backend comprobado el 2026-10-09: [producción](PRODUCTION_PROMOTION_2026-10-09.md)
y [staging](STAGING_REHEARSAL_2026-10-09.md). No repetir login, migraciones,
asignación de dueños ni borrado de datos sintéticos para cerrar esta lista.

## 1. QA del usuario y estabilidad móvil

- [ ] Subir los commits locales y el cierre `335f36c` del 2026-10-18 a
  `rebuild/patio-final`, incluidos los commits posteriores de Claude.
  Dry-run de push revalidado el 2026-10-25: HTTP 403.
  GitHub confirma que la cuenta activa `T1Alejandro` tiene `push: false`.
  Autenticar una cuenta de Patio con escritura; conservar historia y rama,
  sin force-push ni cambio de propietario.

- [ ] Alejandro: buscar «mole», cerrar resultados con swipe, tocar Guardados/
  Cuenta y reabrir la misma búsqueda. Confirmar que vuelve la navegación y
  no se cierra Patio al inicio del iPhone; el cierre anterior sigue sin confirmar.
- [ ] Alejandro: comprobar cards con nombres/precios largos, con/sin sello,
  claro/oscuro, letra grande, teclado y margen inferior. Contrato y ejemplos:
  [columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).
- [ ] Probar el centrado con ubicación concedida, aproximada, denegada y sin
  respuesta; Guardados y ficha omiten distancia si no se puede obtener.
- [ ] Completar recorridos Foodie/Fondero en iPhone y Android: acceso, guardar,
  listas/mover/renombrar, cámara/galería, publicar y recuperar tras fallo de red.

La confirmación del ajuste reciente de Listas queda registrada; no acredita
los recorridos completos anteriores. El usuario prueba en celular. USB fue
retomado con autorización y DEV restaurado; no repetirlo ni sustituir por
Release sin necesidad. Auditorías amplias siguen fuera de este cierre.

- [ ] Confirmar en iPhone/Android: Elegir de Fotos abre el selector, cancelar
  sale al historial, reintentar lectura conserva Fotos; cámara solo al elegirla.
- [ ] Confirmar en mapa lejano/medio/cercano: puntos sin números, búsqueda
  conservada, selección, snapshots y tacos/elotes legibles sin cierres.

## 2. Dependencias, Android e integraciones

- Verificación 2026-10-24: auditoría actualizada de 10 a **8 paquetes afectados
  (5 altos, 3 moderados, 0 críticos)** tras actualizar `fast-uri` 3.1.8 → 3.1.9
  y `undici` 6.28.1 → 6.29.1 en el lockfile. Parches Metro/maps reaplicados;
  TypeScript, lint y 189 pruebas aprobados. Quedan las cadenas de `node-forge`
  y `decode-uri-component`; no aplicar `audit fix --force` (propone cambios
  incompatibles de Expo/router). Release: 29 correctos, dos pendientes Android.
  Evidencia local: `/private/tmp/patio-check-20261024.log`.

- [ ] Resolver la auditoría npm conservando compatibilidad nativa y verificar
  otra vez. Última consulta 2026-10-24: **8 paquetes afectados, 5 altos, 3
  moderados, 0 críticos**. Son cadenas de dependencias, no 32 fallos independientes.
  `npm audit` sigue devolviendo 1; `npm run check` no sustituye esa auditoría.
  CI conserva su gate `npm audit --audit-level=high`; no desactivarlo para dar
  el release por aprobado.
- [ ] Confirmar el cierre de la rotación/revocación de la clave de proveedor
  legada `EXPO_PUBLIC_ANTHROPIC_API_KEY`, pendiente del roadmap anterior.
- [ ] Configurar y validar `GOOGLE_MAPS_ANDROID_API_KEY` y
  `GOOGLE_SERVICES_JSON` en el entorno Android candidato. Son los dos pendientes
  del control de release actual: 29 correctos, 0 errores.
- [ ] Comprobar APNs/FCM, recepción y apertura de avisos en ambos teléfonos;
  sesión cerrada/cambiada no debe recibir avisos ajenos.
- [ ] Ensayar entrega de magic link y retorno con app cerrada/abierta, enlace
  vencido/reutilizado y cambio de cuenta. Staging no probó entrega SMTP.
- [ ] Ensayar respuestas reales de IA y recuperación de errores/cuotas. Las
  funciones están desplegadas; el ensayo previo no hizo llamadas IA pagadas.

Logs de esta verificación: `/private/tmp/patio-npm-audit-20261012.json` y
`/private/tmp/patio-checkpoint-check-20261012.log`.

## 3. Privacidad, operación y tiendas

- [x] Operador legal: Alejandro como persona física (confirmado 2026-10-26).
- El cierre del aviso y domicilio se mueve al último bloque, por petición del usuario.
- [x] Contacto responsable ante tiendas: Alejandro; Claude/Codex apoyan con
  triaje y borradores de respuesta (decidido 2026-10-26).
- [ ] Conectar Gmail de `quehayhoy.patio@gmail.com` para la revisión diaria de
  reportes y completar moderación operativa.
  El soporte público aprobado sigue siendo `quehayhoy.patio@gmail.com`.
- [ ] Acceso del revisor (a cargo de Claude): hoy solo hay enlace mágico
  (`signInWithOtp`), que el revisor no puede abrir. Agregar código de 6 dígitos
  y documentar una cuenta de revisión con datos de prueba.
- [ ] Completar App Privacy/Data Safety,
  clasificación, regiones, contratos y accesos de Apple/Google.
- [ ] Generar un candidato firmado por plataforma después de resolver los
  gates anteriores. Verificar permisos, enlaces, mapas, push y bibliotecas
  Android de 16 KB en los artefactos finales.
- [ ] QA del candidato desde TestFlight/prueba de Google Play; capturas de
  esa versión, resultados registrados y correcciones de fallos.
- [ ] Confirmar requisitos vigentes en las consolas y obtener aprobación final
  antes del envío/publicación. El checkpoint Git no envía la app a tiendas.

Detalle: [checklist de distribución](STORE_RELEASE_READINESS.md) y
[borrador de fichas](STORE_SUBMISSION_DRAFT_2026-10-09.md).
No iniciar EAS ni publicación automáticamente desde esta actualización documental.

## 4. Después del candidato

- [ ] Incorporar una miniatura real del local en la zona superior del grid;
  definir origen/calidad de imagen y fallback manteniendo columnas y alturas.
- [x] «Otro» pide y guarda el giro escrito en el alta; regresión verificada
  el 2026-10-26. Falta ejecutar/programar el recopilado periódico de nuevas altas;
  consulta SQL de solo lectura preparada.
- [x] Icono de Tacos: Alejandro ajustó el trazo (2026-10-26, fuente `PatioGiros6`)
  y Ayuda acredita «Icono de tacos: Freepik en Flaticon.» Conservar el crédito:
  el ajuste no cambia la licencia del original.
- [ ] Decidir tipografía de lanzamiento (Alejandro lo está pensando, 2026-10-26).
  Comprar licencias de fuentes (Pangram Pangram): 3 estilos, Monument Normal Semibold y Neue
  Montreal Regular/Semibold, app + escritorio (≈ USD 240 estimado, precio exacto en el
  carrito; para persona física no vencen; redes y web después). Resumen en el
  escritorio: «Patio — compra de fuentes.html». Reemplazar las
  pruebas de `assets/fonts/prueba/`, cambiar `Monument-Black` por Semibold y fusionar la
  rama `tipografia/monument-neue-montreal`.
- [ ] Planes: llevar a `app/plan.tsx` la propuesta de
  `artifacts/planes-propuesta-2026-10-25.html` (Foodie/Creador; Gratis/Pro; Fundadores),
  definir cupo final de lecturas y avisos, y conectar compras dentro de la app
  (StoreKit/Play Billing o RevenueCat, requiere build nativo) con entitlement `patio_pro`.
- [ ] Branding: pulir el recorrido de bienvenida del Fondero, decidir etiquetas en
  minúsculas, estilo de publicaciones/fotos/fondos y piezas de punto de venta
  (cartel con QR, sello de Fundador, sticker de ventana).
- [ ] Medir el piloto de la microzona: publicación, búsqueda, regreso y soporte.
- [ ] Evaluar OTA, mejoras de búsqueda y crecimiento después de QA y datos del
  piloto. [Roadmap de producto](PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md).

Para cada pendiente cerrado, registrar dispositivo/versión, evidencia y fecha.
No marcar aceptación móvil por pasar pruebas de componentes o exportar JavaScript.

## 5. Al último: datos legales y publicación del aviso

- [ ] Completar nombre legal, domicilio y dominio; finalizar aviso de privacidad
  y publicar URLs HTTPS de privacidad, soporte y eliminación. Codex asume el
  trabajo de preparación; no depende de coordinar otra sesión con Claude.
  Soporte y borrado dentro de ambos perfiles ya existen; no reconstruirlos.
