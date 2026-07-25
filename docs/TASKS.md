# TASKS — Cola de trabajo para agentes

> Última actualización: 2026-07-25.
> Estado: `[ ]` pendiente | `[x]` hecho | `[~]` en progreso.

> Las entradas Patio Smart v1–v6 registran iteraciones históricas y no son una
> especificación vigente. El flujo canónico es v7 y vive en
> `docs/PATIO_SYSTEM_MAP.md`.

## CICLO 2026-07-25 — reestructura panorámica por transcript

- [x] Foodie reorganizado en Buscar/Lugares/Perfil.
- [x] Fondero reorganizado en Menús/Actividad/Perfil; publicar pasó a ser una
  acción hija de Menús.
- [x] Eliminada ficha intermedia del mapa; pin, fila y resultado abren perfil.
- [x] Lista del mapa sin numeración, con información útil y precio discreto.
- [x] Guardados agrupados por categoría con filtro persistente del mapa.
- [x] Barra inferior estable, sin ocultamiento parcial al hacer scroll.
- [x] Publicación termina en perfil público o compartir nativo.
- [x] Preferencias locales de notificación separadas para Foodie y Fondero.
- [x] Eliminada tarjeta grande de métricas sintéticas en Actividad Fondero.
- [x] TypeScript, ESLint y diff check verdes.
- [ ] **QA humano del checkpoint:** Alejandro lo calificó “medio me gustó” y
  revisará la interacción visual en iPhone. Registrar problemas concretos antes
  de otra ronda.
- [ ] **Backend social mínimo:** follows/suscripciones por Patio, push por
  publicación, reseñas compartidas y vistas agregadas reales.

## CICLO 2026-07-24 — perfil + menú vivo + póster

- [x] **Núcleo definido:** perfil público → menú vigente → póster → regreso
  medible al perfil.
- [x] **Auditoría de lectura actual:** detectada contradicción entre prompt y
  contrato de precio, parsing libre, ausencia de tipos/confianza/evidencia y falta
  de captura de correcciones.
- [x] **Fuente técnica nueva:**
  `docs/MENU_INTELLIGENCE_AND_POSTER.md` define ontología, pipeline, revisión,
  evaluación, papel de vectores y sistema adaptable de póster.
- [x] **Benchmark de monetización:** el núcleo permanece gratis; hipótesis
  principal de suscripción = $99 MXN/mes o $990/año, con pruebas de $49/$99/$149.
  Ingresos futuros incluyen IA por consumo, promoción local, servicios y comisión
  sobre transacción real.
- [x] **Contrato de extracción v2:** corregir precio y definir entidades,
  relaciones, confianza, evidencia y razones de revisión.
- [x] **Salida estructurada:** migrar `read-menu` a JSON Schema y añadir
  validadores determinísticos.
- [~] **Datos de mejora:** ya se guarda localmente extracción, versión aprobada,
  advertencias y corrección; falta persistencia central de modelo/prompt, tipo de
  error y tiempo de revisión.
- [x] **Perfil fiel:** conservar descripción, variantes, disponibilidad y señal de
  vigencia en `app/patio/[id].tsx`.
- [x] **Póster canónico:** una sola vista dentro de Patio, legible con menús
  cortos y largos, enlace compartible y atribución. Sin formatos ni impresión MVP.
- [x] **Fotos fuera del camino crítico:** perfil y publicación requieren identidad
  + menú; la fotografía será posterior, opcional, contextual y curada.
- [ ] **Evaluación:** construir conjunto real de los primeros negocios y medir
  entidad, precio, secciones, pérdida de texto y tiempo hasta publicar.

## CICLO 2026-07-24 — perfil público, red atómica y monetización

- [x] **Decisión de producto:** conservar la app y terminarla por secciones.
  Onboarding, avisos iniciales y alta del negocio permanecen como base aprobada.
- [x] **Fuente de verdad nueva:**
  `docs/NETWORK_COLD_START_AND_MONETIZATION.md` define perfil público, seguimiento,
  menús visibles, reseñas, notificaciones, primera red atómica y suscripción.
- [x] **Bucle mínimo acordado:** perfil → seguir → publicar → avisar → regresar →
  medir → volver a publicar.
- [x] **Contradicciones cerradas:** publicación y avisos a seguidores gratuitos;
  métricas de visitantes agregadas; comentarios después de moderación; promoción
  pagada futura local, limitada y etiquetada.
- [x] **Arquitectura de navegación:** aterrizada y refinada el 2026-07-25; ver
  ciclo superior para los destinos vigentes.
- [~] **Perfil público canónico:** ya muestra menú vigente fiel, precio general,
  descripciones, guardar/compartir, calificar y reseña local; faltan versiones
  públicas anteriores, seguimiento y reseñas compartidas por backend.
- [ ] **Modelo de datos social:** diseñar migraciones y RLS para follows, vistas,
  reseñas, visibilidad/versiones de menú y preferencias/entregas de avisos.
- [~] **Actividad:** ya existen superficies raíz para ambos lados; falta reemplazar
  estadísticas sintéticas/locales por backend real.
- [ ] **Notificaciones de red:** publicación → seguidores, con consentimiento,
  deduplicación, límite de frecuencia y baja.
- [ ] **Instrumentación:** medir tiempo a primera publicación/interacción,
  negocios activos, conexiones, densidad por microzona y retorno.
- [ ] **Monetización:** validar $49/$99/$149 con la cohorte antes de implementar
  StoreKit/entitlements. Hipótesis principal: $99 MXN/mes o $990/año; fundadores
  reciben seis meses de funciones completas.

## CICLO 2026-07-24 — bug botón "Entrar a Patio" en TestFlight + email magic link

- [x] **Diagnóstico a fondo del botón que no responde en TestFlight.**
  Reproducido en simulador (dev client): primer touch tras cold start no
  dispara `onPress` en ninguna pantalla del Stack, se arregla solo esperando
  ~15s o revisitando la pantalla. Confirmado con build en configuración
  Release (sin Metro) que el mismo tap responde de inmediato — es un
  artefacto del dev client, NO el bug real de producción. Se armó y luego se
  revirtió por completo una arquitectura boot→warmup→entrada; `index.tsx` y
  `_layout.tsx` quedaron sin cambios netos. Detalle completo en
  `docs/HANDOFF.md` sesión 2026-07-24.
- [ ] **Bug real sin explicación de código confirmada — pendiente de triage
  de device.** Pedir a Alejandro: forzar cierre + reabrir, confirmar que
  TestFlight no tiene un update pendiente (sigue en build 47 o el que se
  lance hoy), y si sigue igual, borrar la app y reinstalar desde cero.
