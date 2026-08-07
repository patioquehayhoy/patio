# Reseñas, identidad y confianza

## Hilos compactos

Cada reseña y respuesta debe conservar una identidad pública. Las respuestas del
negocio se distinguen de las de Foodies, pero ambas pueden recibir reacciones.
La ficha no enseña respuestas por defecto. `Ver N comentarios` revela el hilo
completo; al contraerlo vuelve a quedar únicamente la reseña raíz.

Una marca de negocio verificado confirma identidad o control administrativo del
establecimiento. No puede comprarse sin comprobación y no significa que Patio
avale su comida, servicio o reputación.

## Modelo de conversación

- **Reseña raíz:** representa una visita fechada; contiene 1–5 estrellas,
  razones y comentario opcional. Una cuenta puede crear otra reseña en una visita
  posterior, nunca sobrescribir la anterior.
- **Respuesta:** conversa sobre una reseña o sobre otra respuesta. No lleva
  estrellas porque no representa una visita independiente.
- **Presentación:** la ficha muestra sólo la reseña. `Ver N comentarios` abre el
  hilo completo en orden cronológico, incluida la respuesta oficial.
- **Profundidad:** una respuesta puede referenciar `parent_reply_id`, pero la UI
  no imprime esa arquitectura. Burbuja, sangría y orden cronológico comunican el
  hilo sin `En respuesta a…` ni árboles infinitos.
- **Respuesta oficial:** el Patio participa dentro del mismo hilo con identidad
  diferenciada. No puede editar el contenido de quien reseñó.

Modelo de datos futuro:

```txt
reviews(id, patio_id, author_id, visit_date, stars, reasons, body, status)
review_replies(id, review_id, author_id, parent_reply_id?, body, status)
review_reactions(subject_type, subject_id, user_id, kind)
review_reports(subject_type, subject_id, reporter_id, reason, status)
thread_subscriptions(review_id, user_id, muted_at?)
```

## Antispam y moderación

- cuenta verificada y perfil público completo para publicar;
- una reseña por cuenta, Patio y día; comentarios no crean nuevas estrellas;
- rate limit por cuenta, dispositivo, IP aproximada y Patio;
- cooldown más estricto para cuentas nuevas;
- detección de duplicados, enlaces repetidos, menciones masivas y automatización;
- límites de longitud, número de respuestas consecutivas y creación de hilos;
- reportar, bloquear y silenciar hilo disponibles desde menú contextual;
- contenido reportado puede ocultarse preventivamente según severidad;
- negocio puede responder y reportar, nunca borrar críticas;
- el hilo admite un único nivel de conversación: comentario raíz y respuestas directas; cualquier cuenta habilitada puede contestar una pregunta y la intervención del negocio se distingue con su insignia, pero no es la única respuesta permitida;
- `Escribe un comentario` publica en la reseña; `Responder` abre el compositor debajo del comentario elegido; responder una respuesta vuelve al mismo grupo y nunca crea un tercer nivel;
- bitácora de moderación, apelación y reincidencia;
- paginación por cursor: nunca cargar un hilo completo de forma automática.

## Decisión

Las reseñas reales no serán anónimas para Patio. Para publicar se requerirá una
cuenta con correo verificado, nombre y primer apellido. La interfaz pública
muestra **nombre + inicial del apellido** (por ejemplo, `Diego R.`); internamente
la reseña conserva el `user_id` y el nombre de cuenta.

No se permiten alias libres al publicar una reseña. Patio tampoco pide
identificación oficial en el MVP: sería más dato personal del necesario. Correo
verificado, identidad de cuenta, límites de frecuencia y moderación dan
trazabilidad sin convertir el alta Foodie en un proceso bancario.

## Flujo

1. Calificación estructurada.
2. Razones predefinidas.
3. Comentario opcional con límite.
4. Confirmación de visita/señal contextual cuando exista.
5. Publicación con nombre público y fecha.
6. Reportar, bloquear y apelar disponibles.

## Acciones y distribución

- reseña raíz: comentar, Me gusta y compartir visibles; compartir abre
  directamente la hoja del sistema, sin alerta ni selector intermedio;
- comentario: Me gusta; reportar vive como acción contextual cuando el backend
  de moderación esté conectado;
- no se guarda una reseña individual: guardar el Patio o añadirlo a una
  colección representa mejor la intención de volver;
