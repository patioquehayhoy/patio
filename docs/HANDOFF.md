# HANDOFF

## Sesión 2026-07-22 — gobernanza de documentación + homologación Apple + fixes Fondero

Sesión larga, en dos mitades. Primera mitad: auditoría y limpieza de toda la
documentación del repo. Segunda mitad: en vivo con Alejandro en el iPhone
(dev build por cable, luego Metro por WiFi ya en el depa), corrigiendo UI real
del flujo Fondero a partir de su uso directo. Typecheck y lint verdes en cada
punto de cierre. Nada de esto está comiteado hasta el commit de cierre de esta
misma sesión (ver más abajo).

### Mitad 1 — documentación

- Auditoría de contenido completo (no solo fecha/nombre) de los 53 `.md` del
  repo, 3 agentes en paralelo. Resultado en `docs/DOCS_AUDIT_2026-07-22.md`.
  Hallazgos reales, no solo cosméticos: `PATIO_PRD.md` se autodeclaraba fuente
  de verdad estando superado por `PATIO_SYSTEM_MAP.md`; `IDENTITY_VERBAL.md`
  aprobaba `"Esto no es delivery."` como voz Patio siendo el ejemplo exacto que
  la ley anti-comparativo prohíbe; `ROADCONTROLLER.md` y `NEXT_SESSION.md`
  daban instrucciones ya resueltas; `AGENT_STATUS.md` con 5 semanas de atraso
  (por eso `/status` daba panorama viejo).
- 4 documentos legacy borrados: `docs/AGENT.md`, `docs/design/FLOW_V2.md`,
  `docs/design/PRODUCT_PRINCIPLES.md`, `docs/design/SCREENSHOT_INDEX.md`.
  `PATIO_PRD.md` archivado con banner (no borrado, se conserva como snapshot).
  `README.md` raíz reescrito (era boilerplate de Expo sin tocar).
- Dos agentes nuevos en `.claude/agents/`: `foodie-ops` (no existía dueño del
  lado Foodie) y `fondero-ops` ampliado con Edge Functions/migraciones, que ya
  eran su territorio de facto.
- **Hallazgo mayor:** el sistema tipográfico documentado en `CLAUDE.md` (SF Pro
  Display, pesos solo 900/300) no coincidía con el código real (`Fonts.brand` /
  Plus Jakarta en 40+ estilos, pesos reales 900/700/300). Se corrigió la
  documentación para reflejar lo ya shippeado — cero cambios visuales. De paso,
  `lib/theme.tsx` perdió `Type`, una escala tipográfica completa sin un solo uso
  real (confirmado por grep + `tsc --noEmit` verde).
- Color de botones homologado con cita textual de Apple HIG (`color.txt`):
  *"apply the app accent color to the background in prominent buttons...
  refrain from adding color to the background of multiple controls."* Regla:
  una sola acción de confirmación prominente por pantalla lleva el naranja: el
  resto neutro. Corrigió una inconsistencia real (`perfil-editar.tsx` tenía su
  botón de guardar en blanco).
- `supabase/templates/magic-link.html` rediseñado con la paleta vigente;
  corregida una violación de marca que llevaba tiempo ahí: `"¿Qué hay hoy?"` y
  `"Saaaaaaabes."` vivían separados (uno en el header, el otro en el footer) —
  la ley exige que vayan siempre juntos. Sigue sin instalarse en Supabase
  Dashboard (acción manual de Alejandro, no automatizable).

### Mitad 2 — fixes de UI en vivo (flujo Fondero)

Todo a partir de que Alejandro probó `menu-composer.tsx` y `historial.tsx`
en el device real:

- Pills de "Agregar sección": eran ruido permanente → revelación progresiva
  real (abre y cierra con un solo "+", antes solo abría). Secciones nuevas ya
  no nacen con nombre falso pre-llenado (`"SECCIÓN 6"`, `"MENÚ DE HOY"`) —
  nacen vacías con placeholder; la primera sección sugiere "PRIMER TIEMPO".
- Feedback de guardado homologado (haptic de éxito + check visual) entre
  `saveDraft`/`publish` del menú y `handleSaveAll` del perfil — antes solo uno
  de los dos daba alguna señal, y ninguno tenía haptic.
- Historial ganó **eliminar menú** (no existía en absoluto — ni local ni
  Supabase). Se quitó una fecha duplicada en el título por defecto de cada
  fila. Ícono del tab cambiado (`stats-chart-outline` → `receipt-outline`,
  coherente con "tus menús" en vez de leerse como analytics). Botón
  "+ Menú nuevo" agregado — primero se puso arriba a la derecha, Alejandro
  señaló que quedaba fuera del alcance del pulgar, se movió debajo del
  subtítulo. "Nombrar" → "Renombrar". Eyebrow "PUBLICACIONES" → "TUS MENÚS".
- `menu-editar.tsx`: cerrar/tache ahora regresa a `/historial`, no a `/menu`
  — aplica tanto a "Escribe tu menú" como a "Usa un menú anterior" porque
  ambas pasan por la misma pantalla.
- **Bug real corregido:** `saveDraft` podía fallar en silencio (catch vacío en
  `saveLocalMenu`) y la UI decía "Guardado" sin haber verificado nada.
  `saveLocalMenu` ahora devuelve éxito/fallo real; si falla, se avisa. **Sin
  confirmar con Alejandro si esto resuelve del todo el reporte original** —
  falta saber si el camino que falló fue Guardar o Publicar, con sesión real
  o en DEV.

### Qué sigue

1. Confirmar con Alejandro si el bug de guardado quedó resuelto o si necesita
   más diagnóstico (ver nota arriba).
2. Retomar la cola real de QA en iPhone: magic link, cámara/galería, GPS, alta
   v8 completa — quedó pausada por esta sesión de gobernanza + UI.
3. Instalar el template de email en Supabase Dashboard (manual, Alejandro).
4. Backlog anotado, no implementado: convertir los textos tipo kicker/hint
   fijos en hints temporales de primera vez (`lib/hints.ts` ya tiene el
   mecanismo, falta extenderlo a estas pantallas).

## Sesión 2026-07-20 — principios recuperados + horarios sistémicos

- `ESSENTIAL_DESIGN_PRINCIPLES.md` fue contrastado contra la transcripción oficial
  completa de WWDC17 802 y la HIG vigente. Se corrigieron dos distorsiones que afectaban
  decisiones reales: Mortimer pertenece a mental model, no a mapping; alineación y
  simetría cooperan, pero no son sinónimos.
- El editor semanal usa una composición bilateral por día: nombre y conector en la
  mediana, con ABRE/CIERRA en mitades idénticas. Las filas repiten la misma geometría.
- Días abreviados como `LU MA MI JU VI SÁ DO`; pills con texto ópticamente centrado,
  blancos táctiles de 44 pt y cero días comunicado solo por `0 abiertos`. La revisión
  renderizada detectó que el ancho anterior de 86 pt hacía chocar las cápsulas nativas:
  ahora cada hora reserva 104 pt, ABRE/CIERRA se conectan con `→` y la composición comparte
  una retícula bilateral: nombre y conector en la mediana, ABRE/CIERRA en mitades
  idénticas. El conteo de días + háptica confirman la selección. El popover compacto fue
  reemplazado por una ruleta nativa `spinner` dentro de una superficie centrada de 320 pt:
  apertura y cierre comparten exactamente marco, padding y eje, sin desplazamiento lateral.
- QA verde: TypeScript, ESLint, `git diff --check`, Maestro `13-alta-negocio` y
  `16-editar-perfil-negocio`. Capturas: `13-horarios.png`,
  `13-horarios-picker.png` y `13-horarios-picker-cierre.png`; las dos últimas verifican
  la geometría idéntica de apertura y cierre.
- Maestro también mueve la ruleta de apertura y verifica su autocierre tras 1100 ms.
- Pendiente humano: confirmar en iPhone físico la sensación final del nuevo selector centrado.

## Sesión 2026-07-20 — simetría real en horarios + enriquecimiento del 802

Sesión en vivo con Alejandro dirigiendo desde el iPhone (dev build por cable,
Metro por USB además del intento inicial por WiFi). Typecheck y lint verdes
al cierre.

### Cambios aplicados

1. **Editor de horarios** (`components/business-schedule-editor.tsx`):
   - Se quitó un `marginLeft: -8` que desalineaba el picker de hora respecto
     a su propia etiqueta ABRE/CIERRA (rompía el eje compartido — violación
     directa de Symmetry/Reflection del 802).
   - El remount que fuerza el cierre del picker compacto tras 1100ms de pausa
     ahora usa doble `requestAnimationFrame` + `Easing.out(Easing.cubic)` en
     vez de encadenar el fade-in en el mismo tick: evita que la animación
     arranque sobre una vista nativa que React todavía no montó (causa real
     del glitch reportado).
   - La fila ABRE/CIERRA pasó de "dos columnas izquierda-alineadas" a
     reflexión real: ABRE pegado al borde izquierdo de su columna, CIERRA
     pegado al borde derecho de la suya (`timeEditorEnd`, `timeLabelEnd`,
     `compactTimeEnd`) — el espacio vacío queda centrado entre ambos en vez
     de acumulado a la derecha de toda la tarjeta.
2. **`docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md` reescrito**:
   los 12 principios traían solo el título de cada slide del WWDC17 802; se
   enriquecieron con el mecanismo real de la charla (parafraseado de la
   transcripción oficial, no solo las slides) — aeropuerto en Wayfinding,
   tablero del coche en Feedback, grifo de Mortimer en Mental Model, mesero
   de hamburguesa en Progressive Disclosure, diálogo de imprimir en 80/20,
   etc. Symmetry (3.12) documenta el caso ABRE/CIERRA como ejemplo resuelto.
   Nueva sección aclara qué es vigente hoy: Liquid Glass (WWDC25) es el
   material actual, cubierto por el skill `apple-design`; y se corrigió que
   "múltiplos de 8px" **no es una regla real de Apple** — es convención
   propia de Patio documentada en `CLAUDE.md`, no una cita de la HIG. Lo que
   Apple exige es alineación real entre componentes, no un múltiplo fijo.

### QA pendiente

- Confirmar en iPhone físico que la fila ABRE/CIERRA ya se siente en espejo
  y no descuadrada.
- Sentir de nuevo la animación del picker con el doble `requestAnimationFrame`
  (ajustar solo si se sigue viendo el glitch).

## Sesión 2026-07-19 (tarde) — pulido HIG del recorrido de primera vez

Sesión en vivo con Alejandro dirigiendo desde el iPhone (Metro por WiFi,
IP de la Mac ese día: `192.168.100.141`). Typecheck y lint verdes al cierre.
Maestro `02-onboarding` y `15-onboarding-fondero-notifications` verdes en
simulador iPhone 17 Pro con el copy nuevo; capturas revisadas visualmente.
Cambios sin commit al cerrar la sesión (los corre Alejandro).

### Decisiones de producto (con fuente HIG)

- **Foodie sin sesión, Fondero con correo** — confirmado contra HIG *Managing
  accounts* ("require an account only if core functionality requires it").
  No pedir sign-in a ambos lados.
- **Sin splash extra por rama** — HIG pide explicar el beneficio DENTRO de la
  vista de sign-in; `fondero-acceso` ya lo hace ("Tu menú, en un correo…").
  No agregar pantalla de bienvenida Fondero.
- **Ley global del switch de lado:** la puerta al otro lado vive en un solo
  lugar por lado, al FINAL de Cuenta / Mi Patio, en tinta neutra, agrupada con
  "Cerrar sesión" (las salidas de contexto viven juntas). Nunca en tab bar,
  mapa ni flujos primarios. Excepción: el escape de `fondero-acceso`.
- **Los 6 casos reales del Foodie** (oficina, explorador, referencia ambigua,
  pasó por enfrente, chisme, leal que compara) quedaron en la memoria
  `foodie_jtbd`. Tres incertidumbres: qué hicieron, en cuánto, qué tan lejos.

### Cambios aplicados

1. **Ruleta de horarios** (`components/business-schedule-editor.tsx`): el
   cierre tras 1100 ms ya no brinca — animación de confirmación fade+scale
   (90 ms salida / 140 ms regreso) sincronizada con el remount. Regla HIG
   Motion: "brevity and precision in feedback animations".
2. **Switch de lado** (`app/cuenta.tsx`, `app/perfil.tsx`): "Publicar mi menú"
   perdió el naranja y bajó a la última card junto a "Cerrar sesión"; Mi Patio
   quedó espejo exacto ("Explorar como cliente" + "Cerrar sesión").