- [x] **Rediseño Apple HIG del email "Magic Link"** (`supabase/templates/
  magic-link.html`), 3 rondas de feedback: logo oficial embebido, pesos de
  firma de marca corregidos, CTA centrado, cuerpo recortado a una línea,
  bloque de URL cruda eliminado (fallback humano vía soporte), alineación
  mixta (hero centrado, utilitario a la izquierda). Sigue pendiente que
  Alejandro lo pegue manualmente en Supabase Dashboard — no hay acceso desde
  aquí.
- [x] **Build 48 enviado a Apple** — `eas build -p ios --profile production
  --auto-submit` desde `rebuild/patio-final`, sin fix de código para el bug
  del botón (no hay uno confirmado); lanzado a petición de Alejandro para
  tener un build fresco mientras hace el triage de arriba.

## CICLO 2026-07-23 (parte 2) — Redisño HIG perfil/cuenta + panel de estadísticas

- [x] **Corrección de atribución:** el kicker fijo "Publica lo que vendes hoy.
  Patio lo ordena por ti." vive en `app/menu.tsx` (Hoy), NO en Historial. La
  entrada de más abajo que lo anotaba como "hint de Historial" estaba mal
  atribuida — sigue pendiente tal cual, sin tocar hoy.
- [x] **Componente compartido `components/settings-list.tsx`** (`SettingsGroup`
  + `SettingsRow`): grupo con label opcional (mayúsculas, HIG grouped list) +
  fila con icono en caja tintada, título/subtítulo y trailing. Antes
  `cuenta.tsx`, `perfil.tsx` y `perfil-editar.tsx` tenían tres implementaciones
  de fila visualmente distintas para la misma cosa.
- [x] **`app/cuenta.tsx` reagrupada por propósito**, no por lo que "cupiera
  junto": "Preferencias" (modo oscuro) separado de "Ayuda" (manifiesto,
  soporte) separado de las salidas de contexto (publicar mi menú / cerrar
  sesión). El estilo `groupLabel` existía pero nunca se usaba — ahora si
  tiene contenido real.
- [x] **`app/perfil.tsx` (Mi Patio) reagrupada espejo de Cuenta**: "Negocio"
  (Publicar menú, Editar mi negocio) → "Preferencias" → "Ayuda" → salidas.
  El estado "Menú publicado hoy"/"Aún no publicas" se separó de la
  dirección — antes vivían en una sola línea con un " · ", mezclando dos
  tipos de información distintos (status en vivo vs. dato estático). El
  status ahora es un punto de color + texto; la dirección se movió como
  subtítulo de la fila "Editar mi negocio", que es donde realmente vive ese
  dato.
- [x] **`app/perfil-editar.tsx`**: el bloque "CUENTA" (correo + cerrar sesión)
  al fondo también migrado al componente compartido — era la tercera
  variante de fila divergente en el repo.
- [x] Typecheck, ESLint y verificación visual en simulador (claro) para las
  tres pantallas — ver capturas en la sesión. Modo oscuro no se pudo forzar
  vía tap del simulador (posible quirk de Maestro/simulador, no del código);
  la lógica de color no cambió respecto al original, así que el riesgo es
  bajo, pero vale la pena que Alejandro lo confirme en su iPhone.
- [x] **Panel de estadísticas + reseñas en Historial** (`app/historial.tsx`):
  aparece arriba de la lista solo cuando `menus.length > 0` (ya no es la
  primera vez que publica). Muestra vistas, calificación promedio + número
  de reseñas, y un fragmento de la reseña más reciente. **Datos sintéticos,
  solo en `__DEV__`** vía `lib/patio-stats.ts::getDemoPatioStats()` — determinista
  por seed (fondita id/nombre) para que no “salte” entre renders. Decisión
  explícita de Alejandro (2026-07-23): construir la interacción completa con
  datos sintéticos ahora; migrar a datos reales cuando exista el backend.
- [ ] **Pendiente real, sin resolver:** no existe backend para esto. Las
  reseñas (`lib/ratings.ts`) viven solo en el `AsyncStorage` de cada
  teléfono — nunca llegan a Supabase, nadie más las puede leer. No hay
  ningún contador de vistas por fondita en ningún lado del código. Para que
  el panel muestre datos reales hace falta: tabla de reseñas en Supabase +
  RLS, migrar `savePatioRating` para escribir ahí, y un contador de vistas
  real (incrementar al abrir `app/patio/[id].tsx`). Alcance de una sesión
  aparte, no trivial.
- [x] **Corrección tras feedback de Alejandro (misma sesión):** los grupos
  "Explorar como cliente/Cerrar sesión" y "Publicar mi menú/Cerrar sesión" en
  `perfil.tsx` y `cuenta.tsx` no tenían label — quedó inconsistente contra el
  resto de grupos que sí tienen título. Ahora ambos llevan label "Cuenta"
  (mismo nombre que ya usaba `perfil-editar.tsx` para su bloque de correo +
  cerrar sesión — vocabulario reciclado, no inventado).
- [x] **Corrección de estructura — reseñas como su propio destino, no un
  panel embebido en Historial:** Alejandro pidió pensar esto con HIG y
  aterrizó en el patrón de Apple "Calificaciones y reseñas" del App Store —
  resumen (vistas/promedio/reseñas) arriba + tarjetas individuales abajo, en
  una pantalla propia (`app/resenas.tsx`), no un widget dentro de la pestaña
  de menús. Nueva fila "Reseñas" en el grupo "Negocio" de `perfil.tsx`. El
  panel que se había agregado a `historial.tsx` se revirtió por completo.
  Las etiquetas de la reseña sintética reusan `REVIEW_TAGS`
  (`lib/review-tags.ts`, extraído de `app/resena/[id].tsx` para no tener dos
  taxonomías) — enlaza con la taxonomía aspiracional "comida/porción/
  servicio/precio/ambiente/accesibilidad" ya anotada en
  `docs/AIRBNB_TO_PATIO_SYSTEM.md` sección D (Reseñas inteligentes), que
  Alejandro reconoció como la referencia del video de Airbnb que ya
  teníamos registrada — no hubo que pedírselo de nuevo.
  Sigue sintético/`__DEV__` únicamente; el backend real sigue pendiente
  (ver nota de arriba).
- [x] Typecheck + ESLint verdes; verificado en simulador (grupos con label,
  fila Reseñas, pantalla de reseñas con datos sintéticos renderizando bien).
