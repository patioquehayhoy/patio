# Inventario verificado de accesos y credenciales de Patio

> **Estado vigente 2026-10-28:** transferencia Expo completada a
> `patio-quehayhoy/lafondita`, mismo UUID y credenciales; `patiomx` Owner,
> Admin temporal Parco retirado. GitHub CLI Patio con escritura confirmada.
> Los párrafos siguientes son cortes históricos, superados por
> `EXPO_IDENTITY_MIGRATION_2026-10-28.md` y `FIREBASE_DECISION_2026-10-28.md`.

> **Expo Patio, 2026-10-28:** onboarding terminado, usuario `patiomx` y
> organización `patio-quehayhoy` con correo Patio; Owner comprobado.
> No se creó otro proyecto EAS. Transferencia aún pendiente: invitación temporal
> Admin a Parco preparada, no enviada, esperando autorización explícita.
> [Seguimiento y pasos restantes](EXPO_IDENTITY_MIGRATION_2026-10-28.md).


> **Seguimiento 2026-10-28:** Firebase muestra que `patio-25a52` fue borrado
> recientemente y es recuperable desde Google Cloud. Confirmación visual del panel;
> no se ejecutó un segundo borrado. Expo sigue en `parcomx`; contiene tres proyectos:
> Patio (`lafondita`), `t1fc` y `t1-futbol`. No cambiar el correo global.
> Transferencia de solo Patio pendiente: el panel no ofrece destinos válidos y
> exige ser administrador de origen y destino. Falta crear/verificar el acceso
> Expo con correo Patio y habilitar una cuenta receptora administrable desde ambos
> lados. No se transfirió ni se cambió slug/owner, firmas o UUID de EAS.


Corte: 2026-10-27, America/Mexico_City. Auditoría de lectura: archivos locales,
Expo/EAS, Google Play y Google Cloud con la cuenta Patio, y metadatos Supabase.
No se crearon ni rotaron claves, no se transfirieron cuentas/proyectos, no se
habilitaron APIs, no se iniciaron builds, envíos, pruebas IA pagadas ni compras.

## Conclusión operativa

Patio **ya tiene infraestructura de firma, builds y distribución en ambas
plataformas**. Conservarla. La falta de FCM Android no implica que falte la firma
Android, Google Play, la cuenta de desarrollador o la cuenta de servicio de envío.
El trabajo siguiente parte de este inventario, no de una instalación desde cero.

| Frente | Lo comprobado | Estado y acción correcta |
|---|---|---|
| Identidad de app | `com.parcomx.patio` en iOS, Android, Expo y Play | Conservar; no renombrar el package para quitar «parcomx» |
| Proyecto EAS | UUID `2594b27c-9b35-4a52-8fc0-6367d3bfa59f`, owner `parcomx`, slug `lafondita` | Proyecto histórico con builds y credenciales. No recrear |
| Nombre visible Expo | Patio | Cambiado antes de esta auditoría; el slug técnico sigue siendo `lafondita` |
| Correo de cuenta Expo | `contacto.parco@gmail.com`, panel muestra «Not verified» | No se cambió. Separar mantenimiento del correo/propiedad de los bloqueos de release |
| Google Play | Cuenta de desarrollador `Patioquehayhoy`, accesible con `quehayhoy.patio@gmail.com` | Ya existe, no volver a crear ni pagar registro |
| App de Play | Patio, package `com.parcomx.patio` | Ya registrada; prueba interna disponible |
| Último paquete interno Play | App bundle **8 (1.0.0)**, target SDK 36, Android API 24+ | Distribución interna confirmada; no equivale al código actual de octubre |
| Acceso a producción Play | Inactivo; consola pide prueba cerrada, 12 participantes y 14 días; actualmente 0 aceptados | Pendiente de distribución real, no de credenciales |
| Firma Android en Expo | Keystore JKS, alias existente, subido 22-mar-2026 | Reutilizar. No regenerar ni restablecer la clave de carga |
| Envío a Play | `eas-submit@patio-eas.iam.gserviceaccount.com`, cargada en Expo 17-abr-2026 | Existente. Coincide el ID de clave con Google Cloud; cuenta habilitada |
| FCM V1 en Expo | La sección muestra «Add a service account key», sin clave asignada | Pendiente concreto de push Android, separado de EAS Submit |
| iOS en Expo | Certificado y provisioning App Store marcados Valid, equipo `JK2N262L7X` | Reutilizar, no rehacer signing |
| Push iOS | Clave APNs guardada en Expo desde 18-jun-2026 | Existente; falta ensayo de recepción/apertura actual, no crear otra por defecto |
| App Store Connect | API key EAS Submit con rol Admin ya guardada en Expo; `ascAppId=6760884735` en eas.json | Existente; no se abrió Apple ni se validó un nuevo envío en esta auditoría |
| Supabase producción | `gjfjsjlrgycrgmcbjrus`, ACTIVE_HEALTHY | Conservar el backend y la propiedad Patio documentada el 9-oct; no repetir transferencias/migraciones |
| Supabase staging | `jyexohxixfuirvyqqwmf`, INACTIVE | Pausado; no se restauró ni se recreó durante esta auditoría |
| GitHub | `patioquehayhoy/patio`; conexión actual `T1Alejandro`, lectura sí/escritura no | Hace falta una sesión con escritura; no recrear repositorio ni forzar historia |

