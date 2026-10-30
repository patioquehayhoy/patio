# Patio · centro operativo

Esta carpeta es el índice único para mantenimiento, releases y credenciales.

## Regla de seguridad

- Nunca guardar aquí valores de API keys, tokens, contraseñas, JSON de cuentas de servicio o certificados.
- Las credenciales viven en sus almacenes oficiales: Expo EAS, Google Cloud, Supabase, GitHub y Apple.
- Los archivos locales sensibles (`.env`, `credentials.json`, `credentials/`) están ignorados por Git.
- Si una clave se rota, actualizar primero el registro de [CREDENTIALS_INDEX.md](CREDENTIALS_INDEX.md) y después el servicio que la consume.

## Documentos

- [CREDENTIALS_INDEX.md](CREDENTIALS_INDEX.md): dónde vive cada acceso y cómo comprobarlo sin exponer secretos.
- [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md): orden seguro para validar y publicar.
- [LEGACY_NOTES.md](LEGACY_NOTES.md): referencias históricas que no deben usarse como estado actual.

## Estado de identidad

- Expo owner: `patio-quehayhoy`; usuario: `patiomx`.
- GitHub: `patioquehayhoy/patio`.
- Supabase: proyecto configurado en `lib/supabase.ts`.
- EAS project UUID: `2594b27c-9b35-4a52-8fc0-6367d3bfa59f`.
- Slug técnico EAS: `lafondita` (no cambiar: identifica el proyecto existente).
- Nombre visible: Patio.
