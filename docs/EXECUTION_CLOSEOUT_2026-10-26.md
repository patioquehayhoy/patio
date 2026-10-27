# Ejecución de pendientes — 2026-10-26

Solicitud: concretar pendientes, asumir tareas de Claude y dejar domicilio al final.
Rama preservada: `tipografia/monument-neue-montreal`. No se fusionó ni publicó.

## Cambios terminados en código

- Acceso por código en ambos roles, reenvío con espera, validación estricta,
  activación de la cuenta verificada y destino compartido con enlace mágico.
  Plantillas de alta y acceso preparadas con código y enlace.
- Catálogo aprobado y pantalla Tu plan con Foodie/Creador, Gratis/Pro y
  Fundadores. Checkout y restauración RevenueCat implementados tras una bandera
  apagada; comprobación de UUID, productos autorizados y entitlement activo.
  No se permite cobrar mientras falten configuración, cuotas y beneficios reales.
- `decode-uri-component` actualizado 0.2.2 → 0.5.0 con override y parche CJS/ESM
  de query-string 7.1.3. Alertas npm: 8 → **5** (5 altas, 0 moderadas, 0 críticas).
- «Otro» ya estaba implementado: verificado guardado real del payload
  `categorias = ['Tamales oaxaqueños', 'Bebidas']`; pendiente anterior corregido.
  Consulta agregada de giros nuevos preparada, no ejecutada en producción.
- Rutina de soporte documentada; domicilio movido al último bloque del checklist.
- Monument/Neue Montreal conservadas. El usuario pide posponer el pago;
  los archivos siguen bajo licencia de prueba, no se compró licencia comercial.

## Comprobaciones

- `npm run check`: TypeScript/lint y **207/207 pruebas** aprobados.
- Release estático: 29 correctos, 0 errores, 2 pendientes externos Android.
- Exportaciones Metro/Hermes iOS y Android completadas con el parche y SDK nuevos.
- Patch-package reaplica los tres parches. Regresión del decodificador incluye
  espacios/acentos, campos repetidos y entrada malformada grande con timeout.
- Regresiones Auth: formato inválido, normalización, activación y vencimiento
  sin pérdida de cuenta/borradores. Billing: bandera/módulo ausentes, producto
  ajeno, cuenta cambiada, restauración sin entitlement y bloqueo sin sesión.
- `git diff --check` limpio.
- Logs locales: `/private/tmp/patio-check-20261026.log`,
  `/private/tmp/patio-launch-final-export-20261026.log`,
  `/private/tmp/patio-audit-20261026-final.json`.

Estos resultados no equivalen a binarios nativos firmados, QA visual/física,
entrega de correo, proveedor IA, recepción push o compras sandbox verificadas.

## Bloqueos externos comprobados

| Frente | Evidencia | Siguiente acción |
|---|---|---|
| GitHub | Dry-run HTTP 403; conector `push: false` para T1Alejandro | Autenticar una cuenta con escritura; subir la misma historia sin force-push |
| Google/Firebase | Consola exige 2FA de contacto.parco@gmail.com; gcloud sin cuenta | Usuario activa 2FA; después configurar proyecto Firebase y Maps de Patio |
| EAS Android | `production`: sin variables | Configurar clave Maps restringida, archivo Firebase y credencial FCM v1 |
| Supabase | CLI devuelve INACTIVE para producción/staging; hosts no resolvieron; panel sin sesión | Iniciar sesión como propietario, comprobar/restaurar disponibilidad y aplicar plantillas |
| Acceso de revisión | Formulario listo; ninguna cuenta de revisión creada | Configurar cuenta/instrucciones y ensayar entrega a cuenta nueva/existente |
| IA/push | No hay backend accesible/sesión de prueba para el ensayo real | Recuperar disponibilidad; probar proveedor, cuotas, permisos, recepción y apertura |
| Clave legada | Cliente actual no usa EXPO_PUBLIC_ANTHROPIC_API_KEY; revocación no demostrada | Verificar y revocar la clave identificada en la cuenta del proveedor |
| npm | node-forge 1.4.0, sin versión corregida publicada | Esperar corrección compatible o ensayar cambio de cadena; gate CI conservado |
| Gmail | Propuesta de conexión entregada; sin conexión confirmada | Conectar quehayhoy.patio@gmail.com; luego primera revisión y programador diario |
| Compras | SDK preparado; sin cuenta/productos de tienda/RevenueCat | Conectar productos, implementar cuotas/beneficios servidor, nuevo build y sandbox |

Una consulta administrativa Auth recibió 401. La revisión automática rechazó
transformar/reutilizar la credencial local después del fallo por riesgo de sondeo
de credenciales. Se abandonó esa vía; no se alteró el almacén ni se intentó otro
método de extracción. Alternativa: sesión normal del propietario en el panel.
No se guardaron tokens, contraseñas ni cuentas de prueba en el repo.

## Continuación concreta

1. Resolver sesiones/2FA y escritura GitHub, conservar esta rama.
2. Recuperar backend y desplegar las dos plantillas, comprobar OTP length 6.
3. Configurar Maps/Firebase/FCM y validar acceso, IA/push en dispositivos.
4. Completar el backend de planes antes de activar cobros.
5. Conectar soporte y establecer ejecución diaria real.
6. Al final: datos legales/domicilio, terminar y publicar aviso; candidato firmado
   y aceptación final de distribución siguen pendientes.

Detalle: [acceso](REVIEWER_ACCESS_2026-10-26.md),
[compras](BILLING_SETUP_2026-10-26.md), [soporte](SUPPORT_OPERATIONS_2026-10-26.md),
[checklist vigente](PENDING_LAUNCH_2026-10-12.md).
