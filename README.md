# Patio

App móvil (Expo / React Native) de dos lados: quien busca resuelve **"¿qué hay
hoy?"** cerca de él (Foodie); quien vende publica **lo de hoy** desde foto,
captura manual o historial (Fondero).

Este README es solo el arranque de desarrollo local — la fuente de verdad del
producto, la marca y el estado del repo vive en la documentación:

1. [`CLAUDE.md`](CLAUDE.md) — reglas de diseño, marca y economía de builds (lectura obligatoria)
2. [`docs/ROADCONTROLLER.md`](docs/ROADCONTROLLER.md) — mapa de frentes activos y su estado
3. [`docs/HANDOFF.md`](docs/HANDOFF.md) — qué pasó en la última sesión
4. [`docs/STATE.md`](docs/STATE.md) — estado de features
5. [`docs/TASKS.md`](docs/TASKS.md) — cola de trabajo

## Arranque local

```bash
npm install
npx expo start --ios
```

Primera vez en simulador o device: `npx expo run:ios`. Ver "Economía de builds
EAS" en `CLAUDE.md` antes de proponer un build real.