3. **Onboarding verbal** (`app/onboarding.tsx`): arco por audiencias —
   escena 1 busca ("Qué hicieron, en cuánto y qué tan lejos queda. Sin
   preguntar: está en Patio antes de que llegues."), escena 2 cocina
   ("SI TÚ COCINAS / Publicar lo que preparas." — antes era ambigua),
   escena 3 puerta ("Pásale, aquí es." — "Entra por donde quieras" sonaba a
   albur). Títulos infinitivos gemelos que hacen eco con los dos CTA.
   Icono de publicar: storefront (antes restaurant = comer, lado equivocado);
   mismo símbolo que la puerta en Cuenta.
4. **Avisos** (`app/push-prompt.tsx`): texto y acciones abajo (misma anatomía
   y velo que la intro), escala editorial 40/900, título "Te avisamos qué hay
   hoy.", cuerpo "Solo un recordatorio a la hora de la comida. Sin spam, sin
   ruido." (honesto: sigue siendo recordatorio local). Columna de acciones
   compacta; murió el badge naranja flotante.
5. **Foto del menú HIG** (`app/foto-menu.tsx`,
   `lib/controllers/useFotoMenuController.ts`):
   - fuera `allowsEditing` de cámara (el recorte cuadrado mutilaba menús
     verticales; queda la confirmación nativa Repetir/Usar foto);
   - galería sin `requestMediaLibraryPermissions` (PHPicker no lo necesita);
   - cámara denegada → diálogo con Elegir de Fotos / Abrir Ajustes / Ahora no
     (antes saltaba a galería sin avisar);
   - "Cancelar" durante la lectura (antes no había salida);
   - diálogo de error con tercera opción "Ahora no";
   - ✕ de la revisión sale a Hoy — antes dejaba pantalla en blanco (bug).
6. **Maestro** (`maestro/flows/02`, `15`): aserciones actualizadas al copy
   nuevo. Ambos flujos verdes.

### QA pendiente en iPhone físico (además del listado del corte anterior)

- Sentir la animación nueva de la ruleta (ajustar 90/140 ms solo si se siente).
- Recorrido primera vez completo con el copy nuevo (botón DEV en portada).
- Foto de menú vertical sin recorte + Cancelar durante lectura + salidas de
  los diálogos nuevos.

## EMPIEZA AQUÍ — corte exacto 2026-07-19 · guardado remoto

> Esta es la especificación operativa vigente. Las secciones fechadas anteriores
> permanecen debajo como bitácora y no deben usarse para revertir este flujo.

### TL;DR vigente

Patio sigue en React Native/Expo, rama `rebuild/patio-final`. El baseline funcional
es `d0a5e8d`; este documento se publica en el commit de cierre inmediatamente
posterior. Al apagar, el worktree está limpio y la rama sigue sincronizada con
`origin/rebuild/patio-final`. El flujo nuevo fue probado en simulador y abierto en
el iPhone físico conectado.

La decisión panorámica cerrada es:

```txt
Portada
└── introducción visual
    └── intención
        ├── Ver qué hay hoy
        │   └── avisos opcionales → mapa Foodie
        └── Publicar lo que preparo
            └── correo → nombre → ubicación → horarios → pagos
                → guardar → celebración → primer menú
```

“Foodie” y “Fondero” siguen siendo nombres internos para arquitectura y QA. Nunca
son la pregunta ni las opciones visibles para la persona.

### Estado técnico comprobado al cierre

- `npm run typecheck`: verde.
- `npm run lint`: verde.
- `git diff --check`: verde.
- Maestro, ejecutado flujo por flujo en iPhone 17 Pro / iOS 26.3:
  - `02-onboarding.yaml`: introducción visual + puerta de intención;
  - `13-alta-negocio.yaml`: nombre + ubicación + horario + pagos + celebración;
  - `14-onboarding-fondero-route.yaml`: publicar termina en acceso por correo;
  - `15-onboarding-fondero-notifications.yaml`: explorar → avisos → mapa;
  - `16-editar-perfil-negocio.yaml`: horario y pagos en edición posterior.
- Dev build físico `com.parcomx.patio` lanzado por cable en
  `patio://onboarding` el 2026-07-19.
- Commit publicado: `d0a5e8d feat: refine onboarding and business setup flows`.
- `git status -sb`: `rebuild/patio-final...origin/rebuild/patio-final`, sin
  archivos modificados, staged ni sin seguimiento.
- GitHub CLI autenticado como `patioquehayhoy`; la credencial vive en el llavero
  de macOS y persiste después de reiniciar.
- La advertencia de Maestro sobre `picocli`/Java es de la herramienta. Un fallo
  intermitente `kAXErrorInvalidUIElement` apareció durante el crossfade; se evitó
  usando coordenada estable para saltar la introducción. No es un crash de Patio.

### Reinicio seguro de la Mac

Es seguro cerrar Codex, terminales, Metro, Simulator, Xcode y reiniciar. Nada del
avance vigente depende únicamente de un proceso o caché en memoria.

**Persistente y protegido:**

- código, assets y pruebas: baseline `d0a5e8d` publicado en GitHub; documentos de
  reinicio: commit de cierre inmediatamente posterior en la misma rama;
- acceso de GitHub CLI: cuenta `patioquehayhoy`, guardada en Keychain;
- `node_modules/`, `ios/`, `.expo/` y `supabase/.temp/`: ignorados por Git pero
  presentes en disco; reiniciar no los elimina;
- `.env`: existe, está ignorado y actualmente está vacío; no contiene una clave
  local que haya que rescatar antes de apagar;
- datos remotos en Supabase: no dependen de Metro ni del reinicio de la Mac;
- app, permisos y AsyncStorage del Simulator/iPhone normalmente sobreviven al
  reinicio. Sí se pierden si se desinstala Patio o se ejecuta “Erase All Content
  and Settings”; no hacerlo antes del QA de persistencia.

**Temporal y reconstruible:**

- el proceso Metro y el puerto `8081` se cierran al apagar;
- cachés de Metro/Expo se pueden regenerar sin perder código ni datos remotos;
- la IP LAN puede cambiar al reconectar la Mac al WiFi.

**Primer arranque después del reinicio:**

```bash
cd /Users/parco/Patio
git status -sb
gh auth status
npm run typecheck
npm run lint
npx expo start --dev-client --host lan
```

En el iPhone, abrir la dev build Patio y elegir el servidor de la Mac. Si no
aparece, obtener la IP nueva con `ipconfig getifaddr en0` y usar
`http://<IP>:8081`. Usar `--clear` solo si Metro muestra un bundle viejo o un error
de resolución; esa limpieza no afecta el código ni Supabase.

### Nomenclatura correcta

- **Introducción visual:** las pantallas botánicas que presentan Patio. En código
  la ruta conserva `/onboarding` por compatibilidad, pero en producto no se le
  presenta como un formulario de alta.
- **Puerta de intención:** elección por resultado: “Ver qué hay hoy” o “Publicar
  lo que preparo”. No preguntar “¿eres Foodie o Fondero?”.
- **Alta del negocio:** nombre, ubicación, horarios y pagos.
- **Avisos:** permiso contextual del camino de quien explora. No pertenece al alta
  del negocio.

### Arquitectura de entrada y rutas

| Responsabilidad | Fuente vigente | Contrato |
|---|---|---|
| Portada | `app/index.tsx` | Un CTA: “Entrar a Patio”. La intención no se pregunta antes de presentar el producto. |
| Introducción + intención | `app/onboarding.tsx` | Tres escenas botánicas; la última muestra dos resultados accionables. Cerrar/saltar avanza a esta decisión, no al mapa. |
| Persistencia de intención | `lib/entry-flow.ts` | `@patio_user_role` guarda `foodie`/`fondero`; `onboarding_done` marca introducción terminada. Un parámetro explícito gana a un valor histórico. |
| Camino explorar | `app/push-prompt.tsx` | Explica el beneficio, permite activar u omitir y siempre termina en `/explorar`. |
| Camino publicar | `app/fondero-acceso.tsx` | Omite avisos; pide correo y continúa por magic link. Si la persona cambia a explorar desde aquí, ve primero el contexto de avisos. |
| Alta negocio | `app/patio-smart.tsx` | Cuatro pasos operativos y celebración. “Patio Smart” no aparece en copy visible. |
| Magic link | `app/login-callback.tsx` | Si falta setup, `/patio-smart`; si existe, `/menu`. Nunca caer al mapa por un fallo de hidratación. |

No volver a mezclar introducción, permiso, rol y alta en una secuencia universal.
Cada pantalla pertenece a una rama y debe prometer únicamente lo que esa rama hace.

### Alta del negocio — contrato cerrado

1. **Nombre.** Label persistente `NOMBRE`; sin ejemplo que actúe como etiqueta.
2. **Ubicación.** Opción de usar ubicación actual + dirección manual. La dirección
   permite avanzar aunque el geocodificador falle temporalmente.
3. **Días y horarios.** Presets, siete estados binarios y hora editable por día.
4. **Pagos.** Selección múltiple: efectivo, transferencia y tarjeta. Se exige al
   menos una opción; no se piden números de tarjeta ni datos bancarios.
5. **Celebración.** El nombre del negocio vive en el centro geométrico exacto; la
   instrucción y los CTA quedan abajo. Primaria: “Crear mi primer menú”. Secundaria:
   “Editar datos”.

Se guardan nombre, dirección/coordenadas disponibles, horario semanal y tres
booleanos de pago. Descripción, giro, especialidades y relato con IA quedan fuera
del alta inicial. No explicar esa decisión interna dentro de la UI.

### Componentes canónicos: no duplicar

- `components/business-schedule-editor.tsx`
  - se usa en `app/patio-smart.tsx` y `app/perfil-editar.tsx`;
  - contiene presets, días abiertos/cerrados y `DateTimePicker` compacto;
  - conserva horas al cerrar/reabrir un día;
  - tras 1100 ms sin movimiento remonta el picker para confirmar el valor y cerrar
    el popover nativo.
- `components/business-payment-selector.tsx`
  - se usa en alta y perfil;
  - presenta las mismas tres opciones, estados y accesibilidad;
  - naranja solo en borde/icono/check seleccionado.

Ley: alta y edición posterior importan estos componentes. No copiar su JSX a otra
pantalla ni reconstruir una variante “parecida”. Si cambia la interacción, cambia
el componente compartido y se vuelve a probar en ambos contextos.

### Persistencia

- `lib/smart-setup.ts` conserva el tipo histórico `SmartSetupResult`, pero el flujo
  actual ya no invoca relato libre ni extracción IA.
- `saveSmartSetup()` actualiza `fonditas.nombre`, `direccion`, coordenadas cuando
  existen, `horario_semanal`, `pagos_efectivo`, `pagos_transferencia` y
  `pagos_tarjeta`.
- `app/patio-smart.tsx` refleja también nombre, dirección, horario y pagos en
  `lib/menu-store.ts` para continuidad local inmediata.
- `useFonderoProfileController` conserva Supabase + estado local + dirty state; el
  editor visual recibe `semanal`/`setSemanal` y los setters de pago.
- El primer nombre no debe activar por accidente el candado de 15 días. Ese control
  pertenece a cambios posteriores del perfil.

### Avisos: promesa actual y límite real

- La pantalla visible dice “Te avisamos si hay.”, pero el cuerpo explica la
  capacidad real: un recordatorio a la hora de la comida para revisar guardados.
- Hoy `lib/notifications.ts` programa preferencia/recordatorio local. **No existe
  todavía push remoto disparado cuando un negocio publica.**
- No escribir “te avisamos cuando publiquen” hasta tener tokens remotos, guardados
  sincronizados, evento de publicación, APNs/backend y pruebas reales.
- Activar u omitir avisos debe terminar en el mapa. Publicar un negocio no debe
  atravesar esta solicitud de permiso.

### Fundamentos visuales y verbales aprendidos

1. **Diseñar el recorrido, no el link.** Antes de cambiar una pantalla, recorrer
   todas sus entradas, salidas, permisos, teclado, regreso y estado persistido.
2. **La pantalla funciona sin el chat.** Nunca mostrar frases como “los detalles
   pueden esperar”, decisiones de backlog ni explicaciones para el equipo.
3. **Cero viudas.** Ningún título, párrafo, ayuda, alerta o CTA deja una palabra
   sola al final. Copy estático pasa por `noWidow()` y se revisa en dispositivo.
4. **Resultado antes que rol.** Las personas eligen lo que quieren hacer, no una
   taxonomía interna de producto.
5. **Una pregunta por paso.** Nombre, ubicación, horario y pagos tienen propósito
   propio. No pedir relato para después volver a pedir los mismos datos.
6. **Tinta neutra, naranja como orientación.** Primarias en negro/blanco. Naranja
   en navegación superior, progreso actual, selección y confirmación.
7. **Control junto al dato.** La hora se edita al lado del día; no abrir un sheet
   adicional alrededor de un picker que ya tiene su propio contexto.
8. **Jerarquía geométrica.** Cuando el nombre es la celebración, se centra respecto
   a toda la pantalla, no respecto al espacio sobrante entre header y botones.
9. **Teclado sin secuestro.** `keyboardDismissMode="interactive"`, insets
   automáticos, scroll que lo cierra y tecla Return que avanza cuando corresponde.
10. **Identidad en fotografía, ritmo y voz.** Los controles básicos permanecen
    familiares; Patio se expresa en la composición botánica, el contraste y el
    lenguaje, no inventando controles difíciles de aprender.

### Apple HIG — extracción aplicada, no decoración

Fuentes oficiales consultadas el 2026-07-19:

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- [Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers)
- [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- [Asking permission to use notifications](https://developer.apple.com/documentation/UserNotifications/asking-permission-to-use-notifications)

| Guía de Apple | Aplicación concreta en Patio |
|---|---|
| Jerarquía, armonía y consistencia con la plataforma | Botones compactos, navegación reconocible y controles nativos; la marca no compite con la tarea. |
| La introducción debe ayudar a empezar, no convertirse en burocracia | Introducción visual breve y puerta de intención; el alta pide solo datos operativos. |
| Un placeholder desaparece al escribir; una etiqueta separada conserva el propósito | Label persistente `NOMBRE` y `DIRECCIÓN`; placeholder solo ayuda con formato. |
| Usar el teclado apropiado, secuencia de foco lógica y Clear cuando aporta | Email usa teclado de correo; campos cortos; Return avanza; `clearButtonMode` durante edición. |
| Pickers sirven para valores compuestos o listas medianas/largas; listas cortas pueden usar botones | Hora usa picker del sistema; días, presets y pagos usan opciones directas visibles. |
| Componentes táctiles cómodos y reconocibles | Targets mínimos cercanos o superiores a 44×44 pt; back/cierre tienen hit area propia. |
| Pedir permisos cuando el beneficio es comprensible | Notificaciones solo después de elegir explorar y ver la promesa; ubicación dentro del paso que explica el mapa. |
| Layout adaptativo y Dynamic Type | Safe areas, scroll, `maxFontSizeMultiplier`, push-out/noWidow y QA con tamaño de texto máximo. |

No copiar una captura de Apple. Aplicar el principio y conservar la identidad Patio.
“Apple-like” aquí significa: jerarquía clara, controles familiares, contexto justo,
feedback inmediato, accesibilidad y ausencia de pasos administrativos inútiles.

### QA pendiente real

1. **iPhone físico:** sentir el cierre automático de la ruleta tras 1100 ms. Ajustar
   solo si impide cambiar hora y minutos; rango sugerido de prueba: 900–1400 ms.
2. **Ubicación física:** aceptar/denegar permiso, reverse geocode, dirección manual
   y precisión del pin.
3. **Magic link real:** publicar → correo → callback → alta → menú.
4. **Persistencia real:** cerrar/reabrir app y comprobar horario/pagos en perfil y
   ficha Foodie.
5. **Avisos:** validar diálogo nativo en instalación limpia. El simulador ya tenía
   permiso y por eso Maestro marcó “Permitir” como opcional/no encontrado.
6. **Push remoto por publicación:** sigue pendiente de backend; no confundir con el
   recordatorio local actual.
7. **QA nativo restante:** cámara, galería, lectura IA real, póster/share, Maps y
   manejo de red sin conexión.

### Próximo paso recomendado

Recorrer en el iPhone físico, en este orden y sin abrir nuevas features:

1. `Entrar a Patio → Ver qué hay hoy → Ahora no/Activar avisos → mapa`;
2. reinstalación o limpieza de estado → `Entrar a Patio → Publicar lo que preparo`;
3. magic link → nombre → ubicación → fin de semana → mover hora → pagos → guardar;
4. `Mi Patio → Editar mi negocio` y comprobar que horario/pagos son idénticos;
5. crear el primer menú y publicar.

Registrar solamente fallos reproducibles con pasos, resultado real, resultado
esperado y captura. Corregirlos en el componente/fuente responsable; no maquillar
la pantalla consumidora.

## Archivo anterior — corte 2026-07-16

### TL;DR

Patio ya es un MVP funcional en React Native/Expo. La rama activa es
`rebuild/patio-final`, HEAD local `efdbddd`. Los recorridos principales pasaron en
simulador y el código está sano. No reconstruyas pantallas, no retomes Figma Make y
no abras features nuevas: el siguiente bloque es infraestructura externa + QA nativo.

### Estado verificable

- Worktree limpio al entregar este handoff.
- `npm run typecheck`: verde.
- `npm run lint`: verde.
- `npx expo install --check`: verde.
- Expo alineado de `54.0.35` a `54.0.36`.
- `git diff --check`: verde antes del commit.
- Commit local nuevo: `efdbddd chore: preparar Patio para QA nativo`.
- El push de `rebuild/patio-final` falló por falta de autenticación GitHub; el commit
  solo existe localmente hasta que Alejandro haga login/push.
- `npm audit` reporta 19 vulnerabilidades moderadas transitivas. No ejecutar
  `npm audit fix --force`: propone Expo 57 y sería una migración mayor fuera de scope.

### Lo que ya quedó resuelto

- Warning `Unsupported dashed/dotted border style`: removidos los dos estilos fuente
  en `app/patio/[id].tsx` y `app/resena/[id].tsx`.
- Antigua `EXPO_PUBLIC_ANTHROPIC_API_KEY`: eliminada del `.env` local.
- Estado temporal `supabase/.temp/`: eliminado del índice y agregado a `.gitignore`.
- Métricas ficticias `312 vistas` / `+18%`: no existen en el código actual.
- Documentación operativa actualizada: `HANDOFF`, `STATE`, `TASKS`, `NEXT_SESSION`.

### Bloqueos que requieren a Alejandro

1. **GitHub:** autenticar y ejecutar `git push -u origin rebuild/patio-final`.
2. **Anthropic:** revocar/rotar la clave antigua que estuvo expuesta como pública.
3. **Supabase:** `npx supabase login`; guardar la clave nueva como
   `ANTHROPIC_API_KEY`; desplegar `read-menu`.
4. **iPhone físico:** magic link, cámara/galería, foto IA, GPS, publicación,
   póster/share, push y apertura de mapas.
5. **Distribución:** build/TestFlight nuevo solo tras cerrar ese QA y con autorización.

### Orden de continuación para Claude

1. Verificar rama `rebuild/patio-final` y HEAD `efdbddd`.
2. Ayudar a Alejandro con GitHub/Supabase sin imprimir secretos en consola o docs.
3. Ejecutar el QA nativo como un solo recorrido; registrar únicamente fallos
   reproducibles con pantalla, pasos y resultado esperado/real.
4. Corregir esos fallos sin refactors laterales.
5. Repetir typecheck, lint y Expo check; actualizar esta sección al cerrar.

### Reglas que no se negocian

- Leer `CLAUDE.md` y `docs/ROADCONTROLLER.md` antes de tocar código.
- No modificar ni parafrasear `Saaaaaaabes.`.
- No usar “Foodie” o “Fondero” en copy visible.
- No tocar el bloque de precio protegido del editor.
- No convertir Patio en delivery, reservas, pedidos o marketplace.
- No retomar Figma Make como herramienta de producción.
- No ejecutar build EAS ni TestFlight sin autorización de Alejandro.

## Estado vigente — 2026-07-16 (limpieza autónoma previa a QA)

- `npm run typecheck` y `npm run lint` pasan.
- Retirados los dos bordes `dashed` que originaban el warning nativo.
- Retirada del `.env` local la antigua `EXPO_PUBLIC_ANTHROPIC_API_KEY`.
- No hay métricas hardcodeadas `312 vistas` / `+18%` en el código actual.
- `supabase/.temp/` queda tratado como estado local, no como fuente versionable.
- El CLI de Supabase no tiene sesión: desplegar `read-menu` requiere `supabase login`.
- La clave antigua debe rotarse antes de guardar la nueva como secreto servidor.
- El siguiente bloque real es QA en iPhone: magic link, cámara/galería, foto IA, GPS,
  publicación, póster/share, push y mapas.

## Estado vigente — 2026-07-13 (QA en device + 2 rondas de diseño global)

Sesión de QA en vivo: Alejandro probó en iPhone por WiFi (Metro) y dio feedback en
dos rondas; todo se corrigió en caliente con Fast Refresh. Typecheck y lint verdes.

### Leyes de diseño dictadas (ya aplicadas y documentadas)

- **Todo lo accionable vive abajo** — cero botones flotantes arriba; buscador + mic
  junto a la tab bar en el mapa.
- **Tab bar liquid glass**: se ENCOGE al scrollear (escala 0.82 + baja 12px), no
  desaparece. El mecanismo vive en `lib/tab-bar-visibility.tsx` + interpolaciones
  en `components/bottom-tab-bar.tsx`.
- **Acciones secundarias detrás de `···`** — homologado en composer e historial
  (Editar y usar / Nombrar; el lapicito murió).
- **Densidad HIG**: regla nueva en CLAUDE.md — el aire vive ENTRE grupos.
- **Botones HIG**: cápsulas que abrazan su contenido; nada full-width invasivo.
  Filas tocables = 56pt en ambos lados.
- **Corazón = guardar** en toda la app (tab bar incluida).
- **"Cerrar sesión"** siempre — "Salir del modo Fondero" eliminado.

### Cambios funcionales de la sesión

- **Precio del día**: campo compacto de primera clase en el composer; se guarda en
  `secciones[0].precio`; explicación del modelo (día + a la carta) como hint de
  una sola vez (`fondero_precio` en `lib/hints.ts`). Sale en el póster arriba-derecha.
- **Cadena de foco en captura**: platillo → descripción → siguiente platillo (el
  precio fuera de la cadena; cambia poco). El teclado ya no se cierra.
- **Guardar cambios ≠ Publicar**: guardar (borrador local) y publicar como cierre
  del scroll, en cápsulas.
- **Chips de sección sugeridas** por giro, con equivalencia canónica
  ("PRIMER TIEMPO" ≡ "1ER TIEMPO", `canonicalSeccion` en menu-store).
- **Póster reestructurado**: fecha+nombre / precio arriba-derecha / menú sin label
  redundante / firma sutil light sin logo. Círculo fantasma (spacer con fondo) fuera.
- **Guardados con filtros**: chips Todos / Con menú hoy / categorías reales.
- **Buscar en mapa abre lista "Cerca de ti"** de inmediato; botón mic (dictado del
  teclado iOS; el agente de voz real sigue en backlog Pro).
- **Cuenta y Mi Patio rejerarquizados** en cards espejo; redundancias fuera.

### Pendientes que dejó la sesión

- Drag & drop de platillos: Alejandro autorizó skip si es complejo; queda en radar.
- Filtros de Guardados v2: jerarquizar según "mapa vectorial" del foodie.
- Fricción/ceremonia para volverse Fondero (bloque 5) y agente de voz (Pro).
- Sigue el BLOQUEANTE externo: desplegar `read-menu` + rotar clave (ver 2026-07-10).
- Warning en log: "Unsupported dashed/dotted border style" — cazar el borde punteado.

## Estado vigente — 2026-07-10 (cierre local comprobado en código)

Leer esta sección primero. La bitácora histórica debajo conserva contexto, pero ya
no define la estrategia activa.

### Decisión de producto

- Figma Make deja de ser la herramienta responsable de terminar Patio.
- `v01` y `v02` se conservan únicamente como referencias visuales y de ideas.
- El intento `v03` de Figma Make no se incorpora al repo: produjo una galería de
  cuatro pantallas técnicamente completa, pero visualmente genérica y ajena a Patio.
- Patio Vivo sigue siendo la verdad funcional.
- La reconstrucción final se hará en React Native/Expo, sobre una línea separada,
  reutilizando controllers, servicios, Supabase, persistencia y activos existentes.

### Método aprobado

1. Auditoría corta y ejecutable de arquitectura, datos, flujo y salud técnica.
2. Fijar contratos de comportamiento antes de reemplazar UI.
3. Reconstruir una pantalla maestra en una versión separada.
4. Revisión visual de Alejandro.
5. Solo después de aprobación, propagar el sistema al resto.

No volver a generar veinte pantallas antes de validar el ADN visual. No traducir
Figma Make literalmente. No refactorizar backend estable por motivos visuales.

### Baseline técnico verificado el 2026-07-10

- `npm run typecheck`: verde.
- `npm run lint`: verde.
- `npx expo install --check`: verde; patches Expo alineados.
- Exports iOS y Android: verdes.
- `lib/vision.ts` invoca `read-menu`; la clave Anthropic vive del lado servidor.
- Maestro comprobó detalle y publicación completa hasta póster/Compartir.
- `credentials.json` fue retirado del índice de Git e ignorado.
- QA nativo vigente: magic link, cámara/galería, GPS, compartir, push y mapas.

### Único bloque externo para lectura IA

Seguir `supabase/functions/README.md`: desplegar `read-menu`, guardar
`ANTHROPIC_API_KEY` como secreto y rotar la antigua clave pública. El código local
está terminado, pero la lectura de fotos no debe declararse operativa en producción
hasta completar ese despliegue y probar una fotografía real.

### Primera frontera de reconstrucción

Se conserva:

- `lib/controllers/`, `lib/db.ts`, `lib/auth.ts`, `lib/patios.ts` y servicios.
- esquema Supabase y modelos funcionales actuales;
- assets, marca, paleta y comportamiento real de los flujos.

Se puede reemplazar gradualmente:

- composición de pantallas;
- navegación visual y componentes compartidos;
- tokens, jerarquía, estados visuales y motion.

La primera pantalla maestra será Entrada o Explorar, elegida tras cerrar el contrato
visual mínimo. Patio Vivo debe permanecer recuperable durante todo el trabajo.

## Estado vigente — 2026-07-07 (QA en device + plan de 4 frentes hacia MVP lanzable)

Leer esta sección primero. Abajo es bitácora.

### Contexto de la sesión

Alejandro recorrió la app completa en su iPhone (dev build reinstalada por cable hoy; la anterior ya no estaba). Dio DOS tandas de feedback por transcript de voz + screenshots. Se arreglaron muchas cosas (lista abajo) pero el cierre de sesión fue un **reencuadre importante**: dejar de hacer micro-fixes y ejecutar un plan de panorama completo. **Meta declarada: MVP funcional completo para lanzar.** Si no se logra aquí, Alejandro considera mover el trabajo a Figma Make (desaconsejado: Make exporta web, no RN, y es caro ajustando — learning Ciclo 5).

### EL PLAN APROBADO — 4 frentes (ejecutar en orden, Frente 1 primero)

**FRENTE 1 — Que el MVP camine de punta a punta (LO MÁS IMPORTANTE para Alejandro):**
1. **"Día vivo" demo:** los lugares de `lib/demo.ts` + `MOCK_PATIOS` deben **publicar HOY**: menús del día con precios, horarios abiertos a la hora real, 1-2 agotados a propósito. HOY los demo salen "SIN EXISTENCIA/AGOTADO/Precio pendiente" porque la ficha considera "vivo" solo lo publicado en Supabase.
2. **Búsqueda debe leer los menús demo/mock locales** — `searchLiveMenus()` (`lib/menu.ts`) solo busca menús publicados en Supabase → "mole" no da resultados aunque Don Bonachón lo tenga en su `menu` local. Incluir los `patio.menu` locales en la búsqueda (solo DEV).
3. **"Cerrar sesión" no aparece en Cuenta Foodie** — está detrás de `hasSession` y en DEV no hay sesión. Alejandro lo reportó 2 veces.
4. **Historial: tres puntitos por menú → EDITAR** antes de reutilizar (hoy solo "reusar" directo).
5. **Criterio de salida:** recorrido Foodie completo (mapa → buscar "mole" → ficha viva → guardar → reseña) y Fondero completo (foto → publicar → póster → historial → editar/reusar) SIN callejones. Evidencia con capturas de simulador, no promesas.

**FRENTE 2 — LEY VERBAL NUEVA + barrido de copy:**
- **LEY (dictada por Alejandro, registrarla como regla dura):** PROHIBIDO el lenguaje comparativo "no es X, es Y" ("Esto no es un delivery…", "no es solo un menú…"). Es contaminación de identidad verbal. Se afirma lo que Patio ES, sin negaciones. Ya registrada en CLAUDE.md.
- Barrido de onboarding completo (slides con ese lenguaje + copy desactualizado "Las cocinas de tu barrio…"), empty states y ficha.
- **Viudas** con `noWidow()` en TODO el onboarding ("lo que se cocina hoy", "casi listo para avisarte…", "permitir notificaciones").
- Revisar la palabra "menú" donde no aplica: el puestecito de elotes no tiene menú, tiene *lo de hoy*.

**FRENTE 3 — Sistema de degradados/glass (una regla, no parches):**
- Onboarding: degradado imagen→negro "asqueroso", con corte visible (Figma Make lo tiene suave — comparar con `design-source/figma-make/v02`).
- Ficha (`patio/[id]`): el hero recorta la imagen con degradado negro NO uniforme, y hay una **pleca/banda fake** que se empalma con los textos a la altura del CTA "Avísame mañana" (ver screenshots del 7 jul). Verificar si el glass/blur está funcionando o es un LinearGradient mal parametrizado.
- Regla única de gradiente (más paradas de color, easing suave) aplicada a los 3 lugares.

**FRENTE 4 — Figma Make (en paralelo, lo lleva Alejandro; hay créditos de nuevo):**
- Armarle el paquete de tareas para Make: brief de **intro/onboarding** (candidato #1, la entrada actual le parece "asquerosa"), **póster** rediseñado (logo P no se distingue, espacio raro arriba-derecha; el "¿Qué hay hoy? Saaaaaaabes." abajo SÍ gustó), y **búsqueda viva** (en vez del blur muerto del mapa: planta creciendo / patios prendiéndose al escribir).
- Reparto confirmado: Make DISEÑA pantallas nuevas, el código se traduce aquí. NO pasar el código a Make.

### Hecho en esta sesión (2026-07-07, todo con tsc verde)

- **Dev build reinstalada** en iPhone por cable (`npx expo run:ios --device`, gratis, NO gastó build EAS). Gotcha: falló 1ª vez por "developer disk image could not be mounted" (iPhone bloqueado); reintentar con iPhone desbloqueado. iOS 26.5 + Xcode 26.3 funcionan.
- **Conexión iPhone↔Metro:** dev build abre pantalla "Development servers"; la URL guardada vieja (`10.0.0.25`) era de otra red — verificar IP actual con `ipconfig getifaddr en0` (hoy: `192.168.100.4`). Permiso de Red Local ya activo.
- **Toggle compartido** `components/toggle-switch.tsx` (accent del tema, ambos lados) — reemplaza Switch nativo desfasado (Fondero) y toggle verde iOS (Foodie).
- **Manifiesto**: enlazado en Cuenta + Mi Patio (estaba huérfano) y copy actualizado ("la fonda, la taquería, el puestecito de elotes…"; "Si tú eres quien cocina").
- **Póster**: "¿Qué hay hoy? Saaaaaaabes." juntos como firma (LEY de marca: nunca separados); claim suelto eliminado.
- **Historial/"usar menú anterior"**: `lib/menu-history.ts` — persistencia local AsyncStorage (tope 30) + merge con Supabase + `seedDemoHistory()` (3 menús demo en DEV).
- **Buscador explorar**: `autoFocus` (el `setTimeout(80)` perdía la carrera en device → sin teclado); tocar mapa cierra búsqueda; umbral 3 letras + debounce 300ms + no declarar "sin resultados" hasta tener respuesta; placeholder fijo "¿Qué hay hoy?"; viudas corregidas en empty state.
- **Cámara nativa** en foto-menu (`launchCameraAsync` + `allowsEditing`) — a Alejandro le gustó. **Galería sin recorte** (`allowsEditing` en galería invoca una UI propia de expo sobre PHPicker = el "recorte chafa"; el recorte nativo de Apple no es invocable ahí sin módulo nativo → selector puro y la visión lee la foto completa).
- **Datos sintéticos**: `lib/demo.ts` — 7 lugares variados (elotes, hamburguesas, mariscos, comida corrida, pozolería, repostería, jugos) + seed de guardados/vistos. Se inyectan vía `withDevPatios()` en `fetchPublicFonditas`/`fetchFonditaById` (`lib/patios.ts`), solo `__DEV__`. **INSUFICIENTE: les falta el "día vivo" (Frente 1).**
- **Tab bar auto-hide** cableada en historial y perfil.
- **DEV · Onboarding** botón en la entrada (para poder revisar el onboarding).
- **docs/ROADCONTROLLER.md** creado (mapa operativo, formato T1all) + referenciado como lectura #0 en CLAUDE.md.

### Pendientes fuera de los 4 frentes (registrados en TASKS.md)

- Nombrar menús en historial (default fecha+platillos, editable) — idea de Alejandro, le gustó mucho.
- Navegación simétrica total entre perfiles (decisión: UNA app hoy, dos al escalar — research Uber de Alejandro).
- Spinner de visión estilo ChatGPT.
- Guardados organizados por categoría/cercanía (ya hay datos demo).
- Decisiones pendientes de Alejandro: logo en póster, botonzote naranja de "Editar mi negocio".
- EAS Update (OTA) sin configurar — resolvería "última versión sin build" fuera de casa.
- Push de la rama: `git push -u origin v2-look-figma` (auth GitHub pendiente, lo corre Alejandro).

### Learnings operativos de la sesión (no repetir errores)

1. **No micro-fixes: panorama.** Alejandro lo dijo explícito. Trabajar por recorridos completos con criterio de salida, no por síntomas.
2. **Actualizar este HANDOFF en cada avance** — el contexto del chat se pierde (tokens); los docs son la memoria real.
3. La instalación por cable NO gasta builds EAS (es compilación local Xcode). El miedo a "gastar build" era por confusión de términos — explicar siempre qué tipo de build es.
4. Los transcripts de voz de Alejandro son el canal de feedback preferido (teclear le frustra). Procesarlos a checklist accionable.
5. En el sim/device DEV se entra sin sesión → todo lo que dependa de `fonditaId`/`hasSession` se comporta distinto que en producción. El modo demo debe cubrir esos huecos.

### Sesión 2026-06-21 — sesión larga, MUCHOS cambios. `tsc` verde. SIN COMMIT aún (Alejandro hace push).

**HITO: dev build instalada en iPhone real por cable + Fast Refresh.** Signing en Xcode configurado (Apple ID `dubzon@live.com.mx`, team `JK2N262L7X`, bundle `com.parcomx.patio`, "Automatically manage signing" ✅). Ya NO se necesita cable: el iPhone se conecta por WiFi (Xcode lo ve como "Parco", iPhone 15 Pro). **Flujo de trabajo montado:** Metro corre en la Mac (`npx expo start --dev-client --host lan`), Mac no se duerme con Claude Code abierto. Se trabaja en **simulador** (Claude le toma capturas directo) + **iPhone** (Alejandro cierra/abre la app para ver cambios — el Fast Refresh se va al simulador cuando ambos están conectados). Alejandro puede dirigir desde la app de Claude en el cel estando en la calle (no necesita la app cargada allá, solo escribirle).

**Bug barra de navegación (RESUELTO):**
- Dark mode: la barra usaba `variant === 'fondero'` para el color → salía blanca en oscuro. Ahora `bottom-tab-bar.tsx` lee `theme.isDark` (tema real); `variant` solo decide qué tabs muestra.
- Bug primer-tap: `BlurView` interceptaba el toque → `pointerEvents="none"`.
- Sensibilidad: `tab-bar-visibility.tsx` THRESHOLD 8→24, TOP_ZONE 4→24. Ya no reaparece con micro-scroll.

**Navegación pestañas-puras (modelo Instagram, criterio Apple HIG "un destino = un punto de entrada"):**
- **explorar (mapa):** quitados los botones flotantes Perfil 👤 y Guardados 🔖 (ya están en la tab bar) y luego también el ⛶ Expandir (Alejandro no le veía función). Mapa limpio: solo buscador + tab bar. Borrado el estado muerto `mapExpanded` + estilos `topBar/topRight/glassBtn`.
- **cuenta, favoritos, historial:** quitada la flecha "atrás" (son pestañas raíz, no llevan back). Bug de copy corregido: historial decía "Mi Patio" (título de Perfil) → "Historial".
- Padding inferior con insets (cuenta/favoritos `insets.bottom + 130`) para que la tab bar flotante no tape contenido.

**MODO CLARO/OSCURO en TODO el Fondero (decisión de producto de Alejandro: el toggle debe afectar AMBOS lados):**
- Antes el Fondero era SIEMPRE oscuro (constante `DARK` hardcodeada en 6 pantallas). Ahora respeta `theme.isDark`.
- **`lib/fondero-palette.ts` (NUEVO):** `fonderoPalette(isDark)` → DARK (idéntica a la original, no rompe el diseño oscuro de Figma) + LIGHT (reutiliza tokens claros del Foodie). Una sola fuente de verdad.
- Convertidas a `makeStyles(c)`: menu (Hoy), historial, perfil, menu-editar, foto-menu, preview. El **bloque de precio de menu-editar se preservó** (regla CLAUDE.md). El **póster de preview es SIEMPRE claro** (imagen de marca que se comparte, no cambia con el tema) — solo el chrome sigue el tema.
- **Toggle "Modo oscuro" agregado en Mi Patio (perfil Fondero)** — antes solo existía en Cuenta (Foodie), por eso quedabas atrapado. Ahora se cambia desde ambos lados.

**ESTADÍSTICAS VIVAS (feature nueva, idea de Alejandro):**
- `lib/stats.ts` ya existía (registraba vistas únicas). **Extendido** a lista ordenada por recencia (más reciente primero, tope 100, compatible con datos viejos). Nuevo export `getViewedPatioIds()`.
- **`app/vistos.tsx` (NUEVO):** pantalla "Lo que viste" — lista navegable de cocinas abiertas, cada una entra a su ficha. Estado vacío cuidado. Registrada en `_layout`.
- En **cuenta.tsx** la stat "Lugares vistos" ahora es REAL (no el 12 de ejemplo) y es **tocable** → abre `/vistos`. "Guardadas" ahora abre `/favoritos`.

**SISTEMA DE HEADER (empezado, NO propagado — pendiente validación de Alejandro):**
- **`components/collapsing-header.tsx` (NUEVO):** patrón Large Title estilo WhatsApp/iOS. `CollapsingHeader` = barra compacta flotante (blur + título pequeño + back/acciones) que aparece al scrollear; `CollapsingTitle` = título grande que vive en el scroll y se desvanece al subir. Animación por interpolación de `scrollY` (`useNativeDriver: true`).
- **Integrado SOLO en `vistos.tsx`** como prueba. Se ve bien en reposo. **Falta que Alejandro pruebe el colapso scrolleando** antes de propagarlo a las 9 pantallas con header grande (Hoy, Historial, Mi Patio, Editar, Cuenta, Guardados, etc.).

**PENDIENTES DE DISEÑO (Alejandro los reportó viendo la app en su iPhone — orden de prioridad que él pidió):**
1. **Header system** — validar el colapso en `vistos` y si gusta, PROPAGAR a toda la app (era lo que estaba en curso al cerrar). Inspiración: animación de headers de WhatsApp (botones superiores que se mueven/desaparecen al scrollear).
2. **Horario por día (perfil-editar.tsx) — LO MÁS ROTO.** Interfaz confusa: no se entiende si editas el horario general o el de un día específico, ni cuándo se guardó uno. **Falta feedback al guardar** (el botón "Guardar cambios" no desaparece ni confirma nada → viola Apple HIG 3.2 Feedback, ver `docs/design/foundations/ESSENTIAL_DESIGN_PRINCIPLES.md`). Rediseñar la interfaz completa.
3. **Póster/menu (preview.tsx + menu) — jerarquía.** A Alejandro NO le gusta la jerarquía del menú: muy espaciado, lista plana. Quiere **agrupar por tiempos** (1er tiempo, 2do, postre, bebidas), más compacto y sutil. Aplica a preview Y al menu.
4. **"Usar menú anterior" (menu.tsx → historial)** — no se ve que haya menús anteriores; debería abrir una **vista previa** de cada uno antes de reutilizarlo.
5. **Onboarding sheet "Ponle nombre a tu negocio"** (hint en perfil-editar) — no le gusta, rediseñar/quitar.
6. **Organización de Guardados (a futuro, en el radar)** — cuando un Foodie tenga ~70 guardados, la lista plana no escala. Necesitará filtros/agrupación/búsqueda (por zona, "abierto hoy", tipo, etc.). No urgente, pero diseñar favoritos/vistos pensando en que crecerá.

**Nota de método:** el video de WhatsApp que mandó Alejandro (`~/Downloads/WhatsApp Video...mp4`) mostraba WhatsApp navegando en sí mismo, no Patio — pero la referencia es clara: el patrón Large Title de iOS (header que colapsa al scrollear). Claude no puede VER video reproducido, solo frames extraídos con ffmpeg o screenshots.

**PENDIENTE INMEDIATO — lo corre Alejandro:**
1. **PUSH:** `git push -u origin v2-look-figma` (sigue sin resolver auth GitHub; no bloquea build).
2. Probar en device/sim los cambios de hoy, sobre todo el modo claro Fondero en oscuro (debería verse igual que antes — se preservaron los valores DARK).

---

## Estado previo — 2026-06-20 (Auditoría UX + copy + barra Instagram)

Bitácora abajo.

### Sesión 2026-06-20 — Auditoría heurística + limpieza de copy

**2 commits nuevos en `v2-look-figma` (`2b3f435`, `19387eb`), SIN PUSH.** Sumados a los previos (rama aún no existe en origin). tsc verde, lint limpio.

**Auditoría heurística (Nielsen) hecha como auditor externo.** Hallazgo #1 (no resuelto a propósito): la app muestra DATOS FALSOS hardcoded (312 vistas, +18%, 142 reseñas, 420m, "3 viendo"). Alejandro decidió dejarlos por ahora (sirven para ver el flujo, fáciles de cambiar). **Pendiente real antes de usuarios reales: conectarlos o quitarlos.**

**Limpieza de copy (commit `2b3f435`) — roles de código fuera de pantalla:**
- "Foodie sin nombre" → "Tu cuenta"; "fonditas vistas" → "lugares vistos" (cuenta).
- "foodies vieron tu menú" → "personas vieron tu menú" (historial).
- "otros foodies" → "quien anda buscando" (reseña).
- "Explorar comida" → "Explorar cocinas" (index, unifica). "¿Solo buscas comida?" → "algo rico" (fondero-acceso).
- Auditoría confirmó: el manifiesto SÍ respeta la identidad verbal (no estaba mal).

**Fixes UX (commit `19387eb`):**
- **Barra inferior estilo Instagram:** compacta, centrada, solo íconos (sin labels). Fix del bug de toques: el transform usaba useNativeDriver:true y el área tappeable no seguía a la barra (primer tap en zona muerta) → ahora useNativeDriver:false.
- **explorar:** placeholder "¿Qué hay hoy?"; quitado el micrófono "Próximamente" (idle + búsqueda).
- **Cambio de rol sin logout:** perfil Fondero → "Explorar cocinas". DECISIÓN: una app por ahora, separar Foodie/Fondero al crecer (modelo Uber). Ver memoria one_app_vs_two.
- **Consistencia:** "Mi Patio" = exclusivo Fondero; Foodie usa "Cuenta".
- **Editores protegidos:** menu-editar y perfil-editar confirman "¿Descartar cambios?" al salir. menu-editar no publica vacío + avisa si Supabase falla.

**PENDIENTE INMEDIATO — lo corre Alejandro (TTY/token, Claude no puede):**
1. **PUSH:** `git push -u origin v2-look-figma`. OJO: falta resolver auth de GitHub (no hay token guardado; el push falla con "could not read Password"). NO bloquea el build — EAS compila desde local, no desde GitHub.
2. **BUILD TestFlight:** `eas build -p ios --profile production --auto-submit` (logueado como parcomx, eas.json verificado).
3. **Ver estado:** `eas build:list --platform ios --limit 1`.

**Hilos abiertos (memoria open_ux_threads):** mailing template sin instalar en Supabase; rediseño del mapa (vago, pendiente de aterrizar); liquid glass nativo (dejado fuera, frágil en Expo).

---

## Estado previo — 2026-06-19 (Horario semanal + fixes barra/explorar)

Bitácora abajo.

### Sesión 2026-06-19 — Horario por día + pulido UX

**2 commits locales en `v2-look-figma`, SIN PUSH** (`0341e1a`, `7a16361`). Sumados a los 20 previos que tampoco están en origin (la rama NO existe en remoto → primer push con `-u`). tsc verde, lint limpio.

**Feature grande — Horario semanal por día (commit `7a16361`):**
- Antes el horario era un solo rango para toda la semana (string en columna `horario`). Ahora soporta horario por día con excepciones (caso real: "L–V hasta 7pm, fin de semana hasta 3am") y cierres de madrugada.
- **`lib/horario.ts` (nuevo):** modelo de 7 días (jsonb), cruce de medianoche, `estaAbiertoAhora`, `proximaApertura`, `resumenHorario`/`resumenHorarioFilas`. **CDMX corregido a UTC-6** (el código viejo usaba UTC-5, bug).
- **Migración SQL `supabase/migrations/20260619_add_horario_semanal.sql`** — columna `horario_semanal jsonb`. **YA CORRIDA en Supabase Dashboard por Alejandro** (conserva `horario` text para compat).
- **Editor (`perfil-editar.tsx`) estilo Apple/Resy:** cápsulas base Abre→Cierra + fila de 7 chips (L M M J V S D, punto naranja = excepción) + barra contextual (Igual que el resto / Cerrado / Listo). Resumen agrupado por bloques (no listota). **Botón Guardar ahora es barra fija abajo (glass)** en vez del pill perdido en el header. Editar el base respeta las excepciones.
- **Ficha Foodie (`patio/[id].tsx`):** estado abierto/cerrado con horario semanal (fallback legacy), "Abierto · rango de hoy", "Cerrado · Sáb abre a las…", share con resumen.

**Fixes UX (commit `0341e1a`):**
- **Tab bar:** reset de `lastY` en `reveal()` (ya no hereda el scroll de la pantalla anterior → ocultar/reaparecer estilo Facebook ahora sí funciona). `_layout` con `animation: 'fade'` 160ms (antes `'none'`, no se percibía la navegación al tocar tab).
- **explorar:** eliminados los RADAR_DOTS (la "peca" naranja a media pantalla) + su código muerto. Buscador centrado limpio, sin título redundante sobre el mapa.

**Supabase (decisión 2026-06-19):** proyecto en org "Parco Apps" / "lafondita" / cuenta contacto.parco. Plan Free pausa por inactividad → dar "Resume" (restaura todo, benigno). NO migrar de cuenta todavía (ver memoria supabase_project).

**PENDIENTE INMEDIATO — lo corre Alejandro (TTY/token, Claude no puede):**
1. **PUSH:** `git push -u origin v2-look-figma` (22 commits).
2. **BUILD TestFlight:** `eas build -p ios --profile production --auto-submit`. eas.json ya tiene perfil `production` (autoIncrement) + submit con ascAppId 6760884735. Verificado.
3. **Ver estado:** `eas build:list --platform ios --limit 1`.

**QA en TestFlight cuando llegue:**
- Horario: marcar días distintos, guardar, salir/entrar → confirmar que persiste.
- Magic link: el correo aún llega genérico en inglés (template Patio sin instalar en Supabase, `supabase/templates/README.md`).
- Confirmar que el proyecto Supabase no se volvió a pausar.

---

## Estado previo — 2026-06-18 (TestFlight + UX Foodie/Fondero + tab bar Facebook)

Bitácora abajo.

### Sesión 2026-06-18 — primer build en device + tanda de fixes UX

**7 commits locales en `v2-look-figma`, SIN PUSH** (la rama NO existe en origin todavía → primer push con `-u origin v2-look-figma`). El push pide token de `patioquehayhoy` (no hay TTY en el entorno de Claude; lo hace Alejandro).

**HITO: primer build de Patio instalado en iPhone real (preview, install link).** Pasos que costaron y quedaron resueltos:
- Push notifications: el build fallaba ("provisioning profile doesn't support Push / falta aps-environment"). Causa: app usa `expo-notifications`. Fix: aceptar el **Apple Program License Agreement** (estaba pendiente → bloqueaba crear la Push Key) + `eas credentials` configuró push.
- iPhone registrado en EAS (UDID `00008130-000614960E12001C`) vía `eas device:create` → Website → QR.
- Build `eas build -p ios --profile preview` interactivo (seleccionar Mac + iPhone en el ad-hoc).
- `eas` logueado como **parcomx** (contacto.parco@gmail.com); Apple ID dev **dubzon@live.com.mx**, team **JK2N262L7X**.

**Fixes UX de esta sesión (commit `d82bddc`, todo en simulador, tsc+lint verdes):**
- **Tab bar estilo Facebook** (`lib/tab-bar-visibility.tsx` + `bottom-tab-bar`): se oculta al scrollear abajo, reaparece al jalar arriba; siempre visible cerca del tope y al cambiar de pestaña. Provider en `_layout`, `onScroll` enchufado en menu/historial/perfil/favoritos/cuenta.
- **fondero-acceso**: quitado `autoFocus` (ya no salta el teclado tapando la info) + fondo al 70% con gradiente de 4 stops (elimina la línea dura de corte).
- **explorar**: ELIMINADOS los HintSheet de bienvenida (la "peca" fea antes del mapa).
- **foodie-loading**: el loading del mapa pasó de la peca naranja con ondas a un arco giratorio sobrio.
- **cuenta/notifications**: fix toggles que "rebotaban" a apagado → ahora la preferencia se guarda siempre, el permiso se pide en best-effort sin revertir el switch.
- **index**: acceso Fondero sin magic link en `__DEV__` ("Publicar mi menú" → `/menu`).

**Antes (commit `4842d3d`):** rediseño Mi Patio (hero+avatar, stats, racha), Editar mi lugar (IDENTIDAD/HORARIO/PAGOS/CUENTA, quitado "tipo de cocina" + su lógica), Historial (fix número recortado lineHeight), fix tab bar navegación intermitente (quitado guard `if(!active)`).

**PENDIENTE INMEDIATO (mañana):**
1. **PUSH**: `git push -u origin v2-look-figma` (7 commits). Token de patioquehayhoy. Alejandro.
2. **Dev build local en iPhone para ver cambios EN VIVO** (Fast Refresh en el cel, sin rebuild): quedó a medias. `npx expo run:ios --device 00008130-000614960E12001C` falla con "No code signing certificates". Falta configurar **signing en Xcode**: abrir `ios/Patio.xcworkspace` → target Patio → Signing & Capabilities → ✅ Automatically manage signing → Team (Add Account con Apple ID dubzon@live.com.mx). Una vez firmado, `expo run:ios --device` compila e instala por cable. ALTERNATIVA: `eas build --profile development` (nube, sin Xcode).
3. **Mapa/explorar** (necesita ojo de Alejandro en device/sim): iconos flotantes (perfil/favoritos/expandir) no alineados con el estilo de la app; el pin/peca que sale sobre "se acabó" (cuando algo está cerrado) — decidir si naranja o hover. NO rediseñado aún.
4. **Template de email** sigue sin instalarse en Supabase (`supabase/templates/README.md`).
5. **"Sin correo"** en Editar mi lugar: aparece porque se entra por DEV (sin login real). En device con magic link debería cargar el correo — verificar.

**ROADMAP (orden sugerido):**
- A. Cerrar el **dev build en device** (signing Xcode) → iterar diseño en vivo en el cel.
- B. **Mapa/explorar**: rediseño de iconos + estados de pin (lo más flojo del lado Foodie).
- C. **TONO/REDACCIÓN** de splash/onboarding (POSPUESTO a propósito — primero diseño, luego copy).
- D. **Backend de notificaciones**: el toggle "avísame cuando publiquen" hoy solo programa un recordatorio LOCAL a la 1pm; el push real (cuando un fondero publica) + geofencing de "sugerencias cercanas" necesitan servidor. Feature futura.
- E. Instalar template de email en Supabase + QA del magic link real en device.
- F. Build de TestFlight (production + auto-submit) cuando el bloque esté pulido y probado.

---

## Estado previo — 2026-06-17 (recorrido completo + limpieza + login/mailing)

Leer esta sección antes del historial. Las secciones antiguas abajo son bitácora y pueden contener pendientes ya resueltos.

### Sesión 2026-06-17 (tarde) — Recorrido completo de pantallas + cierre login/mailing

**4 commits locales SIN PUSH.** El recorrido + login/mailing se commiteó en `19444eb`. El arreglo del botón Soporte (abajo) está SIN COMMIT en el working tree. Todo en local, nada de push.

**Recorrido completo de las 19 pantallas** (auditoría por código + 2 capturas en simulador). Veredicto: la mayoría ya estaba look Figma. Lo suelto se arregló. **Ninguna huérfana, ninguna ruta rota, tsc verde, lint sin errores.**

**Limpieza verbal + bugs (hecho):**
- **HintSheet** (`components/hint-sheet.tsx`): el `icon` era emoji (🗺️) renderizado como `<Text>` → sin glyph salían cuadros `?`. Cambiado a **Ionicons** en badge naranja (`accentSoft`). El prop `icon` ahora es `keyof Ionicons.glyphMap`. **Confirmado en simulador.**
- **explorar**: copy genérico del hint de bienvenida ("Patio / Descubre qué hay de comer cerca") → **"¿Qué hay hoy?"** + tono verbal. Ambos hints (`foodie_welcome`, `foodie_explorar`) alineados.
- **manifiesto**: quitado "Para fonderos" + copy marketing → "Si tienes una cocina", humano, cierre `Saaaaaaabes.`
- **push-prompt**: "cuando tu fonda publica" → "cuando publiquen el menú de hoy".
- Dato semilla **"Fonda Lupita" → "Cocina de Lupita"** (perfil, preview, menu-editar). Quita la palabra paraguas "Fonda" de pantalla.
- **foto-menu** registrado en el `Stack` de `_layout` (estaba sin registrar, funcionaba por archivo).
- **menu-publicado**: quitado un `LinearGradient` transparente muerto + su import.

**Botón que mentía — arreglado (SIN COMMIT):**
- **`perfil.tsx` (Mi Patio) → fila "Soporte"**: el `onPress` iba a `/perfil-editar` aunque el sub prometía contacto. Alejandro lo detectó NAVEGANDO (no se ve leyendo una pantalla suelta, hay que recorrer). Ahora abre **correo** (`mailto:quehayhoy.patio@gmail.com`), sub = "Escríbenos por correo". Quitado el `SUPPORT_PHONE` placeholder (`525500000000`).
- **Decisión: soporte por correo, no WhatsApp.** Apple pide URL de soporte (un correo basta); Google Play exige email de contacto (ya está), teléfono opcional. No hace falta número.
- **Pasada estática anti-"botón mentiroso"**: `grep` de filas cuyo `sub` promete WhatsApp/correo/mapa pero `onPress` va a ruta interna. Resultado: solo Soporte mentía en toda la app. Método barato (sin abrir sim) para cazar esta clase de bug.

**Método de trabajo acordado (importante):** Claude en Claude Code NO recorre la app tocando botones — ve código y screenshots sueltos, no el FLUJO. Por eso bugs de navegación (Soporte→Perfil) se le escapan aunque tenga el archivo enfrente. Reparto: **Figma Make diseña el look** (tiene render en vivo), **Alejandro navega y reporta en una frase**, **Claude arregla por código + traduce diseños de Figma a RN**. El rediseño de la ficha "Mi Patio" (se ve mal) va a Figma Make, no a Claude redibujando a ciegas. Ver memoria [[sim_deeplink_fragile]].

**Login + Mailing (lo que faltaba — hecho):**
- **`login-callback.tsx`** ("Verificando link…"): era beige viejo `#F5E9D9` → ahora oscuro `#111214` + glow naranja, consistente con flujo Fondero. **Lógica de auth intacta** (solo el render).
- **Template de email**: NO existía en el repo (Supabase mandaba su default en inglés). Creado **`supabase/templates/magic-link.html`** con marca Patio (botón naranja, P, `Saaaaaaabes.`, variables `{{ .ConfirmationURL }}` / `{{ .Email }}`) + `supabase/templates/README.md`. ⚠️ **NO se instala solo — Alejandro lo pega en Supabase Dashboard → Auth → Email Templates → Magic Link Y Confirm signup** (signInWithOtp con shouldCreateUser:true manda el de signup la 1ª vez).
- **Pantalla FonderoMagicLink**: creada **`app/fondero-acceso.tsx`** (captura de correo oscura + botánica, 3 beneficios, estado "revisa tu correo"). Enganchada desde index ("Publicar mi menú") y cuenta ("¿Tienes una cocina?"). Registrada en `_layout`.
- **`index.tsx` limpiado**: borrado ~110 líneas de código muerto (el formCard de login viejo, el estado `intent='business'`, `showAuthError`, imports y estilos huérfanos). Ahora index solo es la pantalla de elección.

**PENDIENTE (próxima sesión):**
1. **PUSH**: ya son 3 commits + handoff + estos cambios sin commitear. `git push origin v2-look-figma` (la rama NI EXISTE en origin todavía → primer push con `-u`). Solo Alejandro (credenciales).
2. **Instalar el template de email en Supabase** (ver `supabase/templates/README.md`). Sin esto, el correo magic-link sigue saliendo genérico en inglés.
3. **Ojo humano sobre `fondero-acceso` y `login-callback`** en simulador — NO se pudieron capturar por la fragilidad del deep-link del dev client a rutas Fondero. Compilan bien; falta verlas navegando a mano (tocar "Publicar mi menú" desde el inicio).
4. **Warnings de lint preexistentes** (no de esta sesión): `useMemo` sin usar en menu-editar, `SUPPORT_PHONE` sin usar en perfil. Menores.

---

### Sesión 2026-06-17 — Cierre Fondero (3 commits locales, SIN PUSH)

**Commits locales en `v2-look-figma` (falta `git push origin v2-look-figma` — entorno sin credenciales):**
- `8e2372f` Reconstrucción flujo Fondero look Figma + features Foodie
- `342b287` foto-menu idle look Figma + limpiar share huérfana
- `b19f515` preview → MenuPoster look Figma (póster compartible)

**Cerrado esta sesión:**
- **foto-menu (idle)** redISeñado: header back→Hoy, eyebrow, card foto héroe degradado naranja (consistente con "Hoy"), galería discreta. Estados processing/review/saved quedaron oscuros OK.
- **share.tsx BORRADA** (huérfana confirmada, nadie la navegaba) + quitada de `_layout`.
- **preview.tsx → MenuPoster**: póster vertical de marca (P + "¿Qué hay hoy?" + fecha + nombre negocio + menú + "Saaaaaaabes."), chrome oscuro, botón verde "Compartir en WhatsApp", captura como imagen (captureRef + Sharing). Back→Hoy. Lo usa `menu-publicado`.
- **Rutas rotas: NINGUNA** (verificado). tsc verde en todos los commits.

**PENDIENTE (próxima sesión):**
1. **PUSH**: `git push origin v2-look-figma` (3 commits esperando). Solo Alejandro (credenciales).
2. **Recorrido visual de TODAS las pantallas** en simulador — cazar viejas voladas. Método: Alejandro navega, Claude arregla. (Claude verifica tsc, no el look — por eso se cuelan viejas.)
3. **Lado Foodie se siente parchado** — aplicar criterio limpio+verbal. Sospechoso: el buscador de inicio (explorar) con los puntos cargando. Revisar explorar/favoritos/cuenta/ficha a fondo.
4. **Simulador se apaga solo seguido** — molesto pero no bloqueante; rebootear con `xcrun simctl boot` + abrir con URL localhost (la IP de WiFi cambia, usar localhost siempre).

### Sesión 2026-06-16 — Reconstrucción look Figma

**Aprendizaje clave (ver memoria `figma_exact_not_maquillaje` + `verbal_overrides_figma`):**
Alejandro detestó el primer intento porque MAQUILLÉ las pantallas viejas (fondo oscuro encima) en vez de reconstruir. Se sentía "Frankenstein". Decisión: **reconstruir desde cero, no parchar.** Y: **el lenguaje verbal (IDENTITY_VERBAL.md) MANDA sobre el copy de Figma** — Figma usa "Fonda"/"Fondero" que VIOLAN las reglas. NUNCA esas palabras en pantalla.

**Flujo Fondero reconstruido limpio:**
- TabBar = pill flotante glass: **Hoy / Historial / Mi Patio** (NO "Fonda").
- **`menu.tsx` = pantalla "Hoy"** (elección): foto HÉROE (card naranja "Patio lo lee por ti") + Escribir + Menú anterior.
- **`menu-editar.tsx`** = editor de platillos (toggle precio único/por platillo, $55 ±, pills sección, datos Lupita). Back → Hoy. Publicar → `menu-publicado`.
- **`historial.tsx`** = 312 foodies + chart + menús pasados.
- **`perfil.tsx`** = "Mi Patio" (hero foto + racha 14 días + filas). Filas → `perfil-editar.tsx` (editor rediseñado).
- **`menu-publicado.tsx`** = Success ("Tu menú está vivo" + 3 viendo).

**Estado por pantalla (inventario):**
- 🆕 reconstruidas look Figma oscuro: menu (Hoy), menu-editar, historial, perfil, perfil-editar, preview, foto-menu*, menu-publicado.
- ✳️ Foodie con tokens nuevos: explorar, favoritos, cuenta, patio/[id], onboarding, push-prompt, resena/[id].
- ⚠️ **VIEJAS / por revisar:** `foto-menu.tsx` (es la vieja con fondo oscuro — NO tiene look Figma, "Toma foto/Elegir galería" es legacy), `share.tsx` (HUÉRFANA, ya no se navega), `preview.tsx` (compartir viejo, sacado del flujo).

**PENDIENTE INMEDIATO (próxima sesión):**
1. **foto-menu.tsx**: rediseñar exacto a Figma (hoy es la pantalla vieja parchada que Alejandro detectó).
2. **Probar el flujo completo de TODAS las pantallas** en simulador — cazar más pantallas viejas voladas.
3. **Borrar huérfanas**: `share.tsx`, y decidir `preview.tsx` (¿se usa para compartir póster o se reemplaza por MenuPoster?).
4. **Lado Foodie se siente parchado** (buscador inicio con puntos cargando) — aplicar mismo criterio limpio+verbal.
5. **PUSH pendiente**: commit 8e2372f está local, falta `git push origin v2-look-figma` (el entorno no tiene credenciales).

---

## Estado previo — 2026-06-14

Leer esta sección antes del historial. Las secciones antiguas abajo son bitácora y pueden contener pendientes ya resueltos.

### Diseño — Figma Make (Ciclo 5, activo)

- El rediseño visual de Patio se hace en **Figma Make** (lienzo web, Claude compone el UI). Reemplaza el handoff a "Claude Design".
- Exports congelados en `design-source/figma-make/`: **v01** (2026-06-12, base) y **v02** (2026-06-14, ajustes de menú). Conviven, no se reemplazan. Registro en `VERSIONS.md`. **Aislados del build** (Metro/TS/ESLint los ignoran).
- El export es **web (Vite/React/Tailwind), NO React Native** → se **traduce** a `.tsx`, no se pega.
- **DECISIÓN 2026-06-14: dejar de iterar en Figma Make, cerrar el diseño AQUÍ (en código).** Figma es bueno para GENERAR, malo y carísimo para AJUSTAR (1,000 créditos comprados se vaciaron en ajustes de menú que ni quedaron bien). El pulido fino se hace sobre el export/código, gratis. Ver `cost_tracking` en memoria + `docs/COSTOS.md`.
- **Identidad verbal documentada:** `docs/design/foundations/IDENTITY_VERBAL.md` — modelo de nombres estilo Uber (no "fonda/fondero" paraguas), anti-IA, tono por pantalla, par de marca "¿Qué hay hoy? Saaaaaaabes.". Incluye §8 brief para pegar en Figma.
- **Estado del diseño: ~90%.** Falta cerrar menú + compartir + limpiar copy "fondero/a". Se cierra en código, no en Figma.

### Trabajo de esta sesión (2026-06-14) en v02 — sin commitear

- **Modelo de precio del menú reescrito** en `v02/src/app/data/menu.ts`: antes `priceMode: "fixed"|"perItem"` (excluyente). Ahora **`dayPrice` (precio del día, opcional) + `price` por item (extra a la carta) coexisten** — refleja fonditas reales (comida corrida $55 + extras a la carta). Decisión de producto de Alejandro.
- **Editor del Fondero** (`FonderoPublish.tsx`): quitado el toggle de modo de precio; precio del día opcional + precio por platillo siempre disponible. Borrado código muerto (`PriceModeTab`). UX "lo más simple posible".
- **`MenuCard.tsx`**: compatible con el nuevo modelo (muestra precio solo en extras).
- Verificado: cero referencias rotas a campos viejos en todo v02.
- **Pendiente inmediato:** cerrar "compartir" (`MenuPoster.tsx`) y limpiar copy "fondero/a".

### Decisiones visuales 2026-06-15 (tras revisar v02 corriendo en navegador)

Alejandro revisó TODAS las pantallas de v02 (levantadas como web local con `npm run dev` en `design-source/figma-make/v02/`). Veredicto: **le encanta el diseño tal cual.** Decisiones:

- **Meta:** la app real (ya en TestFlight, builds 42–45) debe **VERSE como Figma v02**. La función del menú YA existe en código (`app/menu.tsx` + `lib/menu-store.ts`, con precio por sección + por platillo + Supabase). NO se reconstruye — solo se aplica el look. Trabajar en **rama nueva**.
- **Prioridad de traducción: el LOOK GENERAL** — glass, degradados, hero con flores botánicas, tipografía editorial extrema (SF Pro 800/400), naranja con intención.
- **Naranja confirmado:** `#F2612F` light / `#FF6A3D` dark (ya es el oficial en `lib/colors.ts` y la biblia; lo que se ve "raro" es por degradados encima, no el token).
- **Fix del editor de menú (`menu.tsx`):** Alejandro tiene TOC con el scroll largo del editor "Menú de hoy". Solución acordada: **agrupar platillos por sección** (Entrada/Guisado/etc.) en filas compactas en vez de tarjeta gigante por platillo → menos scroll. (La barra de scroll fea que vio es del navegador/Vite, NO de iOS real — en RN no se ve así.)
- **Recurso clave en v02:** `TokenExport.tsx` trae tokens listos para RN/NativeWind (paleta, espaciado base-4, radios chip14/card18/sheet28/phone44, motion specs) + lista de **11 componentes base que cubren el 90% de la app** (ButtonAccent, ButtonInk, ButtonGlass, ChipFilter, GlassCard, MenuRow, CourseInput, PinPrice, BottomSheet, StatusDot, EyebrowLabel). Usar como puente Figma→código.

### Sesión de código 2026-06-15 — rama `v2-look-figma`

Rama nueva desde `v2-menu-vivo`. Trabajo: aplicar el look de Figma v02 a la app real, recorriendo el **flujo Foodie en orden** (no pantallas sueltas). App corre en simulador iOS (Expo Go, puerto 8081, bundle `com.parcomx.patio`).

**Hecho y commiteado:**
- **Fase 1 tokens** (`lib/colors.ts` + `lib/theme.tsx`): paleta homologada a Figma (ink #111214, ink-soft #4A4A47, borde translúcido, bgDark #0A0B0D, glass, accentSoft #FBE7DD). Escalas nuevas exportadas: `Radius`, `Spacing`, `Type`, `Motion`. Sin colores hardcodeados sueltos → se propaga a toda la app.
- **index.tsx**: quitada la grid DEV (entrada limpia) + botón con presencia.
- **patio/[id].tsx (ficha Foodie)**: rediseño completo tal cual Figma — hero 300px con degradado (placeholder), nav glass, card traslapada, estado dot verde, título 36, meta row, **menú agrupado por sección** (resuelve TOC), CTA sticky. Lógica intacta (Supabase, favoritos, rating, mapa).
- **explorar.tsx**: ajustes (sheet radius 28, precio en naranja).
- **onboarding.tsx**: reescrito tal cual Figma `FoodieOnboarding` — 3 slides, hero botánico REAL (imágenes en `assets/hero/botanica-N.png`, copiadas de `assets/artes/`), eyebrow naranja, título 36, dots animados spring, botón. Copy corregido por identidad verbal (slide 2 = "Lo que se cocina hoy", sin "en su voz"; "cocinas/lugares" no "fonditas").

**Imágenes:** 8 fotos botánicas (dahlias sobre fondo oscuro, formato vertical) en `assets/hero/botanica-1..8.png`. Sirven para heros de onboarding, ficha y estados.

**Reglas de trabajo acordadas con Alejandro (2026-06-15):**
1. **Replicar Figma TAL CUAL**, sin mezclar lo viejo con lo nuevo.
2. **Si una pantalla difiere de Figma o no existe igual → PREGUNTAR**, no inventar/mezclar.
3. El **copy se rige por `IDENTITY_VERBAL.md`**, no por el copy viejo de Figma (que tiene anti-IA como "en su voz").

**PENDIENTE (próxima sesión, en orden del flujo Foodie):**
1. **Enganchar onboarding como first-launch real** — hoy NO se muestra solo (ningún check de `ONBOARDING_KEY` en el arranque; `_layout` o `index` debe redirigir a `/onboarding` si no está visto). Verificar antes de dar por cerrado.
2. **Enchufar foto botánica real** en el hero de `patio/[id]` (hoy es degradado placeholder).
3. **index.tsx (inicio/login) tal cual Figma** — OJO: la app mezcla inicio+login en un archivo; Figma los tiene separados (FonderoLanding oscuro, FonderoMagicLink, MagicLinkEmail). Decidir estructura con Alejandro.
4. **favoritos.tsx** (guardados) y **cuenta.tsx** tal cual Figma → cierran el flujo Foodie.
5. Luego flujo Fondero: foto-menu, menu (fix TOC agrupar), preview/share (MenuPoster), perfil.

### Hecho

- Supabase está conectado para `fonditas`, `menus` y `cartas`.
- Fondero puede crear/editar menú y publicarlo en Supabase.
- Foodie puede ver menú real desde `patio/[id]` vía `fetchMenuForFondita()`.
- `favoritos.tsx` y fallback de fonditas reales ya usan Supabase.
- `explorar.tsx` tiene radar de antojo, búsqueda inline, suggestion pills y sheet solo con intención.
- `buscar.tsx` no es flujo visible del MVP; recupera hacia `/explorar`.
- Migración `lat/lng` y tablas `menu_sections` / `menu_items` ya fueron aplicadas.
- Fuente activa de marca: Plus Jakarta Sans 800ExtraBold vía `Fonts.brand`.

### Pendiente real

1. **Cerrar el diseño en Figma Make** (Alejandro, en progreso) → luego traducir pantalla por pantalla a `.tsx`.
2. QA en dispositivo: magic link, cámara/galería, GPS y flujo Fondero -> Foodie completo.
3. Registrar UDID de iPhone si se requieren builds internos.
4. API key Google Maps restringida antes de builds Android reales.
5. Paleta cerrada: conservar `lib/colors.ts` (`#F2612F`/`#FF6A3D` como accent naranja). No introducir amarillo ni un segundo acento cálido — conciliar con tokens de `theme.css` al traducir.

### Screenshots

- Fuente vigente: `assets/screenshots/` + `docs/design/SCREENSHOT_INDEX.md`.
- `docs/design/screenshots/` no existe actualmente en el worktree.
- No usar paquetes de screenshots que no existan físicamente.

---

## 2026-05-15 (cierre — Supabase completo + búsqueda real + EAS build en progreso)

### Qué se hizo hoy

**Supabase schema completo:**
- `supabase/migrations/20260512_add_lat_lng.sql` — corrida en dashboard ✅
- `supabase/migrations/20260512_create_menu_tables.sql` — corrida en dashboard ✅

**lib/menu.ts — fetchMenuForFondita:**
- Lee `cartas` (carta permanente) primero, fallback a `menus` del día
- Convierte `MenuData` → `PatioMenuSection[]`

**patio/[id].tsx — menú real:**
- Al abrir ficha, llama `fetchMenuForFondita(patioId)`
- Si hay menú en Supabase, lo muestra sobre el MOCK vacío
- Fondero publica → Foodie lo ve inmediatamente

**favoritos.tsx — fonditas reales:**
- IDs no encontrados en MOCK_PATIOS se fetchean de Supabase via `fetchFonditaById`
- MOCK + Supabase mergeados en una sola lista

**explorar.tsx — organismo vivo:**
- Suggestion pills ("mole", "tacos", "agua de jamaica") aparecen a los 800ms con fade-in
- Desaparecen al buscar o seleccionar pin
- Tocar pill activa búsqueda con ese query

### Estado del flujo completo
- **Fondero**: escribe menú → guarda en Supabase (`menus`/`cartas`) ✅
- **Foodie**: abre ficha → ve menú real del fondero ✅
- **Explorar**: mapa limpio al inicio, suggestions ambient, sheet solo con intención ✅

### EAS Build histórico al cierre
- `eas build --platform ios --profile preview` corriendo en EAS cloud
- Credenciales: `dubzon@live.com.mx`, Team `JK2N262L7X`
- Device registrado: MacBook Pro UDID `00006000-000248482121801E`
- Cuando termine: link de instalación en expo.dev/accounts/parcomx/builds
- Instalar en iPhone via link o QR — probar flujo Fondero → Foodie completo

### Pendiente para mañana
1. **Verificar build** en iPhone — flujo completo: fondero sube menú → foodie lo busca y ve
2. **GPS en perfil** — probar "Marcar en el mapa" en dispositivo real (ya funciona con expo run:ios)
3. **API key Google Maps** para Android (no bloqueante para iOS)
4. **Registrar iPhone real** en EAS para próximos builds (ahorita solo está el Mac)

---

## 2026-05-11 (cierre — hints + Supabase completo)

### Qué se hizo hoy

**Sistema de hints contextuales** — implementado desde cero (los agentes nocturnos no commitaron):
- `lib/hints.ts` — AsyncStorage, `shouldShowHint` / `markHintSeen`, one-time por key
- `components/hint-sheet.tsx` — Modal bottom sheet con spring animation, backdrop dismiss, X button
- Wired en 4 pantallas: `perfil.tsx` (🏪 enfoca el TextInput de nombre), `menu.tsx` (📋 navega a foto-menu), `share.tsx` (✉️ dismiss simple), `explorar.tsx` (🍽️ dismiss simple)

**buscar.tsx — fonditas reales de Supabase**:
- Carga fonditas reales al montar con `fetchPublicFonditas()`
- Búsqueda por nombre/categoría normalizada (parallel a búsqueda de platillos en MOCK_PATIOS)
- Resultados mergeados sin duplicados, ordenados por score

**patio/[id].tsx — Supabase fallback**:
- `getPatioById` → si null → `fetchFonditaById` (nueva función en `lib/patios.ts`)
- Loading state con `AgentSpinner` mientras fetchea
- MapView oculto si `patio.latitude === 0`
- `fetchFonditaById` intenta con lat/lng; fallback sin ellos si migración no corrió

### ⚠️ Problema en Dev Fondero (Unmatched Route)
- Al presionar Dev Fondero puede aparecer "Unmatched Route" en `patio:///`
- **Causa**: hot reload de Metro confundido por los nuevos archivos añadidos
- **Fix**: presionar `r` en la terminal de Metro para forzar reload completo del bundle

### ⚠️ Migración Supabase — histórico, ya resuelta
```sql
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS latitude float8;
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS longitude float8;
```

### Decisiones importantes
- Hints son one-time via AsyncStorage — `markHintSeen` se llama síncronamente en el callback, el write a AsyncStorage es fire-and-forget (async, no bloqueante)
- `fetchFonditaById` tiene doble fallback: primero con lat/lng, si falla sin ellos — robusto vs migración pendiente

### Siguiente paso exacto
1. Reload Metro (`r`) para resolver Unmatched Route
2. Ejecutar migración Supabase (ALTER TABLE) para habilitar lat/lng
3. `npx expo run:ios` — rebuild nativo por expo-location

---

## 2026-05-10 (cierre — sesión Supabase + ubicación)

### Qué se hizo hoy

**explorar.tsx — auditoría tipográfica completa**:
- `fontWeight: '300'` agregado a: `selectedMeta`, `priceCaption`, `searchInput`, `listMeta`, `patioMeta`, `patioOpen`
- Inline `fontWeight: '900'` en número de índice movido a `s.indexNum` dentro de `makeStyles`

**explorar.tsx + lib/patios.ts — conexión Supabase (lista)**:
- `fetchPublicFonditas()` en `lib/patios.ts` — query a tabla `fonditas`, mapea a `Patio[]`
- `allPatios` state en explorar: empieza con MOCK_PATIOS, se expande con fonditas reales al montar
- Lista muestra `allPatios` (todos los fonditas registrados)
- Mapa usa solo patios con `latitude > 0` en viewport — MOCK_PATIOS por ahora
- Botón "Ver" visible solo para patios con coordenadas

**perfil.tsx — captura de ubicación GPS**:
- `expo-location` instalado y registrado en `app.json` (plugin)
- Botón "Marcar en el mapa" en campo de dirección
- `handleMarkLocation()`: pide permiso → GPS → guarda `latitude`/`longitude` en `fonditas`
- Estado persiste: si DB ya tiene coords, muestra "En el mapa" al cargar

### ⚠️ Migración Supabase — histórico, ya resuelta
```sql
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS latitude float8;
ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS longitude float8;
```
Sin esta migración, el botón de ubicación falla al guardar.

### Decisiones importantes
- **Lat/lng por registro**: cada fondita marca su ubicación desde su propio dispositivo — no geocoding
- **MOCK_PATIOS para mapa**: quedan como referencia visual hasta que fonditas reales tengan coords
- **expo-location**: requiere `npx expo run:ios` para rebuild nativo antes de poder probar GPS

### Siguiente paso exacto
1. Ejecutar migración Supabase (ALTER TABLE)
2. `npx expo run:ios` — rebuild por expo-location + ver icono/splash
3. Verificar commit agente de hints en GitHub (`feat: contextual onboarding hints`)
4. Probar GPS en simulador (lat/lng ficticio) o dispositivo real

---

## 2026-05-10/11 (cierre — sesión diseño completo)

### Qué se hizo hoy

**Auditoría tipográfica global** — limpieza de todo el codebase:
- `fontWeight`: solo `'900'` y `'300'` en todos los archivos (excepción documentada: `'500'` en `itemName` de preview, `'700'` en botón WhatsApp)
- `letterSpacing`: eliminado de todos los archivos sin excepción
- Archivos corregidos: `menu.tsx`, `foto-menu.tsx`, `preview.tsx`, `explorar.tsx`, `buscar.tsx`, `cuenta.tsx`, `share.tsx`, `patio/[id].tsx`, `loading-indicator.tsx`

**Onboarding rediseñado** (`app/onboarding.tsx`):
- Tagline canónico en dos elementos separados: `"¿Qué hay hoy?"` (900) + `"Saaaaaaabes."` (300) — contraste de peso
- Toda la tipografía migrada a `Fonts.brand` (Plus Jakarta Sans)
- Sin letterSpacing en ningún texto

**Index rediseñado** (`app/index.tsx`):
- Layout centrado verticalmente (HIG optical centering) — ya no pegado al fondo
- Tagline en dos líneas separadas con peso diferenciado
- Botones en zona óptica natural, `paddingBottom: insets.bottom + 32`
- DevBar sigue presente (se eliminará en release)

**Perfil fondero rediseñado** (`app/perfil.tsx`):
- Ruleta de categoría eliminada → **pills horizontales** tapables
- `TU NEGOCIO` label eliminado — nombre editable directo (placeholder: "Nombre de tu negocio")
- Horario simplificado: Apertura/Cierre sin hints de texto
- TIPO + HORARIO + PAGOS fusionados en **un solo card** (Apple HIG)
- Block labels → `textSecondary` (gris, rol organizador)
- Guardar aparece solo cuando hay cambios pendientes

**Assets y app.json**:
- Añadidos: `p-icon-transparent.png`, `p-icon-transparent-blanco.png`, android variants
- `app.json` actualizado: icon y splash usan la P transparente

**Agente scheduled programado** — corre a las 2am (08:00 UTC 2026-05-11):
- Implementa sistema de hints contextuales (bottom sheets, one-time, AsyncStorage)
- Fondero: perfil → menú → share
- Foodie: explorar
- Archivos a crear: `lib/hints.ts`, `components/hint-sheet.tsx`
- URL: https://claude.ai/code/routines/trig_01GactQsWZuPYcVwPesNq4Gh

### Decisiones importantes
- **No letterSpacing en ningún texto** — ley absoluta, sin excepciones
- **fontWeight solo '900' / '300'** — contraste tipográfico como mecanismo de jerarquía
- **Perfil fondero**: un solo card operacional (tipo + horario + pagos) — más limpio que 3 cards
- **Hints onboarding**: bottom sheet (Apple HIG), no spotlight/coach marks
- **Repo público**: `patioquehayhoy/patio` hecho público para acceso de agentes remotos

### Siguiente paso exacto
1. Mañana verificar commit del agente de hints en GitHub (`feat: contextual onboarding hints`)
2. `npx expo run:ios` para ver icono/splash con P transparente (requiere build nativo)
3. Validar visualmente hints en simulador
4. Push a `origin/v2-menu-vivo`

### Pendiente estructural de ese momento (resuelto después)
- Datos Foodie en Supabase: resuelto el 2026-05-15
- API key Google Maps para Android
- EAS build para release

## 2026-05-08 (cierre — sesión 2)

### Qué se hizo hoy
- **Share de lugar sin fricción**: botón de compartir en `app/patio/[id].tsx` (top bar junto al corazón) y en `app/explorar.tsx` (bottom sheet cuando hay lugar seleccionado). Usa `Share.share()` nativo de React Native — abre el share sheet del SO con mensaje pre-compuesto: nombre, categoría, zona, horario, dirección y link a Apple Maps.
- **Rating 5 estrellas con feedback estructurado**: en `app/patio/[id].tsx` se reemplazó el rating estático por estrellas interactivas. 5 estrellas → guarda directo. Menos de 5 → abre `Modal` bottom sheet con pills de razones estructuradas (Horario incorrecto, Ubicación confusa, Menú no disponible, Precio distinto, Atención, Estaba cerrado, Otro).
- **`lib/ratings.ts`** creado: `PatioRating`, `getPatioRating`, `savePatioRating` — mismo patrón que `lib/favorites.ts`, persiste en AsyncStorage.
- `npx tsc --noEmit` en verde al cierre.

### Qué se hizo hoy (sesión 1)
- Instalado `@expo-google-fonts/plus-jakarta-sans` como fuente de marca (alternativa a Stabil Grotesk, que es comercial)
- `app/_layout.tsx`: carga de `PlusJakartaSans_800ExtraBold` con `useFonts` + `SplashScreen.preventAutoHideAsync`
- `lib/theme.tsx`: exportado `Fonts.brand = 'PlusJakartaSans_800ExtraBold'` como token de fuente de marca
- Aplicado `fontFamily: Fonts.brand` en: `app/index.tsx`, `app/manifiesto.tsx`, `app/explorar.tsx`, `app/patio/[id].tsx`
- Viewport filtering en `explorar.tsx` ya estaba implementado (descubierto durante auditoría): `useMemo` + `onRegionChangeComplete={setVisibleRegion}` — quitado de pendientes.

### Decisiones importantes hoy
- **Plus Jakarta Sans** en lugar de Stabil Grotesk — editorial grotesca moderna, libre, feel similar al spec original
- **Share nativo**: usar `Share.share()` de React Native (sin deps extra) — cero fricción, mensaje pre-compuesto con Maps link
- **Ratings estructurados**: feedback por categorías concretas en lugar de texto libre — más accionable, menor fricción para el usuario

### Siguiente paso exacto
Abrir simulador y validar:
1. Fuente carga en index, explorar, patio detail y manifiesto
2. Botón de share en patio detail y en bottom sheet de explorar → abre share sheet nativo
3. 5 estrellas → guarda sin abrir modal; 1–4 → abre modal con pills; seleccionar razones y enviar; re-abrir patio y confirmar que rating persistió

Comando: `npx expo start --ios`

Una vez validado → push a `origin/v2-menu-vivo`.

### Pendiente que venía del historial
- Permisos de cámara/galería (requieren build — no sirve hot reload)
- Datos Foodie en Supabase: resuelto el 2026-05-15
- API key Google Maps para Android

## 2026-05-07 (cierre)

### Qué se hizo hoy
- `app.json`: permisos iOS de cámara/galería en `infoPlist` + plugins `expo-image-picker` y `expo-camera` — esto desbloqueará la función de foto en el próximo build
- `app/patio/[id].tsx`: botón "Cómo llegar" en pill del mapa (abre Apple Maps en iOS, Google Navigation en Android), back button robusto con `router.canGoBack()` + fallback a `/`
- `app/manifiesto.tsx`: botón de regreso propio (ya no dependía del header nativo que fallaba), `headerShown: false` en `_layout.tsx`, tagline `"Saaaaaaabes."` restaurado
- `CLAUDE.md`: bloque "Leer primero" con referencia a `docs/` y reglas de economía de builds EAS
- `lib/patios.ts` + `app/preview.tsx`: mejoras de búsqueda multi-token y limpieza de imports

### Decisiones importantes hoy
- **"Saaaaaaabes."** es el tagline oficial de Patio — posible registro de marca. No tocar
- **EAS builds son recurso limitado**: simulador primero, build solo cuando el sim no alcanza (permisos nativos, módulos nativos)
- **docs/ es la fuente de verdad del producto** — CLAUDE.md ahora lo referencia explícitamente

### Siguiente paso exacto — TAREA OVERNIGHT
Implementar fuente Stabil Grotesk como fuente de marca en toda la app.

Referencia: `docs/design/foundations/IDENTITY_AND_TYPE.md` (sección 2 y 4)
Fuente: Kometa — Stabil Grotesk (descargar o usar via expo-font si está disponible en Google Fonts / licencia libre; si no, buscar alternativa editorial de peso similar como DM Sans o Plus Jakarta Sans)

Regla operativa:
- Títulos de pantalla, nombre de negocio, hero text → Stabil Grotesk Bold
- UI general (labels, inputs, botones, metadata) → SF Pro (sistema, sin cambio)
- Fallback automático a SF Pro si la fuente no carga en runtime
- Implementar en `lib/theme.ts` como token `font.brand`
- Aplicar en: `app/explorar.tsx` (título selected), `app/patio/[id].tsx` (nombre del patio), `app/manifiesto.tsx` (intro), `app/index.tsx` (pantalla de entrada)
- NO aplicar en formularios, inputs ni metadata secundaria

Criterio de éxito: `npx tsc --noEmit` en verde, la fuente carga sin crash en simulador, fallback funciona si se comenta el import de la fuente.

### Pendiente que venía del historial
- Viewport filtering en `explorar.tsx` (`onRegionChangeComplete`)
- Permisos de cámara/galería (requieren build — no sirve hot reload)
- Datos Foodie en Supabase: resuelto el 2026-05-15
- API key Google Maps para Android

## 2026-04-28 (cierre)
- Push realizado a `origin/v2-menu-vivo` con commit `36fb33c`.
- `app/preview.tsx`: estado vacío de `Compartir` quedó sin CTAs (solo icono + leyenda), con composición más compacta.
- Se redujo alto/padding vertical para evitar card gigante.
- Verificación de perfiles: Foodie (`app/cuenta.tsx`) y Fondero (`app/perfil.tsx`) siguen activos.
- `npx tsc --noEmit` en verde al cierre.

## Siguiente paso exacto
- Abrir simulador en `Compartir` con menú vacío y hacer microajuste final si aún se percibe descentrado:
  - `shareCardEmpty.minHeight`
  - `scrollBodyEmpty.minHeight`
  - `emptyWrap.paddingVertical`
- Si hay ajuste, volver a correr `npx tsc --noEmit`, commit y push.

## 2026-04-26 (sesión 2)
- `app/explorar.tsx`: mapa vivo — búsqueda inline en topBar (sin navegación a pantalla separada), pins reactivos (punto pequeño neutral → ring completo al seleccionar), `showHeader`/`selectedId` desacoplados (header solo al tocar explícitamente), `tracksViewChanges={true}` con keys estables (resuelve crash al escribir), `MapView.onPress` deselecciona.
- `app/cuenta.tsx`: rediseño completo — sheet modal con `presentation: 'transparentModal'` + BlurView backdrop (mapa visible/blureado detrás), botón X circular, identidad compacta, sin labels de sección, rows 52pt, "Cerrar sesión" neutral, "Tengo un negocio →" ghost link.
- `app/buscar.tsx`: texto genérico ("lo que se te antoja") — elimina referencia a "platillo".
- Filosofía formalizada: 4 principios del producto completados (ver GOAL.md).
- Decisión de escala de mapa: viewport filtering para MVP → clusters cuando haya 50+ patios por zona.

## 2026-04-26
- `patio/[id].tsx`: mapa real con `MapView` + pin consistente con `explorar`. Corazón de favoritos funcional (carga estado al abrir, persiste en AsyncStorage).
- `explorar.tsx`: design pass — `BlurView` en botones flotantes y sheet, `LinearGradient` como velo del mapa, bordes `hairlineWidth` con opacidad baja, sombras reducidas.
- Instalados `expo-blur` y `expo-linear-gradient` (SDK 54 compatible).
- `CLAUDE.md` actualizado con specs de implementación: glass, gradientes, líneas finas, jerarquía tipográfica, radios.

## Hecho
- Se auditó el repo completo (rutas, librerías, stores, servicios y scripts).
- Se documentó objetivo, arquitectura y estado operativo real del proyecto.
- Se definió una operación de continuidad multi-agente basada en docs dentro del repo.
- Se refactorizó `app/login-callback.tsx` para soportar `code`, `token_hash` y `token`, con fallback de sesión e inicialización vía `initializeSignedInUser`.
- Se corrigió el error de typecheck en `app/_layout.tsx`; `npx tsc --noEmit` queda pasando.
- En `app/menu.tsx` se movió el acceso a foto a un botón redondo centrado estilo HIG (64px, `camera.fill`) y se retiró la cámara inline de la primera sección.
- En `app/preview.tsx` se corrigió la detección de vacío para basarse en platillos reales y se agregó empty state con icono `doc.text` + CTA “Ir al menú”.
- En `app/preview.tsx` se evitó mostrar subtítulo duplicado cuando una sección tiene el mismo nombre del grupo (ej. `MENÚ DEL DÍA`).
- En `app/menu.tsx` y `app/foto-menu.tsx` se agregó prefijo visual `$` en campos de precio de sección y platillo.
- El botón de agregar en secciones de bebidas ahora muestra `+ agregar bebidas`.
- En `app/foto-menu.tsx` se eliminó el ícono de cámara dentro de la primera sección en review y se removió el badge `IA`.
- En `app/menu.tsx` y `app/foto-menu.tsx` las cards de platillo regresaron a fondo blanco y se ajustó alineación visual de precios a la derecha.
- En `app/preview.tsx` se dejó de destacar `MENÚ DEL DÍA` en naranja y se migró parsing de precios desde descripción a precio de item visible.
- Se reforzó layout para anclar bloque de precio al extremo derecho y mantener consistencia con botón `×` en cards de sección/platillo.
- Se añadió empty onboarding state en `app/menu.tsx` para escenario sin secciones (evita pantalla vacía).
- Se reemplazó iconografía de cámara en `foto-menu` idle por icono de cámara consistente y color accent.
- Se homologó `+ agregar platillo` en `app/menu.tsx` y `app/foto-menu.tsx` con alineación izquierda y estado presionado gris.
- Se ajustó el ícono de cámara en `app/foto-menu.tsx` (idle) para usar color accent y mejor consistencia visual/posición.
- Se limpiaron imports no usados en `app/foto-menu.tsx` (lint).
- Se cambió `app/menu.tsx` para iniciar vacío/onboarding cuando no hay menú guardado (sin autogenerar secciones).
- En `app/menu.tsx`, `Crear secciones sugeridas` ahora abre modal de selección por pills (estilo “widgets”) antes de crear secciones.
- Se compactó el layout del bloque de precio en encabezado/platillo para pegar más el `$` al extremo derecho junto al valor y la `×`.
- Se aplicó transparencia al CTA `+ agregar platillo / + agregar bebidas`.
- Se refinó el modal de plantillas con heurística por tipo de negocio y UI HIG (sin copy literal de widgets): plantillas `Fondita`, `Taquería`, `Repostería`, `Mariscos`, `Personalizado`.
- Se corrigió la selección visual invertida: seleccionado ahora usa fondo accent y texto blanco.
- En `app/menu.tsx` se eliminó el espacio visual sobrante entre `$` y número, compactando el bloque de precio junto a la `×` (`$0x`).
- En `app/menu.tsx` el header de sección quedó alineado a base inferior y sin kerning en títulos; además se añadió separación tipo tab entre título y bloque de precio.
- En `app/menu.tsx` se aplicó rediseño de platillo card estilo referencia (sin slash, nombre+descripción en columna izquierda, precio junto a `×` con color homogéneo).
- En `app/preview.tsx` se simplificó render de compartir para filas limpias de platillo (sin encabezados de sección), manteniendo precio al lado derecho.
- En `app/menu.tsx` y `app/foto-menu.tsx` se migró `×` a botón circular para mejorar usabilidad táctil; se retiró la palomita en `menu` y se dejó handle discreto.
- Se refinó interlineado de tipografía en cards para reducir sensación de “texto suelto” y acercar ritmo visual a HIG.
- En `app/menu.tsx` se removió el estilo circular de `×` y se reubicó `×` de platillo a esquina superior derecha (clean look, menos ruido).
- En `app/menu.tsx` y `app/foto-menu.tsx` se compactó la composición de cards a patrón lista (separadores hairline, menos contenedor interno), manteniendo edición inline.
- En `app/menu.tsx` se reemplazó “secciones incluidas” por checklist estable con checkboxes (no desaparece al deseleccionar) y botón de crear con estado disabled cuando no hay selección.
- En `app/preview.tsx` se recuperó la jerarquía real de compartir: título de grupo, encabezado de sección y precio de sección visible/alineado a la derecha.
- En `app/preview.tsx` se dio ancho consistente a la columna de precios para que no salte entre sección y platillo.
- En `app/foto-menu.tsx` se limpió ruido textual de Vision (`menu/menú`) antes de persistir nombre/descripción.
- En `app/preview.tsx` se añadieron sub-bullets automáticos cuando la descripción de un platillo trae variantes separadas.
- Se corrigieron los refs tipados de `Swipeable` en `app/foto-menu.tsx`; `npx tsc --noEmit` vuelve a pasar.
- Arrancó V3 MVP de ubicación: `app/perfil.tsx` ya permite decidir si la dirección se muestra.
- En `app/preview.tsx` la dirección visible ahora tiene CTA `Abrir en Maps`.
- El deep link de Maps usa Apple Maps en iOS y Google Maps web search en Android.
- En `app/perfil.tsx` se pulió jerarquía/espaciado de la sección de negocio.
- En `app/perfil.tsx` el giro del negocio dejó de ser una fila de pastillas y ahora es una ruleta vertical tipo picker con snap al centro.
- En `app/perfil.tsx` la sección `Operación` quedó como bloque minimalista tipo Settings: apertura, cierre y métodos de pago agrupados.
- `app/perfil.tsx` quedó sin warnings de lint; queda pendiente solo el warning conocido de `app/onboarding.tsx`.
- Se actualizó `docs/GOAL.md` con filosofía V3: Patio debe hacer evidente la siguiente acción, no entregar datos para que el usuario piense de más.
- Dirección de producto V3: experiencia principal tipo foodie/exploración, con acceso de negocio discreto tipo Uber; evitar un switch visible permanente Foodie/Fondero.
- Ratings iniciales: 5 estrellas con feedback estructurado si baja de 5; no iniciar con reseñas abiertas ni señales complejas.
- Se añadió principio de eficiencia: IA por lote con salida estructurada, validaciones determinísticas en código/backend y cache cuando no cambió el input.
- Se añadió principio de mapa eficiente: evaluar H3/geohash/S2, usar celdas/zonas y precisión bajo demanda en vez de tracking fino permanente.
- Se creó `app/explorar.tsx`: home Foodie inicial con mapa liviano, pins seleccionables, filtros simples y Top 10 curado/mock.
- `app/explorar.tsx` fue rediseñado a estructura full-bleed tipo dashboard logístico: mapa como superficie principal, controles flotantes y bottom sheet inferior.
- Se actualizó `app/index.tsx`: `Busco comida` entra a Explorar; `Tengo un negocio` revela el login de fondero. Desde Explorar el acceso de negocio es discreto.
- Se limpió `app/onboarding.tsx`: fuera reset forzado de AsyncStorage y warning de hook. `npm run lint` queda limpio.
- Se quitó de `app/perfil.tsx` el toggle `Mostrar ubicación`; `app/preview.tsx` muestra dirección/Maps si existe dirección, sin depender de `direccion_visible`.
- `app/explorar.tsx` ahora usa 5 Patios mock reales de Irrigación/Miguel Hidalgo: Cochitacos, Cíntora Taquería, Don Bonachón, AAATTACO y Restaurante Vianca.
- Se refinó el bottom sheet de `Explorar` con cápsula glass de lugar seleccionado, tomando la nueva referencia visual.
- `Explorar` cambió `Top 10` por `Cerca de ti`, con ratings fake 5.0 y horarios fake; recomendaciones/top queda como apartado futuro.
- `Explorar` se simplificó: fuera zoom fake, fuera botón tienda/switch visible, fuera contador flotante; queda menú/cuenta, búsqueda, favoritos y expandir mapa/lista.
- Se creó `lib/patios.ts` con 5 Patios mock de Irrigación/Miguel Hidalgo y menú estructurado por platillos/tags.
- Se creó `app/patio/[id].tsx` como `Ficha de Patio`: menú de hoy como contenido principal, detalles mínimos y mapa mock.
- Se creó `app/buscar.tsx` con búsqueda por platillo dentro del menú, no por nombre de negocio. Ejemplos: `mole`, `enchiladas`, `anis`, `tacos`.
- Se creó `lib/favorites.ts` con persistencia local de favoritos en AsyncStorage.
- Se creó `app/favoritos.tsx` con lista y empty state.
- Se creó `app/cuenta.tsx` como cuenta Foodie minimalista: accesos a Buscar/Favoritos, Soporte y Sesión; se quitó `Tengo un negocio` de esta pantalla.
- Se agregó `components/agent-spinner.tsx` y se sustituyeron spinners principales de login/callback/foto-menú.
- Se instaló `react-native-maps@1.20.1` con Expo y `app/explorar.tsx` usa `MapView` real con markers custom.
- `lib/patios.ts` ahora incluye coordenadas aproximadas para los 5 Patios mock.
- Decisión vigente de costos/mapa: MVP con mapa nativo simple + pines propios, sin Places/Directions/Distance Matrix/geocoding repetido/tracking fino. Si se necesita ruta, abrir app externa de mapas.

## Pendiente
- Validar en simulador el flujo Foodie completo: mapa, búsqueda por platillo, ficha pública, favoritos y cuenta.
- Validar en dispositivo el flujo de ubicación (`perfil` -> `preview` -> `Abrir en Maps`).
- Conectar Explorar/Buscar/Favoritos a Supabase y ubicación real por zona/celda.
- Configurar API key de Google Maps restringida para Android/Google provider antes de builds Android reales; iOS puede probar con provider nativo.
- Definir estrategia de geoceldas (H3/geohash/S2) antes de tracking fino.

## Siguiente paso exacto
Probar en simulador `Busco comida -> Explorar` con `MapView` real; si el mapa no renderiza, revisar si el entorno necesita dev build por `react-native-maps`.

## Archivos tocados
- app/login-callback.tsx
- app/_layout.tsx
- app/menu.tsx
- app/perfil.tsx
- app/preview.tsx
- app/foto-menu.tsx
- app/explorar.tsx
- app/buscar.tsx
- app/cuenta.tsx
- app/favoritos.tsx
- app/patio/[id].tsx
- lib/patios.ts
- lib/favorites.ts
- components/agent-spinner.tsx
- docs/STATE.md
- docs/GOAL.md
- docs/ARCHITECTURE.md
- docs/HANDOFF.md
- docs/AGENT.md

## Decisiones vigentes
- Antes de cualquier tarea, leer: `docs/GOAL.md`, `docs/ARCHITECTURE.md`, `docs/STATE.md`, `docs/HANDOFF.md`.
- No depender del historial de chat para continuar trabajo.
- No rehacer código existente sin necesidad; extender y corregir de forma incremental.
- Al cerrar cualquier tarea, actualizar mínimo `docs/HANDOFF.md` y `docs/STATE.md` si cambió el panorama.

## Riesgos / dudas
- Aunque el callback es más robusto en código, aún falta prueba manual en dispositivo real.
- Hay cambios locales previos en el working tree que deben respetarse para no pisar trabajo en curso.
- Hay secretos/configuración sensible en el repo que conviene revisar antes de release.
