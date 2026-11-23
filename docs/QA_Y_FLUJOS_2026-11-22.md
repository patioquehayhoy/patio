# Menús, editor y formas de venta — 22 noviembre 2026

**Tercera revisión:** Parco rechazó el contorno de la segunda. Publicado hoy
queda como sección continua alineada con la biblioteca: encabezado discreto,
Editar a la derecha y nombre en una fila navegable; una línea inferior fina
separa los grupos. Sin tarjeta ni sangría adicional. Adaptación de las HIG
de [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
y [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).
Se preservan acciones y textos completos. QA visual solo por Parco.

## Fuente y alcance

Reporte directo de Parco en iPhone, inspección de código y validaciones de
lógica. No hubo QA visual en simulador ni recorrido general automatizado en
iPhone. Parco pidió hacer él las pruebas visuales y de uso. La aprobación de
una dirección no equivale a aprobación visual del resultado.

## Qué quedó implementado

Menús muestra el menú publicado hoy separado de la biblioteca, con su nombre
o resumen y dos acciones: Ver menú y Editar. Los borradores y otros días
siguen disponibles. Un filtro de listas no oculta lo publicado hoy. En
selección se recupera la lista completa para organizarla.

Publicado no significa el primero de la lista: depende de la fecha del día y
de que su hora programada haya llegado (`menuPublicationState`). Ver menú
abre el póster de ese contenido preciso; Editar vuelve a ese menú para
actualizarlo. Publicar otro menú sustituye el del día en el servidor y deja
el otro contenido en la biblioteca.

El editor conserva las columnas de foto, nombre, descripción y precio, pero
las secciones se separan por tipografía y espacio. Crear pasa a una sola hoja
con grupos de menú y avisos. Programar es visible; no requiere un gesto
oculto. El estado de borrador y su escritura se expresa separado del botón.
La publicación sigue siendo explícita: escribir un borrador no lo hace público.

Actualizar estaba apagado después de cambiar un platillo, según Parco.
Ahora se habilita si hay platillos, aunque el detector no encuentre cambios.
Ese detector sigue informando y protegiendo la salida. La causa exacta del
fallo reportado en el teléfono no fue reproducida: no afirmar lo contrario.

Correcciones adicionales comprobables en código:

- Una respuesta negativa a vegetariano se distingue de una sin contestar y
  se conserva al guardar/reabrir. Antes la firma de cambios las igualaba.
- Un fallo de actualización conserva el contenido y estado publicados
  anteriores en el respaldo local; un borrador nuevo sí se respalda antes
  de intentar la publicación remota.
- Renombrar un programado conserva su hora. Editar un programado para hoy,
  antes de su hora, conserva también su programación.
- «Se acabó» en DEV sin cuenta actualiza el menú público de prueba y su
  historial, sin publicar las otras ediciones pendientes.
- Subir/Bajar son acciones de VoiceOver de los campos de nombre y sección;
  no son botones adicionales visibles. Los platillos se mueven dentro de su
  sección; mover entre secciones con VoiceOver sigue siendo una ampliación.

## Auditoría de casos: guardar, publicar y programar

| Situación | Resultado que debe reconocer Parco en el iPhone |
| --- | --- |
| Crear y escribir un platillo | Borrador; se guarda tras una pausa, sin hacerse público. |
| Salir y volver al borrador | El mismo borrador y contenido, sin duplicados. |
| Editar el tercero de varios borradores y publicarlo | Aparece en Publicado hoy, cualquiera que sea su posición previa. |
| Crear otro borrador después | El publicado no cambia por crear o guardar otro. |
| Filtrar una lista que no contiene el publicado | Publicado hoy permanece accesible. |
| Editar precio, nombre o descripción del publicado | Actualizar disponible; la ficha cambia después de actualizar. |
| Fallo de red al actualizar | Se conservan trabajo en editor y publicación anterior. |
| Programar desde la opción visible | Hora de salida visible; no presentarlo como publicado hoy antes de tiempo. |
| Renombrar o editar un programado | Conserva día y hora. |
| Deslizar un platillo y eliminarlo | Deshacer aparece; con teclado, arriba del teclado. |
| Marcar Se acabó | Solo cambia disponibilidad; no debe publicar otras ediciones pendientes. |

La última comprobación es importante tanto con cuenta real como en DEV.
Las pruebas de lógica no acreditan llegada real de pushes ni publicación de
cron a su hora; ambas siguen pendientes de Parco.

## Vegetariano: utilidad y límites

El dato sirve para encontrar platillos, sin exigir que la fonda completa se
anuncie vegetariana. La implementación actual (`lib/dish-diet.ts`) sugiere
la pregunta por nombre/descripción y excluye palabras de carne. No conoce
la receta real. La decisión sigue siendo de quien cocina.

| Caso | Qué debe evitar Patio |
| --- | --- |
| Ensalada con atún o pollo | Marcarla por contener la palabra ensalada. |
| Ensalada sin descripción | Afirmar ingredientes que no conoce. |
| Arroz o sopa preparados con caldo de pollo | Suponer que el título basta. |
| Frijoles con manteca | Suponer preparación vegetariana. |
| Platillo con queso o huevo | Confundir vegetariano con vegano. |
| Dueño respondió No | Repetir la misma pregunta al volver a abrir. |
| Taquería con una opción de hongos | Excluir todo el negocio por su giro. |

Recomendación pendiente de evaluación: conservar la marca opcional por
platillo y hacer menos frecuentes las preguntas genéricas. Preguntar ante
una señal útil o cuando quien cocina decide completar ese dato. No marcar
automáticamente ni convertir la dieta en requisito para publicar.
En este cambio se corrigió persistencia; no se alteró la heurística de
sugerencias ni se añadió una etiqueta vegana.

No se hizo una consulta nueva a Jev: la sesión no dispone de esa herramienta.
Los JSON anteriores en `docs/research/` son antecedentes de asesoría, no una
investigación nueva ni aceptación de personas reales.

## Dónde vende: modelo actual y huecos

Código: `business-where-editor.tsx`, `lib/business-places.ts`, `lib/puntos.ts`.
El giro del negocio se guarda aparte de la modalidad de venta.

| Caso | Soporte actual y limitación |
| --- | --- |
| Un local | Dirección principal. |
| Varias sucursales, mismo menú | Puntos extra; mismo perfil, mismo menú y reseñas del negocio. |
| Tianguis distinto según el día | Lugares y días; el mapa muestra el de hoy. |
| Solo reparto desde casa | Modalidad domicilio; zona aproximada. «Desde casa» como giro no configura esto solo. |
| Un local y tianguis el mismo día | Modalidad única: necesita diseño adicional; no está resuelto por completo. |
| Sucursales con precios/menús diferentes | El modelo comparte menú: pendiente. |
| Varias marcas del mismo dueño | Sigue un negocio por cuenta; no equivale a sucursales. |

Se añadió ayuda en sucursales/itinerante para que el alcance esté a la vista.
Pedir cambio de tipo de lugar abre su solicitud específica; se mantiene la
revisión de soporte existente. No se envió correo ni se cambió el giro.
Falta comprobar con Parco si Dónde vendes necesita una entrada más temprana
en el alta: hoy vive en Editar mi negocio.

## Campana

Siguiendo mantiene el icono de su estado actual y abre sus opciones. Las
ayudas que antes solo existían para lectores de pantalla ahora se muestran:
Todas al momento; Personalizadas en el resumen junto con otros lugares;
Ninguna sin avisos. Se conserva el nombre aprobado anteriormente, a la
espera de ver si una explicación visible resuelve la confusión.

Personalizadas no permite escoger platos ni una dieta por lugar hoy. Esa
personalización no debe prometerse. Las preferencias generales de avisos y
promociones también condicionan la entrega.

## Estadísticas y sesión anónima

`lib/business-stats.ts` obtiene conteos por RPC; `lib/dish-likes.ts` todavía
usa `canonicalDishName`, mientras fotos/identidad usan `dishKey` y otros
nombres confirmados. No basta sumar filas en la pantalla: hay que revisar
la identidad almacenada y evitar contar dos veces a una misma persona.
La agrupación de estadísticas queda pendiente; no se añadió otra pantalla.

Visitante sin registro y sesión anónima de Supabase son cosas distintas.
La app ya contempla explorar sin cuenta; provisionar una identidad anónima
de servidor para acciones sincronizadas es otro trabajo. Primero concretar
qué acción del visitante la necesita; no agregar un acceso obligatorio.

## Tiendas y navegador

La guía `artifacts/patio-sistema.html` se abrió en Chrome, con título Patio
— Sistema, y quedó visible. App Store Connect redirigió a acceso sin sesión
(`authResult=FAILED`); no fue posible revalidar banco, Paid Apps, impuestos
ni Small Business Program. El estado previo documentado no se promovió a
verificado actual. No hubo firmas, compras, envío de formularios ni builds.

## Validación y pendientes

`npm run check`: TypeScript y lint correctos, 352/352 pruebas de lógica y
31 controles de release sin errores. Dos avisos de configuración Android
no cargada en este entorno local; no acreditan ausencia en EAS.
Las pruebas añadidas cubren actualización fallida/reintento, persistencia
del No vegetariano, selección del publicado por fecha/hora frente al orden
y «Se acabó» en DEV sin publicar otras ediciones pendientes.
La aceptación visual, gestos, tipografía, teclado, VoiceOver, estados en el
iPhone y QA general corresponden a Parco.

Continúan: QA anterior, entrega real de resúmenes/programados, acceso de
Apple, consulta nueva a Jev, modalidades mixtas/marcas, estadísticas por
identidad y decidir si hace falta una sesión anónima de servidor.

## Segunda revisión del mismo día: respuesta al QA

Parco reportó que Se acabó/Ya hay no llegaba a la ficha. El primer cambio
guardaba el estado DEV, pero la conversión de `demo.ts` lo descartaba. Se
elimina ese conversor distinto: ahora usa `menuDataToSections` y conserva
disponibilidad, dieta, fotos y otros nombres. La ficha vuelve a consultar el
menú al recuperar foco, también para negocios reales. Una prueba de lógica
cubre marcar y quitar agotado tanto al construir la ficha como al recargar
su menú, manteniendo vegetariano. No acredita por sí sola la interacción en
el iPhone.

La biblioteca usa un título por fecha si no hay nombre propio; deja de
identificar un menú mediante una enumeración de platillos. El nombre aparece
editable a todo el ancho al inicio del contenido, y Publicar/Programar quedan
juntos en navegación. El menú al aire tiene contorno naranja. Los menús
anteriores descartan contexto vivo que pudiera venir incrustado y abren una
copia; la pantalla reconstruye el editor al volver a entrar con otra semilla.
La fila deslizable deja un espacio de 12 pt entre precio y acciones abiertas.

Para recorrer el negocio sin cuenta real, `business-demo.ts` ofrece un
conjunto coherente de cifras solo en DEV y solo para `demo-mi-patio`.
Hoy, Actividad, perfil y seguidores lo identifican como datos de ejemplo.
El perfil del negocio ofrece acceso a Hoy y Mis menús y listas; las listas
siguen leyendo el almacenamiento local, sin inventar colecciones ni tocar
las existentes. Los accesos son `patio://perfil` y `patio://hoy`.
Esto no da acceso a métricas reales de una cuenta ni crea una sesión de
Supabase. Una prueba comprueba que el conjunto de ejemplo no se entrega en
producción ni para identificadores de negocios reales.

La dieta sigue opcional; únicamente se arregló su conservación en la ficha
DEV. Las preguntas genéricas siguen pendientes de evaluar con Parco/Jev.
No hubo QA visual ni general del teléfono por Codex.
