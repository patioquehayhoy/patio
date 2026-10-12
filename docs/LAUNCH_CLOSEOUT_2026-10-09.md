# Cierre de implementación y checklist de lanzamiento — 2026-10-09

> **Estado posterior — 2026-10-12:** 177 pruebas locales, cards con columnas
> estables y navegación corregida. Backend ya ensayado/promovido; la cola
> vigente está en [PENDING_LAUNCH](PENDING_LAUNCH_2026-10-12.md).
> Este archivo conserva el historial técnico, no tareas pendientes duplicadas.

> **Actualización 2026-10-10:** el backend ya se ensayó y promovió; los
> checkboxes de backend pendientes más abajo describen el corte inicial.
> Estado remoto: [PRODUCTION_PROMOTION](PRODUCTION_PROMOTION_2026-10-09.md).
> Auditoría de UI y contrato posteriores: [DESIGN_AUDIT](DESIGN_AUDIT_2026-10-10.md)
> y [DESIGN_SYSTEM](DESIGN_SYSTEM.md). Validación actual: 154 pruebas, TypeScript,
> lint y exportaciones de iPhone/Android. Sigue pendiente QA físico y distribución;
> Maps/Firebase Android y dependencias mantienen bloqueos de release.

Objetivo confirmado: iPhone y Android. Soporte público confirmado por el usuario:
`quehayhoy.patio@gmail.com`. El correo personal de contacto no se utiliza
como soporte. Esta aclaración reemplaza la corrección provisional anterior. Los cambios están locales en `rebuild/patio-final`.
**No hay declaración de lanzamiento aprobado:** homologación implementada en los
flujos indicados; backend promovido tras staging. Validación visual y distribución pendientes.

## Hecho y verificado

- [x] Guardados y Menús comparten panel, fila de listas y patrón de selección.
- [x] Menús tiene agregar, mover con origen/destino/confirmación y eliminar;
  cancelar o fallar conserva la selección y los datos.
- [x] Creación y asignación toleran reintentos sin duplicar listas. Escrituras
  locales serializadas; corrupción se reporta y no se sustituye por una lista vacía.
- [x] Degradados de scroll conectados a Guardados, Menús, Explorar y paneles de
  listas; restablecimiento por vista y callbacks antiguos cubiertos por pruebas.
- [x] Renombrado compartido, protección de doble envío y texto conservado al fallar.
- [x] Primitivos de color Fondero conectados a `Colors` en claro y oscuro.
- [x] Ajustes permiten crecimiento de texto. Guardados distingue carga, error y
  vacío, con reintento. Carga anuncia su estado a accesibilidad.
- [x] Límites IA preparados en servidor: consumo atómico por usuario y función,
  rechazos antes del proveedor y fallo cerrado si falta la migración.
- [x] Fecha de reseña fijada por servidor para impedir eludir el límite diario.
- [x] Dependencias actualizadas dentro de compatibilidad y parche reproducible
  de Metro para leer imágenes con `image-size` 2.0.4.
- [x] `npm run check`: TypeScript, lint, **149/149 pruebas** y control de release.
- [x] Ensayo PostgreSQL aislado: **19 comprobaciones**, sin acceso a producción.
- [x] Exportación JS/assets iOS y Android completada. Configuración estricta iOS:
  19 verificaciones; Android: 26 y dos pendientes externos.

Las exportaciones están en `/private/tmp/patio-export-verified-20261009`.
Son bundles, no builds nativas firmadas. El ensayo SQL usa un fixture; no acredita
RLS, Auth o Storage del proyecto real. No se ejecutó simulador ni dispositivo,
según las instrucciones del repositorio.

## Contrato e inventario de homologación

