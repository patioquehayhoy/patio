# Auditoría de backend — 10 de septiembre de 2026

Validación SQL ampliada el 11 de septiembre de 2026.

Este corte mejora código local y agrega migraciones. **No certifica el backend de
producción ni constituye un despliegue.** No se borraron cuentas ni se enviaron
notificaciones reales. Los bloqueos de lanzamiento abajo requieren un entorno
Supabase de ensayo, inventario de producción y operación humana.

## Cambios implementados

| Hallazgo | Corrección local | Evidencia |
|---|---|---|
| Las funciones IA podían llegar al proveedor sin comprobar un usuario real dentro del handler. Una clave pública no identifica a una persona. | `requireUser` valida el Bearer con `auth.getUser`, rechaza sesiones inválidas y usuarios anónimos; todas las funciones comparten esa comprobación. | Tests ejecutan los cinco handlers con autorización ausente/inválida/anónima y verifican que no hay trabajo privilegiado. |
| Los cuerpos IA no tenían cota y algunos tipos incorrectos terminaban en 500. | Lectura de stream acotada, validación JSON/objeto/tipos, cota de imagen/relato/búsqueda, timeout de proveedor y errores de cliente sin detalles internos. | JSON inválido/null/array/tipos incorrectos dan 400; cuerpo de búsqueda excesivo sin Content-Length da 413. |
| No existía eliminación de cuenta. | `delete-account` obtiene el usuario del token, comprueba la migración de limpieza, elimina sus carpetas Storage y llama `auth.admin.deleteUser(id, false)`. | Pruebas de identidad suplantada en body, carpetas anidadas, 205 archivos, error Storage, migración ausente y fallo Auth/SQL. |
| Borrar `auth.users` no incluía negocios enlazados por correo. | Trigger `BEFORE DELETE` elimina `menus`, `cartas` y `fonditas` del correo verificado dentro de la transacción de Auth. Las relaciones sociales existentes tienen FK con cascada. | Ejecutado en PostgreSQL/PGlite con rol auth_admin de prueba: cascadas correctas y rollback completo ante FK bloqueante. El esquema Auth/Storage real sigue pendiente. |
| Una inserción directa de reseña podía traer una respuesta oficial falsa o controlar su estado. | La política nueva exige `status = published`, `business_reply IS NULL` y `business_replied_at IS NULL`. | La inserción de respuesta falsa falla por RLS en PostgreSQL/PGlite. |
| No había tablas para denunciar contenido o bloquear autores. | `content_reports` admite insertar/leer reportes propios abiertos; `blocked_users` admite insertar/leer/eliminar bloqueos propios y prohíbe autobloqueo. Restricciones SELECT adicionales ocultan perfiles, reseñas y colecciones de autores bloqueados a la cuenta autenticada. `get_blocked_profiles` devuelve únicamente los IDs bloqueados propios y nombres de perfiles públicos para desbloquear. | Contratos estáticos y ejecución RLS en PostgreSQL/PGlite: aislamiento A/B/C, status spoof denegado, nombre privado protegido y desbloqueo. |
| Publicar una colección actualizaba metadatos, borraba lugares y los reinsertaba en solicitudes separadas. Una caída dejaba una publicación incompleta. | `publish_collection` escribe metadatos y lugares en una transacción, exige propietario autenticado real y UUID estable del cliente para reintentos. Conserva orden y deduplica lugares. | PostgreSQL/PGlite confirma dueño, ID estable, orden y rollback por FK. La concurrencia de conexiones independientes requiere ensayo adicional. |
| Un anuncio podía generarse sin menú publicado y con otra clase de evento. | Se verifica dueño con correo confirmado, existencia del menú del día y tipo `menu_published` antes de crear evento. | Pruebas de dueño incorrecto y menú ausente sin mutaciones. |
| Más de 100 destinatarios rompían el envío a Expo. | Lotes de hasta 100, timeout y un resultado por dispositivo, incluso si falla un lote. | Pruebas con 205 destinatarios y fallo parcial 100 + 1. |
| La fecha UTC cambiaba el día comercial a las 18:00 CDMX. | Persistencia de menús y anuncio usan `America/Mexico_City`, consistente con `lib/menu-date.ts`. | Pruebas del frente de menús; revisión de fecha del handler. |
| Android podía pedir permisos antes de crear el canal. | Se crea `default` antes del permiso/token; los mensajes usan `channelId: default`. | Revisión de integración; permiso real en Android pendiente. |
| Un error de consulta podía crear otro negocio; los borrados ocultaban fallos. | `lib/db.ts` propaga fallos de consulta/creación/borrado para que el flujo no confirme un guardado o retiro fallido. | Validación de flujos por el frente de menús/cuenta. |

## Eliminación de cuenta: contrato y límites

`POST /functions/v1/delete-account` no acepta un identificador de usuario como
autoridad. La sesión determina el único usuario elegible. Éxito:
`{"deleted":true}`. Un fallo anterior a la eliminación Auth devuelve un error,
sin confirmar que se haya eliminado la cuenta.

La secuencia es:

