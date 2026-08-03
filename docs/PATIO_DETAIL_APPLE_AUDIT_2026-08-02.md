# Auditoría Apple — ficha pública de Patio

Fecha: 2026-08-02. Superficie: `app/patio/[id].tsx`.

Fuentes oficiales: Apple HIG `Searching`, `Feedback`, `Buttons`, `Maps`,
`Ratings and reviews`; Apple UI Design Dos and Don'ts; App Review Guideline 1.2.

## Resultado ejecutivo

La ficha tiene una jerarquía correcta —identidad, menú, detalles/mapa y
reputación— y usa divulgación progresiva para horario, medallas e hilos. Los
problemas encontrados estaban en objetivos táctiles, proximidad de acciones,
posición de verificación y expansión excesiva de conversación.

## Corregido

- Controles del hero: 40 → 44 pt.
- Medallas: 40 → 44 pt.
- Reseñar y columnas prácticas: mínimo 44 pt.
- Barra social: `space-between` sustituido por grupo próximo con blancos de
  44 pt; comentario, like y alcance se leen como una familia.
- Verificación movida a la línea de estado, derecha, sin competir con nombres
  largos. Usa SF Symbol nativo `checkmark.seal.fill`.
- Hilos: una respuesta visible; expansión voluntaria; burbuja, sangría y orden
  comunican la relación sin exponer `En respuesta a…`.
- Búsqueda sobre mapa: resultados limitados a media pantalla; tocar o arrastrar
  el mapa cierra teclado, consulta y panel.

## Cumple

- Un solo campo busca todo el inventario.
- Estado abierto/cerrado es pasivo y proporcional; no usa alertas.
- Menú conserva máxima prioridad editorial.
- Precio permanece próximo al platillo afectado.
- Mapa conserva contexto circundante y una acción clara para llegar.
- Rating usa estrellas reconocibles y muestra volumen de reseñas.
- Acciones destructivas o administrativas no contaminan la lectura pública.
- Copy factual: no explica decisiones de diseño ni inventa notas contextuales.

## Pendiente de backend antes de producción

- Likes, vistas, hilos y reportes reales con RLS y agregación.
- Menú contextual por reseña/respuesta: reportar, bloquear, silenciar.
- Moderación, límites, paginación y apelación.
- Verificación con evidencia, revisión, expiración y revocación.
- QA de Dynamic Type, VoiceOver, Reduce Motion y contraste en dispositivo.

## Regla de producto

Apple HIG no prescribe una red social ni decide si Patio debe admitir hilos. Sí
exige claridad, controles familiares, feedback proporcional, blancos táctiles y
agrupación. La arquitectura social se define por integridad del contenido y por
App Review Guideline 1.2 para contenido generado por usuarios.
