# Auditoría de interacción y controles — Patio

> Actualización del mismo día: la ficha ya no usa píldoras de distinción ni copy
> contextual sintético. Los reconocimientos son medallas tocables derivadas de
> señales y su explicación reutiliza una pleca de altura estable. Las reseñas demo
> incorporan una barra social por iconos y conversación en hilo. Ver
> `docs/HANDOFF.md` y `docs/REVIEWS_AND_TRUST.md` para la decisión vigente.

> Corte estático del código vigente: 2026-08-01.
> Alcance: rutas de `app/` y componentes interactivos compartidos de `components/`.
> Marco: `ESSENTIAL_DESIGN_PRINCIPLES.md`, Apple HIG aplicada al proyecto y
> decisiones propias de Patio. Esta auditoría evalúa arquitectura de interacción;
> no sustituye una prueba posterior en iPhone con VoiceOver y tamaños de texto.

## Resultado ejecutivo

La arquitectura principal ya es sólida: tres destinos raíz por rol, una sola acción
de creación de menú dentro de Menús, controles de plataforma reconocibles, jerarquía
clara en el alta y buenos ejemplos de revelación progresiva. El problema dominante no
es falta de minimalismo, sino **acciones ocultas sin señal**, **controles con
significados mezclados** y **datos secundarios con demasiada jerarquía**.

Prioridad de corrección:

1. Hacer descubribles las acciones hoy escondidas en pulsación prolongada.
2. Separar `Guardar` de organizar, anotar y reseñar.
3. Retirar “En Patio desde…” del encabezado de la ficha pública.
4. Normalizar estados, roles accesibles y blancos táctiles en los componentes base.
5. Reducir opciones simultáneas en edición de menú y perfil mediante contexto.

## Vocabulario operativo

| Concepto | Pregunta de auditoría | Regla Patio |
|---|---|---|
| Jerarquía de acciones | ¿Cuál es la acción primaria, secundaria, terciaria y destructiva? | Una sola acción prominente por estado de pantalla. |
| Prominencia | ¿El peso visual coincide con la importancia y frecuencia? | Relleno de acento para la confirmación principal; acciones secundarias neutrales. |
| Disponibilidad contextual | ¿La acción aparece solo cuando puede actuar sobre algo? | Mostrar el control cuando exista selección, permiso o contenido válido. |
| Divulgación progresiva | ¿Se enseña primero el camino común? | Complejidad adicional bajo demanda, siempre con una señal visible. |
| Consolidación de acciones | ¿Las operaciones del mismo objeto viven juntas? | Menú o toolbar contextual; no repartirlas entre gestos secretos. |
| Economía visual | ¿Se retiró ruido sin perder descubribilidad? | Ocultar lo infrecuente, mantener visible lo esencial. |
| Afordancia percibida | ¿Se reconoce qué puede tocarse, cambiarse o desplazarse? | Forma, estado y respuesta deben comunicar interacción sin instrucciones. |
| Mapeo natural | ¿El control está cerca de aquello que modifica? | La acción pertenece visualmente al objeto afectado. |
| Feedback | ¿La interfaz confirma qué pasó y qué está pasando? | Estado visible, háptico o verbal; prevenir antes de mostrar errores. |
| Reversibilidad | ¿La persona puede recuperar una acción importante? | Deshacer o confirmar acciones destructivas. |
| Consistencia | ¿El mismo significado conserva aspecto y conducta? | Compartidos para filas, botones, toggles, navegación y estados. |
| Blanco táctil | ¿El objetivo sigue siendo cómodo con texto grande o ícono pequeño? | Área mínima práctica de 44×44 pt para acciones aisladas. |

`Componentización` se trata aquí como arquitectura de interfaz: convertir un patrón
repetido en una unidad reutilizable con anatomía, variantes, estados, semántica y
comportamiento definidos. No reemplaza a los principios de interacción anteriores.

## P0 — antes de ampliar funciones

### 1. La fecha administrativa compite con el contenido útil

**Evidencia:** `app/patio/[id].tsx` calcula `identitySignal` y muestra
`En Patio desde {año}` inmediatamente debajo de categoría y zona. En esa posición se
lee como atributo principal del negocio y puede confundirse con su fecha de apertura.

**Decisión:**

- No mostrar `patioJoinedAt` en la ficha pública.
- Conservar `Abrió hace poco` solo si es información real del negocio y aporta a la
  decisión de visita.
- Si existe `businessOpenedAt`, mostrarlo al final dentro de una sección colapsable
  **Acerca de** o **Historia**, con el texto `Abrió sus puertas en 2004`.
