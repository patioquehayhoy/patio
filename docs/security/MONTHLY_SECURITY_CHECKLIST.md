# Patio — Monthly Security Checklist

## Cada mes

- [ ] Revisar miembros y roles de GitHub, Expo, Supabase, Google Cloud y Anthropic.
- [ ] Revocar accesos que ya no sean necesarios.
- [ ] Revisar credenciales creadas, próximas a rotar y revocadas.
- [ ] Confirmar que no existan secretos en Git, logs o builds públicos.
- [ ] Revisar errores de Edge Functions y alertas de abuso.
- [ ] Confirmar que los backups recientes existan.
- [ ] Registrar una prueba o simulacro de restauración cuando corresponda.
- [ ] Revisar solicitudes de eliminación y reportes de privacidad.
- [ ] Ejecutar `npm run check` y guardar el resultado en `docs/security/EVIDENCE_LOG.md`.

## Cada release

- [ ] Revisar cambios de migraciones y RLS.
- [ ] Revisar variables EAS de preview/production.
- [ ] Confirmar Maps, FCM/APNs y permisos nativos.
- [ ] Revisar App Privacy y Data Safety.
- [ ] Confirmar versión, firma y responsable del release.

## Registro

```text
Fecha:
Responsable:
Resultado:
Hallazgos:
Acciones correctivas:
Evidencia:
Próxima revisión:
```
