# Patio — Privacy & Vendor Matrix

| Sistema/proveedor | Datos involucrados | Finalidad | Control requerido | Estado |
|---|---|---|---|---|
| Supabase Auth | correo, ID de cuenta, sesiones | autenticación | RLS, eliminación, mínimo privilegio | implementado/probar evidencia |
| Supabase Database/Storage | perfiles, menús, fotos, reseñas | operación del producto | RLS, backups, retención | revisar operación |
| Expo/EAS | builds, credenciales de distribución | publicación | secretos por entorno, miembros | revisar accesos |
| Google Maps | ubicaciones, búsquedas geográficas | mapa y descubrimiento | claves restringidas, consentimiento | pendiente externo |
| FCM/APNs | token push, preferencias | notificaciones | secreto fuera de Git, baja al cerrar cuenta | revisar por entorno |
| Anthropic | fotos/menús enviados a IA | lectura y organización de menús | clave solo backend, retención/proveedor | revisar contrato |
| Gmail/soporte | correo y reportes | atención y seguridad | acceso limitado, retención | pendiente de conexión |

## Decisiones que faltan

- plazo de retención para logs, fotos de IA, reportes y tokens push;
- responsables y miembros autorizados por proveedor;
- procedimiento para solicitudes de acceso, corrección y eliminación;
- URL pública final de privacidad y eliminación;
- evidencia de revisión contractual o términos de cada proveedor.
