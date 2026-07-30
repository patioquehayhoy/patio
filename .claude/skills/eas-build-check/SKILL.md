---
name: eas-build-check
description: Checklist de economía de builds EAS para Patio — úsalo antes de proponer o ejecutar cualquier build real (npx eas build, eas submit). Los builds de EAS son un recurso limitado; esta skill decide si el simulador alcanza o si de verdad se justifica quemar un build.
---

Los builds de EAS son un recurso limitado. Antes de proponer o ejecutar un build:

1. **Simulador primero** — todo cambio de UI, navegación, copy y lógica JS va al simulador antes de ir a build. Comando: `npx expo run:ios` (primera vez instala nativo) → después `npx expo start --ios`.
2. **Build solo cuando el simulador no alcanza** — casos válidos para build real:
   - Permisos nativos nuevos (cámara, galería, ubicación) agregados en `app.json`
   - Módulos nativos que no funcionan en simulador (mapas en producción, notificaciones push, biometría)
   - QA final antes de release o cuando ya se acumularon varios cambios testeados en simulador
3. **Agrupar cambios** — nunca hacer build por un solo ajuste de UI. Acumular en simulador hasta que haya un bloque de funcionalidad completo y probado.
4. **Antes de proponer un build** — mencionar explícitamente qué no se puede probar en simulador y por qué justifica quemar un build.
5. **Rama correcta** — confirmar que estamos en la rama activa (`v2-menu-vivo` o la que corresponda) antes de hacer build o submit.
