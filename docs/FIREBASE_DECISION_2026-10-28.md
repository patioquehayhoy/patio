# Firebase y Supabase — decisión vigente

Patio utiliza Supabase para Auth, base de datos, Storage y funciones de servidor.
No necesitamos Firebase como backend y no se deben crear nuevos proyectos
Firebase para sustituir o duplicar Supabase.

El proyecto Firebase nuevo `patio-25a52` ya figura borrado según la verificación
previa. No está conectado al código ni a Expo. No se debe restaurar ni reutilizar
su archivo descargado para configurar Patio.

## Diferencia pendiente de decisión: push Android

Actualización: el usuario pidió completar push remoto y el candidato Android.
Se preparó agregar FCM al Google Cloud histórico `patio-eas`, sin duplicar
Supabase. La revisión automática exige confirmación explícita de ese enlace
por la instrucción previa de retirar Firebase; pregunta pendiente en el chat.
No se agregó Firebase a `patio-eas` ni se crearon claves nuevas.

El usuario respondió afirmativamente al alcance FCM, pero simultáneamente
volvió a cuestionar la insistencia en Google/FCM. Se detuvo la configuración
externa para no avanzar con esa objeción sin resolver. No activar servicios.

Expo utiliza FCM para entregar push a Android, incluso cuando el emisor es una
función Supabase. Eliminar FCM implica posponer esa capacidad. No confundir
Supabase Realtime con entrega push cuando la aplicación está cerrada.

- https://supabase.com/docs/guides/functions/examples/push-notifications
- https://docs.expo.dev/push-notifications/fcm-credentials/

Hasta resolver esta decisión, no crear proyectos, claves ni activar servicios.
La configuración Android pendiente no se considera terminada.

`patio-eas` es el proyecto Google Cloud histórico de la cuenta de servicio de
EAS Submit/Google Play. No borrarlo como parte de la limpieza de Firebase:
conserva una función de publicación independiente de la decisión sobre push.

Conservar las notas de auditoría como historial; no afirmar ausencia de rastros
en logs del proveedor ni borrar evidencia de cambios realizados.
