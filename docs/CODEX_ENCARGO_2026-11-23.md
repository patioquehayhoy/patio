# Encargo para Codex — 23 noviembre 2026

Parco pidió dejarle a Codex **tiendas y trámites** y el seguimiento de la
**lectura lenta**. Claude dejó listo lo que se podía hacer sin el teléfono.
Antes de empezar, leer el [heads-up](HEADS_UP_2026-10-12.md) y la
[auditoría de redacción](AUDITORIA_REDACCION_Y_VIGENCIA_2026-11-23.md).
Lado difícil hoy: el negocio que publica su menú del día.

## A. Lectura lenta

### Lo que ya quedó (Claude, 23 nov)

- **Bug corregido:** el teléfono cortaba la lectura a los 60 s, pero el servidor
  espera al modelo hasta 110 s. Un menú largo que el servidor sí terminaba
  fallaba siempre en el teléfono y gastaba la lectura. Ahora el límite es
  `READ_DEADLINE_MS = 120_000` en `lib/vision.ts`. Siguen el aviso a los 12 s
  y «Cancelar».
- **Medición en producción:** `read-menu` desplegada con un registro por
  lectura, sin datos de la persona ni del menú:
  - `ms_total`, `ms_antes_del_modelo` y `ms_modelo`;
  - `kb_imagen`, `tokens_entrada` y `tokens_salida`;
  - `secciones` y `platillos`.

  Las fallas registran `fallo` y `ms_total`.
- **Diagnóstico por código (aún sin medir):**
  - La imagen ya llega reducida al tamaño que usa el modelo
    (`visionSize` en `useFotoMenuController.ts`).
  - El modelo no piensa antes de contestar.
  - La espera casi seguro la pone lo que escribe: unos 60 tokens por platillo,
    con seis campos cada uno.
  - Por eso un menú largo e impreso tarda mucho más que un pizarrón corto.

### Lo que sigue, en orden

1. **Medir con Parco en el iPhone:** 3 a 5 menús reales (un pizarrón corto,
   uno mediano y uno impreso largo). Leer los registros en Supabase → Edge
   Functions → `read-menu` → Logs (buscar `lectura`). Comparar con lo que
   dice Metro: `[foto-menu] preparar imagen ms` y `lectura ms`.
   - Si `ms_modelo` crece con `tokens_salida`, el cuello es lo que escribe el
     modelo.
   - Si `ms_antes_del_modelo` es grande, el cuello es el acceso, la cuota o el
     arranque en frío.
   - Si el teléfono tarda mucho más que `ms_total`, el cuello es la subida o
     la red.
2. **Probar, una a la vez y con las mismas fotos**, contra las 64 fotos reales
   de `docs/research/menus-gmaps`, revisando la calidad al lado de la actual:
   - **Menos salida, sin costo:** campos por platillo más cortos (por
     ejemplo, `motivoRevision` vacío salvo que haga falta revisar). Puede
     cambiar respuestas: revisar.
   - **Modelo más rápido:** `claude-sonnet-5-5` o `claude-haiku-5-5` (los dos
     cuestan menos que `claude-sonnet-4-6`). Antes de cambiar, leer la guía de
     migración del skill `claude-api`. Sonnet 5.5 piensa por defecto, así que
     hay que bajar `effort` o usar `thinking: {type: "between_tools"}`, y
     además pide manejar `fallbacks`/`refusal`.
   - **Que la espera se sienta menos:** mostrar los platillos conforme se
     leen (streaming). Es el cambio más grande; solo vale la pena si los
     anteriores no alcanzan.
3. **Cobro:** la comparación de modelos gasta API. Pedir el sí de Parco con
   el costo estimado antes de correrla. La estimación es de unos USD 5 por
   64 fotos y tres modelos; verificar los precios vigentes. No cambiar modelo
   ni bajar calidad sin esa comparación.

## B. Tiendas y trámites

Lo que solo puede hacer Parco (firmar, pagar, entrar a su cuenta) va marcado.
Lo demás Codex lo puede preparar o hacer.

| # | Tarea | Quién | Dónde está el detalle |
| --- | --- | --- | --- |
| 1 | App Store Connect: ver si el banco y Paid Apps ya pasaron de «Processing»; después, pedir el Small Business Program. | Parco entra; Codex guía. | [Pendientes](PENDING_LAUNCH_2026-10-12.md), corte 15 nov |
| 2 | Google Play: perfil de pagos. | Parco | [Billing](BILLING_SETUP_2026-10-26.md) |
| 3 | Comprar `quehayhoy.mx` y `quehayhoy.com.mx`; redirigir. | Parco paga | Corte 11 nov |
| 4 | Publicar el aviso de privacidad y la página para eliminar la cuenta en el dominio; poner `EXPO_PUBLIC_PRIVACY_URL`. | Codex | `docs/legal/` |
| 5 | Antes de publicar el aviso: corregir lo que encontró la auditoría. Borrar también las fotos del local, de los platillos y de las reseñas al eliminar la cuenta, con prueba. Redactar «Tus visitas» en segundo plano. Ajustar los textos de listas privadas. | Codex | [Auditoría](AUDITORIA_REDACCION_Y_VIGENCIA_2026-11-23.md) |
| 6 | Pegar los 6 correos de `supabase/templates/` en Authentication → Email Templates y mandar un código de prueba. | Parco en el panel (o Codex en su Chrome, con su sí) | [Plantillas](../supabase/templates/README.md) |
| 7 | ✅ Hecho por Claude el 24 nov: cuenta de revisión con código fijo en el servidor (`review-login`). | — | [Consolas](STORE_CONSOLES_2026-11-11.md) §7 |
| 8 | App Privacy y Data Safety: respuestas listas; agregar la ubicación en segundo plano. | Codex prepara; Parco envía | Consolas §1–§3 |
| 9 | Builds nuevos iOS y Android (el instalado no muestra varias fotos por reseña) y video de 30 s para la ubicación en segundo plano de Play. | Codex con el skill `eas-build-check`; Parco graba | Consolas §5 |
| 10 | `GOOGLE_MAPS_ANDROID_API_KEY` y `GOOGLE_SERVICES_JSON` (los 2 pendientes de `check:release`). | Codex | [Inventario](CREDENTIALS_INVENTORY_2026-10-27.md) |
| 11 | Productos de Pro en las dos tiendas. Esperar la decisión de Parco sobre Pro y Pro 10 ([marcas, sucursales y equipo](SUCURSALES_Y_EQUIPO_2026-11-23.md) §5 y §9). | Parco decide; Codex crea | Billing |
| 12 | SAT: actividad de software y declaraciones de RESICO. | Parco con su contador | Corte 15 nov |
| 13 | Al final: datos legales, candidato firmado, TestFlight y prueba cerrada de Play (12 personas, 14 días); revocar la clave antigua de Anthropic. | Los dos | [Preparación](STORE_RELEASE_READINESS.md) |
| 14 | Antes de la primera cadena: confirmar con App Review que el plan Cadenas se puede vender por contrato fuera de la app (3.1.3(c)), sin precio ni botón en la app. | Codex prepara; Parco envía | [Sucursales](SUCURSALES_Y_EQUIPO_2026-11-23.md) §5 |

Al terminar cada punto: anotarlo en el heads-up y marcar la casilla en
pendientes. No hacer push, builds ni compras sin el sí de Parco.
