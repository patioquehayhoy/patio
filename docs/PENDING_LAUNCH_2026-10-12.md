# Pendientes y roadmap de lanzamiento — actualizado 2026-10-26

## Ejecución solicitada por Alejandro — 2026-10-26

- Domicilio y cierre/publicación del aviso quedan **al final**, por petición del usuario.
- Monument + Neue Montreal se conservan en la rama actual; Alejandro prefiere
  posponer el pago. La licencia disponible sigue siendo de prueba/uso personal;
  no se registra compra ni autorización comercial inexistente.
- [x] Implementar acceso por código de 6 dígitos en ambos roles y preparar
  las dos plantillas de correo. [Detalle y límites](REVIEWER_ACCESS_2026-10-26.md).
- [x] Verificar que «Otro» persiste el texto en `categorias`; regresión automatizada.
  Consulta de recopilado preparada en `scripts/backend/custom-category-report.sql`.
- [x] Llevar el catálogo aprobado y cuotas propuestas a la pantalla Tu plan;
  preparar SDK/checkout/restauración, con cobro apagado.
- [ ] Aplicar plantillas Auth, verificar entrega y crear acceso real de revisión.
- [ ] Conectar tiendas/RevenueCat e implementar cuotas y beneficios en servidor.
  Los límites antiabuso actuales no equivalen a planes. [Detalle](BILLING_SETUP_2026-10-26.md).
- [ ] Google: activar 2FA en la cuenta de Patio; Firebase bloquea la consola
  de `contacto.parco@gmail.com` hasta completarlo. No hay sesión de gcloud.
  EAS production consultado: sin variables; Maps/Firebase siguen sin configurar.
- [ ] GitHub: cuenta `T1Alejandro` sin permiso `push`, confirmado por conector
  y dry-run HTTP 403. Hace falta autenticar cuenta con escritura.
- [ ] Supabase: CLI reporta producción y staging INACTIVE; hosts públicos no
  resolvieron. Panel sin sesión. No afirmar IA, push ni Auth real validados hoy.
- [ ] Gmail: conexión propuesta, no completada. Rutina diaria preparada en
  [soporte](SUPPORT_OPERATIONS_2026-10-26.md), sin automatización activa.
- [x] Corregir las 3 alertas moderadas: `decode-uri-component` 0.5.0 oficial,
  override de query-string y adaptación CJS/ESM por patch-package.
- [ ] Cerrar las 5 alertas altas heredadas de `node-forge` 1.4.0: sin versión
  corregida publicada. Auditoría final: **5 altas, 0 moderadas, 0 críticas**.
  CI conserva su gate. No se aplicó `audit fix --force`.
- [ ] Revocar clave legada en el proveedor: no confirmado. El código actual
  solo usa `ANTHROPIC_API_KEY` del servidor; eso no prueba revocación.

El detalle histórico siguiente se conserva como referencia; este bloque actualiza
su estado. El build firmado y QA física siguen pendientes.

Objetivo: iPhone y Android. Este es el checklist vigente; reemplaza pendientes
operativos de los cortes históricos. El lanzamiento público sigue pendiente.

**Lo que de verdad bloquea la publicación (repriorizado 2026-10-26 con Alejandro):**
1. URL pública de privacidad (obligatoria en ambas tiendas).
2. Acceso del revisor: código de 6 dígitos además del enlace y cuenta de revisión.
3. Candidato firmado y su QA en TestFlight/Google Play.
4. Tipografía publicable: salir con Plus Jakarta Sans (gratis, `rebuild/patio-final`)
   o comprar Monument/Neue Montreal antes. Nunca publicar las fuentes de prueba.
Lo demás (auditoría npm, push, IA real, branding) puede cerrarse después con
actualizaciones; no frenar el lanzamiento por ello.

Último cierre técnico: [prebuild](PREBUILD_CLOSEOUT_2026-10-24.md) y
[continuidad del 25 de octubre](HEADS_UP_2026-10-12.md). **196 pruebas de app**,
19 SQL y 12 de esquema aislado aprobadas. Exportaciones iOS/Android y builds
locales Release/Debug realizadas; DEV restaurado en iPhone. Eso no es un
candidato de tienda ni aceptación del recorrido completo. Auditoría npm y
configuración Android siguen pendientes.

## Completado

- [x] Supabase bajo la cuenta Patio como único Owner; proyecto visible `patio`.
- [x] Staging real preparado y 15 pruebas Auth/RLS/Storage/Edge aprobadas.
- [x] Producción actualizada con siete migraciones y cinco funciones con JWT.
- [x] Bibliotecas, mover/renombrar, filtros, selección y estados homologados.
- [x] Cards con columnas estables, estrella única y colonia · distancia.
- [x] Centrar ubicación en Mapa y recuperar navegación al cerrar resultados.
- [x] TypeScript/lint y 196 pruebas locales aprobados el 2026-10-25.
- [x] Cámara con pellizco para zoom; último corte sin título ni pastilla 1×.
- [x] Pulido compartido de Filtros/Listas, encabezados, iconos, colores y desvanecido.
- [x] Error al abrir Listas corregido con regresión; el usuario confirmó «ya quedó me parece».
- [x] Precio por platillo sin + y panel Nuevo menú con oscurecimiento sincronizado.
- [x] Elegir de Fotos corregido en código: cierre nativo antes del picker,
  recuperación sin cámara y regresiones automatizadas. QA física pendiente.
