# STATE

> **Ejecución 2026-10-26, Codex:** código de acceso implementado en ambos roles,
> plantillas locales preparadas; catálogo de planes y checkout/restauración
> RevenueCat preparados, cobro apagado hasta conectar tiendas/entitlements/cuotas.
> «Otro» ya guarda el giro; regresión verificada. Auditoría reducida de 8 a 5
> paquetes (5 altos de node-forge, 0 moderados). Domicilio al último por solicitud
> de Alejandro. GitHub 403; Google requiere 2FA; Supabase figura INACTIVE y panel
> sin sesión; Gmail sin conectar. No declarar integraciones reales cerradas.
> [Estado de esta ejecución](EXECUTION_CLOSEOUT_2026-10-26.md).


> **Corte vigente — 2026-10-25:** conservar las últimas decisiones de Claude:
> Ionicons + PatioGiros (taco 2A, elote, postres, botanas y jugos). Mapa: puntos sin números de lejos/medio e
> iconos cerca; búsqueda conserva consulta y excluye no coincidentes.
> Menús = libro; Listas Foodie = líneas/puntos; Listas Fondero = marcadores.
> Precio por platillo sin `+`; Nuevo menú sincroniza fondo y desplazamiento;
> Elegir de Fotos abre solo la fototeca; cámara con pellizco para zoom.
> `npm run check`: TypeScript/lint y **196 pruebas** aprobados; 29 controles
> de release correctos, dos configuraciones Android pendientes. Auditoría npm
> aparte: ocho paquetes afectados (5 altos/3 moderados), cierre pendiente.
> iPhone: cliente DEV restaurado por USB tras una prueba Release local;
> no confundir esa instalación con un candidato de tienda ni producción.
> QA física integral y aceptación final de los últimos ajustes pendientes.
> [Continuidad](HEADS_UP_2026-10-12.md) · [Pendientes](PENDING_LAUNCH_2026-10-12.md).


> **Corte histórico — 2026-10-18:** pulido de Filtros/Listas, botones,
> iconografía y paleta compartida entre Foodie/Fondero guardado en este corte.
> Tras corregir el error de apertura de Listas, Alejandro respondió «ya quedó
> me parece» y pidió cerrar con documentación, commit y push. Se registra como
> confirmación del ajuste reciente; no sustituye QA completa de ambos roles,
> Android, letra grande ni candidato de tienda.
> `npm run check`: TypeScript/lint, 189 pruebas y control de release aprobados
> (29 verificaciones, 0 errores, 2 configuraciones Android pendientes).
> Push bloqueado por credenciales: GitHub confirma que `T1Alejandro` tiene
> lectura y carece de permiso de escritura en `patioquehayhoy/patio`.
> Commit del cierre: `335f36c`. Push intentado y rechazado con HTTP 403.
> Checklist vigente: [pendientes](PENDING_LAUNCH_2026-10-12.md).

## Cierre del pulido

- Colores y fondos dependen del tema; ambos roles comparten controles.
- Filtros usa columnas estables para valores y flechas; Listas y sus acciones
  conservan agrupación y medidas compartidas, sin instrucciones auxiliares.
- Listo/Organizar/Limpiar usan ancho natural; el título se centra con insets
  simétricos independientes. Las mediciones capturan el valor antes de liberar
  el evento nativo. Regresión del error `layout of null` cubierta.
- Nueva lista/Renombrar comparten editor temático, sin etiqueta duplicada y
  con altura estabilizada al abrir el teclado.
- Desvanecido pasivo en navegación y acciones de ambos roles, con espacio
  para mostrar completa la última fila. Fijar usa chincheta diferenciada.
- Evidencia y límites: [controles](CONTROLS_AUDIT_2026-10-18.md),
  [iconos](ICON_AUDIT_2026-10-18.md) y [sistema de diseño](DESIGN_SYSTEM.md).
- Rollback combinado: `design/experiments/final-filter-lists-polish-2026-10-18.patch`.
  Solo aplicar si se solicita volver y `git apply --reverse --check` pasa.
  Los demás parches son cortes históricos, no una secuencia para aplicar.

## Continuación

Completar la autenticación para subir esta rama sin force-push. Después,
seguir el checklist vigente; no reabrir el pulido aceptado sin un hallazgo.
No repetir migraciones ni login de Supabase. Diagnóstico USB, auditorías amplias,
EAS y publicación siguen fuera del alcance de este cierre.

## Historial anterior

