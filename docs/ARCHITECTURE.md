# ARCHITECTURE

## Stack actual
- Expo SDK 54 + React Native 0.81 + React 19.
- Expo Router (file-based routing en `app/`).
- TypeScript estricto (`tsconfig` con `strict: true`).
- Supabase (`@supabase/supabase-js`) para auth y datos (`fonditas`, `menus`, `cartas`).
- AsyncStorage para persistencia local de tema y fallback de id.
- Anthropic SDK para lectura de menú desde imagen (`lib/vision.ts`).

## Estructura del repo
- `app/`: pantallas/rutas (`index`, `login-callback`, `perfil`, `menu`, `foto-menu`, `preview`, etc.).
- `lib/`: servicios y estado en memoria (`supabase`, `db`, `auth`, `menu-store`, `theme`, `vision`).
- `components/`: UI reutilizable, incluyendo `BottomTabBar`.
- `assets/`: logos e imágenes.
- `scripts/`: utilidades para screenshots y assets.
- `docs/`: PDFs de referencia + (desde ahora) docs de continuidad multi-agente.

## Flujo funcional principal
1. `app/index.tsx`: envío de magic link (o login dev) y redirección inicial por sesión.
2. `app/login-callback.tsx`: procesa deep link y verifica OTP con Supabase.
3. `app/perfil.tsx`: edición de datos del negocio, horarios, pagos y tipo.
4. `app/menu.tsx`: edición manual del menú del día y guardado diferido.
5. `app/foto-menu.tsx`: captura/galería -> IA -> revisión editable -> guardado.
6. `app/preview.tsx`: composición visual final para compartir imagen.

## Decisiones implícitas detectadas
- Estado de dominio en memoria (`menu-store`, `user-store`) con sincronización puntual a Supabase.
- Persistencia local mínima (tema y fallback de `fonditaId`).
- Enfoque mobile-first (iOS/Android), web solo secundario.
- Diseño y copy orientados a negocio local mexicano (fonditas).
- Tema custom (`lib/theme.tsx`) convive con componentes heredados del template Expo (`components/themed-*`, `hooks/use-theme-color`).

## Deuda técnica visible
- Mezcla de dos sistemas de theming (custom y template Expo) en paralelo.
- Warnings de lint activos en `foto-menu`, `onboarding` y `perfil`.
- El callback de auth ya se robusteció para múltiples parámetros, pero aún requiere validación manual en dispositivos reales.
- Secretos sensibles presentes en repo (`.env` local y clave publishable embebida en `lib/supabase.ts`).
