# STATE

> Fuente de verdad operativa. Última actualización: 2026-07-20.

## Corte operativo — 2026-07-20

- Editor de horarios (`components/business-schedule-editor.tsx`) corregido: fila
  ABRE/CIERRA en reflexión real (ABRE al borde izquierdo, CIERRA al borde derecho de
  su columna) y remount del picker compacto suavizado con doble `requestAnimationFrame`.
- `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md` reescrito con el mecanismo
  real de cada uno de los 12 principios del WWDC17 802 (antes solo tenía el título de
  cada slide) y una nota de vigencia: Liquid Glass (WWDC25) es el material actual vía
  el skill `apple-design`; "múltiplos de 8px" no es regla de Apple, es convención propia
  de Patio.
- TypeScript y ESLint pasan sobre los archivos tocados.
- QA pendiente: confirmar en iPhone físico que la simetría de horarios y la animación
  del picker ya se sienten resueltas (ver `docs/HANDOFF.md`).

## Corte operativo — 2026-07-19

- Rama `rebuild/patio-final` limpia y sincronizada con GitHub; incluye el baseline
  funcional `d0a5e8d` y el commit documental de cierre posterior.
- TypeScript, ESLint y `git diff --check` pasan.
- La introducción visual separa intención: explorar → avisos opcionales → mapa;
  publicar → correo → alta del negocio → primer menú.
- El alta pide únicamente nombre, ubicación, días/horarios y pagos; alta y perfil
  comparten los editores canónicos de horario y métodos de pago.
- La lectura de foto y el setup inteligente viven detrás de Edge Functions; el QA
  real de credenciales, despliegue y fotografías sigue pendiente.
- Reiniciar la Mac es seguro. El procedimiento exacto y los límites de caché están
  en la sección superior de `docs/HANDOFF.md`.

Las secciones anteriores permanecen como bitácora. Si contradicen este corte o el
handoff superior, prevalece el estado del 2026-07-19.

## Corte operativo — 2026-07-16

- TypeScript y ESLint pasan sobre `rebuild/patio-final`.
- Se eliminaron los dos estilos `dashed` que producían el warning nativo.
- La antigua `EXPO_PUBLIC_ANTHROPIC_API_KEY` se retiró del `.env` local; la clave
  expuesta debe rotarse en Anthropic antes de configurar el secreto servidor.
- No se encontraron métricas hardcodeadas `312 vistas` / `+18%` en el código actual.
- El despliegue de `read-menu` sigue bloqueado por autenticación del CLI de Supabase.
- El QA de integraciones nativas sigue requiriendo el iPhone físico.

## Decisión vigente

El cierre de Patio pasa a implementación directa en React Native. Figma Make queda
como archivo de referencia (`v01`/`v02`), no como fuente final ni generador de las
pantallas restantes. El intento v03 no se adopta.

La app actual permanece como baseline funcional en `rebuild/patio-final`. En vez de
una reescritura destructiva, se estabilizaron sus contratos y se comprobó el flujo
real sobre la UI vigente; la rama anterior conserva Patio Vivo recuperable.

## Salud técnica — 2026-07-16

- TypeScript: pasa.
- ESLint: pasa.
- Expo dependency check: dependencias alineadas; `npx expo install --check` pasa.
- Producción: Anthropic Vision ya sale por la Edge Function `read-menu`; falta
  desplegarla y registrar `ANTHROPIC_API_KEY` en Supabase.
- Exports: bundles iOS y Android generados correctamente.
- Seguridad: `credentials.json` dejó de estar versionado y quedó ignorado.
- Dispositivo real: pendientes magic link, cámara/galería, GPS, compartir, push y
  apertura de mapas.

## Estrategia inmediata

1. Desplegar `read-menu` y guardar su secreto en Supabase.
2. Ejecutar el barrido humano en iPhone de las integraciones nativas.
3. Corregir únicamente hallazgos reproducibles del barrido.
4. Preparar build de distribución solo con autorización de Alejandro.

## Estado ejecutivo

Patio ya tiene un MVP funcional de dos lados:

- **Foodie:** abrir sin login -> explorar mapa -> buscar platillo -> seleccionar fondita -> ver ficha/menu -> guardar/compartir/calificar/como llegar.
- **Fondero:** login magic link -> perfil negocio -> marcar ubicación -> crear/editar menú -> guardar en Supabase -> preview/share.
- **Puente real:** lo que publica Fondero en Supabase puede verse desde la ficha Foodie.

El foco actual es **QA en dispositivo + rediseño visual homologado**, no construir el flujo base desde cero.

## Hecho

### Producto / flujo