> **Corte histórico — 2026-10-12:** auditoría de diseño aplicada a tarjetas,
> iconos, pills, listas, formularios, tipografía, feedback y copy. Contrato:
> [DESIGN_SYSTEM](DESIGN_SYSTEM.md). Evidencia y checklist físico:
> [DESIGN_AUDIT_2026-10-10](DESIGN_AUDIT_2026-10-10.md).
> Ajuste de distribución con referencia Uber: precio a la derecha, tarjetas
> compactas, paneles sin sombra y margen inferior medido. Ver
> [UBER_LAYOUT_REFINEMENT](UBER_LAYOUT_REFINEMENT_2026-10-10.md).
> Tarjetas compactas concluidas (2026-10-12): nombre de una línea en lista
> y grid, columna fija para el sello, precio y metadata sin saltos por texto.
> Estrella única y «colonia · distancia» conservadas. Fuentes Uber Base/Material,
> ejemplos y medidas en [columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).
> Búsqueda: swipe devuelve la navegación y conserva término/pines; una
> sola salida, reapertura y callbacks de cierre protegidos. Ver
> [SEARCH_SWIPE_FIX](SEARCH_SWIPE_FIX_2026-10-10.md). Cierre nativo reportado
> en iPhone aún sin confirmar. El usuario hará QA física; diagnóstico de
> dispositivo y auditoría amplia/EAS detenidos por su petición.
> TypeScript y lint limpios; **177/177 tests**. Exportaciones nativas del
> corte previo completas; este ajuste se verificó localmente sin EAS.
> El backend ya fue promovido tras staging: no repetir migraciones ni pedir login.
> Pendientes vigentes: [checklist/roadmap](PENDING_LAUNCH_2026-10-12.md).
> Auditoría npm actualizada: 32 paquetes afectados (24 altos, 8 moderados,
> 0 críticos). Heads-up: [continuidad](HEADS_UP_2026-10-12.md).
> Los cortes anteriores siguientes son históricos; sus pendientes no sustituyen
> este estado. Checkpoint en rebuild/patio-final; no implica envío a tiendas.

> **Producción actualizada (2026-10-09):** siete migraciones aplicadas y registradas; cinco funciones ACTIVE con JWT. Datos existentes conservados; correos protegidos. Evidencia: [PRODUCTION_PROMOTION_2026-10-09.md](PRODUCTION_PROMOTION_2026-10-09.md). Lanzamiento aún pendiente de QA móvil y requisitos de distribución.

> **Staging preparado (2026-10-09):** patio-staging creado; siete migraciones
> y cinco funciones instaladas. **15 pruebas reales Auth/RLS/Storage/Edge**
> aprobadas; posteriormente promovidas a producción con autorización explícita. Ver
> [STAGING_REHEARSAL_2026-10-09.md](STAGING_REHEARSAL_2026-10-09.md).


> **Corte histórico — 2026-10-09:** lanzamiento solicitado para iPhone y Android.
> Homologación de bibliotecas implementada; 149 pruebas y 19 comprobaciones SQL
> aisladas aprobadas; exportaciones de ambas plataformas completas. Backend real,
> seguridad restante, configuración Android, QA visual y tiendas siguen abiertos.
> Checklist y contrato: [LAUNCH_CLOSEOUT_2026-10-09.md](LAUNCH_CLOSEOUT_2026-10-09.md).
> Los cortes anteriores se conservan como historial, no como estado de lanzamiento.


## Corte histórico — auditoría 2026-10-01

Trabajo parcial: cards y mover implementados; etapa 1 pendiente de inventario,
contrato, degradado de scroll y QA en iPhone físico. Etapas 2 y 3 sin cierre.
TypeScript, lint y 133 tests aprobados hoy. Release estricto falla por Maps y
Firebase Android; Supabase real y bloqueos de lanzamiento siguen sin certificar.
Siguiente: cerrar pendientes de etapa 1 y después continuar etapa 2.
Evidencia y límites: [PENDING_AUDIT_2026-10-01.md](PENDING_AUDIT_2026-10-01.md).
Los cortes históricos siguientes no sustituyen este estado.


> Fuente de verdad operativa. Última actualización: 2026-09-14.

## Prioridad actual — refinamiento de navegación y filtros

Mapa y Guardados comparten buscador y accesos directos Filtros/Tus listas.
El panel presenta un resumen de cuatro filas; categoría y pago abren sus
opciones dentro de la misma hoja. La navegación tiene etiquetas y estados visibles. Guardados distingue lugar, menú, ubicación y
contexto personal, sin repetir el encabezado Guardados. Menú de hoy usa publicaciones reales de la fecha CDMX.
TypeScript, lint, 118 pruebas y export JavaScript iOS aprobados. Falta
aprobación visual en iPhone físico. Ver corte superior de [HANDOFF](HANDOFF.md).