| Función | Fuente vigente | Consumidores y regla |
| --- | --- | --- |
| Panel de biblioteca | `components/library-sheet.tsx` | FoodieFilterBar y MenuListsSheet; cabecera, vidrio, arrastre, teclado, safe area y scroll comunes. Radio superior 28; acciones de cabecera 44. |
| Fila de lista | `components/library-list-row.tsx` | Listas Foodie y Menús; altura mínima 52, acciones 44, título flexible, cuenta real y estado parcial accesible. SaveToListSheet conserva su fila contextual y geometría equivalente. |
| Renombrado | `components/rename-dialog.tsx` | Menú y listas Android; botones mínimos 48, bloqueo durante guardado, fallo mantiene editor. Listas iOS conservan prompt nativo. |
| Selección y mover | `components/selection-actions.tsx`, `lib/library-selection.ts` | Guardados y Menús; agregar/mover/eliminar, origen explícito cuando es ambiguo y confirmación final. |
| Cards | `components/patio-card-info.tsx`, `lib/patio-card-info.ts` | Cards/filas de lugares: precio, distancia, abierto, estrellas y calificación propia; ausencias honestas y texto apilable. Implementación previa conservada. |
| Scroll | `lib/use-scroll-edges.ts`, `components/scroll-edge-fade.tsx` | Guardados, Menús, Explorar, LibrarySheet y SaveToListSheet; fades según contenido realmente desplazable. |
| Colores | `lib/colors.ts`, `lib/theme.ts`, `lib/fondero-palette.ts` | Fondo, superficies, bordes, textos y acento comunes por tema; colores semánticos conservados. |
| Ajustes y estados | `components/settings-list.tsx`, `components/foodie-loading.tsx` | Etiquetas sin recorte forzado; carga accesible; Guardados incorpora recuperación de error. |
| Texto | `lib/typography.ts`, fundamentos de identidad | `noWidow` en copy estático; títulos flexibles. Marca «¿Qué hay hoy?» y «Saaaaaaabes.» conservada. |

Este inventario cubre los flujos cambiados; no afirma homologación visual de
cada pantalla de la app. Ficha pública aprobada y bloque de precio del compositor
conservados. Horarios, pagos y formularios restantes requieren el recorrido visual
antes de cerrar las tres etapas del plan.

## Roadmap accionable, en orden

### 1. Backend real — bloquea integración

- [ ] Iniciar sesión con `supabase login` en la terminal local. Tener cuenta y
  configuración pública de la app no autentica el CLI. No enviar contraseñas/token.
- [ ] Ejecutar inventario de solo lectura de `scripts/backend/inventory.sql`;
  seguir `scripts/backend/README.md`. Hay tablas base ausentes del historial local:
  no ejecutar reset, backfill ni `db push` a ciegas.
- [ ] Restaurar el esquema real en staging y comprobar dueños, RLS y Storage.
- [ ] Aplicar migraciones de cuota y fecha de reseñas **antes** de desplegar
  read-menu, smart-setup y search-intent; comprobar 401, 429 y 503.
- [ ] Ensayar cuentas Foodie/Fondero, publicación, búsqueda, reseñas, bloqueos,
  reportes y eliminación completa Auth/SQL/Storage con usuarios desechables.
- [ ] Verificar secretos del proveedor y operación de moderación en servidor.

### 2. Seguridad y configuración Android — bloquea release

- [ ] Resolver auditoría npm restante: **32 paquetes afectados: 24 altas y 8
  moderadas, cero críticas**. Antes había 40, incluida una crítica. Los conteos
  incluyen cadenas dependientes; no son 32 fallos independientes. No se forzó una
  actualización mayor ni se desactivó el control de CI. `npm audit` sigue fallando.
- [ ] Configurar `GOOGLE_MAPS_ANDROID_API_KEY`, restringida por paquete y SHA-1.
- [ ] Configurar `GOOGLE_SERVICES_JSON` válido como archivo Firebase Android.
- [ ] Configurar y probar APNs/FCM, tickets/receipts de notificaciones y permisos.
- [ ] Repetir `npm run check` y controles estrictos para ambas plataformas.

### 3. Homologación visual y QA — bloquea aceptación

