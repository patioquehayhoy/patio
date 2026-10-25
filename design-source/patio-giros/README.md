# PatioGiros

Iconos de giros de Patio, empaquetados como fuente (`assets/fonts/PatioGiros.ttf`)
para usarlos sin dependencias nativas.

- Familia: [Lucide](https://lucide.dev) y `@lucide/lab` (licencia ISC, ver
  `LICENSE-lucide.txt`), trazo 1.75 en retícula de 24.
- `tacos.svg` y `elotes.svg` no existen en Lucide: están dibujados en Patio con
  sus mismas reglas (retícula 24, trazo 1.75, puntas y uniones redondas).
- Regenerar: expandir los trazos con `picosvg` (`NAME.svg` → `NAME.pico.svg`) y
  correr `scripts/design/build-patio-giros-font.py <dir> assets/fonts/PatioGiros.ttf "$(cat codepoints.json)"`.