## Continuación de auditoría — 2026-09-12

- Corregidos el guardado tardío de título y el reuso del magic link en mounts
  consecutivos; las transiciones de Auth esperan guardados pendientes y mantienen
  suspendidas las escrituras si falla la restauración local, hasta recuperarla.
- TypeScript, lint y 105 pruebas aprobadas. Export JavaScript iOS/Android verde.
- Smoke de navegación pública 1/1 aprobado sobre el binario Release del 10-sep;
  no acredita login, publicación, hardware ni las correcciones posteriores.
- Dependencias: 16 paquetes afectados (8 altos, 8 moderados) tras actualizar
  uuid para sus consumidores. `npm audit` sigue bloqueante.
- Los pendientes externos y el P0 de infraestructura siguen vigentes.
  Detalle y evidencia en [HANDOFF](HANDOFF.md) y la
  [auditoría](APP_AUDIT_2026-09-10.md).

## Corte de auditoría de lanzamiento — 2026-09-11

- Corregidos acceso por enlace, separación y restauración de datos por cuenta,
  errores de guardado/publicación, fechas CDMX y respuestas tardías de pantalla.
- Incorporadas eliminación de cuenta, reportes y bloqueo/desbloqueo. Su backend
  está preparado en el repositorio; todavía requiere despliegue y ensayo con
  el esquema real, Auth y Storage. No se modificó producción.
- Configuración nativa revisada en un prebuild aislado iOS/Android. La
  compilación local iOS Release para simulador pasó, sin firma de distribución.
- Ensayo SQL mínimo: 14 comprobaciones reales de RLS, transacciones y cascadas
  aprobadas. No sustituye la validación del proyecto Supabase real.
- El lanzamiento sigue bloqueado por backend verificable, configuración
  Maps/Firebase Android, avisos altos de dependencias, identidad legal e
  infraestructura, moderación efectiva y QA de dispositivos/firma.
- Resultados y pendientes actuales: [auditoría](APP_AUDIT_2026-09-10.md),
  [backend](APP_BACKEND_AUDIT_2026-09-10.md) y
  [tiendas](STORE_RELEASE_READINESS.md). Los cortes históricos siguientes
  describen su momento y no anulan estos bloqueos.

## Corte Foodie — 2026-08-10

- Guardados es el destino directo del tab Foodie; la biblioteca intermedia queda
  fuera del flujo mientras se valida la organización básica.
- Mapa y Guardados montan `FoodieFilterBar` como única fuente de verdad para
  accesos, edición, persistencia y ruedas de categorías/listas.
- Las filas de Guardados priorizan identidad, platillo y confianza: nombre,
  verificación, menú disponible, ubicación y rating. Precio global y distancia
  quedan fuera de esta superficie.
- La búsqueda reserva el gesto de cierre al grabber y deja el scroll de
  resultados libre; su panel se adapta al teclado sin hueco o borde inferior.

## Bloqueo de lanzamiento — identidad e infraestructura

Antes de producción pública debe centralizarse la propiedad de Supabase,
GitHub, Expo/EAS, Apple y los correos bajo una identidad neutral de Patio. El
correo `quehayhoy.patio@gmail.com` describe un caso de uso, no todo el producto,
y no debe quedar como dependencia estructural.

Está permitido crear un proyecto Supabase nuevo, migrar y retirar el actual,
pero no se ha autorizado ejecutar el borrado ahora. Primero se requiere
inventario, respaldo, migración ensayada, QA integral, dos administradores y plan
de reversión. Este trabajo es **P0 inmediato antes de lanzar**; el checklist
canónico vive en `docs/TASKS.md`.

## Corte de producto — 2026-07-28

- Guardados/Colecciones unificados; cada lista abre su proyección en el mapa.
- Filtros rápidos del mapa + selector temporal de categorías y colecciones.
- Precio únicamente por platillo; retirado el precio global de las superficies.
- Perfil público recompuesto y reseñas comunitarias al final.
- Una respuesta oficial del Patio por reseña, sin conversación anidada.
- Actividad Fondero basada en acontecimientos reales, sin datos sintéticos.
- Plan y Privacidad explican estado y consecuencias; Avisos evita verificación
  duplicada.
