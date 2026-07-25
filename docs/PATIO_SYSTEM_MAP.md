# PATIO SYSTEM MAP

> Esquema maestro del producto y producción · 2026-07-18.
> Responde qué sistema gobierna cada decisión y cuál es su fuente de verdad.

## Decisión de onboarding — 2026-07-19

Esta sección es la **única especificación vigente** del alta. Las iteraciones de
`TASKS.md` y `AIRBNB_TO_PATIO_SYSTEM.md` anteriores a esta fecha son histórico.

```txt
Portada Patio
└── introducción visual (si es primera vez)
    └── intención
        ├── Ver qué hay hoy → avisos opcionales → Explorar
        └── Publicar lo que preparo
            → correo → nombre → ubicación → días/horarios → pagos
            → guardar → celebración → crear menú
```

- La introducción presenta Patio antes de pedir una intención. La decisión se
  expresa con resultados concretos —“Ver qué hay hoy” y “Publicar lo que
  preparo”— y no con etiquetas internas como Foodie/Fondero.
- Los avisos pertenecen únicamente al camino de quien explora. Activarlos u
  omitirlos termina en el mapa; quien publica nunca atraviesa esa pantalla.
- El rol persistido es respaldo para enlaces anteriores, pero nunca sustituye la
  intención explícita del botón que inició el recorrido.
- El alta inicial pide nombre, ubicación, horarios y formas de pago. Cada paso
  responde una pregunta concreta y pagos se resuelve con selección múltiple, sin
  datos bancarios ni formularios adicionales.
- La ubicación ofrece el botón nativo contextual y una dirección manual; persiste
  dirección y coordenadas cuando están disponibles.
- Los días son binarios y se cambian con un toque. Cada hora usa el selector
  compacto de iOS junto al día que modifica, sin una hoja inferior adicional. Al
  dejar de mover la ruleta, Patio confirma el valor y cierra el popover.
- Alta y edición de perfil comparten el mismo editor de días, horas y pagos.
- Nombre, ubicación, horario y pagos se guardan antes de mostrar la celebración. El alta
  no escribe campos que no preguntó ni activa el bloqueo de cambio de nombre.
- Descripción y giro se solicitan después, únicamente en el
  momento donde aporten valor. Esa decisión nunca se explica dentro de la UI.
- El cierre botánico centra el nombre del negocio como identidad principal; las
  instrucciones y acciones viven abajo. “Editar datos” vuelve al alta completa.
- El naranja se reserva para estados seleccionados. Las acciones principales usan
  tinta del sistema y botones compactos, no bloques naranjas de ancho completo.
- El teclado no desplaza ni cubre el título o la acción y la tecla “aceptar” avanza.
- Después de elegir explorar, una pantalla botánica con campana explica una sola
  vez el recordatorio diario y desde ahí abre el permiso nativo de iOS.
- Mientras no exista push por publicación, el copy promete un recordatorio diario,
  no detectar que un lugar acaba de publicar.

## Vista completa

```txt
PROPÓSITO DE PRODUCTO
docs/GOAL.md
        │
        ├── IDENTIDAD DE MARCA
        │   ├── verbal: identity/tono/copy
        │   └── visual: tipo/color/fotografía/motion
        │
        ├── EXPERIENCIA
        │   ├── recorrido de quien busca
        │   ├── recorrido de quien publica
        │   └── sistema de interacción/componentes
        │
        ├── PRODUCTO EJECUTABLE
        │   pantalla → controller → dominio → persistencia
        │                                ├── local
        │                                └── Supabase/Edge Functions
        │
        └── PRODUCCIÓN
            configuración → seguridad → QA → build → distribución
            → observabilidad → soporte → privacidad
```

Una decisión baja por este árbol. Nunca se corrige desde una hoja si su origen está
en una rama superior.

## 1. Producto

**Promesa:** saber qué hay hoy cerca y permitir publicarlo en segundos.

**Navegación vigente (2026-07-25):**

```txt
Foodie:   Buscar → Lugares → Perfil
Fondero:  Menús → Actividad → Perfil
```

Publicar es una acción dentro de Menús. El perfil público es el destino canónico
desde mapa, búsqueda, compartir y publicación; no existe una ficha intermedia.

**Fuentes:**

1. `docs/GOAL.md`;
2. `docs/NETWORK_COLD_START_AND_MONETIZATION.md` para red, crecimiento y cobro.
3. `docs/MENU_INTELLIGENCE_AND_POSTER.md` para el núcleo perfil, menú y póster.

**Límites:** Patio no incorpora delivery, pedidos, reservas o marketplace dentro del
núcleo. Nuevas ideas pasan por `docs/PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md`.

## 2. Identidad verbal

**Fuentes:**

1. `docs/design/foundations/IDENTITY_VERBAL.md`;
2. reglas no negociables de `CLAUDE.md`;
3. copy aprobado en el producto real.

**Contrato:**

- humano, local y editorial;
- afirmar lo que Patio es, sin comparaciones negativas;
- “¿Qué hay hoy?” y “Saaaaaaabes.” permanecen juntos;
- “Foodie” y “Fondero” son nombres internos, no copy visible;
- evitar vocabulario de plataforma genérica o marketing;
- cero viudas en títulos, párrafos, ayudas, alertas y CTA: todo copy estático de
  varias palabras pasa por `noWidow()` y se valida en dispositivo;
- ninguna pantalla expone contexto del chat, decisiones internas ni campos
  pospuestos: debe entenderse por sí sola.

