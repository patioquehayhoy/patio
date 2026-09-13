# Ensayo SQL aislado

Estos tests ejecutan las migraciones nuevas en PostgreSQL 18.3 compilado a WASM
mediante PGlite 0.5.8. Usan un fixture mínimo explícito y una selección de las
migraciones existentes. No requieren red al ejecutarse, no conocen credenciales
de Supabase y no se conectan a producción.

La dependencia se instala fuera del repositorio. Desde la raíz del proyecto:

```sh
mkdir -p /private/tmp/patio-pglite-audit
npm install --prefix /private/tmp/patio-pglite-audit --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.8
node scripts/db-tests/run-pglite.cjs /private/tmp/patio-pglite-audit
```

No se agrega PGlite a `package.json` ni al lockfile de la app. Este ensayo se
ejecuta por separado de `npm test`: los contadores no se suman automáticamente.

Resultado del 11 de septiembre de 2026: **14 comprobaciones SQL aprobadas**.

- A no modifica colecciones de B; un reintento conserva el mismo ID y orden.
- Una FK inválida revierte título y lugares de una colección.
- El RPC rechaza usuarios anónimos o identificadores de cuentas inexistentes.
- Los reportes no pueden suplantar autor, moderación ni lectura entre cuentas.
- Bloquear B oculta su contenido a A y conserva la visibilidad para C.
- El RPC de desbloqueo protege nombres privados y no admite llamadas anónimas.
- Desbloquear restaura la visibilidad original.
- Una reseña no puede insertar una respuesta oficial falsa.
- `account_deletion_ready` comprueba el trigger y restringe EXECUTE.
- Un fallo FK al borrar Auth revierte el trigger; el rol de prueba
  `supabase_auth_admin` puede ejecutar el borrado y sus cascadas autorizadas.

`minimal-fixture.sql` reconstruye únicamente columnas base necesarias y roles
con permisos explícitos. `auth.uid()` lee una variable de sesión asignada por el
test; no valida JWT. La definición real de `auth.users`, sus triggers de Supabase,
Storage, PostgREST y las migraciones base ausentes no se sustituyen por este
fixture. Tampoco se ensaya concurrencia de conexiones independientes.

Este resultado comprueba semántica SQL, RLS y rollback de las migraciones sobre
el fixture. Sigue pendiente restaurar el esquema real y repetir la integración
Auth/Storage/Edge en un proyecto de ensayo antes de producción.
