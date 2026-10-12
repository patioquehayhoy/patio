# Inventario y ensayo de Supabase

El proyecto configurado en `lib/supabase.ts` no equivale a una sesión administrativa.
`supabase projects list` requiere `supabase login`. No incluir tokens en Git ni en el chat.

1. Iniciar sesión y confirmar el proyecto exacto de Patio. No usar otro proyecto por
   semejanza del nombre. La app apunta al ref `gjfjsjlrgycrgmcbjrus` por defecto;
   comprobar si producción lo reemplaza mediante variables EAS.
2. Ejecutar `inventory.sql` en su SQL Editor y exportar todos los resultados.
   Es una consulta de metadatos y conteos; no cambia datos ni muestra identidades.
3. Exportar esquema completo y preparar un respaldo de datos/Storage antes de
   modificar producción. El dump de esquema no es un respaldo de datos.
4. Restaurar el esquema en un entorno de ensayo; resolver migraciones históricas
   ya aplicadas y columnas/políticas faltantes a partir de ese inventario.
5. Ensayar dueño A/dueño B/anon, Auth, Storage, publicación, eliminación y gateway.
   Resolver propiedad por UUID y lectura pública del correo legado antes del lanzamiento.
6. Aplicar `20261009100000_ai_request_limits.sql` y
   `20261009110000_review_server_dates.sql` en ensayo. Desplegar después los handlers
   `read-menu`, `smart-setup` y `search-intent`. Si falta el RPC de cuotas, los nuevos
   handlers fallan cerrado con 503 y no llaman al proveedor. Los handlers anteriores
   no utilizan las cuotas aunque la migración esté aplicada.
7. Probar 401/429/503 con cuentas de ensayo, límites por usuario/función y
   publicaciones de reseñas con fechas manipuladas. Los límites son techos antiabuso
   del piloto (20 lecturas de menú y 20 altas inteligentes/día; 100 búsquedas/día),
   no una implementación de los planes de suscripción.
8. Revisar con datos de ensayo, respaldar y desplegar el candidato comprobado.
   Verificar funciones y permisos después del despliegue; conservar resultados.

La prueba SQL local ejecuta 19 comprobaciones sobre un fixture mínimo. No restaura
producción ni ensaya JWT reales, Storage, conexiones concurrentes o entrega de push.
No ejecutar `db reset`, borrados de proyectos, ni `db push` a ciegas para cerrar la lista.

## Staging real preparado el 2026-10-09

Proyecto fijo jyexohxixfuirvyqqwmf, distinto de producción.
`build-staging-schema.cjs` genera DDL sin datos desde el inventario.
`test-staging.cjs` ejecuta el ensayo de JWT/RLS/Storage/Edge con cuentas
desechables, usando llaves guardadas exclusivamente en directorio privado.
Quince pruebas aprobadas. Ver docs/STAGING_REHEARSAL_2026-10-09.md.
No ejecutar el generador sobre producción ni aplicar el baseline a tablas
existentes. Los scripts no cambian la configuración de la app.
