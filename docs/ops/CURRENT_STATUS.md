# Patio — cierre técnico y operativo

Actualizado: 2026-10-30

## Cerrado

- Identidad Expo/EAS: `patiomx` / Patio.
- Repositorio: `patioquehayhoy/patio`.
- Proyecto EAS: `patio-quehayhoy/lafondita` (slug técnico conservado por compatibilidad; nombre visible Patio).
- `GOOGLE_SERVICES_JSON` existe en EAS Production.
- Dependencia vulnerable `decode-uri-component` fijada a `0.5.1` mediante override.
- `npm run lint` y `npx tsc --noEmit` pasan.
- Búsqueda de secretos en archivos versionados: sin coincidencias de claves privadas, Anthropic o Google API.
- Inventario de credenciales y runbook de release: `docs/ops/`.
- Build Android production terminado: AAB `versionCode 12`.
- Build Android preview terminado: APK `versionCode 12` para prueba interna.

## Bloqueado por acceso o prueba externa

- Push Android: requiere instalar el APK preview en un teléfono Android real para verificar entrega y apertura.
- Supabase: instalar/revisar plantillas de correo desde el dashboard propietario.
- Anthropic: revisar y revocar la clave legada desde la consola que la creó.
- Soporte: conectar el correo de soporte y comprobar la bandeja.

## Nota de seguridad

No ejecutar `npm audit fix --force`: propone cambios mayores de Expo y puede romper el SDK actual. Las vulnerabilidades restantes son bajas/transitivas y se revisarán en una actualización planificada.

