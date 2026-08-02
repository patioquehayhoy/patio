# Reseñas, identidad y confianza

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

## Límites de abuso

- una reseña activa por cuenta y Patio por visita/periodo;
- rate limit;
- edición visible como “Editada”;
- lenguaje y contenido sensible pasan por moderación;
- el negocio puede responder, no borrar;
- reportes se clasifican, no se reciben como texto totalmente abierto;
- reincidencia afecta capacidad de publicar.

La base actual en `AsyncStorage` es únicamente una demostración local. No debe
presentarse como red real ni migrarse automáticamente como reseña pública.

## Interacción social y verificación

Una reseña es contenido social con conversación y distribución. Su barra pública
usa patrones conocidos, en este orden:

1. comentario;
2. republicación;
3. like;
4. visualizaciones;
5. compartir.

La UI muestra iconos y contadores; no introduce etiquetas editoriales como
`Me pasó también`. Los nombres accesibles sí deben expresar la acción completa.

### Significado de las señales

- **Comentario:** agrega contexto al hilo; puede coincidir, disentir o reportar
  que la situación cambió.
- **Republicación:** distribuye la reseña. No equivale automáticamente a verificarla.
- **Like:** expresa valoración o relevancia, no confirmación factual.
- **Visualización:** alcance; no se convierte en reputación positiva o negativa.
- **Compartir:** usa la hoja nativa y conserva atribución/origen.

`Guardar` no forma parte de la barra de reseña en esta etapa. El objeto guardable
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