1. Verificar el usuario con Auth.
2. Llamar `account_deletion_ready` con service_role. Comprueba el trigger activo,
   su función y la combinación BEFORE/DELETE/ROW. Si falta, se detiene antes de
   tocar Storage.
3. Eliminar archivos por la API de Storage en `avatars/<uid>/` y
   `business-logos/<uid>/`, incluyendo subcarpetas y páginas posteriores a 100.
4. Hacer hard delete de Auth. El trigger elimina los negocios y sus menús;
   las FK existentes eliminan perfil, guardados, colecciones propias, reseñas,
   likes, follows, preferencias, dispositivos, reportes y bloqueos propios.

Storage y Auth son servicios distintos: no hay una transacción que abarque
ambos. Si la limpieza de archivos se completa y después falla SQL/Auth, la
cuenta permanece y se puede reintentar; sus archivos ya pueden haberse borrado.
Objetos propiedad del usuario en un bucket adicional no inventariado pueden
impedir el borrado Auth. Se debe inventariar Storage antes del ensayo.

La relación `fonditas.telefono = auth.users.email` es legado. No es una identidad
estable ante cambios de correo. El trigger usa exclusivamente correo confirmado
y conserva esta relación actual; **migrar a owner_id y reconciliar propietarios
es un bloqueo del backend**, no una tarea resuelta por el endpoint.

La función trigger no tiene permisos EXECUTE para public/anon/authenticated.
El chequeo de instalación solo puede ejecutarlo service_role. El cambio no
concede a clientes DELETE sobre reseñas inmutables: su borrado sucede por FK al
eliminar la cuenta.

## Gateway y llamada móvil

`supabase/config.toml` ahora versiona `verify_jwt = true` para las cinco Edge
Functions. No altera el proyecto remoto hasta desplegar. Debe conservarse la
verificación adicional del handler incluso cuando el gateway filtra tráfico.

Se verificó el SDK instalado con una prueba sin red: `functions.invoke` envía
el JWT de sesión en `Authorization: Bearer ...` y la clave publishable en
`apikey`. No se requiere incluir claves privadas en la app. Sin sesión,
`search-intent` falla cerrado; `lib/aiSearch.ts` conserva la búsqueda
determinística al devolver null. La lectura de menú y el alta inteligente
requieren sesión real.