La cuenta de Play también contiene otra aplicación. No modificar esa aplicación
ni asumir que cambiar un correo global o transferir una cuenta afecta solo Patio.

## Credenciales encontradas dentro de /Users/parco/Patio

| Archivo | Qué contiene / comprobación | Protección |
|---|---|---|
| `credentials.json` | Configuración **iOS**; referencia al certificado y al perfil. No contiene sección Android | Ignorado por Git |
| `credentials/ios/dist-cert.p12` | Certificado de distribución; mismo serial que el certificado guardado en Expo; vence en marzo de 2027 | Ignorado por Git; no se imprimió contraseña ni clave privada |
| `credentials/ios/profile.mobileprovision` | Perfil App Store para `JK2N262L7X.com.parcomx.patio`, vence en marzo de 2027 | Ignorado por Git |
| `.env` | Archivo vacío, 0 bytes | Ignorado por Git |
| `.env.example` | Solo nombres de variables y documentación, sin valores | Plantilla, no acredita configuración real |
| `app.json`, `app.config.js`, `eas.json` | Identidades, UUID de EAS, entornos, recepción de Maps/Firebase y envío a tiendas | Configuración, no llaves privadas |

El UUID del provisioning local difiere del guardado remotamente en Expo; ambos
corresponden al mismo bundle/equipo. No es prueba de invalidez ni motivo para
regenerarlo. El certificado local sí coincide con el remoto.

No se encontró `google-services.json`, keystore Android ni JSON de cuenta de
servicio dentro del proyecto al recorrer archivos por nombre. Tampoco se
identificaron firmas típicas de claves Google/Anthropic/PEM/service-account en los
archivos de texto inspeccionados. Se excluyeron dependencias, Git, Pods, caches de
build y binarios grandes: no es una auditoría del historial Git ni de todo el disco.

Existe `/Users/parco/Downloads/google-services.json`: es el archivo descargado
por esta sesión, para el proyecto nuevo `patio-25a52` y `com.parcomx.patio`.
No se copió al repo ni se cargó en EAS. No mostrar su API key en documentación.

## Google Cloud: proyectos ya accesibles desde la cuenta Patio

| Proyecto | Resultado de lectura |
|---|---|
| `patio-eas` (número 1061665288713) | Existía antes de esta sesión; Google Play Android Developer API habilitada. Cuenta `eas-submit` habilitada y clave coincidente con Expo. No aparecen API keys ni clientes OAuth. En las 23 APIs listadas no aparecen Maps SDK ni FCM |
| My Maps Project / `woven-benefit-492020-d6` | Existía antes de esta sesión. No aparecen claves API, clientes OAuth ni cuentas de servicio. En el listado completo de APIs habilitadas no aparece Maps SDK for Android |
| Patio / `patio-25a52` | **Creado por Codex en esta conversación**, tras autorización para condiciones Firebase; plan Spark, cuenta Patio, app Android registrada. No está conectado a Expo ni reemplaza los proyectos anteriores |

No se afirma que no existan otras llaves en cuentas no inspeccionadas. No crear
más proyectos de Maps/Firebase basándose solo en que falten variables locales.
Antes de conectar push, elegir si se conserva el proyecto nuevo o se integra
Firebase en uno de los proyectos existentes; no borrar ni consolidar durante
esta auditoría.

## EAS: configuración y builds existentes

Consulta de nombres de variables en ámbitos **project y account**, entornos
production/preview/development: las seis combinaciones sin variables. No se
solicitaron valores sensibles ni contenido de archivos.

