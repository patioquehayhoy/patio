# PatioGiros

Giros que Ionicons no trae, armados con piezas reales de Ionicons (MIT) para
no salir de la familia. Se empaquetan como fuente (`assets/fonts/PatioGiros.ttf`).

- `jugos.svg`: el vaso con popote de `fast-food-outline` + la manzana de
  `nutrition-outline` en lugar de la hamburguesa (trazo compensado a 32).
- Regenerar: `picosvg jugos.svg > jugos.pico.svg` y
  `scripts/design/build-patio-giros-font.py <dir> assets/fonts/PatioGiros.ttf '{"jugos":57345}'`.