- Edición Fondero respeta modo claro/oscuro.
- QA estático verde; revisión visual humana en iPhone pendiente.

## Corte de producto — 2026-07-25 (perfil de lectura y cierre de QA)

- El giro del negocio es dato persistente y editable. La etiqueta visible usa
  **Fondita**; visión selecciona internamente el perfil correspondiente.
- Las secciones del menú se conservan en mayúsculas. Jerarquía del editor:
  H1 36/38, sección 18/22, platillo 16/21 y descripción 13.
- Precio por platillo siempre visible y próximo a su platillo. **Precio único**
  es opcional y queda agrupado al final del contenido como detalle del menú.
- `read-menu` usa asociación espacial de precios, distingue precio único/de
  sección/por platillo y deriva variantes múltiples a revisión descriptiva.
- El panel de mapa tiene transición interactiva y cierre completo antes del
  desmontaje; elimina el salto visual del cierre inmediato.
- QA estático pendiente de repetir tras despliegue; QA humano iPhone pendiente.

## Corte de producto — 2026-07-25 (navegación y continuidad)

- Checkpoint aceptado como **“medio me gustó”**: conservar, probar en iPhone e
  iterar; no interpretar como aprobación visual definitiva.
- Navegación vigente: Foodie = **Buscar/Lugares/Perfil**; Fondero =
  **Menús/Actividad/Perfil**.
- Publicar es una acción dentro de Menús. El selector de creación ofrece cámara,
  Fotos o escritura; la reutilización se resuelve desde cada menú del historial.
- Mapa y búsqueda abren el perfil público directamente. Ya no existe una ficha
  intermedia redundante ni numeración de negocios.
- Lugares agrupa favoritos por categoría y persiste qué categorías filtran los
  puntos del mapa.
- La barra raíz es estable y no se encoge u oculta con scroll.
- El éxito de publicación lleva al perfil o al share sheet nativo.
- Notificaciones Foodie y Fondero tienen preferencias locales independientes.
  Falta backend para seguir un Patio y recibir push cuando publique.
- La tarjeta de métricas sintéticas Fondero se retiró. Reseñas, vistas y
  actividad multiusuario continúan como trabajo de backend.
- QA de este corte: TypeScript, ESLint y diff check verdes. Revisión visual
  pendiente de Alejandro; no se usó simulador por instrucción explícita.

## Corte de producto — 2026-07-24 (menú inteligente, póster y monetización)

- Núcleo confirmado: **perfil público + menú vivo + póster**. El perfil sostiene
  la relación, el menú es la fuente estructurada y el póster es una sola vista
  canónica dentro de Patio. Compartir distribuye el enlace a esa misma vista.
- Implementado: `read-menu` usa JSON Schema estricto, reglas explícitas para
  platillo/ingrediente/opción/precio, confianza y revisión dirigida. La Edge
  Function quedó desplegada en el proyecto `lafondita`.
- La app conserva extracción y versión aprobada para formar ejemplos de
  corrección locales; falta centralizar ese conjunto con metadatos de
  modelo/prompt antes de hablar de entrenamiento.
- La ficha pública conserva secciones, descripciones, precio general, precios por
  platillo y la reseña local. El póster es una sola vista canónica, scrolleable,
  abre el perfil y comparte su deep link; no genera archivos ni formatos alternos.
- Esta navegación fue reemplazada el 2026-07-25 por
  Buscar/Lugares/Perfil y Menús/Actividad/Perfil.
- QA real de simulador completado con una imagen de menú: foto → extracción →
  revisión → publicación → recompensa → póster → perfil. Se validaron el precio
  general `$700`, precios individuales, descripciones y reseña en perfil con
  Maestro.
- Decisión IA: primero contrato, JSON Schema, ontología, validación y revisión
  humana dirigida. El uso no entrena automáticamente al modelo; Patio debe formar
  su conjunto de evaluación con correcciones explícitas.
- Los vectores se reservan para búsqueda semántica, recuperación de casos
  parecidos y recomendaciones. No son fuente de verdad ni sustituyen la
  clasificación visual de platillo, ingrediente, variante y precio.
- Fotografías fuera del camino crítico: el alta y la publicación funcionan con
  identidad + menú. Las fotos llegan después, curadas y solo cuando aporten valor.
- Monetización diversificada por etapas: perfil + menú vigente + póster canónico
  gratis; suscripción con hipótesis principal de $99 MXN/mes o $990/año;
  consumo IA, promoción local, servicios de puesta en marcha y comisión solo
  cuando exista una transacción real.
