# design-source/ — Fuente de diseño de Patio

Esta carpeta guarda los **exports de Figma Make** donde se diseña Patio. **No es código de la app.**

## Qué es esto (y qué NO es)

- **Es:** snapshots congelados del diseño visual de Patio, exportados desde Figma Make.
  Proyecto web (**Vite + React + Tailwind + Radix/shadcn + MUI**) — corre en navegador.
- **NO es:** código de la app. Patio real es **Expo / React Native** (`<View>`, `<Text>`,
  `StyleSheet`, módulos nativos). El código de aquí **no se pega** en `app/` — se **traduce**.

Está **aislado del build**: Metro lo ignora (`metro.config.js` → `blockList`), TypeScript lo
excluye (`tsconfig.json` → `exclude`) y ESLint también (`eslint.config.js`). No puede romper la app.

## El flujo (cómo iterar sin ir y venir)

> **Regla de oro:** Figma Make en la nube = el documento vivo del diseño.
> Esta carpeta = la fotocopia fechada por si se cae el avión. **No se sincroniza, se reemplaza.**

1. **Iteras el diseño en Figma Make** (visual, estructura, copy). Ahí Claude ve todo y compone
   sobre lo existente. Mientras el diseño esté vivo, **no se traduce nada a React Native** todavía.
2. **En cada hito** (no en cada edición), exportas el ZIP y lo dejas como snapshot nuevo:
   `v02/`, `v03/`, … Cada versión es una carpeta **congelada e independiente**. Anotas una línea
   en `VERSIONS.md`. Eso es todo el mantenimiento.
3. **Cuando declares el diseño CERRADO**, recién ahí traducimos a React Native pantalla por
   pantalla, **una sola vez**, contra la última versión. Sin desperdicio.

## Cómo agregar una versión nueva

1. Exporta el ZIP desde Figma Make.
2. Descomprímelo en `design-source/figma-make/vNN/` (siguiente número).
3. Agrega una fila en `VERSIONS.md` con la fecha y qué cambió.
4. Commit. No borres versiones viejas — son tu historial.

## Inventario de la versión actual (v01)

- **Foodie:** Map, MapDark, Detail, DetailDark, Search, Saved, Me, Empty, SoldOut, Loading,
  Onboarding, Review.
- **Fondero:** Landing, Publish, Fonda, History, MagicLink, Success, Prototype.
- **Sistema:** `theme.css` (tokens), `TokenExport.tsx`, `BrandMoments`, `MotionPrinciples`,
  `LightDarkComparator`, modo claro/oscuro, widgets iOS, App Store shots, `PatioMark`.
- **Imágenes hero** (flores endémicas, fórmula `FLORES_ENDEMICAS_PROMPT.md`) en
  `figma-make/v01/src/imports/`.

## NO ejecutar aquí

No corras `npm install` ni `vite` dentro de estas carpetas como parte del trabajo normal.
Es referencia. (Si algún día quieres verla en navegador: `cd figma-make/vNN && npm i && npm run dev`,
pero su `node_modules`/`dist` están en `.gitignore` y no se commitean.)
