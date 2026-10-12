# Búsqueda: cerrar resultados y recuperar navegación

Reporte: buscar «mole», cerrar las tarjetas con swipe y perder la barra
inferior. El usuario también confirmó que Patio se cerró y volvió al inicio
del iPhone. La pérdida de navegación está corregida en código; la causa
del cierre nativo requiere el informe del dispositivo.

## Diagnóstico confirmado por código

El swipe ocultaba el panel con `sheetHiddenByDrag`, pero conservaba
`searchActive`. La barra dependía exclusivamente de `!searchActive`, por
lo que nunca regresaba. Además, cerrar iniciaba una animación y su
completion cambiaba el estado que iniciaba otra salida. El completion
no distinguía una búsqueda posterior de la que estaba cerrando.

## Corrección

- `lib/use-explore-sheet.ts` concentra visibilidad, detents y gesto. Ocultar
  resultados conserva término/pines y devuelve la navegación sin teclado.
  Revela también la barra si estaba desplazada por un scroll anterior.
- Una sola salida retira el panel. La transición vigente identifica el
  completion válido; cancelar, reabrir y desmontar invalidan callbacks antiguos.
- Durante la salida el panel deja de capturar toques y desaparece del árbol
  accesible. La navegación recuperada puede recibir interacción.
- Foco, confirmar búsqueda y sugerencias reabren los resultados, incluso
  cuando se confirma otra vez el mismo término o se interrumpe un cierre.
- Los handlers del gesto consultan el modo y geometría actuales. Se
  conserva separación de valores/vistas con driver nativo y layout con JS.

## Verificación

`scripts/tests/explore-sheet.test.cjs` ejecuta el hook y la pantalla reales,
con React/native/network aislados. Siete regresiones: cierre con navegación,
una única salida, reapertura frente a completion antiguo, submit antes del
render, handlers con estado actual, detent estable ante cambios de geometría
y limpieza al desmontar. La pantalla comprueba además que el overlay que
sale no capture toques y que submit/foco restablezcan resultados.

- `npm run check`: TypeScript y lint limpios; **164/164 pruebas**.
- Control de release: 29 correctos, 0 errores, los dos pendientes Android
  preexistentes (Maps y Firebase).
- Exportación JavaScript/Hermes iOS y Android completa.
- `git diff --check` del archivo editado sin errores de whitespace.

Evidencia local:

- `/private/tmp/patio-search-dismiss-check-20261010.log`
- `/private/tmp/patio-search-dismiss-native-20261010.log`
- `/private/tmp/patio-search-dismiss-native-20261010/`

## Cierre nativo pendiente de diagnóstico

No hay informe de Patio/Expo en los DiagnosticReports locales. CoreDevice
detectó el iPhone 15 Pro «Parco» como `unavailable`; no se obtuvo un crash
log nuevo. Se solicitó conectar y desbloquear el iPhone para leerlo.
No atribuir el cierre a estas animaciones, memoria o AIRMap sin el stack.
El crash AIRMap de agosto es histórico y no demuestra la causa actual.

Sin simulador, operación de la app en el teléfono, build firmado, commit ni
publicación. Los tests/exportaciones no certifican que el cierre nativo
esté resuelto. QA física pendiente: buscar → swipe → tocar Guardados/Cuenta;
volver → reabrir el mismo término y repetir con teclado/nueva búsqueda.

Decisión posterior del usuario: realizará la prueba en el celular; detener
el diagnóstico por USB, auditoría amplia y EAS. Solo continuar ajustes
puntuales que solicite. Estado posterior: [agrupación y ubicación](COMPACT_CARDS_LOCATION_2026-10-10.md).
