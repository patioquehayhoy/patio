# Preparación de lanzamiento — Patio

Auditoría de configuración: 9–10 de septiembre de 2026. **La configuración mejoró, pero el lanzamiento público sigue bloqueado por configuración externa, validación de backend, políticas públicas, moderación y QA en dispositivos.** No se creó ni envió un build EAS durante esta auditoría.

## Configuración corregida

| Área | Estado verificable |
| --- | --- |
| Identidad nativa | iOS y Android conservan `com.parcomx.patio`; enlaces `patio://`; versión comercial `1.0.0`. No se cambió de aplicación registrada. |
| Icono iOS | Se reutilizó `assets/images/p-icon.png`, PNG opaco de 1024 × 1024, en lugar de una imagen transparente de 4267 × 4267. El icono generado por prebuild también es opaco y mide 1024 × 1024. |
| Permisos iOS | El prebuild solicita cámara, fototeca y ubicación durante el uso. Se eliminaron micrófono y ubicación permanente añadidos por los plugins por defecto. |
| Permisos Android | Se bloquean audio, ubicación en segundo plano y acceso amplio a fotos, videos y almacenamiento. La app selecciona imágenes concretas con el picker del sistema; falta validar captura/selección/compartir en dispositivos. |
| Maps Android | `app.config.js` recibe `GOOGLE_MAPS_ANDROID_API_KEY`; un build EAS Android `production` se detiene si falta. |
| Firebase Android | `app.config.js` recibe la ruta `GOOGLE_SERVICES_JSON`; producción Android comprueba que exista. Esto permite incluir la configuración cliente necesaria para push. |
| Push Android | El plugin declara el canal `default`, que debe coincidir con el canal creado por `lib/community-notifications.ts`. Credenciales y entrega real siguen pendientes. |
| EAS | Entornos explícitos development/preview/production; producción `store`, incremento remoto de versiones, AAB Android, imagen iOS con Xcode 26.0 y Android con JDK 17. Submit Android apunta a borrador en el canal interno. |
| Privacidad nativa | `NSPrivacyTracking: false` explícito. Los SDK agregan sus razones de uso de APIs mediante el proceso nativo de Expo/React Native. El formulario de datos de la tienda requiere una declaración aparte. |

Las carpetas `ios/` y `android/` están ignoradas por Git y se regeneran. Las fuentes de configuración son `app.json`, `app.config.js` y `eas.json`. Los cambios se comprobaron en una copia temporal; el `ios/` local existente puede conservar permisos e iconos anteriores hasta volver a ejecutar prebuild.

## Requisitos de las tiendas consultados

