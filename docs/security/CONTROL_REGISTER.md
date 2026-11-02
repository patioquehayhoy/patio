# Patio — Control Register

Registro operativo para mantener la preparación SOC 2 / ISO/IEC 27001 / ISO/IEC 27701.

| ID | Control | Evidencia | Cadencia | Responsable | Estado |
|---|---|---|---|---|---|
| SEC-01 | No incluir secretos privados en el repositorio | escaneo `rg`, revisión de `.gitignore` | cada release | ingeniería | listo para revisión |
| SEC-02 | Separar claves por entorno | variables EAS y Supabase | cada release | ingeniería | pendiente externo |
| SEC-03 | Mínimo privilegio en Supabase | migraciones RLS + pruebas backend | por migración | ingeniería | cubierto por pruebas |
| SEC-04 | Proteger Edge Functions | pruebas de auth, método y cuota | cada release | ingeniería | cubierto por pruebas |
| SEC-05 | Proteger mapas | restricciones por app, firma y API | al cambiar credencial | ingeniería | pendiente externo |
| SEC-06 | Proteger push | FCM/APNs fuera de Git y por entorno | al cambiar credencial | ingeniería | pendiente externo |
| SEC-07 | MFA administrativo | configuración de proveedores | mensual | propietario | pendiente externo |
| SEC-08 | Rotación y revocación | inventario de credenciales | mensual | propietario | pendiente externo |
| PRIV-01 | Política de privacidad publicada | URL HTTPS y versión | por cambio legal | propietario | documento existente |
| PRIV-02 | Eliminación de cuenta | migración, función y pruebas | cada release | ingeniería | cubierto por pruebas |
| PRIV-03 | Retención de datos | tabla de retención | trimestral | propietario | pendiente de decisión |
| PRIV-04 | Proveedores y transferencias | inventario Supabase/Expo/Google/Anthropic | trimestral | propietario | pendiente de revisión |
| OPS-01 | Backups y restauración | captura, fecha y simulacro | mensual | propietario | pendiente externo |
| OPS-02 | Gestión de incidentes | registro y procedimiento | por incidente | soporte | pendiente de activar |
| OPS-03 | Revisión de accesos | export/revisión de miembros | mensual | propietario | pendiente externo |
| OPS-04 | Evidencia de release | salida de `npm run check` | cada release | ingeniería | disponible |
| MOD-01 | Filtrar contenido ofensivo antes de publicarlo (Apple 1.2) | revisión en servidor de reseñas, perfiles y listas | cada release | ingeniería | pendiente de decisión |
| DATA-01 | Reglas del negocio en el servidor: nombre cada 15 días, giro fijo, nombre único | trigger e índice en `fonditas` | por migración | ingeniería | pendiente de decisión |
| PRIV-05 | Recordatorios locales se apagan al cerrar sesión o eliminar la cuenta | `lib/account-session.ts` + prueba | cada release | ingeniería | cubierto por pruebas |

## Regla de evidencia

Cada control debe conservar fecha, responsable, resultado y enlace o archivo de evidencia. Un control no se considera cerrado solo por estar documentado.
