# Auditoría de iconos — 2026-10-18

**Decisión posterior del usuario, 2026-10-25:** conservar la galería anterior
Ionicons; solo Tacos/Elotes cambian a taco/corn. La familia completa nueva
fue rechazada. En zoom lejano no se muestran números.


Estado vigente 2026-10-25: Menús en navegación usa libro (`book-outline` /
`book`); Listas Foodie `list-outline`; Listas Fondero `bookmarks-outline`.
Giros: Ionicons originales salvo `taco`/`corn` (MaterialCommunityIcons) en
`lib/business-category-icons.ts`. Zoom del mapa en `DESIGN_SYSTEM.md`,
sección Giros y detalle del mapa.

Motivo: rechazo visual del usuario a cubiertos cruzados, cubiertos verticales
y fachada en tarjetas; herramientas sin relación con Publicar mi menú DEV.

Hallazgos:
- El reemplazo global confundía identidad de un lugar con biblioteca de menús.
- MaterialCommunityIcons introducía otro grosor/silueta en controles Ionicons.
- DEV usaba construct-outline (herramientas), aunque abre el flujo del negocio.
- Ayuda y soporte tenía símbolos distintos entre perfiles.

Contrato corregido:
- Lugar genérico: location-outline en tarjetas, colecciones y categoría genérica.
- Biblioteca Menús: document-text-outline; seleccionado document-text.
- Menús nuevos y vacío de biblioteca: document-text-outline.
- Publicar mi menú: create-outline tanto en DEV como en acceso normal.
- Ayuda y soporte: chatbubble-outline en ambos perfiles.
- Centrar/obtener ubicación: navigate-outline; el pin representa el lugar.
- Mantener las acciones convencionales: + crear, carpeta listas, marcador guardar,
  lápiz editar, puntos más acciones, corazón actividad, persona perfil.
- Una familia: Ionicons. No introducir cubiertos o logos de otras apps.

Inspección: glifos reales de la fuente instalada renderizados a 18/22/32 pt
sobre superficie blanca y fondo del tema. Lámina de comparación:
[iconos](design/experiments/icon-audit-2026-10-18.png).
Es una lámina de glifos, no una captura ni aceptación de la app en dispositivo.
Las categorías específicas del mapa conservan sus símbolos existentes;
esta corrección no redefine la taxonomía de negocios.

## Ajustes 2026-10-24 (resumen)

El acceso superior a Listas pasó por `albums-outline`, `folder-outline` y
`bookmarks-outline` antes de la decisión vigente de arriba. Esas pruebas
quedan reemplazadas; no reabrirlas sin una petición nueva.
