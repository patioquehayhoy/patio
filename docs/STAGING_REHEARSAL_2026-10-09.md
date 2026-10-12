# Staging de Patio — 2026-10-09

Entorno creado y ensayado por elección explícita del usuario. Después de aprobar
las 15 pruebas, el usuario autorizó promover y producción fue actualizada; ver
[PRODUCTION_PROMOTION_2026-10-09.md](PRODUCTION_PROMOTION_2026-10-09.md). Cuenta titular: quehayhoy.patio@gmail.com; organización Parco Apps.

| Entorno | Proyecto | Referencia |
| --- | --- | --- |
| Producción | patio | gjfjsjlrgycrgmcbjrus |
| Ensayo | patio-staging | jyexohxixfuirvyqqwmf |

[Dashboard staging](https://supabase.com/dashboard/project/jyexohxixfuirvyqqwmf)

## Preparación completada

- Reconstruido el esquema público inventariado de producción, con sus columnas,
  constraints, índices, funciones, triggers y políticas. No se copió contenido
  ni usuarios de producción. Auth y Storage son servicios reales de Supabase.
- Recreados los tres buckets y sus políticas de acceso. No se copiaron archivos.
- Grants base de las tablas públicas de staging son explícitos; no se afirma
  copia exacta de cada grant productivo. Las migraciones nuevas los restringen.
- Aplicadas siete migraciones en una transacción al entorno de ensayo: eliminación,
  moderación/bloqueos, publicación de colecciones, cuotas, fechas de reseña,
  compatibilidad de esquema y propiedad UUID. Historial registrado con el CLI.
- Cinco Edge Functions ACTIVE: delete-account, read-menu, smart-setup,
  search-intent y send-publication-notifications; verify_jwt habilitado.
- Contraseña de DB y llaves exclusivamente en directorio privado local
  `/private/tmp/patio-staging-private`, fuera de Git. No se enviaron al chat.
- Dos cuentas desechables por ejecución, JWT auténticos y limpieza al terminar.
  Verificado: cero usuarios, cero negocios y cero archivos después del ensayo.

## Resultado

**15 comprobaciones de integración reales aprobadas.**

1. Auth emite JWT distintos para las dos cuentas de ensayo.
2. Cuenta autenticada crea su negocio con owner_id real.
3. Otra cuenta no puede actualizar el negocio.
4. Se rechaza suplantar al dueño.
5. El correo legado no es legible por el cliente.
6. Descubrimiento anónimo lee los campos públicos reales.
7. Upserts de menú y carta funcionan con sus claves únicas.
8. Anuncios rechazan dueño ajeno y deduplican; sin seguidores no envían push.
9. Cuotas son exclusivas de service_role y rechazan exceso por minuto.
10. Publicación de colección rechaza reemplazar la de otra cuenta.
11. Reseñas usan fecha de servidor, limitan una al día y rechazan respuestas falsas.
12. Reportes y bloqueos respetan autor y visibilidad.
13. Storage admite carpeta propia y rechaza escrituras en carpeta ajena.
14. Las cinco funciones rechazan llamadas sin JWT de usuario.
15. delete-account elimina Auth, negocio, datos propios y archivos, e ignora un
    ID ajeno enviado en el body; la otra cuenta permanece.

Evidencia sin credenciales: `scripts/backend/staging-results-2026-10-09.txt`.
Reproducir con `node scripts/backend/test-staging.cjs /private/tmp/patio-staging-private`.
El script fija la referencia de staging y crea únicamente cuentas de prueba.

Consulta antes de promover: producción conservaba un negocio y aún no tenía
owner_id. La promoción posterior está documentada por separado. El vínculo del
repositorio y la app siguen apuntando a producción; staging usa carpeta aislada.

## Seguimiento después de promover

- [x] Confirmación explícita posterior del usuario y promoción completada.
- Verificar correo/magic link y retorno desde una instalación móvil; este ensayo
  usó contraseña para JWT, no probó entrega SMTP ni enlaces profundos.
- Configurar claves del proveedor IA en staging y ensayar resultados/costos:
  no se copiaron secretos ni se hicieron solicitudes de IA pagada.
- Probar APNs/FCM y entrega a dispositivos; solo se ensayó anuncio sin seguidores.
- QA visual de cards/pills y ambos roles en iPhone/Android, y builds firmadas.
- Seguridad npm restante, Maps/Firebase Android, privacidad, eliminación web,
  moderación operativa y fichas de tiendas según LAUNCH_CLOSEOUT_2026-10-09.md.

El historial previo de producción está incompleto: no usar db push para aplicar
migraciones históricas a ciegas. La promoción debe conservar la secuencia
comprobada y un respaldo adecuado, con verificación posterior de permisos.