Esto acredita ausencia en esos entornos EAS actuales, no ausencia de credenciales
históricas o imposibilidad de que builds anteriores usaran otra configuración.
`GOOGLE_MAPS_ANDROID_API_KEY` y `GOOGLE_SERVICES_JSON` siguen sin valores en el
entorno candidato actual. Las credenciales de firma/EAS Submit viven en otro
almacén y **sí están presentes**.

Historial consultado: 20 builds más recientes, sin descargar binarios ni generar
builds. Evidencia saneada: [build-inventory-2026-10-27.json](audits/build-inventory-2026-10-27.json).

- Android producción/store: build 8 terminado; también 7, 6, 5 y 4.
- Android preview/internal: build 8 terminado.
- iOS producción/store: build 48 terminado el 24-jul-2026; también varios anteriores.
- Un build «FINISHED/STORE» no demuestra por sí solo publicación en tienda.
  Para Android se verificó además la disponibilidad del paquete 8 en Play interno.

## Supabase y correo

Cinco funciones ACTIVE con verify_jwt=true: read-menu, smart-setup,
send-publication-notifications, delete-account y search-intent.
El secreto servidor `ANTHROPIC_API_KEY` existe; solo se consultaron nombres.
La verificación OTP y una lectura IA real ya fueron aprobadas en la sesión previa;
no se repitieron llamadas pagadas durante esta auditoría. La existencia de la
clave actual no demuestra revocación de una clave legada.

SMTP Gmail existente y correo Patio ya comprobados en la sesión previa; no se
cambiaron credenciales SMTP. La integración Gmail/programación diaria es un frente
distinto de tener acceso al buzón desde el navegador.

## Cambios de esta conversación que deben quedar explícitos

Antes de esta auditoría, Codex creó `patio-25a52`, registró la app Android y
cambió únicamente el nombre visible de Expo a Patio. No transfirió Expo,
no cambió su correo/owner/slug, no cambió package/bundle, no reemplazó firmas,
no cargó el archivo Firebase en EAS ni creó un build nuevo.

La creación de otro proyecto se adelantó al inventario de `patio-eas` y My Maps
Project. Debió hacerse este inventario primero. No convertir automáticamente ese
proyecto nuevo en el backend o identidad definitiva de Patio.

## Pendientes reales, sin rehacer trabajo

1. Conservar firmas, identificadores, proyecto EAS, cuenta de Play y cuenta EAS Submit.
2. Resolver el origen de Maps/Firebase usando el inventario; luego conectar solo
   lo que falta (Maps Android, archivo cliente y FCM V1), con prueba en teléfono.
3. Planificar prueba cerrada Play de 12 participantes/14 días para acceso a producción.
4. Validar push en ambos teléfonos con las credenciales existentes donde ya las hay.
5. Recuperar escritura GitHub con la cuenta correcta.
6. Si se desea separar Expo de Parco: acordar cambio de correo global o transferencia
   de solo Patio, después de comprobar alcance. No es requisito para probar la app.
7. Revisar después la limpieza del proyecto Firebase añadido; no borrarlo sin decisión.
8. Datos legales/domicilio al final, como pidió Alejandro.

No ejecutar `eas build`, `eas submit`, `eas credentials:configure-build`, cambios
IAM, rotaciones, activación de facturación ni creación de proyectos para «validar»
este inventario. La auditoría no sustituye un ensayo de recepción push ni de envío
actual a tiendas.

## Fuentes verificadas

- [Credenciales Expo](https://expo.dev/accounts/parcomx/projects/lafondita/credentials)
- [Cuenta Expo](https://expo.dev/settings)
- [Patio en Google Play](https://play.google.com/console/u/2/developers/8571748834816517204/app/4974611703078043913/app-dashboard)
- [Prueba interna](https://play.google.com/console/u/2/developers/8571748834816517204/app/4974611703078043913/tracks/internal-testing?releaseType=defaultReleases)
- [Google Cloud patio-eas](https://console.cloud.google.com/apis/credentials?project=patio-eas&authuser=2)
- [Google Cloud My Maps Project](https://console.cloud.google.com/apis/credentials?project=woven-benefit-492020-d6&authuser=2)
- CLI de lectura: `eas build:list`, `eas env:list` (valores ocultos),
  `supabase projects list`, `supabase functions list`, `supabase secrets list`
  (solo nombres), con salidas filtradas.
