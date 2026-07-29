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
