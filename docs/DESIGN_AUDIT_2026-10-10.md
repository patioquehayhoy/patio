# Auditoría integral de diseño — Patio

Ajuste posterior de distribución: [referencia Uber y reglas aplicadas](UBER_LAYOUT_REFINEMENT_2026-10-10.md).
Precio a la derecha, tarjetas compactas y márgenes medidos de barras inferiores.

Corte: 2026-10-10. Solicitud: refinar toda la app, conservando identidad,
con agrupación, jerarquía, feedback y consistencia. Revisión del código de
35 archivos TSX de app: 34 rutas y el layout, además de componentes compartidos
y controladores de los flujos afectados. Las capturas del usuario orientaron
los cambios de tarjetas y pills; no se ejecutó revisión visual en dispositivo.

## Correcciones implementadas

- Identidad y disponibilidad compartidas en Guardados, Mapa, Vistos y listas
  privadas. Eliminadas categorías, fotos botánicas arbitrarias de lugares,
  metadata «Menú de hoy» y verde que significaba publicación, no apertura.
- Disponibilidad en una única esquina de la caja transparente del icono;
  sin placas ni contornos y sin cambios a los pines. Nombre completo y
  estado hablado en accesibilidad de las tarjetas agrupadas.
- Presupuesto de texto estable: nombre dos líneas, colonia una, precio a
  la derecha en lista y esquina superior derecha en grid; reservas proporcionales a la escala tipográfica.
  El grid permite una columna con letra grande; la ficha conserva nombre entero.
- Pills de Mapa y Guardados en posiciones constantes. Abierto sin cuenta;
  insignias de selecciones absolutas. Paneles base sin títulos redundantes;
  cerrar permanece disponible y las subpantallas mantienen contexto.
- Listas con selección izquierda coherente; marcador para fijar y lápiz
  sólido para renombrar. Aviso de mover junto a acciones, destino explícito
  y confirmación. Barra de selección adaptable a letra grande.
- Vistos y detalle privado de lista distinguen carga, error recuperable y
  vacío. Respuestas antiguas de una consulta no reemplazan una recarga reciente.
- Guardar en usa la fila compartida, bloqueo de doble acción, reintento,
  etiquetas accesibles y conservación de una creación parcial al reintentar.
- Buscador, títulos grandes, acciones y campos permiten crecer. Formularios
  de acceso, perfil comunitario y soporte contemplan teclado y scroll;
  onboarding permite desplazamiento con letra grande.
- Etiquetas persistentes en acceso y perfil comunitario. Retirado el texto
  interno «Descripción editorial»; ahora «Sobre ti». Título de perfil acorde
  con los campos reales. Estados de guardado expuestos a accesibilidad.
- Área efectiva ampliada en reseñas, seguir y acceso a listas de Menús;
  retirada sombra naranja exagerada del botón de publicar reseña.
- Plan explica lo disponible y Pro futuro: retirada compra simulada,
  precios de suscripción y mensajes internos de StoreKit.
- Avisos dice «este dispositivo» y no presupone iPhone en Android. Fecha de
  respuesta oficial procede del registro; una fecha desconocida se omite.
- Los registros remotos sin colonia ya no inventan «CDMX» como colonia.
  Categorías siguen disponibles para filtros. No se agregó geocodificación.
- Sistema de diseño actualizado a paleta, fuentes y contratos actuales;
  reglas de CLAUDE ajustadas para evitar reincidencia por documentación antigua.

## Inventario revisado

La tabla indica revisión de fuente y patrones, no aprobación visual individual.