- [x] Zoom progresivo sin números; giros finales de Claude/Jev en PatioGiros
  junto con Ionicons (taco 2A y catálogo documentado).
- [x] Borrador de fichas preparado; soporte `quehayhoy.patio@gmail.com`.

Backend comprobado el 2026-10-09: [producción](PRODUCTION_PROMOTION_2026-10-09.md)
y [staging](STAGING_REHEARSAL_2026-10-09.md). No repetir login, migraciones,
asignación de dueños ni borrado de datos sintéticos para cerrar esta lista.

## 1. QA del usuario y estabilidad móvil

- [ ] Subir los commits locales y el cierre `335f36c` del 2026-10-18 a
  `rebuild/patio-final`, incluidos los commits posteriores de Claude.
  Dry-run de push revalidado el 2026-10-25: HTTP 403.
  GitHub confirma que la cuenta activa `T1Alejandro` tiene `push: false`.
  Autenticar una cuenta de Patio con escritura; conservar historia y rama,
  sin force-push ni cambio de propietario.

- [ ] Alejandro: buscar «mole», cerrar resultados con swipe, tocar Guardados/
  Cuenta y reabrir la misma búsqueda. Confirmar que vuelve la navegación y
  no se cierra Patio al inicio del iPhone; el cierre anterior sigue sin confirmar.
- [ ] Alejandro: comprobar cards con nombres/precios largos, con/sin sello,
  claro/oscuro, letra grande, teclado y margen inferior. Contrato y ejemplos:
  [columnas estables](CARD_COLUMNS_AUDIT_2026-10-12.md).
- [ ] Probar el centrado con ubicación concedida, aproximada, denegada y sin
  respuesta; Guardados y ficha omiten distancia si no se puede obtener.
- [ ] Completar recorridos Foodie/Fondero en iPhone y Android: acceso, guardar,
  listas/mover/renombrar, cámara/galería, publicar y recuperar tras fallo de red.

La confirmación del ajuste reciente de Listas queda registrada; no acredita
los recorridos completos anteriores. El usuario prueba en celular. USB fue
retomado con autorización y DEV restaurado; no repetirlo ni sustituir por
Release sin necesidad. Auditorías amplias siguen fuera de este cierre.

- [ ] Confirmar en iPhone/Android: Elegir de Fotos abre el selector, cancelar
  sale al historial, reintentar lectura conserva Fotos; cámara solo al elegirla.
- [ ] Confirmar en mapa lejano/medio/cercano: puntos sin números, búsqueda
  conservada, selección, snapshots y tacos/elotes legibles sin cierres.

## 2. Dependencias, Android e integraciones

- Verificación 2026-10-24: auditoría actualizada de 10 a **8 paquetes afectados
  (5 altos, 3 moderados, 0 críticos)** tras actualizar `fast-uri` 3.1.8 → 3.1.9
  y `undici` 6.28.1 → 6.29.1 en el lockfile. Parches Metro/maps reaplicados;
  TypeScript, lint y 189 pruebas aprobados. Quedan las cadenas de `node-forge`
  y `decode-uri-component`; no aplicar `audit fix --force` (propone cambios
  incompatibles de Expo/router). Release: 29 correctos, dos pendientes Android.
  Evidencia local: `/private/tmp/patio-check-20261024.log`.

- [ ] Resolver la auditoría npm conservando compatibilidad nativa y verificar
  otra vez. Última consulta 2026-10-24: **8 paquetes afectados, 5 altos, 3
  moderados, 0 críticos**. Son cadenas de dependencias, no 32 fallos independientes.
  `npm audit` sigue devolviendo 1; `npm run check` no sustituye esa auditoría.
  CI conserva su gate `npm audit --audit-level=high`; no desactivarlo para dar
  el release por aprobado.
- [ ] Confirmar el cierre de la rotación/revocación de la clave de proveedor
  legada `EXPO_PUBLIC_ANTHROPIC_API_KEY`, pendiente del roadmap anterior.
- [ ] Configurar y validar `GOOGLE_MAPS_ANDROID_API_KEY` y
  `GOOGLE_SERVICES_JSON` en el entorno Android candidato. Son los dos pendientes
  del control de release actual: 29 correctos, 0 errores.
- [ ] Comprobar APNs/FCM, recepción y apertura de avisos en ambos teléfonos;
  sesión cerrada/cambiada no debe recibir avisos ajenos.
