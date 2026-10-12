# Promoción de Patio a producción — 2026-10-09

El usuario eligió primero staging y, tras aprobar 15 pruebas reales, autorizó
expresamente las siete migraciones y cinco funciones con «si a todo».
Destino verificado: patio, `gjfjsjlrgycrgmcbjrus`.

## Resultado verificado

- Siete migraciones aplicadas juntas en una transacción; historial registrado.
- Cinco funciones ACTIVE: read-menu, smart-setup, search-intent,
  send-publication-notifications y delete-account, todas con verify_jwt=true.
- Las cinco rutas rechazan POST sin sesión con 401; ninguna operación autenticada
  destructiva se ejecutó en producción para comprobarlo.
- Conservados los cinco usuarios, un negocio y dos menús. El negocio sintético
  sin coincidencia de propietario permanece sin dueño y no se publica.
- 23 tablas públicas; RLS habilitado en negocios, reportes, bloqueos y cuotas.
- anon y authenticated no pueden leer telefono (correo legado); anon conserva
  acceso a nombre. Las tres políticas antiguas de propiedad fueron retiradas.
- Función de respuesta de negocio por propietario UUID presente.

Evidencia sin secretos: [production-results-2026-10-09.json](../scripts/backend/production-results-2026-10-09.json).
Las integraciones con usuarios, almacenamiento, cuotas y eliminación se probaron
previamente en staging: [ensayo](STAGING_REHEARSAL_2026-10-09.md).

## Respaldo y límites

Tablas públicas anteriores, código anterior de tres funciones, SQL aplicado y
logs guardados en `/private/tmp/patio-release-backup`, privado y fuera de Git.
Este respaldo no contiene un restore completo de Auth ni archivos de Storage.
No se eliminaron los datos existentes ni se asignó un dueño arbitrario.

No equivale a autorización de lanzamiento: siguen pendientes QA físico de ambos
roles, correo y enlaces móviles, resultados reales del proveedor IA, entrega push,
configuración Maps/Firebase Android, auditoría npm, builds firmadas, privacidad y
fichas de tiendas. Consultar [checklist](LAUNCH_CLOSEOUT_2026-10-09.md).
