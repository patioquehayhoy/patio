# QA con Maestro

`run-all.sh` ejecuta por defecto únicamente el smoke de navegación de Release:

```sh
./maestro/run-all.sh --device DEVICE_ID --output-dir /tmp/patio-qa
```

Requiere Maestro y Java ejecutables, un simulador/emulador o dispositivo ya
iniciado, Patio **Release** instalado y sesión cerrada en un entorno de prueba.
Puede configurarse `MAESTRO_BIN`, `MAESTRO_DEVICE_ID`, `MAESTRO_OUTPUT_DIR` y
`JAVA_HOME`. El runner exige un dispositivo explícito para evitar selección
interactiva en CI. Maestro comprueba la conexión al ejecutar el flujo; si el
dispositivo no está disponible o la app no está instalada, el runner falla.

Cada ejecución crea un directorio nuevo. Cada flow tiene su propio `report.xml`
JUnit, `run.log` y carpeta de artefactos. `summary.tsv` registra PASS/FAIL y el
código original. Un fallo no impide ejecutar los flows restantes y el proceso
termina con código 1 si cualquiera falla; los errores de preflight devuelven 2.
La salida de error se conserva en la consola y en el log. No se abre Finder ni
otra interfaz para mostrar los resultados.

El smoke `release/01-public-navigation.yaml` comprueba interacciones reales:
entrada → los tres pasos de introducción → cuenta sin sesión → privacidad →
regreso. Usa rutas y etiquetas del código actual, comprueba que no se muestre
DEV y evita completar onboarding, cambiar preferencias, iniciar sesión,
publicar o limpiar datos. Tampoco concede permisos mediante `launchApp`, que
en Maestro los concede por defecto. El flow acepta, si aparece, el aviso de
iOS para abrir la URL local en Patio; esto no concede permisos de cámara,
ubicación ni notificaciones. La navegación puede inicializar caches
normales de la app; no es una prueba de inmutabilidad del almacenamiento.

Este smoke **no acredita** login, mapa, GPS, cámara, publicación, push,
eliminación de cuenta ni moderación. Ver `docs/STORE_RELEASE_READINESS.md` para
los recorridos que faltan. Un screenshot sirve como evidencia adicional y no
reemplaza una aserción funcional.

Los flows históricos en `flows/` contienen etiquetas antiguas, accesos DEV,
lugares demo y operaciones de escritura. Por ejemplo, `01-index.yaml` toma
solamente una captura; los flows de publicación y reseñas pueden modificar
datos. No forman parte del smoke y necesitan actualizarse y ejecutarse en un
backend/cuenta aislados. Se seleccionan explícitamente:

```sh
./maestro/run-all.sh --device DEVICE_ID maestro/flows/02-onboarding.yaml
```

Validación local del 12 de septiembre de 2026: **1/1 flow aprobado en 42 s**,
código de salida 0, con Maestro 2.5.1 y Temurin 26.0.1. Se usó un simulador
aislado creado para esta QA, `Patio-Release-Smoke-2026-09-11`
(`6E843FF9-4A9B-4E3F-A5F6-BE541F8B2CCA`, iPhone 17 Pro, iOS 26.3), sin sesión.
Los dos intentos anteriores fallaron ante el aviso de apertura de iOS; se
añadió su selector condicional y se reanudó con el aviso pendiente despejado
por el reinicio del simulador. En la corrida aprobada el aviso ya estaba
aceptado y la rama condicional se omitió; el selector sí había ejecutado
el toque en el segundo intento. No se cambiaron pantallas de la app.

Evidencia local (temporal, no incluida en Git):
`/private/tmp/patio-release-smoke-2026-09-11/run.9z3ZBe/` contiene
`summary.tsv`, `1-01-public-navigation/report.xml`, `run.log` dentro de esa
carpeta del flow y `artifacts/release-public-navigation.png`, además del
registro JSON de comandos. JUnit registra `tests="1"`, `failures="0"` y
`status="SUCCESS"`.

Se probó el Release sin firma existente en
`/private/tmp/patio-launch-build/Build/Products/Release-iphonesimulator/Patio.app`,
cuyo `main.jsbundle` es del **10 de septiembre de 2026, 23:08:05 -0600** y
tiene SHA-256
`d31a1e71d202cb8fedf812eb7c62dd2c30f05ab972d447d5d928346f91092579`.
El resultado acredita únicamente este recorrido público en ese binario;
no valida cambios posteriores, Android, un archive de distribución ni los
recorridos autenticados pendientes. También se había validado el manejo de
éxitos/fallos del runner con ejecutables simulados, por separado del smoke.

Referencias: [reportes y artefactos](https://docs.maestro.dev/cli/test-suites-and-reports),
[comportamiento de launchApp](https://docs.maestro.dev/reference/commands-available/launchapp),
[confirmación iOS de openLink](https://docs.maestro.dev/reference/commands-available/openlink).