- Fuente técnica:
  `docs/MENU_INTELLIGENCE_AND_POSTER.md`.
- Fuente de crecimiento y cobro:
  `docs/NETWORK_COLD_START_AND_MONETIZATION.md`.

## Corte de producto — 2026-07-24 (red, perfil público y arranque en frío)

- Decisión confirmada: conservar la app y reestructurar secciones; el onboarding,
  los avisos iniciales y el alta del negocio quedan como base aprobada.
- El perfil público de cada Patio será la unidad central de la red: identidad,
  menú vigente, menús visibles anteriores, seguir/guardar, reseñas y actividad.
- Esta navegación objetivo fue refinada en el corte 2026-07-25.
- `The Cold Start Problem` gobierna el lanzamiento: primera red atómica alrededor
  de Polanco, diez negocios incorporados personalmente, lado difícil subsidiado y
  expansión por zonas adyacentes después de validar densidad.
- Monetización definida como hipótesis: núcleo gratuito y varias fuentes de
  ingreso por etapas; fundadores reciben seis meses de funciones completas.
- Fuente completa:
  `docs/NETWORK_COLD_START_AND_MONETIZATION.md`.
- La arquitectura de navegación y la primera versión del perfil ya están
  aterrizadas. El siguiente bloque de red requiere backend social real:
  follows, reseñas, vistas, versiones visibles y entregas de notificación.

## Corte operativo — 2026-07-23 (parte 2: redisño HIG + panel de estadísticas)

- `cuenta.tsx`, `perfil.tsx` y `perfil-editar.tsx` reagrupadas por propósito
  (Negocio/Preferencias/Ayuda/salidas) con un componente compartido nuevo
  (`components/settings-list.tsx`) — antes cada pantalla tenía su propia fila
  visualmente distinta. Status de "menú publicado hoy" separado de la
  dirección en Mi Patio. Typecheck/lint verdes; verificado en simulador claro.
- Nuevo panel de estadísticas + reseñas en `historial.tsx`, visible cuando
  `menus.length > 0`. Datos **sintéticos, solo `__DEV__`** vía
  `lib/patio-stats.ts` — decisión explícita de Alejandro de construir la
  interacción completa antes de tener backend real. El backend real (tabla
  de reseñas + RLS + contador de vistas) sigue sin existir — detalle en
  `docs/TASKS.md`.
- Ajuste tras feedback de Alejandro: los grupos finales de `perfil.tsx`/
  `cuenta.tsx` (salidas de contexto) ahora llevan label "Cuenta" — antes eran
  el único grupo sin título. Reseñas dejó de ser un panel embebido en
  Historial: ahora es pantalla propia (`app/resenas.tsx`, patrón App Store
  "Calificaciones y reseñas"), con entrada desde el grupo "Negocio" de Mi
  Patio. Sigue con datos sintéticos `__DEV__` — sin backend real todavía.
- Build de TestFlight lanzado 2026-07-23 con este bloque completo.

## Corte operativo — 2026-07-23 (confirmaciones de Alejandro, sin código)

- Bug de guardado en historial (abierto el 22-jul): **confirmado resuelto**
  por Alejandro — cualquier menú que guarda o crea se queda guardado.
- QA nativo con avance real: **cámara/galería confirmada funcionando**; **GPS
  confirmado funcionando** (Alejandro marca ubicación sin problema al crear/
  editar perfil Fondero — cobertura happy path). Sigue pendiente **magic link
  real** en iPhone.
- Templates de email siguen pendientes de instalar en Supabase Dashboard —
  confirmado que no se descartan, solo no son la prioridad inmediata.
- Nuevo backlog (no urgente): el campo NOMBRE del alta no valida longitud.
- Nueva idea de producto sin definir: panel de Historial que, después de la
  primera vez, muestre estadísticas del menú + reseñas del Patio en vez del
  hint fijo — depende de una feature de reseñas del lado Fondero que no
  existe hoy. Detalle en `docs/TASKS.md` ciclo 2026-07-23.
- Próximo hito acordado: build de TestFlight para mostrar Patio a otras
  personas, una vez cerrada esta ronda de QA (magic link, recorte de
  galería, blur del mapa).

## Corte operativo — 2026-07-22

- Documentación: 53 → 49 `.md` (4 legacy borrados); tipografía real (`Fonts.brand`,
  pesos 900/700/300) reconciliada entre `CLAUDE.md`/`DESIGN_SYSTEM.md` y el código;
  color de botones homologado (acción de confirmación prominente = acento naranja,
  una sola por pantalla, con cita de Apple HIG). Detalle completo en
  `docs/DOCS_AUDIT_2026-07-22.md` y sesión en `docs/HANDOFF.md`.