- [ ] Ensayar entrega de magic link y retorno con app cerrada/abierta, enlace
  vencido/reutilizado y cambio de cuenta. Staging no probó entrega SMTP.
- [ ] Ensayar respuestas reales de IA y recuperación de errores/cuotas. Las
  funciones están desplegadas; el ensayo previo no hizo llamadas IA pagadas.

Logs de esta verificación: `/private/tmp/patio-npm-audit-20261012.json` y
`/private/tmp/patio-checkpoint-check-20261012.log`.

## 3. Privacidad, operación y tiendas

- [x] Operador legal: Alejandro como persona física (confirmado 2026-10-26).
- El cierre del aviso y domicilio se mueve al último bloque, por petición del usuario.
- [x] Contacto responsable ante tiendas: Alejandro; Claude/Codex apoyan con
  triaje y borradores de respuesta (decidido 2026-10-26).
- [ ] Conectar Gmail de `quehayhoy.patio@gmail.com` para la revisión diaria de
  reportes y completar moderación operativa.
  El soporte público aprobado sigue siendo `quehayhoy.patio@gmail.com`.
- [ ] Acceso del revisor (a cargo de Claude): hoy solo hay enlace mágico
  (`signInWithOtp`), que el revisor no puede abrir. Agregar código de 6 dígitos
  y documentar una cuenta de revisión con datos de prueba.
- [ ] Completar App Privacy/Data Safety,
  clasificación, regiones, contratos y accesos de Apple/Google.
- [ ] Generar un candidato firmado por plataforma después de resolver los
  gates anteriores. Verificar permisos, enlaces, mapas, push y bibliotecas
  Android de 16 KB en los artefactos finales.
- [ ] QA del candidato desde TestFlight/prueba de Google Play; capturas de
  esa versión, resultados registrados y correcciones de fallos.
- [ ] Confirmar requisitos vigentes en las consolas y obtener aprobación final
  antes del envío/publicación. El checkpoint Git no envía la app a tiendas.

Detalle: [checklist de distribución](STORE_RELEASE_READINESS.md) y
[borrador de fichas](STORE_SUBMISSION_DRAFT_2026-10-09.md).
No iniciar EAS ni publicación automáticamente desde esta actualización documental.

## 4. Después del candidato

- [ ] Incorporar una miniatura real del local en la zona superior del grid;
  definir origen/calidad de imagen y fallback manteniendo columnas y alturas.
- [x] «Otro» pide y guarda el giro escrito en el alta; regresión verificada
  el 2026-10-26. Falta ejecutar/programar el recopilado periódico de nuevas altas;
  consulta SQL de solo lectura preparada.
- [x] Icono de Tacos: Alejandro ajustó el trazo (2026-10-26, fuente `PatioGiros6`)
  y Ayuda acredita «Icono de tacos: Freepik en Flaticon.» Conservar el crédito:
  el ajuste no cambia la licencia del original.
- [ ] Decidir tipografía de lanzamiento (Alejandro lo está pensando, 2026-10-26).
  Comprar licencias de fuentes (Pangram Pangram): 3 estilos, Monument Normal Semibold y Neue
  Montreal Regular/Semibold, app + escritorio (≈ USD 240 estimado, precio exacto en el
  carrito; para persona física no vencen; redes y web después). Resumen en el
  escritorio: «Patio — compra de fuentes.html». Reemplazar las
  pruebas de `assets/fonts/prueba/`, cambiar `Monument-Black` por Semibold y fusionar la
  rama `tipografia/monument-neue-montreal`.
- [ ] Planes: llevar a `app/plan.tsx` la propuesta de
  `artifacts/planes-propuesta-2026-10-25.html` (Foodie/Creador; Gratis/Pro; Fundadores),
  definir cupo final de lecturas y avisos, y conectar compras dentro de la app
  (StoreKit/Play Billing o RevenueCat, requiere build nativo) con entitlement `patio_pro`.
- [ ] Branding: pulir el recorrido de bienvenida del Fondero, decidir etiquetas en
  minúsculas, estilo de publicaciones/fotos/fondos y piezas de punto de venta
  (cartel con QR, sello de Fundador, sticker de ventana).
- [ ] Medir el piloto de la microzona: publicación, búsqueda, regreso y soporte.
- [ ] Evaluar OTA, mejoras de búsqueda y crecimiento después de QA y datos del
  piloto. [Roadmap de producto](PRODUCT_EVOLUTION_ROADMAP_2026-07-18.md).

Para cada pendiente cerrado, registrar dispositivo/versión, evidencia y fecha.
No marcar aceptación móvil por pasar pruebas de componentes o exportar JavaScript.

## 5. Al último: datos legales y publicación del aviso

- [ ] Completar nombre legal, domicilio y dominio; finalizar aviso de privacidad
  y publicar URLs HTTPS de privacidad, soporte y eliminación. Codex asume el
  trabajo de preparación; no depende de coordinar otra sesión con Claude.
  Soporte y borrado dentro de ambos perfiles ya existen; no reconstruirlos.