- [x] **Build de TestFlight lanzado y enviado** — `eas build -p ios --profile
  production --auto-submit`, buildNumber 47, subido y **"Submitted your app
  to Apple App Store Connect!"** (2026-07-23, ~23:08). Apple procesa el
  binario (5-10 min típico) antes de aparecer en
  https://appstoreconnect.apple.com/apps/6760884735/testflight/ios — pendiente
  que Alejandro reciba el correo de Apple y lo instale para probar fuera de
  casa. QA de la parte 1 (magic link real, recorte de galería, blur del mapa)
  sigue sin resolver — no bloqueó el build, lo adelantó.

## CICLO 2026-07-23 — Confirmaciones de Alejandro en vivo (triage, sin código)

- [x] **Bug de guardado en historial — CONFIRMADO RESUELTO** por Alejandro:
  cualquier menú que guarda o crea se queda guardado. Cierra el pendiente
  abierto el 22-jul sobre `saveDraft`/`saveLocalMenu`.
- [ ] **Templates de email — sigue pendiente, NO se descarta.** Confirmado que
  sí hay que instalarlos, solo que no es lo urgente ahora. Recordar que son
  **dos pestañas** en Supabase Dashboard (Magic Link + Confirm signup, mismo
  HTML en ambas — ver `supabase/templates/README.md`), no una.
- [ ] **QA magic link real** — sigue pendiente de probar en iPhone.
- [x] **QA cámara/galería (captura de menú) — CONFIRMADO funcionando** en
  dispositivo real.
- [x] **QA GPS — CONFIRMADO funcionando** vía uso real: Alejandro marca su
  ubicación sin problema al crear/editar perfil de Fondero. Cobertura: happy
  path (permiso concedido, geocode normal). No se probó explícitamente permiso
  denegado ni el fallback de dirección manual — dejar en radar si aparece un
  reporte real, no bloquea nada hoy.
- [ ] **Nuevo hallazgo, backlog (no urgente):** el campo NOMBRE del alta acepta
  cualquier longitud/contenido sin validación ni límite de caracteres.
- [x] **Idea de producto implementada** (ver CICLO 2026-07-23 parte 2 arriba):
  panel de estadísticas + reseñas en Historial, visible cuando ya no es la
  primera vez que publica. Corrección de atribución: el kicker "Publica lo
  que vendes hoy..." vive en `app/menu.tsx` (Hoy), no en Historial — son dos
  cosas distintas, esta nota original las mezclaba.
- [ ] **Recorte de galería** — pendiente que Alejandro lo compruebe él mismo
  antes de decidir si se toca.
- [ ] **Blur del mapa al buscar** — Alejandro cree que ya está bien; pendiente
  confirmación final suya antes de cerrarlo del backlog.
- [ ] **Próximo hito acordado:** hacer un build de **TestFlight** para mostrar
  Patio a otras personas desde su celular, una vez cerrada esta ronda (magic
  link real probado, recorte de galería y blur del mapa confirmados). Antes de
  proponerlo formalmente: confirmar rama activa y agrupar los cambios ya
  probados en simulador/device, por economía de builds EAS (ver `CLAUDE.md`).

## CICLO 2026-07-22 — Gobernanza de docs + homologación Apple + fixes Fondero

- [x] Auditoría completa de los 53 `.md` del repo (contenido, no solo fecha) —
  3 agentes en paralelo, ver `docs/DOCS_AUDIT_2026-07-22.md`. 4 legacy borrados
  (`AGENT.md`, `FLOW_V2.md`, `PRODUCT_PRINCIPLES.md`, `SCREENSHOT_INDEX.md`),
  `PATIO_PRD.md` archivado con banner, `ROADCONTROLLER.md` corregido.
- [x] Agentes: `foodie-ops` creado (explorar/ficha/favoritos/vistos/cuenta/reseña,
  no tenía dueño); `fondero-ops` ampliado con Edge Functions + migraciones.
- [x] Sistema tipográfico real vs. documentado reconciliado: `CLAUDE.md` decía
  SF Pro Display + solo pesos 900/300; el código real usa `Fonts.brand` (Plus
  Jakarta) + 900/700/300. Corregido en `CLAUDE.md`/`DESIGN_SYSTEM.md`; borrado
  `Type` en `lib/theme.tsx` (escala muerta, 0 usos).
- [x] Color de botones homologado con cita real de Apple HIG (`color.txt`):
  la única acción de confirmación prominente por pantalla lleva el acento
  naranja; el resto se queda neutro. Corregido `perfil-editar.tsx` (era blanco).
- [x] Email de magic link (`supabase/templates/magic-link.html`) rediseñado con
  paleta vigente; corregida violación de marca (`"¿Qué hay hoy?"` y
  `"Saaaaaaabes."` estaban separados, ahora van juntos). Sigue sin instalarse
  en Supabase Dashboard — pendiente de Alejandro.
- [x] `menu-composer.tsx`: pills de "Agregar sección" ahora son revelación
  progresiva real (abre y cierra, no solo abre); secciones nuevas nacen sin
  nombre pre-llenado (antes decían "SECCIÓN 6"/"MENÚ DE HOY" como si fuera
  contenido real); placeholder de la primera sección dice "PRIMER TIEMPO".
- [x] Feedback de guardado homologado (haptic + check visual) en
  `saveDraft`/`publish` (menú) y `handleSaveAll` (perfil) — antes solo uno
  de los dos tenía feedback, y sin haptic.
- [x] Historial: agregar **eliminar menú** (no existía); quitada fecha
  duplicada en el título por defecto; ícono del tab cambiado de
  `stats-chart-outline` a `receipt-outline` (coherente con "tus menús");
  botón "+ Menú nuevo" agregado (dentro del alcance del pulgar, no arriba a
  la derecha); "Nombrar" → "Renombrar"; eyebrow "PUBLICACIONES" → "TUS MENÚS".
- [x] `menu-editar.tsx`: cerrar/tache regresa a `/historial`, no a `/menu`.
- [x] Bug real corregido: `saveDraft` podía fallar en silencio y la UI decía
  "Guardado" sin verificar — ahora `saveLocalMenu` devuelve éxito/fallo y se
  avisa si de verdad falla.
- [x] Confirmado con Alejandro 2026-07-23: el bug de "guardado que no aparece
  en historial" quedó resuelto — cualquier menú que guarda o crea se queda
  guardado. Ver CICLO 2026-07-23 arriba.