- [ ] Recorrer Foodie y Fondero en dispositivos iPhone y Android: claro/oscuro,
  texto grande, pantalla pequeña, teclado, safe areas, scroll y gestos de cierre.
- [ ] Verificar Guardados/Menús: crear, renombrar, seleccionar todo, selección
  parcial, mover entre varias listas, fallos de red/escritura y reintentos.
- [ ] Verificar cámara/galería, ubicación concedida/denegada, mapa y búsqueda.
- [ ] Verificar inicio/cierre de sesión, recuperación, cambio de rol y eliminación.
- [ ] Completar recorrido de Ajustes, Perfil Fondero, horarios, pagos, estados
  vacíos/carga/error y ficha pública. Registrar evidencia sin dar aceptación ficticia.

### 4. Tiendas y distribución — bloquea lanzamiento público

- [ ] Publicar URLs reales de privacidad y solicitud de eliminación; confirmar
  titular responsable, retención y tratamiento efectivo antes del texto definitivo.
- [ ] Preparar declaraciones de privacidad/Data safety a partir del backend real,
  fichas, capturas, clasificación y acceso de revisión.
- [ ] Verificar acceso a Apple/Google, certificados y firma; generar builds nativas
  y probar enlaces, permisos, mapas, push y compatibilidad Android de 16 KB.
