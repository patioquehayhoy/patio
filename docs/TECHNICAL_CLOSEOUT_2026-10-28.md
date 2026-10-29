# Cierre técnico — 2026-10-28

> **FCM configurado:** Expo muestra la clave de la cuenta dedicada de FCM;
> la credencial de Google Play sigue presente. El archivo Android está en EAS
> preview y production. Pendientes: nuevo build, prueba de recepción Android,
> Maps para producción y tipografías disponibles con licencia para CI/release.

> **Actualización FCM:** `patio-eas` vinculado a Firebase Spark sin Analytics;
> Android registrado y FCM V1 habilitado. `GOOGLE_SERVICES_JSON` configurado
> en EAS preview/production; cuenta de servicio dedicada y clave creadas fuera
> de Git. La carga de la clave FCM en Expo no se ejecutó por límite de revisión
> automática. Falta cargarla, configurar Maps y probar un build en Android.
> EAS CLI está autenticado como `patiomx`. Conservar el contenido posterior
> como corte histórico, no como estado actual.

## Cerrado y comprobado

- GitHub CLI `patioquehayhoy` con push, rama tipográfica subida sin force-push.
- Expo transferido a Patio; firmas y UUID conservados, acceso temporal retirado.
- node-forge 1.4.2: 0 altas/críticas; 16 bajas de deepmerge sin parche publicado.
- Auth de 8 dígitos, correo y lectura IA real ya verificados.
- Nuevo cierre de sesión desvincula solo el token push de esta instalación
  antes de salir de Auth. Si falla la desconexión, conserva sesión para reintentar.
- Registro push serializado con cambios de cuenta; token recordado antes del
  upsert para permitir limpieza aun si se pierde la respuesta de red.
- 209 pruebas, TypeScript/lint aprobados; release tiene 2 pendientes Android.
- Exportaciones locales iOS y Android completadas con la corrección de sesión.
  Log: `/private/tmp/patio-export-push-20261028.log`.

## No dar por terminado

- FCM: vinculación precisa `patio-eas` pendiente de confirmación solicitada.
  No se crearon nuevos proyectos ni claves. Supabase permanece como backend.
  El usuario aprobó el alcance pero volvió a objetar FCM en la misma respuesta;
  se detuvo la configuración externa para resolver esa objeción.
- EAS CLI sigue como Parco: el login por navegador volvió a esa cuenta;
  `project:info` confirmó falta de acceso tras retirar Admin temporal.
  Se necesita sesión `patiomx`, no recrear ni cambiar UUID.
- Maps: falta configuración Android restringida a package y certificado.
- Candidato nativo y recepción/apertura push requieren nuevo build y teléfono.
- Gmail integración y programador diarios no conectados; revisión manual hecha.
- Revocación clave Anthropic legada no demostrada; no extraer credenciales.
- CI 40780798102 falló en export por fuentes ignoradas. Repo público: no subir
  fuentes personales automáticamente. Pendiente vinculado a tipografía/licencias.
- Compras Pro apagadas: cuotas/beneficios servidor, RevenueCat y sandbox siguen
  pendientes, según `BILLING_SETUP_2026-10-26.md`.
- Prueba cerrada de Play y fichas/privacidad/revisor siguen pendientes externos;
  domicilio al final como pidió el usuario. No publicar ni marcar lanzamiento listo.

No confundir configuración, prueba automatizada y validación física.