- [ ] Anotado para el futuro (no implementado): los textos tipo kicker/hint
  fijos (ej. "Publica lo que vendes hoy...") deberían comportarse como hints
  temporales de primera vez, no quedar fijos — extender `lib/hints.ts`.

## PENDIENTES POR URGENCIA — corte 2026-07-16

### Memoria durable — corte 2026-07-18

- [x] Actualizar el esquema técnico vigente en `docs/ARCHITECTURE.md`.
- [x] Crear esquema maestro de producto y producción en `docs/PATIO_SYSTEM_MAP.md`.
- [x] Guardar notas de recurrencia, Airbnb, IA, Voronoi, incentivos, estatus,
  comunidades, gobernanza y privacidad en
  `docs/PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md`.
- [x] Añadir entrada directa “Elige de Fotos” con selector nativo de galería.
- [x] Corregir lectura IA descartada cuando no existe precio único — la Edge
  Function ahora normaliza siempre `precio`, secciones y platillos; el cliente
  conserva además los precios individuales. Desplegado y smoke test OK 2026-07-18.
- [ ] QA iPhone de cámara/galería y consolidar cambios locales.
- [ ] Siguiente bloque recomendado: modelo `lastPublishedAt` + estados de actividad.
- [x] Primera rebanada Patio Smart: relato libre → extracción estructurada → revisión
  → editor de perfil; Edge Function desplegada y smoke test OK 2026-07-18.
- [x] Patio Smart v2: revisión editable + preguntas de faltantes una por una,
  con “Después”; función desplegada y smoke test OK 2026-07-18.
- [x] Reencuadre panorámico Patio Smart: onboarding solo en primer acceso, categoría
  interna oculta, pagos sin repetición, horario verificable día por día, guardado
  directo y salida a Hoy. Edge Function v3 desplegada 2026-07-18.
- [x] Alta v4: IA invisible en el copy, dictado del teclado como entrada principal,
  escritura secundaria y flujo de cuatro pasos sin preguntas duplicadas; horario
  multiselección + presets + resumen abierto/cerrado. 2026-07-19.
- [x] Corrección QA v5: retirar micrófonos del alta y mapa hasta que exista voz real;
  copy “Confirma tu información”; horario independiente por día con estados visibles
  y atajos opcionales. Recargado en iPhone 2026-07-19.
- [x] Corrección panorámica v6: retirar “Cuéntanos de tu negocio” y extracción previa;
  comenzar directamente en datos/pagos, después horarios y resumen. Cada dato se
  solicita una sola vez. Recargado en iPhone 2026-07-19.
- [x] Alta v7 canónica: elegir intención primero; negocio = correo → nombre →
  días/horarios → guardar → celebración → primer menú. Sin relato, pagos,
  descripción, ubicación ni revisión duplicada. 2026-07-19.
- [x] Horarios v7: días binarios de un toque, presets, ruleta nativa en intervalos
  de 15 minutos y conservación de horas al cerrar/reabrir durante la edición.
- [x] Persistencia v7: solo nombre + horario, guardado antes de celebrar, sin borrar
  campos diferidos y sin bloquear 15 días el primer nombre.
- [x] QA simulador v7: ancho iPhone, teclado visible, ruleta, cierre y Dynamic Type
  normal/máximo; sin viudas en el recorrido.
- [x] Enrutamiento v7: la introducción conserva intención Foodie/Fondero; activar,
  omitir o cerrar avisos continúa al destino correcto. También se eliminó la
  carrera al persistir el rol y se blindaron Cuenta, acceso y magic link.
- [x] Alta v8 HIG: nombre sin ejemplo flotante, ubicación como dato esencial,
  horarios con selector compacto anclado al campo (sin sheet inferior), CTA
  compactos sin bloques naranjas y cierre centrado en el nombre del negocio.
- [x] Persistencia v8: dirección y coordenadas se guardan junto con nombre y horario
  cuando están disponibles; la dirección manual no bloquea el alta si el
  geocodificador falla temporalmente.
- [x] Flujo v9: introducción visual → intención por resultado; avisos solo en la
  rama “Ver qué hay hoy” y acceso/alta directo desde “Publicar lo que preparo”.
- [x] Alta v9: pagos como cuarto paso ligero y persistencia conjunta con nombre,
  ubicación y horario.
- [x] Sistema v9: alta y “Editar mi negocio” comparten editor canónico de días,
  selector horario compacto y pagos. La ruleta confirma y cierra tras 1.1 s sin
  movimiento.
- [x] QA simulador v9: introducción/intención, rama Fondero, rama Foodie/avisos,
  alta completa con pagos y edición de perfil.
- [x] Pulido HIG del recorrido de primera vez (sesión 2026-07-19 tarde):
  animación de cierre de la ruleta, ley global del switch de lado (final de
  Cuenta/Mi Patio en tinta neutra), arco verbal del onboarding por audiencias,
  avisos con texto abajo y copy sin redundancia, flujo de foto sin recorte
  cuadrado + cancelar lectura + salidas en diálogos, flujos Maestro 02/15
  actualizados y verdes en simulador. Ver HANDOFF sección superior.
- [x] Editor de horarios — simetría real (2026-07-20, sesión en vivo en iPhone):
  quitado `marginLeft:-8` que desalineaba picker/etiqueta; fila ABRE/CIERRA
  pasa a reflexión real (bordes opuestos, no dos columnas izquierda-alineadas);
  remount del picker compacto usa doble `requestAnimationFrame` + easing para
  quitar el glitch al autocerrar tras 1100ms.
- [x] Editor de horarios — simetría bilateral + ruleta centrada (2026-07-20,
  perfeccionamiento): composición bilateral por día (nombre/`→` en la mediana,
  ABRE/CIERRA en mitades idénticas), pills de día con texto ópticamente
  centrado y blancos táctiles de 44pt, ancho de hora 104pt para no chocar
  cápsulas nativas, ruleta nativa `spinner` en superficie centrada de 320pt
  (apertura/cierre con marco y padding idénticos). `ESSENTIAL_DESIGN_PRINCIPLES.md`
  reescrito contra la transcripción oficial WWDC17 802 (no solo títulos de
  slides); corrige Mortimer→mental model y separa alineación de simetría.
  Maestro `13-alta-negocio`/`16-editar-perfil-negocio` verdes; capturas nuevas
  en `maestro/screenshots/13-horarios*.png`.
- [ ] QA iPhone físico: confirmar que la simetría de horarios y la animación
  del picker (remount sin glitch) ya se sienten resueltas — pendiente explícito
  de la sesión 2026-07-20 (ver `docs/STATE.md`).