- [ ] Usar Xcode/SDK aceptados y target vigente. Referencias oficiales:
  [Apple SDK 26](https://developer.apple.com/news/upcoming-requirements/?id=04282026a),
  [Google target API](https://developer.android.com/google/play/requirements/target-sdk).
- [ ] Distribuir prueba interna/TestFlight, resolver hallazgos y completar
  `docs/STORE_RELEASE_READINESS.md` antes de envío público.

## Evidencia y límites

Logs locales: `/private/tmp/patio-check-final-20261009.txt`,
`/private/tmp/patio-audit-final-20261009.json`,
`/private/tmp/patio-release-ios-20261009.txt` y
`/private/tmp/patio-release-android-20261009.txt`.
El parche Metro se revirtió y reaplicó con `npm run postinstall`; aplicaron
Metro y react-native-maps, y volvió a pasar el check completo.
No hubo despliegue, build pagada, publicación, commit ni push en este corte.

## Titularidad Supabase — invitación enviada 2026-10-09

Autorizada por el usuario y verificada en el dashboard: invitación a
`quehayhoy.patio@gmail.com` como **Owner** de `Parco Apps`
(`uwtvunlhcdjrhxabekes`), cuyo único proyecto visible es `lafondita`
(`gjfjsjlrgycrgmcbjrus`). Estado **INVITED** y confirmación de envío exitoso.
Pendiente aceptar desde la cuenta de Patio y verificar acceso efectivo.
`contacto.parco@gmail.com` conserva Owner; no se retiró ningún acceso.
No se recreó ni transfirió el proyecto ni se cambió la configuración de la app.
La sesión web funciona; el CLI sigue devolviendo Invalid access token.

### Aceptación verificada — 2026-10-09

Después de la aceptación del usuario, el dashboard muestra
`quehayhoy.patio@gmail.com` como **Owner activo**, sin la etiqueta INVITED.
La organización conserva el nombre Parco Apps y el mismo proyecto.
`contacto.parco@gmail.com` permanece como segundo Owner. No se retiraron
accesos, no se cambiaron credenciales ni se migraron datos. La incorporación
de Patio a la propiedad queda completada; los bloqueos técnicos de lanzamiento
y la autenticación del CLI siguen pendientes.

### Cuenta personal retirada — 2026-10-09

Tras confirmación explícita del usuario sobre el borrado permanente de snippets,
reportes y consultas guardadas de la cuenta saliente, se ejecutó Leave team
para `contacto.parco@gmail.com`. Supabase confirmó **Successfully left Parco Apps**
y mostró la lista de organizaciones vacía para esa cuenta. Antes de salir se
verificaron exactamente dos miembros, ambos Owner, con Patio activo; por tanto
`quehayhoy.patio@gmail.com` queda como único propietario. No se ejecutaron cambios
de facturación, borrado de proyecto ni migración de datos. Para continuar la
administración hace falta sesión web/CLI de la cuenta de Patio.

### Nombre del proyecto actualizado — 2026-10-09

Proyecto Supabase renombrado de `lafondita` a **`patio`**. Verificado en
cabecera del dashboard y confirmación Successfully saved settings.
La sesión activa corresponde a `quehayhoy.patio@gmail.com`; Project access
muestra un solo miembro, Owner. Se conserva project ref `gjfjsjlrgycrgmcbjrus`.
Este cambio es del nombre visible del proyecto Supabase.

## Auditoría remota efectiva y ensayo — 2026-10-09

Consulta de solo lectura ejecutada con la sesión web de Patio. Se guardaron
`inventory-2026-10-09.json` y `schema-2026-10-09.json` en `scripts/backend/`,
con metadatos y conteos; sin filas, correos ni contenido de usuarios.

- 20 tablas públicas, 31 políticas public/Storage y tres funciones SQL.
- Cinco usuarios Auth, un negocio y dos menús. El negocio no coincide por UUID
  ni correo con los usuarios: requiere asignación explícita, no backfill inventado.
- Fonditas/menus/cartas tienen RLS ligada a auth.uid() = fonditas.id, mientras
  la app crea negocios con UUID aleatorio y busca por correo en telefono.
  Descubrimiento público y escritura Fondero requieren corregir esta propiedad.
- Faltan direccion, direccion_visible, horario, pagos_efectivo,
  pagos_transferencia, pagos_tarjeta, tipo_negocio y categorias.
- Cartas carece del índice único en fondita_id que necesita su upsert.
- No están desplegadas las migraciones de septiembre/octubre de reportes,
  bloqueo, publicación de colección, eliminación y cuotas.
- Edge Functions: solo read-menu y send-publication-notifications (actualizadas
  hace dos meses), smart-setup (hace tres meses). Faltan search-intent y
  delete-account; el listado no acredita el código de las funciones existentes.
- Avatars, business-logos y Patio ID son buckets públicos, sin restricciones
  de tamaño/MIME; falta revisar su contenido/uso y la eliminación de archivos.

Se reconstruyó el DDL público real sin datos en PostgreSQL aislado: diez
comprobaciones aprobadas al aplicar seis migraciones, incluida la nueva
`20261009120000_live_schema_compatibility.sql`. Esta agrega columnas sin
fabricar valores y aborta si hay cartas duplicadas antes de crear su unicidad.
No se aplicaron cambios de esquema ni funciones a producción. Falta respaldo
real y staging Auth/Storage/JWT. CLI aún devuelve Invalid access token; se
solicitó renovar login con la cuenta de Patio.

Revisadas versiones npm disponibles: node-forge 1.4.0, braces 3.0.3 y
sprintf-js 1.1.3 siguen siendo las últimas; no se inventó cierre de las
alertas ni se forzó decode-uri-component 0.5 ESM sobre consumidores CJS.
Copy y plan de capturas preparados en `STORE_SUBMISSION_DRAFT_2026-10-09.md`.

### Acceso, correo y distribución revisados

- Auth Site URL `patio://` y retorno permitido `patio://login-callback`
  coinciden con `lib/auth.ts`; no se cambiaron. Falta prueba de entrega/enlace.
- SMTP personalizado habilitado, remitente visible Patio, host smtp.gmail.com
  y puerto 587. Supabase muestra aviso de proveedor de correo personal y
  posible impacto en entrega. No se leyeron ni cambiaron contraseñas.
- EAS whoami responde parcomx / contacto.parco@gmail.com. La transferencia
  de Supabase no cambia la propiedad de EAS ni las cuentas de las tiendas.
  No se generaron builds ni se cambiaron accesos EAS.
- Ensayo SQL original repetido: 19/19 comprobaciones aprobadas.

## Corrección de diseño según captura y CLI — 2026-10-09

- Usuario confirmó que todos los datos existentes son sintéticos; no autorizó
  su borrado ni asignación arbitraria de dueño. Se conservan.
- CLI autenticado correctamente como cuenta Patio; projects list confirma
  nombre patio y ref correcto. No se necesita enviar credenciales al chat.
- Cards ahora agrupan ubicación/precio, horario/menú y métricas compactas, con
  crecimiento vertical y sin límites de líneas; eliminadas columnas elásticas
  que separaban demasiado los datos. Calificación propia visible como Tu y
  accesibilidad conserva su explicación completa.
- Filtros de Guardados/Explorar y tipos de negocio en Perfil ahora envuelven
  dentro del ancho, sin carruseles horizontales. Texto de pills flexible, sin
  ellipsis. Títulos de Menús y nota IA tampoco se recortan a líneas fijas.
- TypeScript, lint y 149 pruebas aprobadas después de todos esos cambios.
- Copia privada de las 20 tablas públicas y tres funciones anteriores en
  /private/tmp/patio-release-backup. No es backup completo de Auth ni blobs
  Storage. Docker/pg_dump no están disponibles; SQL CLI funciona por API.
- Nueva migración 20261009130000_business_owner_uuid.sql, clientes de negocio
  y notificaciones adaptados a UUID. Conserva negocios legados sin dueño y los
  excluye de lectura pública; no adivina propiedad. El correo legado se excluye
  de permisos SELECT para anon/authenticated.
- Ensayo reconstruido actualizado: 12 comprobaciones aprobadas, con rechazo
  de suplantación, creación propia, privacidad del correo, descubrimiento público
  y cascada de eliminación. Sigue sin restaurar Auth/Storage/JWT completos.
- La revisión automática rechazó aplicar las siete migraciones a producción:
  falta staging real y autorización explícita para el alcance de permisos y datos.
  No se aplicó ninguna migración ni se desplegaron handlers dependientes.
  Se solicitó elección explícita entre staging primero y producción autorizada.
- La consulta amplia de pestañas fue rechazada por riesgo de privacidad; se
  continuó únicamente por la URL directa de Supabase y el login quedó resuelto.

El diseño está corregido en código; falta la comprobación visual del usuario
en su celular. No se ejecutó simulador ni dispositivo, por regla del repositorio.

Exportación posterior al diseño compacto y clientes UUID completada para
iOS y Android en /private/tmp/patio-compact-export-20261009. Bundles JS/assets
verificados; sigue sin ser una build firmada ni aceptación visual física.

## Staging preparado y validado — 2026-10-09

Usuario eligió preparar staging primero. Creado patio-staging
(jyexohxixfuirvyqqwmf) en la organización de Patio. Siete migraciones
aplicadas en ensayo, cinco funciones ACTIVE y 15 pruebas reales de
Auth/JWT, RLS, Storage, reseñas, cuotas, publicación y eliminación aprobadas.
Producción sigue con un negocio y sin columna owner_id; no fue modificada.
Detalles, límites y siguientes pasos en STAGING_REHEARSAL_2026-10-09.md.
La etapa de staging solicitada queda completada; promoción aún no autorizada.

## Producción promovida con autorización explícita

- [x] Siete migraciones aplicadas en una transacción y registradas en el historial.
- [x] Cinco funciones ACTIVE con JWT; las cinco rechazan llamadas sin sesión (401).
- [x] Conservados cinco usuarios, un negocio y dos menús; negocio sintético sin dueño conservado.
- [x] Lectura de correo prohibida para anon/authenticated, RLS activo y políticas antiguas retiradas.
- Evidencia y límites: [PRODUCTION_PROMOTION_2026-10-09.md](PRODUCTION_PROMOTION_2026-10-09.md).

## Ajuste solicitado: píldoras fijas y datos compactos

- Píldoras Abierto/Filtros/Listas en una fila, con slots iguales; Organizar fijo.
- Etiquetas estables; conteos absolutos tipo notificación, sin cambiar anchos.
- Tarjetas sin Menú de hoy; estado/calificación/distancia agrupados. Abierto lleva punto verde; horario/distancia/calificación propia ausentes se omiten.
- TypeScript y lint verificados. Revisión visual física pendiente.

- Mapa reserva el slot vacío de Organizar (40 pt), igual que Guardados, para conservar los mismos anchos y posiciones de las tres píldoras.

## Auditoría de selección y estado — correcciones posteriores

- Abierto ya no muestra número.
- Todos los lugares tiene el círculo de selección a la izquierda, igual que las listas.
- Fijar usa bookmark; Renombrar usa pencil sólido también en el menú contextual e Historial.
- Mover con lista vacía explica que necesita lugares; selección múltiple al renombrar pide una sola lista.
- Destino permite crear lista y la preselecciona, manteniendo confirmación explícita antes de mover.
- Estado en tarjetas usa punto verde abierto, gris cerrado y amarillo con 30 minutos o menos restantes; nombre del estado se conserva para lector de pantalla.
- TypeScript, lint y 17 pruebas dirigidas aprobados; revisión física pendiente.

- Avisos de Mover y selección múltiple al renombrar integrados encima de las acciones del panel, con anuncio accesible y limpieza al cambiar selección. Destino explica elegir/crear y confirmar; no abre alerta flotante para estos avisos. TypeScript, lint y 11 pruebas de biblioteca aprobados.

## Posición unificada del indicador de disponibilidad

- Componente compartido antes del nombre en tarjetas lista/grid y detalle; marca en esquina superior derecha de pins de mapa.
- Mismo estado y ventana de 30 minutos; sin pulsaciones ni color de selección. Horario desconocido distinguido de cerrado, incluyendo tabla semanal.
- 150 pruebas y TypeScript aprobados; revisión visual física pendiente.

## Corrección expresa de ubicación del estado

La ubicación anterior junto al nombre y en pins queda reemplazada: solo insignia superior derecha del icono de negocio en tarjetas Guardados y resultados Explorar. Quitado de pins de mapa y título del detalle. Selección de lista conserva círculos sin insignia de actividad.

- Aclaración final: insignia sobre el borde superior derecho de la caja del icono (36 pt, superficie suave), no sobre el glifo. Cajas homologadas en Guardados y resultados Explorar; pins sin indicador.

- Corrección visual final: retirados fondo de la caja, placa del badge y contornos. Solo punto sólido sobre espacio del icono; horario desconocido omite el punto.

- Tarjetas y subtítulo de ficha muestran únicamente colonia; no muestran giro ni lo usan como sustituto cuando falta ubicación.

## Orden de Guardados auditado

- Opciones explícitas: Más reciente, Más cerca, Precio: menor a mayor, Tu calificación y Alfabético A–Z. Elegir el orden activo no lo desactiva; check muestra el estado.
- Precio usa el extremo inferior publicado (incluye precios de menú si falta rango del lugar); sin precio al final. No se estima ticket promedio.
- Cercanía usa distancia geográfica numérica, no texto redondeado ni tiempo de traslado. Coordenadas inválidas/desconocidas al final; empates conservan orden reciente.
- Ubicación se solicita al elegir cercanía y no se cambia el orden si se deniega o falla. Preferencia de cercanía solo se recupera si el permiso existe.
- Referencias consultadas: [Apple Menus](https://developer.apple.com/design/human-interface-guidelines/menus) y [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy/). Las opciones y reglas de precios/distancia son decisiones de Patio.

- Presupuesto de texto en tarjetas: nombre 2 líneas, colonia 1 y métricas cortas; grid reserva espacios consistentes y separa precio de colonia. Escala con texto accesible y ficha conserva nombre completo.

- Panel inicial de Filtros y Listas sin título redundante; conserva cierre y acciones. Subvistas de tipo/pago, destino, selección y creación mantienen encabezados de orientación.
