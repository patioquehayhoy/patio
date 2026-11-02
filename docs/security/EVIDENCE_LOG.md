# Patio — Evidence Log

## 2026-11-01 — Revisión técnica local

- `npm run check`: completado correctamente.
- TypeScript: sin errores.
- Lint: sin errores.
- Pruebas: 215 correctas, 0 fallas.
- Release check: 29 verificaciones correctas.
- Pendientes detectados por el release check:
  - restringir `GOOGLE_MAPS_ANDROID_API_KEY` por paquete y SHA-1;
  - configurar/verificar `GOOGLE_SERVICES_JSON` como secreto de archivo en EAS.
- Escaneo de repositorio: no se detectaron claves privadas conocidas incrustadas.
- La revisión local no sustituye la verificación en consolas de Google, Expo, Supabase, GitHub o Anthropic.

## 2026-11-01 — Auditoría de la app (tarde)

- `npm run check`: 216 pruebas correctas; 29 verificaciones de release; 2 pendientes externos.
- Producción (solo lectura): RLS activo en todas las tablas públicas; borrado de cuenta en cascada verificado.
- `npm audit --omit=dev`: 0 altas/críticas; 33 moderadas y 1 baja en herramientas de compilación.
- Detalle y decisiones abiertas: `docs/APP_AUDIT_2026-11-01.md`.

## Plantilla de revisión

```text
Fecha:
Control:
Responsable:
Acción realizada:
Resultado:
Evidencia (archivo, URL o captura):
Próxima revisión:
```