- [ ] QA iPhone físico v8: nombre, ubicación, teclado, días, horas compactas,
  guardar y primer menú. Incluir: animación de ruleta, recorrido primera vez
  con copy nuevo, foto vertical sin recorte.
- [ ] Push real por publicación: tokens, guardados remotos, evento de publicación y
  entrega. Hasta entonces el onboarding promete únicamente recordatorio diario.
- [ ] Seguir `docs/AIRBNB_TO_PATIO_SYSTEM.md` para perfil, guardados, reseñas,
  comparación, explicación y soporte contextual.

### A. Bloquean funcionalidad (requieren a Alejandro)

- [x] Desplegar `read-menu` en Supabase + secreto `ANTHROPIC_API_KEY` — RESUELTO
  2026-07-18: proyecto reactivado (estaba pausado por plan Free), función
  desplegada, llave NUEVA registrada como secreto (rotación de facto; falta solo
  desactivar la llave vieja "Patio" en console.anthropic.com). Smoke test OK.
- [ ] Confirmar magic link real: `patio://login-callback` en Supabase Dashboard + iPhone.
- [ ] QA iPhone completo: magic link, cámara/galería, IA, GPS, póster/share, push, mapas.

### B. Diseño — pantallas/flujos (escoger una y cerrarla)

- [~] Onboarding/intro — RECONSTRUIDO 2026-07-17 en código: botánica full-bleed
  (la imagen gana), crossfade auto tipo ruleta + Ken Burns, barras de progreso
  estilo stories, texto editorial abajo, CTAs chicos en glass. Verificado en
  simulador (3 slides). Falta revisión visual de Alejandro en device.
  OJO QA: tap de Maestro en `DEV · Onboarding` no navega (¿quirk sim o
  regresión de la entrada?) — confirmar botones de entrada en iPhone.
- [~] Entrada + login/sesión — `fondero-acceso.tsx` CERRADO 2026-07-18: Alejandro
  eligió mix A+B (botánica full-bleed + logo y par de marca al centro, campo en
  glass abajo); variantes y switcher DEV eliminados. Copy a identidad verbal
  ("Ver lo de hoy →", fuera "cocinas"). Entrada `index.tsx` rediseñada
  2026-07-18: botánica full-bleed (cempasúchil), logo anclado al centro exacto
  con par de marca debajo, CTA glass, barra DEV en pills discretas. Onboarding
  sin auto-avance (solo Continuar/tap), sin barras de progreso (tache glass),
  sin contornos en cápsulas.
- [ ] Contrato visual mínimo — tokens, tipografía, superficies, componentes permitidos.
- [ ] Pantalla maestra Explorar → propagar sistema (Foodie primero, luego publicación).
- [ ] Póster de compartir: recomponer (logo P ilegible, espacio raro arriba).
- [ ] Spinner de visión estilo ChatGPT (shimmer progresivo).
- [ ] Blur del mapa al buscar: algo vivo (botánica, patios prendiéndose).
- [ ] Guardados organizados (categoría/cercanía/abierto hoy).
- [ ] "Botonzote" naranja de Editar mi negocio: bajar jerarquía.
- [ ] Navegación simétrica Foodie↔Fondero (incl. onboarding al cambiar rol).
- [ ] Recorte de galería libre (el nativo cuadrado se siente "chafa").
- [ ] Captura robusta: catálogo de casos reales de foto de menú y respuesta de la visión.
- [x] Foto→menú SOLO con cámara del sistema — RESUELTO 2026-07-18: se eliminó la
  pantalla intermedia ("Patio lo lee" + tarjeta naranja); entrar a foto-menu
  lanza directo la cámara nativa iOS; cancelar regresa al menú; fallo de
  lectura ofrece "Otra foto" / "Escribirlo a mano".
- [x] BUG lectura de menú — RESUELTO 2026-07-18: las fotos de cámara (12MP) se
  mandaban SIN redimensionar y excedían el límite de la API de visión → fallo
  silencioso. Ahora resize a 1600px + compress 0.8 (~300KB). Backend verificado
  OK con imagen de prueba real (secciones/platillos/precio perfectos).
- [ ] Botones glass del onboarding: no convencen del todo a Alejandro (aunque
  prefiere glass vs contorno) — explorar variante en otra iteración.

### C. Al final (decisión 2026-07-16: no urgente)

- [ ] Rotar la clave Anthropic anteriormente expuesta.
- [ ] Generar más botánicas hero con `FLORES_ENDEMICAS_PROMPT.md` (hoy son 8).
- [ ] Features futuras (ver sección al fondo).

## CICLO 2026-07-16 — Limpieza autónoma previa a QA

- [x] Retirar `borderStyle: dashed` de ficha y reseña para eliminar el warning nativo.
- [x] Eliminar `EXPO_PUBLIC_ANTHROPIC_API_KEY` del entorno local.
- [x] Confirmar que las métricas ficticias `312 vistas` / `+18%` ya no existen en código.
- [x] Ignorar el estado temporal de Supabase CLI (`supabase/.temp/`).
- [x] Optimizar botánicas hero: 8 PNG (13 MB) → JPEG q80 (2 MB), 941×1672 intactas;
  referencias actualizadas en onboarding, favoritos, vistos, push-prompt,
  fondero-acceso y patio/[id]. Typecheck y lint verdes.
- [x] Borrar `app/.perfil.tsx.swp` — swap viejo de vim (proyecto "lafondita");
  el ToggleSwitch que contenía ya vive en `components/toggle-switch.tsx`.
- [x] `npx expo install --check` — dependencias al día; `@types/react-native`
  ya no es dependencia directa.
- [x] Autenticar Supabase CLI, desplegar `read-menu` y registrar el secreto nuevo —
  RESUELTO 2026-07-18 (ver sección PENDIENTES POR URGENCIA).
- [ ] Ejecutar QA nativo en iPhone y confirmar que desapareció el warning visual.
- [ ] Rotar la clave Anthropic anteriormente expuesta — decisión 2026-07-16 (Alejandro):
  va AL FINAL, no es urgente.

## CICLO 2026-07-09 — Cierre en código

- [x] **Descartar Figma Make como fuente final** — v01/v02 quedan como referencia;
  el intento v03 no se incorpora porque reconstruyó estados, pero perdió la identidad
  visual de Patio.