- Entrada Foodie-first con acceso secundario Fondero.
- Foodie y Fondero separados por intención y navegación.
- `/explorar` es la home real del Foodie.
- `/buscar` no es flujo visible del MVP; recupera hacia `/explorar`.
- Explorar abre como radar de antojo: mapa vivo, buscador protagonista, sugerencias ambient y sheet solo con intención.
- Favoritos, cuenta y manifiesto existen como utilidades/secundarios.
- Rating de 5 estrellas implementado con razones estructuradas cuando baja de 5.
- Share nativo de ficha/lugar implementado.

### Fondero

- Login por magic link.
- Perfil de negocio rediseñado con categoría, horario, pagos y ubicación.
- GPS/lat-lng en `perfil.tsx`.
- `menu.tsx` guarda menú del día y carta permanente.
- `foto-menu.tsx`, `preview.tsx` y `share.tsx` existen y fueron auditados en ciclos previos.
- Hints contextuales one-time implementados en Fondero y Foodie.

### Supabase

| Tabla | Estado |
|---|---|
| `fonditas` | ✅ lat/lng aplicado, lectura/escritura desde perfil |
| `menus` | ✅ menú del día desde `menu.tsx` |
| `cartas` | ✅ carta permanente desde `menu.tsx` |
| `menu_sections` | ✅ creada para migración estructurada futura |
| `menu_items` | ✅ creada para migración estructurada futura |

### Foodie data

- `fetchPublicFonditas()` carga fonditas reales.
- `fetchFonditaById()` permite fallback cuando un ID no está en mocks.
- `fetchMenuForFondita()` lee `cartas` primero y hace fallback a `menus` del día.
- `favoritos.tsx` combina mocks + Supabase.
- `explorar.tsx` combina búsqueda de mocks con `searchLiveMenus()` para cartas/menús reales.

### Sistema de diseño implementado

- `Fonts.brand` = Plus Jakarta Sans 800ExtraBold.
- `fontWeight` permitido: `'900'` / `'300'`, con excepciones documentadas.
- Separadores deben usar `StyleSheet.hairlineWidth`.
- Glass usa `expo-blur`; velos de mapa usan `expo-linear-gradient`.
- La paleta vigente es la de `lib/colors.ts`: fondo `#F8F8F5`, texto/botón `#1C1C1E`, accent naranja `#F2612F` light / `#FF6A3D` dark.
- No hay decisión pendiente de amarillo ni de segundo acento cálido. El rediseño debe elevar jerarquía, glass, geometría, composición y ritmo usando la paleta actual.

## Pendiente ahora

### QA humano / dispositivo

1. Verificar build iOS/TestFlight o preview en dispositivo real.
2. Probar magic link Fondero con diagnóstico visible si falla.
3. Probar cámara/galería y permisos nativos.
4. Probar GPS real en `perfil.tsx`.
5. Registrar UDID de iPhone para builds internos si aplica.
6. Configurar API key Google Maps restringida antes de builds Android reales.

### QA automatizado local

- Maestro comprobó entrada, Explorar, selección, detalle, Cuenta, búsqueda,
  Favoritos, Perfil, menú y preview.
- El flujo de publicación quedó comprobado completo: crear menú manual, publicar,
  confirmar “Tu menú está vivo”, abrir póster y llegar a Compartir.
- Evidencia vigente en `maestro/screenshots/` y flows `01` a `12`.

### Auditoría visual de implementación

1. Auditoría humana ya realizada: funcionalmente bien, visualmente insuficiente para el estándar premium/minimalista.
2. Falta convertir esa auditoría en sistema y mockups implementables.
3. Antes de código visual grande: asegurar que `docs/DESIGN_SYSTEM.md`, `docs/design/VISUAL_SYSTEM.md` y `lib/colors.ts` digan lo mismo.

## No pendiente

- Migración lat/lng en `fonditas`.
- Creación de tablas `menu_sections` / `menu_items`.
- Conectar ficha Foodie a menú real.
- Conectar favoritos a Supabase.
- Implementar sugerencias ambient en Explorar.
- Implementar ratings estructurados.
- Implementar fuente de marca activa.
- Implementar hints contextuales.

## Capturas

- Fuente vigente de screenshots históricos: `assets/screenshots/` y `docs/design/SCREENSHOT_INDEX.md`.
- `docs/design/screenshots/` no existe actualmente en el worktree.
- No documentar un paquete de screenshots nuevo hasta que los archivos existan físicamente.

## Validación

- Último estado documentado: typecheck, lint, Expo dependency check y
  `git diff --check` en verde el 2026-07-10.
- Antes de cerrar cualquier ciclo de código: correr `npx tsc --noEmit`.
- Para cambios visuales sustanciales: validar en simulador primero; build EAS solo cuando el simulador no alcance.