Todo texto generado por IA debe respetar este contrato y requerir confirmación cuando
represente la voz de un negocio.

## 3. Identidad visual y diseño

**Fuentes, en orden:**

1. `CLAUDE.md` — leyes ejecutables;
2. `docs/DESIGN_SYSTEM.md` — sistema y referencias;
3. `docs/design/foundations/IDENTITY_AND_TYPE.md`;
4. `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`;
5. tokens reales: `lib/colors.ts`, `lib/theme.tsx`, `lib/fondero-palette.ts`.

**Regla:** si documento y código divergen, se detiene la propagación, se decide la
fuente correcta y se actualizan ambos. Figma Make es referencia congelada, no fuente
de producción.

## 4. Experiencia y navegación

### Quien busca

```txt
Entrada → onboarding/rol → Explorar → búsqueda/mapa
→ perfil público → menú vivo
→ guardar/seguir/reseñar/compartir/abrir mapas → Actividad/Cuenta
```

### Quien publica

```txt
Acceso → perfil del negocio → Hoy
├── cámara
├── Fotos
├── captura manual
└── historial
→ extracción estructurada → revisión dirigida → publicar
→ perfil público + póster canónico/compartir enlace
```

Las acciones principales viven cerca del pulgar; destinos raíz viven en tab bar;
acciones secundarias se agrupan sin duplicar navegación.

## 5. Arquitectura de aplicación

**Fuente:** `docs/ARCHITECTURE.md`.

```txt
app/ y components/       presentación
        ↓
lib/controllers/         casos de uso
        ↓
lib/*.ts                 dominio y servicios
        ↓
AsyncStorage / Supabase  persistencia
        ↓
Edge Functions           IA y fronteras servidor
```

Una feature declara controller propietario, fuente de verdad, offline, privacidad,
abuso y QA antes de entrar a producción.

## 6. Esquema de entornos

### Desarrollo local

- rama activa `rebuild/patio-final`;
- datos demo únicamente bajo `__DEV__`;
- Metro + simulador para iteración;
- iPhone dev build para hardware y permisos;
- secretos solo en archivos locales ignorados o secretos servidor.

### Preproducción

Estado objetivo antes de abrir beta:

- build interno con configuración de producción;
- cuentas y datos de prueba identificables;
- Edge Function desplegada;
- deep links, push, mapas y permisos reales;
- checklist de recorrido completo;
- mecanismo documentado para rollback.

Mientras no exista proyecto Supabase separado, las pruebas deben evitar escrituras
destructivas y usar entidades de QA claramente marcadas.

### Producción

- build firmado y distribuido por App Store/TestFlight según fase;
- Supabase con políticas RLS revisadas;
- secretos únicamente en servidor;
- Google Maps key restringida por aplicación/plataforma;
- redirects y dominios permitidos explícitos;
- datos demo imposibles de activar;
- política de privacidad y soporte accesibles;
- monitoreo de errores y salud de Edge Functions;
- proceso de borrado/exportación de datos.

## 7. Pipeline de producción

```txt
Tarea aprobada
→ implementación local
→ typecheck + lint + diff check
→ recorrido Maestro relevante
→ simulador
→ iPhone si usa hardware/OS
→ revisión visual/verbal
→ checkpoint Git
→ build interno autorizado
→ smoke test de servicios
→ distribución gradual
→ monitoreo y rollback si aplica
```

No ejecutar EAS/TestFlight por un cambio aislado de UI. Agrupar un bloque probado y
solicitar autorización explícita.

## 8. Gates de salida a producción

### Funcional

- [ ] Auth y magic link reales.
- [ ] Cámara, Fotos y lectura IA.
- [ ] GPS, mapas y salida a navegación.
- [ ] Publicación, historial, póster y share.
- [ ] Guardados, reseñas y cuenta.
- [ ] Push: permiso, recepción y apertura.

### Técnico

- [ ] Typecheck, lint, Expo check y diff check verdes.
- [ ] Maestro 01–12 o excepciones registradas.
- [ ] RLS y secretos revisados.
- [ ] Keys restringidas.
- [ ] Sin datos demo ni logs sensibles.
- [ ] Rollback y versión identificables.

### Marca y experiencia

- [ ] Copy conforme a identidad verbal.
- [ ] Tokens/componentes compartidos, sin parches divergentes.
- [ ] Accesibilidad básica y estados de error/cancelación.
- [ ] Revisión en claro/oscuro y tamaños de texto relevantes.

### Legal y operación

- [ ] Privacidad refleja datos, IA, notificaciones y retención reales.
- [ ] Canal de soporte y borrado de cuenta.
- [ ] Consentimientos separados cuando corresponda.
- [ ] Procedimiento para incidente, abuso y contenido reportado.

## 9. Orden de consulta

```txt
¿Qué estamos construyendo?      → GOAL
¿Cómo habla Patio?              → IDENTITY_VERBAL + CLAUDE
¿Cómo se ve/interactúa?         → DESIGN_SYSTEM + tokens reales
¿Dónde implementarlo?           → ARCHITECTURE
¿Está listo para personas?      → PATIO_SYSTEM_MAP / gates
¿Qué sigue después del MVP?     → PRODUCT_EVOLUTION_ROADMAP
¿Cómo crece y cuándo cobra?     → NETWORK_COLD_START_AND_MONETIZATION
¿Cuál es el estado de hoy?      → HANDOFF + STATE + TASKS
```