- [x] **Baseline técnico** — `npm run typecheck` y `npm run lint` pasan.
- [x] **Auditoría ejecutable de arquitectura** — contratos críticos corregidos y
  recorridos Foodie/Fondero comprobados con Maestro.
- [x] **Alinear salud Expo** — actualizar los ocho patch versions reportados por
  `npx expo install --check` y retirar `@types/react-native` si sigue siendo directo.
- [ ] **Definir contrato visual mínimo** — tokens, tipografía, navegación, superficies,
  estados y componentes permitidos; rescatar únicamente lo útil de v01/v02.
- [x] **Crear línea separada de reconstrucción** — trabajo activo en
  `rebuild/patio-final`; Patio Vivo permanece recuperable.
- [ ] **Implementar una pantalla maestra** — Entrada o Explorar; no ampliar sin revisión
  visual de Alejandro.
- [ ] **Propagar sistema aprobado** — completar primero el recorrido Foodie y después
  el recorrido de publicación.
- [x] **P0 código de producción** — `lib/vision.ts` invoca la Edge Function
  `read-menu`; la clave ya no se consume desde React Native.
- [x] **P0 despliegue IA** — RESUELTO 2026-07-18: `read-menu` desplegada, llave
  nueva como secreto de Supabase; solo falta desactivar la llave vieja en consola.
- [x] **QA simulador** — flows Maestro `01`–`12`; publicación y detalle pasan E2E.
- [ ] **QA iPhone** — magic link, cámara/galería, IA, GPS, poster/share, push y mapas.

## CICLO 2026-07-08 - Estabilizacion arquitectura

- [x] **Rollback conservador de cambios riesgosos** - se sacaron los experimentos recientes en `explorar`, `foto-menu`, `patio/[id]`, `favoritos`, `preview` y docs que marcaban features experimentales como resueltas. Ver `docs/DIFF_AUDIT_2026-07-08.md`.
- [x] **Diagnostico de arquitectura Patio** - mapa funcional de app real vs Make/Tahoe en `docs/ARCHITECTURE_AUDIT_2026-07-08.md`.
- [x] **Primer controller Foodie** - `app/explorar.tsx` ya delega datos, busqueda, favoritos, seleccion, seed demo y Share a `lib/controllers/useFoodieExploreController.ts`. La pantalla queda principalmente como render + animacion.
- [x] **Segundo controller: Patio Detail** - `app/patio/[id].tsx` ya delega carga de patio, menú vivo, favorito, rating, Share, avisos, horarios derivados y CTAs a `lib/controllers/usePatioDetailController.ts`.
- [x] **Tercer controller: Fondero Menu Draft** - `components/menu-composer.tsx` ya delega estado del draft, secciones, platillos, publicar, persistencia local y Supabase a `lib/controllers/useFonderoMenuDraftController.ts`.
- [x] **Cuarto controller: Fondero Profile** - `app/perfil-editar.tsx` ya delega Supabase, AsyncStorage, horario semanal, pagos, dirty-state, GPS, logout y hint a `lib/controllers/useFonderoProfileController.ts`.
- [x] **Quinto controller: Foto Menu State** - `app/foto-menu.tsx` ya delega permisos, picker, normalizacion JPEG, vision, conversion a `MenuData` y estado `idle -> processing -> review` a `lib/controllers/useFotoMenuController.ts`.
- [x] **Sexto controller: Favoritos Foodie** - `app/favoritos.tsx` ya delega ids guardados, fetch de patios y conteo de menú hoy a `lib/controllers/useFavoritePatiosController.ts`.
- [x] **Séptimo controller: Historial Fondero** - `app/historial.tsx` ya delega seed demo, merge local/Supabase, reuso, renombrado y helpers de título/fecha a `lib/controllers/useMenuHistoryController.ts`.
- [x] **Octavo controller: Vistos Foodie** - `app/vistos.tsx` ya delega ids vistos y fetch de patios a `lib/controllers/useViewedPatiosController.ts`; `todayDish` vive en `lib/controllers/patioListHelpers.ts`.
- [x] **Noveno controller: Cuenta Foodie** - `app/cuenta.tsx` ya delega stats, sesión, sign out y entrada DEV Fondero a `lib/controllers/useFoodieAccountController.ts`.
- [x] **Décimo controller: Preview Fondero** - `app/preview.tsx` ya delega carga de menú, negocio, secciones, fecha, precio y share/capture a `lib/controllers/useMenuPreviewController.ts`.
- [x] **Auditoría integral app** - typecheck, lint y export iOS/Android pasan; diagnóstico completo en `docs/APP_AUDIT_2026-07-08.md`.
- [x] **Simulador DEV end-to-end** - Explorar ya muestra lista de lugares desde el inicio; búsqueda consulta menús demo/locales; publicar menú en Fondero crea/actualiza `Mi Patio Demo` para verlo luego desde Foodie, detalle, guardados y búsqueda.
- [x] **Explorar tipo mapa/capas** - sheet de `Cerca de ti`/`Guardados` ya se puede ocultar con tap en mapa, botón `Ocultar` o swipe hacia abajo; búsqueda y guardados viven como botones flotantes estilo mapa.
- [ ] **Siguiente panorámico real** - QA manual en iPhone + revisar navegación completa Foodie/Fondero antes de rediseñar Make/Tahoe.
- [x] **P0: sacar IA de cliente antes de producción** - movida a
  `supabase/functions/read-menu`; despliegue/secret registrados como tarea externa.
- [ ] **P0: confirmar magic link real** - validar `patio://login-callback` en Supabase Dashboard y en iPhone con correo real.
- [x] **P1: corregir expo-doctor** - RESUELTO 2026-07-16: `npx expo install --check` reporta dependencias al día; `@types/react-native` ya no es directo.
- [x] **P1: limpiar archivo temporal** - RESUELTO 2026-07-16: `app/.perfil.tsx.swp` borrado (contenía un ToggleSwitch ya existente en `components/toggle-switch.tsx`).

## CICLO 2026-07-07 — Feedback de Alejandro en device (transcript de voz)

Recorrido completo Fondero + Foodie en iPhone con la dev build del 4 jul. Lo que gustó:
tab bar y botones, inicio Fondero (foto/a mano/anterior), spinner de visión, resultado editable,
"Editar mi negocio" rediseñado, horarios L-D, pantallas Foodie, guardados, perfil.

### Bugs (código, arreglar directo)