| Requisito | Fuente oficial y resultado para Patio |
| --- | --- |
| Apple: SDK | Desde el **28 de abril de 2026**, las cargas de iOS necesitan SDK iOS 26 o posterior. La imagen EAS elegida tiene Xcode 26.0. La Mac tiene Xcode 26.3 y SDK iOS 26.2. [Apple: requisitos mínimos](https://developer.apple.com/news/?id=ueeok6yw), [imágenes EAS](https://docs.expo.dev/build-reference/infrastructure/). |
| Google Play: target API | La página de Android Developers consultada el **10 de septiembre de 2026**, actualizada el 1 de septiembre, establece **API 36 para nuevas apps y actualizaciones desde el 31 de agosto de 2026**. Su referencia a API 35 corresponde a disponibilidad de apps existentes. Patio es una nueva publicación móvil y ya usa target/compile 36 en React Native 0.81.5. [Requisito de target SDK](https://developer.android.com/google/play/requirements/target-sdk). |
| Android: bibliotecas nativas | Patio incluye C/C++ mediante React Native y otros SDK. Hay que inspeccionar el AAB/APK final, sus bibliotecas ELF y alineación de 16 KB, y probarlo en ese entorno. Tener RN reciente o NDK r27b no demuestra por sí solo que todos los binarios cumplan. [Guía oficial de páginas de 16 KB](https://developer.android.com/guide/practices/page-sizes). |
| Eliminación de cuenta Apple | Crear una cuenta exige poder iniciar su eliminación dentro de la app, incluyendo contenido asociado que no deba conservarse. El código añadido en esta auditoría debe desplegarse y probarse con una cuenta de prueba. [Apple: eliminación de cuenta](https://developer.apple.com/support/offering-account-deletion-in-your-app/). |
| Eliminación de cuenta Google | Además del camino dentro de la app, se necesita un recurso web público para solicitar eliminación de cuenta y datos. Falta una URL pública operativa. [Google Play: eliminación](https://support.google.com/googleplay/android-developer/answer/13327111). |
| Contenido de personas | Perfiles, fotos, menús y reseñas requieren mecanismos efectivos de filtrado, reporte, atención, bloqueo y contacto. El lanzamiento público queda bloqueado hasta completar el flujo de moderación. [Apple: sección 1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content). |
| Google: pruebas de cuentas personales nuevas | Si la cuenta es personal y fue creada después del 13 de noviembre de 2023, necesita prueba cerrada con 12 personas inscritas durante 14 días consecutivos y aprobación de acceso a producción. No se verificó el tipo ni la fecha de la cuenta de Patio. [Requisitos de pruebas](https://support.google.com/googleplay/android-developer/answer/14151465). |

Los mínimos soportados por el código instalado son iOS 15.1 y Android API 24. Son diferentes de los SDK usados para compilar y del target exigido por las tiendas. Los SDK efectivamente incluidos y permisos finales se deben confirmar en el artefacto firmado.

## Configuración externa pendiente

1. **Maps Android:** habilitar Maps SDK for Android en Google Cloud, proporcionar `GOOGLE_MAPS_ANDROID_API_KEY` en el entorno EAS correspondiente y restringirla a `com.parcomx.patio` con las huellas SHA-1 de las firmas que se usarán. La firma de Play App Signing puede diferir de la firma de desarrollo/carga. Verificar mapa desde una instalación de Google Play. [Configuración oficial de Expo para react-native-maps](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/).
2. **Push Android:** registrar el cliente Firebase con el package correcto; cargar su `google-services.json` como variable EAS de tipo archivo `GOOGLE_SERVICES_JSON`. La cuenta de servicio FCM V1 se configura en EAS Credentials: **no** se coloca en esa variable ni dentro de la app. Configurar las credenciales APNs de iOS y comprobar entrega real en ambas plataformas. [Credenciales FCM V1](https://docs.expo.dev/push-notifications/fcm-credentials/).
3. **Backend:** desplegar y comprobar migraciones, reglas RLS, funciones de IA, publicación, push y eliminación de cuenta de esta auditoría. Verificar eliminación de filas, archivos de Storage, tokens y sesión con una cuenta de prueba. Configuración en Git no acredita despliegue.
4. **Acceso:** probar magic link con la app cerrada, en segundo plano y abierta, enlace expirado/reutilizado y regreso desde otro dispositivo. Confirmar las URLs de retorno permitidas y templates en Supabase. Preparar acceso real para el equipo de revisión sin introducir un bypass público de autenticación.
5. **Privacidad y soporte:** definir responsable, correo de soporte y URLs HTTPS públicas de privacidad y eliminación. Completar App Privacy y Data Safety desde los datos que realmente se envían: cuenta, perfiles, contenido, ubicación del negocio, identificadores push y procesamiento de fotos por IA. No declarar “no se recopilan datos” por tener `NSPrivacyTracking: false`. Revisar retención, terceros y política de eliminación.
6. **Moderación:** completar reporte y bloqueo de personas/contenido, términos aceptados al publicar, revisión de reportes y un contacto atendido. Probar con dos cuentas. El borrado propio no reemplaza la moderación del contenido público.
7. **Propiedad:** resolver el P0 de identidad e infraestructura registrado en `docs/STATE.md` y `docs/TASKS.md`: administradores, propiedad neutral y recuperación de cuentas. No se migraron ni eliminaron proyectos en esta auditoría.
8. **Fichas y firma:** confirmar cuentas, contratos, firma, clasificación de edad/contenido, regiones, descripción, soporte, privacidad y capturas actuales. Las capturas históricas de `assets/screenshots/` no acreditan el comportamiento de este corte.

`.env.example` documenta únicamente nombres y propósito. Las llaves Maps y la configuración cliente Firebase viajan en el binario; las credenciales de servidor se mantienen fuera. El control local verifica presencia y rutas, no habilitación, restricciones, facturación ni validez remota de credenciales.

## Evidencia técnica realizada

| Comprobación | Resultado |
| --- | --- |
| `node scripts/check-release.mjs` | 29 verificaciones correctas, 0 errores, 2 pendientes externos: Maps y archivo Firebase Android. |
| `node scripts/check-release.mjs --strict --platform=ios` | 19 verificaciones correctas, 0 errores, 0 pendientes de configuración detectados por este script. No equivale a aprobación para lanzar iOS. |
| `node scripts/check-release.mjs --strict` | Devolvió código 1 por las dos variables Android pendientes. La salida no imprime sus valores. |
| Configuración dinámica | 5/5 tests correctos: iOS y desarrollo sin credenciales Android, bloqueo de producción sin Maps/Firebase o con archivo ausente, e inyección de configuración preservando identidad/plugins/EAS. Tests reproducibles en `scripts/tests/release-config.test.cjs`. |
| Prebuild iOS + Android | `expo prebuild --no-install --platform all --skip-dependency-update react-native,react` finalizó correctamente en una copia aislada del proyecto. No instala pods ni compila/firma los binarios. |
| Inspección del prebuild | iOS sin micrófono ni ubicación permanente; Android con los seis permisos no usados marcados `tools:node="remove"`; canal push `default`; icono iOS opaco 1024 × 1024. Falta comprobar el manifiesto final fusionado del build Android Release. |
| SDK y herramientas | Xcode 26.3, SDK iOS 26.2, CocoaPods; Android SDK 36 instalado, adb presente en SDK pero fuera del PATH, JBR 21 de Android Studio. El Java predeterminado del sistema es 26; EAS usa la imagen JDK 17 configurada. |
| Lint de archivos de configuración | `npx eslint app.config.js scripts/check-release.mjs` terminó sin errores. |

No se ejecutaron en este frente un archive iOS firmado, Gradle Release, análisis del AAB, instalación desde tienda ni pruebas en teléfonos. El export JS iOS/Android y la auditoría global de dependencias se registran en el cierre general de la auditoría.

## Recorrido de aceptación antes del envío

Registrar dispositivo, SO, versión/build, resultado y evidencia para cada caso. Ejecutar con una instalación nueva y con una actualización que conserve datos.

| Flujo | Casos necesarios |
| --- | --- |
| Inicio y acceso | Instalación limpia, arranque sin red, exploración sin cuenta, acceso por magic link, expiración, cerrar sesión, alternar dos cuentas sin cruzar sus datos. |
| Foodie | Ubicación concedida/aproximada/denegada, búsqueda con y sin resultados, ficha pública, guardar/desguardar, colecciones, compartir y abrir un enlace recibido. |
| Fondero | Alta completa, dirección manual/GPS, horarios, publicar foto y texto, corregir extracción, publicar doble toque, fallo de red y reintento, recuperar borrador y comprobar visibilidad desde otra cuenta. |
| Fotos y cámara | Permiso denegado, acceso limitado, picker nativo Android, cancelar selección/recorte, foto grande, rotación EXIF y compartir el póster fuera de la app. |
| Comunidad | Crear/eliminar reseña, ver contenido ajeno, reportar, bloquear y comprobar ocultación y respuesta de moderación. Este flujo continúa pendiente. |
| Push | Permiso inicial Android 13+, denegar y reactivar, recepción con app abierta/cerrada, tocar notificación, apagar preferencias, cerrar sesión/cambiar cuenta y comprobar que ya no llegan avisos ajenos. |
| Privacidad | Eliminar una cuenta con negocio, fotos, reseñas y favoritos; comprobar datos y archivos, cierre de sesión, no acceso residual y posibilidad de registro nuevo. Probar la solicitud web pública. |
| Plataforma | iPhone real y Android real: zonas seguras, teclado, botón/gesto atrás, texto grande, VoiceOver/TalkBack, tema claro/oscuro, reanudación y red lenta. Android: probar también bibliotecas en entorno de 16 KB. |

## Secuencia de cierre

1. Resolver configuración externa, desplegar backend y completar privacidad/moderación.
2. Ejecutar tests, typecheck, lint y `node scripts/check-release.mjs --strict` con el entorno destinado a producción.
3. Generar un único build candidato por plataforma, comprobar firma, permisos, privacy manifest y bibliotecas nativas.
4. Ejecutar los recorridos anteriores desde TestFlight y el canal de pruebas de Google Play; corregir fallos y conservar evidencia.
5. Completar metadatos, acceso de revisión y requisitos de la cuenta; enviar el candidato verificado a revisión. Este documento no realiza el envío ni la publicación.
