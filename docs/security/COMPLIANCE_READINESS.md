# Patio — Compliance Readiness

**Alcance:** preparación interna para SOC 2, ISO/IEC 27001, ISO/IEC 27002 e ISO/IEC 27701.  
**Estado:** baseline en construcción; no es una certificación ni una declaración de cumplimiento.

## Alcance de Patio

- App móvil Expo/React Native para iOS y Android.
- Supabase Auth, Database, Storage y Edge Functions.
- Expo/EAS y credenciales de publicación.
- Google Maps y notificaciones push.
- Anthropic para funciones de IA.
- Soporte, correo transaccional y operación de cuentas.

## Datos tratados

| Categoría | Ejemplos | Control requerido |
|---|---|---|
| Cuenta | correo, identificador Auth | mínimo privilegio, eliminación |
| Perfil | nombre, avatar, bio | privacidad y visibilidad |
| Ubicación | ubicación del dispositivo, ubicación de negocio | consentimiento, precisión mínima |
| Contenido | menús, fotos, reseñas, avisos | moderación, propiedad y borrado |
| Operación | tokens push, logs, reportes | retención limitada, acceso restringido |
| IA | fotos/menús enviados para lectura | proveedor, finalidad y retención |

## Matriz inicial

| Área | Estado actual | Pendiente de cerrar |
|---|---|---|
| Autenticación y sesiones | Cubierta por pruebas | MFA para cuentas administrativas |
| RLS y permisos | Cubierta por pruebas | evidencia periódica de revisión |
| Secretos | Sin claves privadas detectadas en código | inventario, rotación y responsable |
| Edge Functions | Autorización y límites probados | monitoreo de errores y alertas |
| IA | cuotas y errores controlados | contrato, retención y revisión de proveedor |
| Eliminación de cuenta | Implementada y probada | evidencia de ejecución y retención |
| Ubicación | permisos y fallos controlados | texto de consentimiento y retención |
| Push | flujo implementado | revisar credenciales FCM/APNs por entorno |
| Backups | depende de Supabase | documentar frecuencia, restauración y responsable |
| Incidentes | controles parciales | procedimiento, severidad, escalamiento y registro |
| Proveedores | Supabase, Expo, Google, Anthropic | inventario, finalidad y revisión contractual |
| Privacidad | documentos existentes | publicar URLs finales y alinear App Privacy/Data Safety |

## Controles mínimos a implementar

### Seguridad técnica

- MFA en cuentas administrativas y proveedoras.
- Claves separadas para desarrollo, preview y producción.
- Rotación documentada y revocación de credenciales antiguas.
- `service_role` solo en backend/Edge Functions.
- Claves Maps restringidas por plataforma, paquete, SHA-1 y APIs.
- Revisión de RLS después de cada migración sensible.
- Logs sin tokens, correos completos ni contenido privado innecesario.
- Backups y simulacro de restauración.

### Privacidad

- Inventario de datos y finalidad por función.
- Política de privacidad y eliminación accesibles por HTTPS.
- Consentimiento de ubicación y uso de fotos/IA.
- Retención definida para fotos, logs, reportes y tokens push.
- Flujo para acceso, corrección y eliminación de datos.
- Registro de proveedores y transferencias.

### Operación y evidencia

- Responsable por cada sistema y credencial.
- Revisión mensual de accesos.
- Registro de cambios y despliegues.
- Registro de incidentes y pruebas de recuperación.
- Checklist de release por plataforma.
- Revisión trimestral de riesgos.

## Orden de cierre

1. Completar inventario de credenciales y propietarios.
2. Cerrar Maps, FCM/APNs y secretos EAS por entorno.
3. Activar MFA administrativo.
4. Confirmar backups y restauración.
5. Finalizar retención, privacidad y eliminación.
6. Documentar incidentes, accesos y proveedores.
7. Adjuntar evidencias de pruebas técnicas ya existentes.
8. Hacer una revisión de preparación antes de buscar auditoría formal.

## Nota de alcance

SOC 2 e ISO/IEC 27001/27701 requieren controles organizacionales, políticas, responsables y evidencia operativa además del código. Este documento prepara Patio para ese proceso; no sustituye una auditoría independiente ni asesoría legal.
