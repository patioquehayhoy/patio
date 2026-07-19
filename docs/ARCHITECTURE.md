# ARCHITECTURE — Patio

> Fuente técnica vigente · actualizada 2026-07-18.
> Para el esquema completo de marca, experiencia, entornos y release ver
> `docs/PATIO_SYSTEM_MAP.md`.

## 1. Principio

Patio es una app móvil Expo/React Native de dos lados:

- quien busca resuelve **qué hay hoy cerca**;
- quien vende publica **lo de hoy** desde foto, captura manual o historial.

La UI no debe poseer reglas de dominio. El flujo esperado es:

```txt
Pantalla Expo Router
→ controller del caso de uso
→ servicio/store de dominio
→ persistencia local y/o Supabase
→ Edge Function cuando interviene IA
```

## 2. Stack

- Expo SDK 54, React Native 0.81, React 19 y TypeScript estricto.
- Expo Router para navegación basada en archivos.
- Supabase para autenticación, fonditas, menús y cartas.
- AsyncStorage para rol, preferencias, favoritos, vistos, historial y fallbacks locales.
- `supabase/functions/read-menu` como frontera servidor de lectura visual.
- `supabase/functions/smart-setup` como frontera servidor de alta conversacional.
- `expo-image-manipulator` para normalizar fotografías antes de enviarlas.

La llave del proveedor de visión no vive en React Native. `lib/vision.ts` invoca la
Edge Function y la función consume el secreto servidor `ANTHROPIC_API_KEY`.

## 3. Capas y propiedad

### Presentación

- `app/`: rutas, composición, layout, navegación y motion.
- `components/`: UI compartida; `menu-composer` es la vista operativa del editor.
- `constants/` y `lib/theme.tsx`: tokens y tema ejecutable.

Las pantallas llaman controllers; no deben duplicar consultas, transformaciones o
reglas de persistencia.

### Casos de uso

`lib/controllers/` contiene los contratos principales:

- explorar y búsqueda;
- detalle público;
- favoritos y vistos;
- cuenta;
- perfil del negocio;
- captura/lectura de foto;
- borrador y publicación;
- historial y preview.

Cambios funcionales deben entrar por el controller correspondiente. Cambios
puramente visuales permanecen en pantalla/componente.

### Dominio y persistencia

- `lib/menu-store.ts`: modelo y puente de borrador en memoria.
- `lib/menu-history.ts`: historial local y merge con datos remotos.
- `lib/patios.ts`, `lib/menu.ts`, `lib/db.ts`: lectura/escritura de datos.
- `lib/favorites.ts`, `lib/ratings.ts`, `lib/notifications.ts`: capacidades locales.
- `lib/demo.ts`: datos sintéticos exclusivamente de desarrollo.

### Backend

- Supabase Auth: sesión y magic link.
- Tablas Supabase: negocio y contenido publicado.
- Edge Function `read-menu`: recibe imagen normalizada, llama visión y devuelve
  secciones/platillos/precio estructurados.

La Edge Function normaliza la salida del modelo antes de responder: `precio` siempre
es string aunque no exista precio único, las colecciones siempre son arrays y los
precios individuales permanecen en cada platillo. El cliente repite la validación
como defensa, pero no depende de que el proveedor incluya campos opcionales.

## 4. Flujos críticos

### Publicar desde foto

```txt
Hoy → Cámara nativa o Fotos → resize JPEG 1600px
→ read-menu → revisión editable → borrador → publicar → póster/compartir
```

La cámara es la acción principal. **Elige de Fotos** abre directamente el selector
nativo; ambas entradas convergen en la misma normalización y lectura.

### Publicar desde historial

```txt
Hoy → Historial → recuperar menú local/remoto → editar → publicar
```

Foto reutilizable e historial son capacidades distintas: la primera reinterpreta
la imagen; la segunda reutiliza estructura ya corregida.

### Descubrir

```txt
Explorar → controller de búsqueda/mapa → datos reales + demo DEV
→ selección → detalle → guardar/reseñar/compartir/abrir mapas
```

### Autenticación

```txt
Acceso → magic link → patio://login-callback → Supabase Auth
→ initializeSignedInUser → rol e id local → destino correspondiente
```

Magic link conserva una deuda de QA físico; no es deuda de estructura.

### Patio Smart

```txt
Primer acceso con negocio incompleto → relato libre → smart-setup
→ datos estructurados + faltantes → revisión humana editable
→ confirmación/persistencia → Hoy
```

La extracción nunca publica directamente. Días, dirección, pagos y otros datos no
mencionados permanecen pendientes; no se completan por inferencia. La categoría
interna ayuda al sistema pero no se presenta como identidad del negocio: públicamente
es un Patio y la persona describe qué prepara.

## 5. Estado y fuentes de verdad

| Dato | Fuente primaria | Fallback/derivado |
|---|---|---|
| Sesión | Supabase Auth | — |
| Negocio publicado | Supabase | id local |
| Menú vivo | Supabase | demo solo en DEV |
| Borrador actual | `menu-store` | persistencia del controller |
| Historial | local + Supabase | merge determinístico |
| Favoritos/vistos | AsyncStorage | datos del Patio por id |
| Tema/rol | AsyncStorage | defaults de app |

## 6. Riesgos que gobiernan cambios

1. Rol local, sesión e id de negocio siguen siendo estados relacionados pero
   separados. No alterar auth sin probar sus tres combinaciones.
2. El borrador usa memoria como puente entre rutas; cualquier refactor debe preservar
   restauración y publicación.
3. Datos demo y reales comparten loaders en desarrollo; nunca escribir demo en
   producción.
4. Cámara, magic link, GPS, push y share necesitan QA en iPhone.
5. Cambios granulares pueden expresar una decisión global. Antes de parchear una
   pantalla, revisar controller, componente compartido, tokens y navegación.
6. Feeds, mensajería, incentivos y ranking requieren privacidad, moderación,
   instrumentación y controles de abuso antes de producción.

## 7. Regla para nuevas funciones

Cada función nueva debe declarar:

1. trabajo humano que resuelve;
2. evento/estado de dominio;
3. controller propietario;
4. fuente de verdad y política offline;
5. datos personales utilizados;
6. abuso o efecto de ranking posible;
7. QA y criterio de salida.

Si no puede contestar los siete puntos, permanece en discovery y no entra a UI.

## 8. Próxima frontera

La arquitectura soporta avances incrementales. No hace falta un rediseño estructural
antes de continuar. El orden es:

1. cerrar cambios locales y QA de cámara/galería;
2. instrumentar actividad reciente;
3. Smart Setup del negocio;
4. invitaciones y notificaciones;
5. búsqueda conversacional/reseñas;
6. ranking territorial, comunidades y gobernanza.

El detalle de producto y sus gates vive en
`docs/PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md`.
