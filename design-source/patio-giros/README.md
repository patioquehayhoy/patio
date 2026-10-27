# PatioGiros

Giros que Ionicons no trae, con la misma línea que Ionicons (1.5 en retícula
de 24, equivalente a 32 en 512). Se empaquetan como fuente
(`assets/fonts/PatioGiros.ttf`) para no agregar dependencias nativas.

| Archivo | Origen | Licencia |
|---|---|---|
| `jugos.svg` | piezas de Ionicons: vaso de `fast-food-outline` + manzana de `nutrition-outline`, con línea de nivel | MIT (Ionic) |
| `tacos.svg` | Flaticon (Freepik), icono 10305288, vectorizado y sin las pecas; elegido con Jev (2A); trazo ajustado por Alejandro (2026-10-26) | Licencia Flaticon con atribución: crédito al pie de Ayuda (`app/soporte.tsx`). No quitarlo |
| `elotes.svg` | Hugeicons `corn` | MIT (Hugeicons) |
| `postres.svg` | Hugeicons `cheese-cake-01` (elegida con Jev entre dos rebanadas) | MIT (Hugeicons) |
| `botanas.svg` | IconPark `popcorn`, trazo 3 en retícula de 48 | Apache 2.0 (ByteDance) |

Regenerar: expandir trazos con `picosvg NAME.svg > NAME.pico.svg` y correr
`scripts/design/build-patio-giros-font.py <dir> assets/fonts/PatioGiros.ttf "$(cat codepoints.json)"`.
Al cambiar los glifos, cambiar también el nombre de la familia en el script y en
`components/business-category-icon.tsx` para que el teléfono no use la versión en caché.