- No crear la sección cuando no exista información real. No rellenarla con la fecha
  de registro en Patio.

Jerarquía propuesta para la ficha:

```txt
estado de hoy → nombre y tipo → menú → ubicación → reseñas → acerca de
```

### 2. Compartir una colección está escondido en pulsación prolongada

**Evidencia:** `app/actividad.tsx` abre la colección al tocarla, muestra `···` para
editarla, pero compartir solo ocurre mediante `onLongPress` sobre toda la fila. No hay
texto, símbolo ni menú que anuncie ese gesto.

**Problema:** falla de visibilidad y afordancia. Una pulsación prolongada puede ser un
atajo, nunca el único acceso a una acción importante.

**Corrección:** convertir `···` en un menú contextual visible con `Editar`, `Compartir`
y, si corresponde, `Eliminar`. Mantener la pulsación prolongada únicamente como atajo
al mismo menú. El toque principal debe seguir abriendo la colección.

### 3. Guardar ejecuta una acción antes de que la pantalla se entienda

**Evidencia:** al entrar a `app/guardar/[id].tsx`, el Patio se agrega automáticamente a
guardados, aun antes de elegir una lista o tocar `Listo`. En la misma pantalla aparecen
listas, estado privado, nota, calificación privada y entrada a reseña pública.

**Problema:** `Guardar` mezcla cinco modelos mentales: favorito, organización, diario
privado, valoración privada y publicación pública. `Listo` parece confirmar, aunque el
cambio principal ya ocurrió.

**Corrección recomendada:**

1. Tocar el marcador guarda o desguarda inmediatamente y ofrece feedback háptico/visual.
2. Después aparece una hoja compacta: `Guardado` + `Agregar a una lista`.
3. Nota privada y estado `Quiero ir / Ya fui` viven en el detalle del guardado o bajo
   `Más opciones`.
4. `Escribir una reseña` permanece en la sección Reseñas de la ficha pública; no dentro
   del acto de guardar.

## P1 — impacto alto en los flujos frecuentes

### Explorar y búsqueda

**Funciona:** mapa como raíz, búsqueda prominente, filtros contextuales fuera del estado
de búsqueda, resultados con affordance de fila y hoja que mantiene contexto espacial.

**Ajustar:**

- El control de listas guardadas y los filtros rápidos deben compartir una sola
  gramática de selección: mismo estado activo, check y forma de desactivar.
- Cuando esté activa una lista, el control `Limpiar` debe conservar etiqueta explícita;
  no depender solamente de una `x`.
- Validar que cerrar una hoja, cerrar búsqueda y limpiar consulta sean tres acciones
  visualmente distintas; hoy varios símbolos de cierre pueden coincidir por estado.
- Si un resultado ya está guardado, el marcador debe anunciar `Guardado` además del
  cambio de color.

### Ficha pública del Patio

**Funciona:** estado abierto/cerrado, horario desplegable, menú antes de detalles,
mapa directamente asociado con indicaciones y reseñas agrupadas.

**Ajustar:**

- Mover la historia al final según la decisión P0.
- Añadir una señal textual breve sobre el mapa (`Cómo llegar` o dirección). Un mapa
  estático por sí solo comunica ubicación, pero no inequívocamente que abre indicaciones.
- El resumen de calificaciones funciona también como filtro, pero parece únicamente
  informativo. Mostrar estado seleccionado y una forma explícita de `Ver todas`.
- Una tarjeta de reseña ajena no debe ser `TouchableOpacity` sin acción; renderizarla
  como `View`. Solo `Tu reseña` debe verse y anunciarse editable.
- Guardar debe confirmar inmediatamente su nuevo estado antes de ofrecer organización.

### Creación y edición de menú

**Funciona:** `Tomar una foto` tiene mayor prominencia, las otras dos rutas conservan
igual estructura sin competir, y la revisión de foto pide corregir solo lo necesario.

**Ajustar:**

- En `MenuComposer`, evitar dos confirmaciones equivalentes (`Guardar borrador` y
  `Publicar`) con peso cercano. `Publicar menú` es primaria; guardar borrador es
  secundaria o automática.
- Las acciones de sección `subir`, `bajar` y `eliminar` están bien consolidadas, pero
  deben presentarse en un menú anclado al `···`, no expandirse como una nueva fila que
  desplaza contenido inesperadamente.
- La descripción y precio de cada platillo deben revelarse después del nombre o al
  tocar `Agregar detalles`; el nombre es el dato mínimo para avanzar.