- Agentes: `foodie-ops` nuevo (Foodie no tenía dueño); `fondero-ops` ahora declara
  explícitamente las Edge Functions/migraciones como su territorio.
- Historial (`app/historial.tsx`) ahora permite **eliminar** un menú (local +
  Supabase) — no existía antes. También: botón "+ Menú nuevo", "Renombrar" en vez
  de "Nombrar", ícono de tab coherente (`receipt-outline`), sin fecha duplicada en
  el título por defecto.
- `menu-composer.tsx`: pills de sección con revelación progresiva real (abre y
  cierra); secciones nuevas nacen sin nombre falso pre-llenado.
- Feedback de guardado (haptic + visual) homologado entre menú y perfil.
- Bug corregido: `saveDraft` podía fallar en silencio y decir "Guardado" sin
  verificar — pendiente confirmar con Alejandro si esto resolvió el reporte
  original o si hace falta más diagnóstico (Guardar vs. Publicar, sesión vs. DEV).

## Corte operativo — 2026-07-20

- Editor de horarios reconstruido como composición bilateral por día. Los días usan
  abreviaturas inequívocas (`MA`/`MI`), los atajos no desplazan texto al activarse y
  cero días se comunica solo mediante `0 abiertos`. La revisión visual final usa
  reflexión bilateral por día: nombre y `→` en la mediana; ABRE/CIERRA en mitades
  idénticas; conteo de días y feedback háptico. Las cápsulas ya no colisionan. La edición
  usa una ruleta nativa `spinner` en una superficie propia centrada de 320 pt, por lo que
  apertura y cierre tienen el mismo marco y padding; Maestro verifica además el autocierre.
- `ESSENTIAL_DESIGN_PRINCIPLES.md` contrastado contra la transcripción oficial completa:
  separa charla/HIG/decisiones Patio, corrige Mortimer (mental model, no mapping),
  distingue alineación de simetría y añade pruebas operativas por principio.
- Maestro `13-alta-negocio` y `16-editar-perfil-negocio` pasan con el editor compartido;
  evidencia específica en `maestro/screenshots/13-horarios.png`.
- La corrección previa de ABRE/CIERRA en extremos y remount del picker compacto queda
  reemplazada por la composición bilateral y la ruleta centrada descritas arriba.
- `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md` reescrito con el mecanismo
  real de cada uno de los 12 principios del WWDC17 802 (antes solo tenía el título de
  cada slide) y una nota de vigencia: Liquid Glass (WWDC25) es el material actual vía
  el skill `apple-design`; "múltiplos de 8px" no es regla de Apple, es convención propia
  de Patio.
- TypeScript y ESLint pasan sobre los archivos tocados.
- QA pendiente: confirmar en iPhone físico que la simetría de horarios y la animación
  del picker ya se sienten resueltas (ver `docs/HANDOFF.md`).

## Corte operativo — 2026-07-19

- Rama `rebuild/patio-final` limpia y sincronizada con GitHub; incluye el baseline
  funcional `d0a5e8d` y el commit documental de cierre posterior.
- TypeScript, ESLint y `git diff --check` pasan.
- La introducción visual separa intención: explorar → avisos opcionales → mapa;
  publicar → correo → alta del negocio → primer menú.
- El alta pide únicamente nombre, ubicación, días/horarios y pagos; alta y perfil
  comparten los editores canónicos de horario y métodos de pago.
- La lectura de foto y el setup inteligente viven detrás de Edge Functions; el QA
  real de credenciales, despliegue y fotografías sigue pendiente.
- Reiniciar la Mac es seguro. El procedimiento exacto y los límites de caché están
  en la sección superior de `docs/HANDOFF.md`.

Las secciones anteriores permanecen como bitácora. Si contradicen este corte o el
handoff superior, prevalece el estado del 2026-07-19.

## Corte operativo — 2026-07-16

- TypeScript y ESLint pasan sobre `rebuild/patio-final`.
- Se eliminaron los dos estilos `dashed` que producían el warning nativo.
- La antigua `EXPO_PUBLIC_ANTHROPIC_API_KEY` se retiró del `.env` local; la clave
  expuesta debe rotarse en Anthropic antes de configurar el secreto servidor.