- [x] **Historial/"Usar menú anterior" vacío** — RESUELTO 2026-07-07: nuevo `lib/menu-history.ts` guarda cada menú publicado en AsyncStorage (tope 30); `historial.tsx` mezcla local + Supabase (Supabase manda si hay sesión). Causa original: sin sesión no había UUID y `saveMenuHoy` se saltaba en silencio.
- [x] **Manifiesto huérfano** — RESUELTO 2026-07-07: fila "Nuestro manifiesto" en Cuenta (Foodie) y Mi Patio (Fondero).
- [x] **Buscador Foodie (explorar) no permite buscar** — RESUELTO 2026-07-07: `autoFocus` en el TextInput (el `setTimeout(80)` perdía la carrera en device → sin teclado, barra oculta tras la tab bar) + tocar el mapa cierra la búsqueda.
- [x] **Toggle "Modo oscuro" desfasado en Mi Patio (Fondero)** — RESUELTO 2026-07-07: nuevo `components/toggle-switch.tsx` compartido reemplaza el Switch nativo.
- [x] **Toggle "Modo oscuro" en Cuenta (Foodie) sale VERDE** — RESUELTO 2026-07-07: el toggle compartido usa el accent del tema (naranja) en ambos lados.

### Mejoras UX (código)

- [x] **Cámara/galería nativas en foto-menu** — RESUELTO 2026-07-07: la cámara custom de `expo-camera` se reemplazó por `ImagePicker.launchCameraAsync` con `allowsEditing` (cámara nativa iOS con zoom y recorte); "tomar otra foto" desde revisión reabre la nativa. Galería ya era nativa con recorte.
- [ ] **Spinner de visión estilo ChatGPT** — el actual gusta, pero quiere el patrón de "generando imagen" de ChatGPT (progresivo/shimmer).
- [~] **Modo demo (dev)** — PARCIAL 2026-07-07: `seedDemoHistory()` siembra 3 menús de ejemplo en días pasados (solo `__DEV__`, solo si el historial local está vacío). Falta evaluar seed de guardados/vistos Foodie y estados bloqueados.
- [ ] **Captura robusta: casos de uso de foto** — cubrir y categorizar todos los casos reales antes de lanzar: menú manuscrito, pizarrón, foto chueca/borrosa, poca luz, menú muy largo, varios menús en una foto. Definir qué hace la visión en cada caso y qué feedback recibe el Fondero.

### Marca (regla no negociable)

- [x] **Póster: "¿Qué hay hoy?" y "Saaaaaaabes." deben ir JUNTOS** — RESUELTO 2026-07-07: la firma del póster ahora dice "¿Qué hay hoy? Saaaaaaabes."; se quitó el claim suelto de arriba-derecha. Logo sigue arriba-izquierda (decisión pendiente).

### Tanda 2 (transcript 2 · resuelto 2026-07-07)

- [x] **Onboarding visible** — botón `DEV · Onboarding` en la entrada.
- [x] **Manifiesto actualizado** — fuera "cocinas" como paraguas: "la fonda, la taquería, el puestecito de elotes, la hamburguesa de la esquina"; "Si tú eres quien cocina".
- [x] **"Sin resultados" apresurado** — la búsqueda ahora exige 3 letras + debounce 300ms + espera resultados antes de declarar vacío.
- [x] **Viudas** — `noWidow()` en título y cuerpo del empty state de búsqueda.
- [x] **Placeholder consistente** — el buscador activo dice "¿Qué hay hoy?" (ya no cambia a "mole, enchiladas…").
- [x] **Datos sintéticos Foodie** — `lib/demo.ts`: 7 lugares variados (elotes, hamburguesas, mariscos, comida corrida, pozolería, repostería, jugos) + seed de ~6 guardados y ~8 vistos. Solo `__DEV__`; se inyectan vía `fetchPublicFonditas`/`fetchFonditaById`.
- [x] **Tab bar auto-hide estilo Instagram** — cableado en historial y perfil (ya existía en menu/cuenta/favoritos).

### Tanda 2 (pendientes)

- [ ] **Póster: rediseñar composición** — el logo P no se distingue, espacio raro arriba-derecha. "¿Qué hay hoy? Saaaaaaabes." abajo SÍ le gustó. Candidato Figma Make.
- [x] **Nombrar menús en historial** — RESUELTO 2026-07-08: default fecha + platillos, editable con lápiz, persistido localmente por fecha y conservado al mezclar local + Supabase.
- [ ] **Recorte de galería "chafa"** — el actual es el editor nativo de iOS pero de marco cuadrado; investigar recorte libre como el de la cámara.
- [ ] **Blur del mapa al buscar se ve muerto** — explorar algo vivo: fotos botánicas, "planta creciendo", o patios prendiéndose conforme escribes. Diseño/Make.
- [ ] **Navegación simétrica total entre perfiles** — que Foodie y Fondero puedan recorrer TODOS los escenarios (incl. onboarding/registro al cambiar de rol). DECISIÓN confirmada: UNA app hoy, dos al escalar (research Uber).
- [ ] **Verificar "Cerrar sesión" en Fondero** — Alejandro reporta que no le aparece (en DEV sin sesión podría estar oculto).
- [ ] **Guardados organizados** — por categoría/cercanía/abierto-hoy; ya hay datos demo para diseñarlo.

### Decisiones de diseño (validar con Alejandro / explorar en Figma Make)

- [~] **Intro/onboarding de la app** — reconstruido en código 2026-07-17 (ver
  sección PENDIENTES POR URGENCIA); pendiente visto bueno de Alejandro.
- [ ] Logo de Patio arriba-izquierda en el póster — ¿es el lugar idóneo?
- [ ] "Botonzote" naranja de Editar mi negocio — ¿bajarle jerarquía?


## REDISEÑO EDITORIAL — listo, espera aterrizaje visual

- [x] **Dirección editorial completa** producida en `docs/design/EDITORIAL_REDESIGN.md` (Ciclo 2). Naranja=marca confirmado; flujo NO tocado.
- [x] **Paleta confirmada por producto:** se conserva la paleta actual de la app (`lib/colors.ts`) sin introducir amarillo ni un segundo acento cálido.
- [x] Brief de rediseño Figma creado en `docs/design/FIGMA_REDESIGN_BRIEF.md`.
- [x] Blueprint previo a Figma creado en `docs/design/REDESIGN_BLUEPRINT_V1.md`.
- [x] Registro de versiones creado en `docs/design/DESIGN_VERSION_REGISTRY.md` (`Patio Vivo`, `Patio Tahoe`, `Patio Agent`).
- [ ] Aterrizar bases de diseño en Figma: tokens, componentes, jerarquía, glass, corners Tahoe-style y mockups clave.