- compartir usa la hoja del sistema y conserva autoría, calificación y enlace;
- visualizaciones de reseñas no se muestran públicamente: sólo podrán existir
  como telemetría real, con definición explícita, nunca como cifra sintética;
- no existe repost interno mientras Patio no tenga un feed de Foodies y
  seguidores: un ícono sin destino de distribución sería una función falsa;
- si más adelante existe repost, debe acreditar al autor, depender del original,
  permitir deshacer y desaparecer si el contenido fuente se elimina.

## Señales de conversión

La red pública no debe confundir popularidad con intención. Para el Fondero,
Patio puede medir de forma agregada el recorrido que comienza en una reseña o
menú y termina en una acción útil:

```text
impresión → ficha abierta → menú consultado → Patio guardado
          → indicaciones → llamada/mensaje → visita confirmada
```

- Gratis: estado del perfil, reseñas recibidas, comentarios y respuesta oficial.
- Pro: tendencias por periodo, consultas del menú, guardados del Patio,
  indicaciones, compartidos y temas repetidos en conversaciones.
- Pro no promete ventas ni revela identidades individuales; presenta señales
  agregadas, definiciones claras y comparaciones contra el propio historial.
- Una vista repetida no equivale a una persona ni a una visita. Las métricas se
  nombran según el evento real y no se sustituyen con estimaciones silenciosas.

## Efecto de red atómica

```text
Foodie publica experiencia
  → otros Foodies validan, preguntan o corrigen
  → el Patio confirma información operativa
  → mejora el dato vivo del lugar
  → aumenta la confianza para decidir
  → nuevas visitas producen experiencias nuevas
```

El perfil Foodie acumula criterio y contribuciones útiles; el perfil Fondero
acumula información vigente, capacidad de respuesta y aprendizaje operativo.
Ninguna parte necesita convertirse en un feed genérico para producir valor.

## Límites de abuso

- una reseña activa por cuenta y Patio por visita/periodo;
- rate limit;
- una reseña publicada es inmutable: no se edita ni se elimina desde el cliente;
- lenguaje y contenido sensible pasan por moderación;
- el negocio puede responder, no borrar;
- reportes se clasifican, no se reciben como texto totalmente abierto;
- reincidencia afecta capacidad de publicar.

La base actual en `AsyncStorage` es únicamente una demostración local. No debe
presentarse como red real ni migrarse automáticamente como reseña pública.

## Inmutabilidad

Una reseña publicada representa una observación fechada y no vuelve a abrirse
como editor. La app usa inserción, no `upsert`, y la política de Supabase permite
crear y leer, pero no actualizar o eliminar desde el cliente. La respuesta oficial
del negocio sigue un RPC separado y no modifica el contenido del autor.

El modelo es append-only por visita: una cuenta puede volver a reseñar el Patio
en otra fecha y la observación anterior permanece intacta. El MVP limita a una
reseña por cuenta, Patio y día. Una experiencia posterior crea otra fila con
`visit_date`; nunca sobrescribe la anterior.

## Interacción social y verificación

Una reseña es contenido social con conversación. Su barra pública usa patrones
conocidos, en este orden:

1. comentario;
2. like;
3. visualizaciones, sólo cuando exista medición real.

La UI muestra iconos y contadores; no introduce etiquetas editoriales como
`Me pasó también`. Los nombres accesibles sí deben expresar la acción completa.

### Significado de las señales

- **Comentario:** agrega contexto al hilo; puede coincidir, disentir o reportar
  que la situación cambió.
- **Like:** expresa valoración o relevancia, no confirmación factual.
- **Visualización:** alcance; no se convierte en reputación positiva o negativa.

`Republicar`, `compartir` y `guardar` no forman parte de la barra de reseña en
esta etapa. El objeto guardable
de Patio es el lugar o la colección; guardar una reseña individual fragmentaría
esa arquitectura sin un caso de uso 80/20 demostrado.

### Condiciones para una señal verificable

- una interacción de cada tipo por cuenta y reseña, reversible;
- autor autenticado y cuenta verificada;
- el autor no puede auto-confirmar ni manipular alcance;
- fecha y relación con visita, ubicación consentida o acción dentro de Patio;
- detección de cuentas coordinadas, rate limits y moderación;
- historial de edición y estado visible de contenido moderado;
- separación estricta entre popularidad, distribución y corroboración.

Los hilos sintéticos cubren reporte inicial, coincidencias y actualización
posterior. Son datos de QA y no deben confundirse con actividad real.