- No se encontraron métricas hardcodeadas `312 vistas` / `+18%` en el código actual.
- El despliegue de `read-menu` sigue bloqueado por autenticación del CLI de Supabase.
- El QA de integraciones nativas sigue requiriendo el iPhone físico.

## Decisión vigente

El cierre de Patio pasa a implementación directa en React Native. Figma Make queda
como archivo de referencia (`v01`/`v02`), no como fuente final ni generador de las
pantallas restantes. El intento v03 no se adopta.

La app actual permanece como baseline funcional en `rebuild/patio-final`. En vez de
una reescritura destructiva, se estabilizaron sus contratos y se comprobó el flujo
real sobre la UI vigente; la rama anterior conserva Patio Vivo recuperable.

## Salud técnica — 2026-07-16

- TypeScript: pasa.
- ESLint: pasa.
- Expo dependency check: dependencias alineadas; `npx expo install --check` pasa.
- Producción: Anthropic Vision ya sale por la Edge Function `read-menu`; falta
  desplegarla y registrar `ANTHROPIC_API_KEY` en Supabase.
- Exports: bundles iOS y Android generados correctamente.
- Seguridad: `credentials.json` dejó de estar versionado y quedó ignorado.
- Dispositivo real: pendientes magic link, cámara/galería, GPS, compartir, push y
  apertura de mapas.

## Estrategia inmediata

1. Desplegar `read-menu` y guardar su secreto en Supabase.
2. Ejecutar el barrido humano en iPhone de las integraciones nativas.
3. Corregir únicamente hallazgos reproducibles del barrido.
4. Preparar build de distribución solo con autorización de Alejandro.

## Corte activo — 2026-08-01

- La ficha pública es factual: fuera `reason` editorial y fuera píldoras de
  distinción. Las medallas se derivan de menú completo, comunidad y trayectoria.
- Tocar una medalla reutiliza la pleca práctica sin mover el layout. La pleca
  normal alinea horario, pagos y apertura en tres columnas antes del mapa.
- Las reseñas demo ejercitan comentario, republicación, like, vistas y compartir,
  además de hilos con varias respuestas. Persistencia multiusuario y verificación
  servidor siguen pendientes; los contadores actuales son datos de desarrollo.
- Se conservan todos los Patios sintéticos. Tres escenarios principales de QA se
  distinguen en el mapa con pin lapislázuli: menú extenso, apertura reciente con
  reseñas críticas y nombre largo con buena reputación.
- Metro LAN fue probado en iPhone 15 Pro físico.
- TypeScript, ESLint, Expo Doctor (18/18) y `git diff --check` pasan.

## Ajuste activo — 2026-08-02

- Búsqueda única para nombre de lugar y platillo, con ranking explícito de nombre.
- Tarjetas de búsqueda compactas: sin giro persistente; distancia junto a rating.
- Pleca de ficha: apertura izquierda, pagos centro, horario derecha.
- Horario ausente o parcial nunca se rellena con datos inventados.
- Reseñas append-only por visita: una por cuenta/Patio/día, sin edición.
  **Aplicada 2026-08-29** (`20260804_make_reviews_immutable.sql`) — hasta
  entonces `reviews.id` no existía en la base real y ninguna reseña real se
  mostraba en ningún Patio (`getPublicPatioReviews()` fallaba en silencio).

## Estado ejecutivo

Patio ya tiene un MVP funcional de dos lados:

- **Foodie:** abrir sin login -> explorar mapa -> buscar platillo -> seleccionar fondita -> ver ficha/menu -> guardar/compartir/calificar/como llegar.
- **Fondero:** login magic link -> perfil negocio -> marcar ubicación -> crear/editar menú -> guardar en Supabase -> preview/share.
- **Puente real:** lo que publica Fondero en Supabase puede verse desde la ficha Foodie.

El foco actual es **QA en dispositivo + rediseño visual homologado**, no construir el flujo base desde cero.

## Hecho

### Producto / flujo

- Entrada Foodie-first con acceso secundario Fondero.
- Foodie y Fondero separados por intención y navegación.
- `/explorar` es la home real del Foodie.
- `/buscar` no es flujo visible del MVP; recupera hacia `/explorar`.
- Explorar abre como radar de antojo: mapa vivo, buscador protagonista, sugerencias ambient y sheet solo con intención.
- Favoritos, cuenta y manifiesto existen como utilidades/secundarios.
- Rating de 5 estrellas implementado con razones estructuradas cuando baja de 5.
- Share nativo de ficha/lugar implementado.

### Fondero