## CICLO ACTUAL — QA + Claude Design handoff

### Bloqueado por acción humana

- [x] ~~Pasar screenshots/flujo/definición/refs a Claude Design~~ — **resuelto in-session** (Ciclo 2). El rediseño editorial se hizo aquí leyendo los screenshots reales directamente. Ver `docs/design/EDITORIAL_REDESIGN.md`. Ya no hay cuello de botella de "sesión externa".
- [x] ~~Handoff de diseño a herramienta externa~~ — **resuelto vía Figma Make** (Ciclo 4). Diseño completo exportado a `design-source/figma-make/v01/`, aislado del build. Sistema de versiones en `design-source/README.md` + `VERSIONS.md`.
- [~] **Cerrar el diseño en Figma Make** (en progreso, Alejandro). Sigue iterando visual + estructura + copy. La traducción a React Native NO inicia hasta que el diseño quede cerrado.

### QA humano / dispositivo

- [ ] Verificar build iOS en dispositivo real: flujo Fondero -> Foodie completo.
- [ ] Probar magic link Fondero; si falla, capturar texto de diagnóstico visible en `/login-callback`.
- [ ] Probar permisos reales de cámara/galería.
- [ ] Probar GPS real en `perfil.tsx` con "Marcar en el mapa".
- [ ] Registrar UDID de iPhone para builds internos si aplica.
- [ ] Configurar API key Google Maps restringida antes de builds Android reales.

### Puede hacer agente antes de mockups

- [x] Auditoría visual humana realizada: la app está funcional, pero no satisface la dirección premium/minimalista buscada.
- [ ] Preparar sistema visual homologado para rediseño: paleta actual, typography 900/300, glass, spacing, Tahoe-style corners, componentes reutilizables.
- [ ] Investigar si Supabase Dashboard tiene `patio://login-callback` en Redirect URLs si magic link falla.

## POST-SISTEMA VISUAL / FIGMA

> Fuente de diseño: `design-source/figma-make/v01/` (export de Figma Make, web — traducir a `.tsx`).
> **No iniciar hasta que el diseño esté cerrado** (ver tarea "Cerrar el diseño en Figma Make").

Implementar mockups pantalla por pantalla. Orden recomendado:

1. [ ] `app/explorar.tsx` — radar/spinner, top bar, pins, bottom sheet, search-first map.
2. [ ] `app/patio/[id].tsx` — ficha de fondita, menú real, trust signals, acciones.
3. [ ] `app/index.tsx` — entrada limpia sin grid DEV.
4. [ ] `app/foto-menu.tsx` — captura premium y estado de procesamiento.
5. [ ] `app/menu.tsx` — editor con respiro sin tocar bloque de precio.
6. [ ] `app/preview.tsx` / `app/share.tsx` — revisar si `share` sigue siendo ruta necesaria.
7. [ ] `app/cuenta.tsx` / `app/perfil.tsx` — settings con personalidad y baja fricción.

## FEATURES FUTURAS

- [ ] Reseñas del propio Patio para el Fondero — hoy solo Foodie puede reseñar
  (`app/resena/[id].tsx`); no existe lectura de esas reseñas del lado Fondero.
  Ligado a la idea del panel de Historial que evoluciona con estadísticas +
  reseñas después de la primera vez (planteado 2026-07-23).
- [ ] Textos tipo kicker/explicación (ej. "Publica lo que vendes hoy. Patio lo
  ordena por ti." en Hoy) son en realidad guía de onboarding — deberían
  comportarse como hints temporales que se retiran solas tras las primeras
  veces de uso, no quedar fijas en la pantalla para siempre (planteado
  2026-07-22). Ya existe el patrón `lib/hints.ts` (`shouldShowHint`/
  `markHintSeen`) usado en otras pantallas — evaluar extenderlo aquí.
- [ ] Ruta dentro del mapa en vez de abrir Apple/Google Maps.
- [ ] Zoom-out automático cuando una búsqueda tiene matches dispersos.
- [ ] AGENTE_VOZ MVP texto con búsqueda live de menús.
- [ ] Favoritos: swipe to delete o long press.
- [ ] Explorar: filtro por colonia/zona.
- [ ] Onboarding: enganchar como first-launch real o dejarlo solo dev/beta.
- [ ] Notificaciones push: "hoy hay mole en tu fondita guardada".
- [ ] Estrategia de geoceldas H3/geohash/S2 antes de tracking fino.

## REGISTRO DE BUILDS

| Build | Fecha | Highlights |
|---|---|---|
| 1.0.0 (42) | 2026-05-16 | Primer submit, error duplicate build number |
| 1.0.0 (43) | 2026-05-16 | Role-picker, blur Halo, mic placeholder, foto-menu Fondero |
| 1.0.0 (44) | 2026-05-16 | Cleanup, botones zombi arreglados, cerrar sesión real, email oficial |
| 1.0.0 (45) | 2026-05-17 | Blur baja al filtrar, sheet sobre teclado, dev nav completa, cuenta simplificada, diag magic link |
| 1.0.0 (47) | 2026-07-23 | Perfil/Cuenta reagrupados por HIG (grupos con label, status separado de dirección), pantalla nueva Reseñas (App Store pattern, datos sintéticos DEV). Submit automático a TestFlight vía `eas build --auto-submit`, procesando en Apple. |

## REFERENCIAS VISUALES

Las referencias aspiracionales viven en `docs/design/references/`.

- `GRID_PLATILLOS`: futuro, cuando haya fotos reales de platillos.
- `DASHBOARD_FONDERO`: futuro, métricas y dark tech para Fondero.
- `FICHA_EDITORIAL`: futuro, ficha de fondita más editorial cuando haya fotos reales.
- `REDES_LANZAMIENTO`: assets de marketing/lanzamiento.
- `GLASS_ORGANICO`: sistema transversal de texturas/marca.
- `AGENTE_VOZ`: futuro, input natural/orbe cuando haya masa crítica.
- `TINDER_PLATILLO`: futuro, necesita fotos y densidad de platillos.

## REGLAS PARA AGENTES

1. Una tarea a la vez, sin refactor extra.
2. Validar con `npx tsc --noEmit` antes de cerrar cambios de código.
3. No tocar el bloque de precio en `menu.tsx`.
4. No modificar ni parafrasear `"Saaaaaaabes."`.
5. Leer primero `CLAUDE.md`, `docs/ROADCONTROLLER.md`, `docs/HANDOFF.md` y `docs/STATE.md`.