- Eliminar sección/platillo requiere confirmación o `Deshacer`, especialmente cuando
  contiene texto ya capturado.
- Los controles de colapsar y `···` necesitan etiquetas accesibles que incluyan el
  nombre de la sección.

### Menús e historial

**Funciona:** `Menú nuevo` está dentro de Menús y no ocupa una pestaña permanente; el
estado vacío ofrece una sola salida clara.

**Ajustar:**

- El toque de una fila actualmente significa `Editar y usar`, mientras el menú repite
  esa misma acción. Elegir una sola convención: toque abre vista previa/detalle y menú
  ofrece `Usar hoy`, o toque ejecuta `Usar hoy` y el menú no lo duplica.
- `Eliminar` debe confirmar qué menú se borrará y ofrecer reversión cuando sea viable.
- El menú `···` debe cerrar al tocar fuera y anunciar accesiblemente si está abierto.

### Publicado y póster

**Funciona:** la confirmación posterior a publicar es breve; compartir el póster es la
acción central del artefacto.

**Ajustar:**

- En `menu-publicado.tsx`, `Ver menú publicado`, `Editar` y `Listo` forman tres salidas.
  Mantener una primaria (`Ver y compartir`) y convertir las otras en navegación
  secundaria de barra.
- En `preview.tsx`, elegir una sola acción primaria: `Compartir póster`. `Ver en mi
  perfil` queda como enlace secundario y `Guardar imagen`, si existe, en el share sheet.
- El feedback tras compartir debe indicar finalización o cancelación sin un alert
  innecesario.

### Perfil de negocio y edición

**Funciona:** grupos por propósito, estado del menú separado de dirección y acciones
ocasionales sin prominencia excesiva.

**Ajustar:**

- El estado `Aún no publicas el menú de hoy` debería ser accionable o convivir con una
  acción cercana `Crear menú`; hoy informa una tarea pendiente pero obliga a cambiar de
  pestaña para resolverla.
- `Cerrar sesión` debe diferenciarse semánticamente y pedir confirmación si hay cambios
  locales sin sincronizar.
- En edición, revelar horarios de cada día únicamente cuando esté abierto; conservar
  internamente sus valores al cerrarlo.
- La barra fija de guardar necesita tres estados inequívocos: `Guardar cambios`,
  `Guardando…`, `Guardado`. Deshabilitar no debe comunicarse solo con opacidad.
- `Marcar ubicación` debe explicar el resultado, no el mecanismo: por ejemplo,
  `Usar mi ubicación actual` si eso es exactamente lo que hace.

### Perfil Foodie, guardados y colecciones

**Funciona:** Cuenta y Mi Patio comparten `SettingsRow`/`SettingsGroup`; Guardados usa
colecciones como estructura principal y creación contextual.

**Ajustar:**

- La pestaña se llama `Colecciones`, pero la pantalla se titula `Guardados`. Elegir un
  concepto raíz y usarlo en navegación, título y copy.
- La fila de colección contiene toque principal, `···` y un icono de mapa pasivo. Ese
  mapa parece otro control. Convertirlo en chevron/estado o hacerlo realmente accionable.
- Al abrir `Nueva lista`, ofrecer `Cancelar` o permitir que el mismo `+` cierre el
  compositor. La revelación progresiva debe ser reversible.
- Los toggles en Settings necesitan que la fila completa no parezca navegable cuando el
  único control es el switch.

### Alta, acceso y onboarding

**Funciona:** el alta de negocio es secuencial, muestra progreso, adapta las preguntas y
reduce decisiones por paso. Es el mejor ejemplo actual de progressive disclosure.

**Ajustar:**

- El onboarding usa grandes zonas invisibles para avanzar o regresar. Mantener swipe o
  toque como comodidad, pero dar controles visibles y accesibles; una zona invisible no
  tiene affordance.
- `Continuar` debe anticipar el resultado cuando sea posible (`Elegir cómo entrar`,
  `Revisar negocio`, etc.).
- Los errores de validación deben aparecer cerca del campo y conservar el foco; alerts
  solo para fallos globales o del sistema.
- Revisar que `Saltar` siempre lleve al mismo destino mental y no cambie de significado
  entre diapositivas.

## P2 — consistencia, calidad y accesibilidad

### Contratos para componentes compartidos

Crear o consolidar estos componentes antes de seguir diseñando botones pantalla por
pantalla:

| Componente | Variantes mínimas | Contrato |
|---|---|---|
| `ActionButton` | primary, secondary, tertiary, destructive | label, loading, disabled, icon, accessibility state |
| `IconButton` | solid, glass, plain | objetivo 44 pt, label obligatorio, selected/expanded |
| `ContextMenu` | acciones normales y destructiva | anclaje, cierre exterior, orden estable, VoiceOver |
| `SelectionRow` | single, multiple | check + color + texto; no depender solo de color |
| `DisclosureRow` | navegación, expandible | chevron correcto y estado expanded |
| `InlineComposer` | cerrado, editando, válido, guardando | apertura y cierre reversibles |
| `FeedbackState` | loading, success, warning, error, empty | mensaje humano y siguiente acción posible |

### Hallazgos transversales

- Muchos `TouchableOpacity` no declaran `accessibilityRole="button"`; los componentes
  base deben imponerlo.
- Los botones compuestos solo por texto (`Crear`, `Listo`, `Responder`) necesitan un
  blanco táctil estable, no el tamaño accidental del texto.
- Los estados deshabilitados suelen depender de opacidad o color. Añadir
  `accessibilityState={{ disabled, selected, expanded, busy }}` según corresponda.
- No volver tocable un contenedor cuando `onPress` sea indefinido. Cambiar el elemento,
  no solamente `activeOpacity`.
- Unificar `Pressable`/`TouchableOpacity` detrás de componentes con feedback presionado,
  háptico y semántica consistentes.
- Las acciones destructivas (`Eliminar`, cerrar sesión con trabajo pendiente) deben
  reservar color rojo y confirmación/reversión. El naranja es marca y acción primaria.
- Revisar Dynamic Type: títulos y labels que usan `numberOfLines={1}` pueden truncar la
  acción. Nunca sacrificar el significado del control para conservar una línea.

## Cobertura por ruta

| Área | Rutas revisadas | Foco |
|---|---|---|
| Entrada | `entrada`, `onboarding`, `fondero-acceso`, `comunidad-acceso`, `login-callback`, `warmup` | orientación, decisión de rol, validación, estados |
| Foodie | `explorar`, `patio/[id]`, `actividad`, `favoritos`, `vistos`, `guardar/[id]`, `resena/[id]` | búsqueda, guardado, colecciones, confianza |
| Comunidad | `perfil-comunidad`, `foodie/[id]`, `coleccion/[id]`, `coleccion-publica/[id]` | privacidad, edición, compartir, affordances |
| Negocio | `historial`, `menu`, `foto-menu`, `menu-editar`, `menu-publicado`, `preview`, `resenas`, `perfil`, `perfil-editar`, `patio-smart` | captura, edición, publicación, respuesta |
| Cuenta y soporte | `cuenta`, `avisos`, `plan`, `privacidad`, `soporte`, `manifiesto` | settings, permisos, estados y acciones externas |
| Navegación | `_layout`, `bottom-tab-bar`, `collapsing-header`, `glass-button`, `settings-list` | consistencia, jerarquía, semántica y blanco táctil |

## Secuencia de implementación sugerida

1. [x] Corregir la ficha: `patioJoinedAt` ya no se muestra; `Acerca de` vive
   colapsable al final y solo aparece cuando existe `businessOpenedAt` válido.
2. Rediseñar Guardar como acción inmediata + hoja compacta; separar reseña y notas.
3. Crear menú contextual compartido y aplicarlo a colecciones, historial y secciones.
4. Crear contratos compartidos de botones, selección, disclosure y feedback.
5. Simplificar el editor de menú y las barras de confirmación.
6. Hacer pase accesible con VoiceOver, Dynamic Type y pruebas de blanco táctil.
7. Validar en iPhone los recorridos 80/20: encontrar comida hoy y publicar menú hoy.

## Prueba de aceptación por pantalla

Antes de cerrar una pantalla, responder sin explicación externa:

1. ¿Dónde estoy y cómo salgo?
2. ¿Cuál es la única acción principal en este estado?
3. ¿Qué cambió después de tocarla?
4. ¿Qué opciones aparecen solo cuando ya son pertinentes?
5. ¿Existe alguna función disponible únicamente mediante un gesto oculto?
6. ¿Los controles están junto al contenido que modifican?
7. ¿Se distingue seleccionado, deshabilitado, cargando y completado sin depender solo
   del color?
8. ¿Una persona con VoiceOver y texto grande puede completar el flujo?
9. ¿Una acción destructiva se puede confirmar o deshacer?
10. ¿La interfaz muestra información del negocio o expone datos internos de Patio?
