# Firebase y Supabase — decisión vigente

> **FCM configurado en Expo:** la cuenta dedicada `patio-expo-push` y su clave
> FCM V1 aparecen en Expo para `com.parcomx.patio`, proyecto `patio-eas`.
> La cuenta `eas-submit` y la firma de Google Play se comprobaron intactas.
> La copia temporal de la clave creada en Descargas se eliminó; la copia local
> protegida de `credentials/android/` está excluida de Git. La configuración
> cliente consta en EAS preview y production. Falta validar un build y recepción
> real Android; no declarar push operativo hasta completar dicha prueba.

> **Estado actualizado 2026-10-28:** el usuario autorizó continuar con FCM
> usando el proyecto existente `patio-eas`. Firebase se agregó a ese proyecto
> Spark, con Analytics desactivado; se registró Android `com.parcomx.patio` y
> FCM V1 figura habilitado. El archivo cliente correcto se guardó fuera de Git
> y la variable secreta `GOOGLE_SERVICES_JSON` aparece en EAS preview y
> production de `@patio-quehayhoy/lafondita`. Se creó la cuenta dedicada
> `patio-expo-push@patio-eas.iam.gserviceaccount.com` con rol de API FCM y
> una clave JSON autorizada, guardada fuera de Git. Cargar esa clave en Expo
> sigue pendiente: la revisión automática no pudo completarse por límite de
> uso y no ejecutó la acción. Sin esa carga ni prueba en teléfono, push Android
> no está terminado. El texto posterior conserva el contexto histórico.

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