Esto coincide con la documentación de [autenticación de Edge Functions](https://supabase.com/docs/guides/functions/auth)
y [cabeceras de autorización](https://supabase.com/docs/guides/functions/auth-headers).
La configuración efectiva del gateway y su compatibilidad con las claves de
firma del proyecto **no se verificaron remotamente**.

## Pendientes que impiden certificar lanzamiento

| Prioridad | Pendiente verificable | Cierre requerido |
|---|---|---|
| P0 | El repositorio no contiene la creación base de `fonditas`, `menus` y `cartas`, ni sus políticas RLS/grants originales. `menu_sections`/`menu_items` se crean sin RLS en su migración. | Inventariar esquema/grants/policies desplegados, completar migraciones restaurables y probar aislamiento dueño A/dueño B/anon en lectura y escritura. No asumir que la ausencia local prueba una exposición remota. |
| P0 | Propiedad de negocios por correo en `telefono`. No existe `owner_id` persistente auditado. | Backfill con comprobación de duplicados/huérfanos/cambios de correo, RLS por UUID y restricción para que la app no reasigne propiedad. Revisar también que el correo usado como teléfono no se exponga por SELECT público. |
| P0 | Las migraciones nuevas pasan 14 comprobaciones sobre un fixture mínimo PostgreSQL/PGlite, pero no se ejecutaron sobre el esquema real de Supabase. | Restaurar esquema completo y ensayar Auth Admin, Storage, gateway y cascadas reales; respaldo y revisión de migraciones antes de producción. |
| P0 | Reportar/bloquear tiene persistencia y reglas locales preparadas, pero no existe una operación de moderación demostrada. | Responsable, canal de atención, tiempos de revisión, manejo de reportes abiertos, retirada de contenido y prueba UI completa. Los reportes no moderan automáticamente. |
| P1 | Las llamadas IA autenticadas no tienen cuota persistente por usuario ni limitación de solicitudes. Los límites de tamaño no impiden repetir requests. | Límite atómico del lado servidor, presupuesto del proveedor y tratamiento de 429 antes de abrir acceso amplio. |
| P1 | `publication_events` se registra antes de enviar; si hay fallo posterior, la deduplicación puede impedir el reintento del día. | Cola/outbox con estados y reintentos por dispositivo, sin reenviar tickets ya aceptados; ensayo de caída entre evento, envío y auditoría. |
| P1 | `sent` significa ticket aceptado por Expo; no se consultan receipts APNs/FCM. | Procesar receipts y retirar tokens rechazados después del ticket; medir entrega con ese límite. |
| P1 | Feeds consultados sin paginación pueden truncarse al límite de respuesta del proyecto; seguidores/dispositivos grandes no tienen paginación server. | Paginar las consultas de audiencia y medir carga antes de superar la red piloto. |
| P1 | Las reseñas siguen aceptando `visit_date` y timestamps del cliente. El cliente ya usa la fecha CDMX en este corte. | Límite diario verificado por el servidor; evitar que una fecha arbitraria eluda la unicidad por visita. |
| P1 | `collections` marca `unlisted` como legible mediante SELECT general. El share_token no restringe esa consulta. | Decidir si “con enlace” requiere secreto y cerrar acceso mediante RPC/token si esa es la promesa de privacidad. |
| P1 | Los bloqueos ocultan los tres tipos de contenido indicados. No ocultan automáticamente negocios, contadores, likes o aristas públicas de follows. | Verificar el alcance exacto del copy y de todas las superficies. Los bloqueos no son moderación global ni hacen anónima una identidad pública. |

Supabase indica que borrar Auth invalida sesiones/refresh tokens, pero un access
token emitido puede vivir hasta su expiración. Las operaciones sensibles deben
verificar vigencia de usuario/sesión y RLS; [referencia oficial](https://supabase.com/docs/guides/auth/managing-user-data).
Las funciones cambiadas vuelven a consultar Auth. Las políticas antiguas del
resto del esquema aún requieren auditoría frente a tokens de cuentas borradas.

## Validación realizada y ensayo pendiente

Ejecutado localmente:

```sh
node --test scripts/tests/backend-security.test.cjs scripts/tests/content-safety-schema.test.cjs scripts/tests/collection-publication-schema.test.cjs
git diff --check
```

Resultado: **35 pruebas aprobadas** (28 de handlers/SDK y 7 de contratos SQL),
sin errores de whitespace. Los handlers TypeScript se transpilan con el
TypeScript instalado y usan dobles de Auth, Storage, base de datos y proveedor.

Por separado se ejecutaron **14 comprobaciones SQL aprobadas** mediante
PostgreSQL 18.3/PGlite 0.5.8 sobre el fixture
`scripts/db-tests/minimal-fixture.sql`. El runner carga las tres migraciones
nuevas sin modificarlas, prueba los roles authenticated/anon/service_role y un
rol auth_admin con permisos mínimos, y confirma rollback de publicación y de
borrado Auth ante fallos FK. Incluye ejecución real de políticas RLS,
SECURITY DEFINER, permisos EXECUTE y cascadas de reseñas inmutables.

Reproducción e instalación aislada en `scripts/db-tests/README.md`:

```sh
node scripts/db-tests/run-pglite.cjs /private/tmp/patio-pglite-audit
```

PGlite se instaló únicamente bajo `/private/tmp/patio-pglite-audit`; no se agregó
una dependencia de app. Estas 14 comprobaciones se cuentan por separado de
`npm test`. El fixture define el esquema base ausente y simula auth.uid mediante
una variable de sesión: no valida JWT ni restaura el esquema de producción.
La máquina no dispone de Deno, psql ni Docker; no se ejecutaron Edge Runtime,
Auth Admin HTTP, Storage ni concurrencia de conexiones independientes. El CLI
Supabase instalado es 2.98.2. No hubo acceso a servicios de producción.

Ensayo mínimo antes de desplegar:

1. Restaurar un esquema completo en un proyecto aislado y aplicar migraciones
   existentes más `20260909_account_deletion.sql`, `20260910_content_safety.sql`
   y `20260910120000_publish_collection.sql`.
2. Crear usuarios A/B/C, perfiles públicos/privados, reseñas y colecciones.
   Comprobar que A no lee reportes/bloqueos de B, no puede insertar como B,
   no puede escribir status reviewed/dismissed y no puede editar reportes.
3. Bloquear B desde A: perfil/reseñas/colecciones de B desaparecen para A,
   continúan visibles para C conforme a privacidad y vuelven al desbloquear.
   Verificar que colecciones privadas siguen privadas y la navegación anónima
   conserva sus permisos anteriores. `get_blocked_profiles` solo debe devolver
   bloqueos de A y display_name NULL para un perfil privado o inexistente;
   un intento anónimo no debe poder ejecutar ese RPC.
4. Eliminar A con negocio/menús/reseñas/colecciones y >100 objetos Storage;
   comprobar cascadas y ausencia de cambios en B/C. Probar fallo inducido de FK:
   el SQL debe hacer rollback y la API no debe responder deleted=true.
5. Desplegar funciones de ensayo con su configuración gateway. Probar JWT de
   usuario válido/expirado, clave pública sin usuario y sesión eliminada.
6. Probar publicación en CDMX antes/después de medianoche UTC, permisos nativos
   Android/iOS y Expo con dispositivos reales.
7. Invocar `publish_collection(p_collection_id, p_title, p_description,
   p_visibility, p_fondita_ids)` con ID estable: un reintento debe conservar la
   misma fila; intentar modificar la colección de B como A debe fallar. Un
   Patio inexistente debe provocar rollback de título/visibilidad/lugares.
   Dos publicaciones concurrentes deben producir una versión completa, nunca
   una mezcla de los dos conjuntos.

El límite de 100 mensajes y la diferencia entre tickets y receipts están
documentados en [el servicio de notificaciones Expo](https://docs.expo.dev/push-notifications/sending-notifications/).