| Área | Rutas | Criterio y resultado |
| --- | --- | --- |
| Entrada y Auth | index, warmup, entrada, onboarding, comunidad-acceso, fondero-acceso, login-callback | Marca y rutas preservadas; controles legibles, formularios y errores claros. |
| Descubrimiento | explorar, patio/[id] | Barra estable, resultados coherentes, iconos y horarios con significado real. Ficha editorial y mapa conservados. |
| Biblioteca Foodie | favoritos, actividad, vistos, guardar/[id], coleccion/[id] | Jerarquía común, selección distinguible, ordenar y mover explícitos, carga y recuperación. actividad es redirección. |
| Comunidad | cuenta, perfil-comunidad, foodie/[id], coleccion-publica/[id], resena/[id], resenas | Perfil, colecciones, reseñas y seguridad; controles y estados accesibles. Datos públicos sin métricas supuestas. |
| Negocio | patio-smart, perfil, perfil-editar, menu-editar, foto-menu, historial, preview, menu-publicado | Formularios, editor compartido, horarios, pagos, publicación, reuso y organización. Bloque protegido de precio intacto. |
| Ajustes/editorial | avisos, notificaciones, soporte, privacidad, manifiesto, plan | Grupos de ajustes coherentes, copy veraz, acceso a soporte y planes sin acciones ficticias. |
| Contenedor | _layout y +native-intent | Navegación y enlaces existentes preservados; no se cambiaron rutas ni permisos nativos. |

## Fundamento aplicado

Proximidad: identidad compacta, etiquetas junto al campo y feedback junto
a la acción. Similitud: filas, iconos, controles y estados comunes. Jerarquía:
nombre domina, colonia orienta, precio permite decidir y métricas apoyan.
Consistencia: posiciones constantes y selección explícita. Veracidad: ningún
color, número, fecha ni botón promete una capacidad inexistente.

Las recomendaciones de [Layout de Apple](https://developer.apple.com/design/human-interface-guidelines/layout),
[Typography](https://developer.apple.com/design/human-interface-guidelines/typography),
[The details of UI typography](https://developer.apple.com/videos/play/wwdc2020/10175/)
y [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy/)
orientaron la revisión. La composición y las medidas son decisiones de Patio,
no una homologación o certificación emitida por Apple.

## Verificación y límites

- TypeScript aprobado; lint sin errores ni advertencias.
- 156/156 pruebas aprobadas, incluidas recuperación y concurrencia de Vistos,
  semántica accesible, selección, mover, filas, guardado y publicación.
- Exportaciones JS/assets iOS y Android completadas en
  /private/tmp/patio-uber-refinement-native-20261010. No son builds firmadas.
- Control de release: 29 verificaciones correctas, dos pendientes externos
  (GOOGLE_MAPS_ANDROID_API_KEY y GOOGLE_SERVICES_JSON).
- Evidencia local: /private/tmp/patio-uber-refinement-check-20261010.log y
  /private/tmp/patio-uber-refinement-native-20261010.log.
- Sin simulador ni sesión en dispositivo; no se declara ausencia absoluta
  de fallos visuales. Pendiente recorrido humano en iPhone y Android.

## Checklist de aceptación física

- [ ] Mapa y Guardados a ancho pequeño: posiciones idénticas, pills completas,
  sin scroll horizontal; badges sin desplazar títulos.
- [ ] Nombres y colonias largos: cards parejas, elipsis intencional y nombre
  completo en ficha; precio y métricas sin solaparse.
- [ ] Claro/oscuro y letra normal/grande: buscador, encabezados, formularios,
  teclado, CTA, colección y onboarding utilizables.
- [ ] Abierto, cerrado, próximo a cerrar y desconocido: un indicador legible
  en tarjetas, ninguno en pins; horario semanal explícito.
- [ ] Seleccionar Todos/listas; agregar, mover, renombrar, fijar y cancelar.
  Sin selección: explicación próxima. Fallo: reintentar sin perder trabajo.
- [ ] VoiceOver/TalkBack: identidad completa, disponibilidad, selección y
  guardado; orden de foco y encabezado al colapsar.
- [ ] Acceso, cámara/galería, ubicación, publicar, compartir y volver: revisar
  permisos nativos y continuidad con datos reales.

Para distribución, seguir [STORE_RELEASE_READINESS](STORE_RELEASE_READINESS.md).
Backend promovido con evidencia en [PRODUCTION_PROMOTION](PRODUCTION_PROMOTION_2026-10-09.md).
Esta auditoría no modifica producción, firma ni publica en tiendas.