- Login por magic link.
- Perfil de negocio rediseñado con categoría, horario, pagos y ubicación.
- GPS/lat-lng en `perfil.tsx`.
- `menu.tsx` guarda menú del día y carta permanente.
- `foto-menu.tsx`, `preview.tsx` y `share.tsx` existen y fueron auditados en ciclos previos.
- Hints contextuales one-time implementados en Fondero y Foodie.

### Supabase

| Tabla | Estado |
|---|---|
| `fonditas` | ✅ lat/lng aplicado, lectura/escritura desde perfil |
| `menus` | ✅ menú del día desde `menu.tsx` |
| `cartas` | ✅ carta permanente desde `menu.tsx` |
| `menu_sections` | ✅ creada para migración estructurada futura |
| `menu_items` | ✅ creada para migración estructurada futura |

### Foodie data

- `fetchPublicFonditas()` carga fonditas reales.
- `fetchFonditaById()` permite fallback cuando un ID no está en mocks.
- `fetchMenuForFondita()` lee `cartas` primero y hace fallback a `menus` del día.
- `favoritos.tsx` combina mocks + Supabase.
- `explorar.tsx` combina búsqueda de mocks con `searchLiveMenus()` para cartas/menús reales.

### Sistema de diseño implementado

- `Fonts.brand` = Plus Jakarta Sans 800ExtraBold.
- `fontWeight` permitido: `'900'` / `'300'`, con excepciones documentadas.
- Separadores deben usar `StyleSheet.hairlineWidth`.
- Glass usa `expo-blur`; velos de mapa usan `expo-linear-gradient`.
- La paleta vigente es la de `lib/colors.ts`: fondo `#F8F8F5`, texto/botón `#1C1C1E`, accent naranja `#F2612F` light / `#FF6A3D` dark.
- No hay decisión pendiente de amarillo ni de segundo acento cálido. El rediseño debe elevar jerarquía, glass, geometría, composición y ritmo usando la paleta actual.

## Pendiente ahora

### QA humano / dispositivo

1. Verificar build iOS/TestFlight o preview en dispositivo real.
2. Probar magic link Fondero con diagnóstico visible si falla — **pendiente**.
3. ~~Probar cámara/galería y permisos nativos.~~ **Confirmado 2026-07-23:
   funciona.**
4. ~~Probar GPS real en `perfil.tsx`.~~ **Confirmado 2026-07-23: funciona**
   (happy path — permiso concedido, marcar ubicación al crear/editar perfil).
5. Registrar UDID de iPhone para builds internos si aplica.
6. Configurar API key Google Maps restringida antes de builds Android reales.

### QA automatizado local

- Maestro comprobó entrada, Explorar, selección, detalle, Cuenta, búsqueda,
  Favoritos, Perfil, menú y preview.
- El flujo de publicación quedó comprobado completo: crear menú manual, publicar,
  confirmar “Tu menú está vivo”, abrir póster y llegar a Compartir.
- Evidencia vigente en `maestro/screenshots/` y flows `01` a `12`.

### Auditoría visual de implementación

1. Auditoría humana ya realizada: funcionalmente bien, visualmente insuficiente para el estándar premium/minimalista.
2. Falta convertir esa auditoría en sistema y mockups implementables.
3. Antes de código visual grande: asegurar que `docs/DESIGN_SYSTEM.md`, `docs/design/VISUAL_SYSTEM.md` y `lib/colors.ts` digan lo mismo.

## No pendiente

- Migración lat/lng en `fonditas`.
- Creación de tablas `menu_sections` / `menu_items`.
- Conectar ficha Foodie a menú real.
- Conectar favoritos a Supabase.
- Implementar sugerencias ambient en Explorar.
- Implementar ratings estructurados.
- Implementar fuente de marca activa.
- Implementar hints contextuales.

## Capturas

- Fuente vigente de screenshots históricos: `assets/screenshots/` (el índice `docs/design/SCREENSHOT_INDEX.md` se retiró el 2026-07-22 por no tener más referencia que documentos legacy).
- `docs/design/screenshots/` no existe actualmente en el worktree.
- No documentar un paquete de screenshots nuevo hasta que los archivos existan físicamente.

## Validación

- Último estado documentado: typecheck, lint, Expo dependency check y
  `git diff --check` en verde el 2026-07-10.
- Antes de cerrar cualquier ciclo de código: correr `npx tsc --noEmit`.
- Para cambios visuales sustanciales: validar en simulador primero; build EAS solo cuando el simulador no alcance.
