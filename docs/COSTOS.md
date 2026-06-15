# Patio — Control de costos e inversión (Burn tracker)

> Registro de **toda la inversión en Patio** desde el día 1: suscripciones,
> herramientas, créditos, servicios y tiempo. Sirve para calcular el **ROI**
> cuando Patio empiece a generar ingresos.
>
> **Cómo usarlo:** cada vez que pagues algo o termines un hito, agrega una fila.
> Convierte todo a la misma moneda al registrar (usar **USD** como base; anotar
> tipo de cambio si pagas en MXN). Revisar el total mensual al cerrar cada mes.
>
> Campos marcados con `⟨?⟩` los completa Alejandro (solo él tiene la cifra real).

---

## 1) Suscripciones recurrentes (mensuales / anuales)

> El gasto que corre aunque no hagas nada. Lo que más erosiona el ROI.

| Servicio | Plan | Costo | Periodicidad | Desde | Estado | Notas |
|---|---|---|---|---|---|---|
| Apple Developer | Individual | $99.00 USD | Anual | ⟨? mes⟩ | ✅ Activo | Necesario para TestFlight / App Store |
| Figma | Professional | $20.00 USD | Mensual | ⟨? mes⟩ | ✅ Activo | Incluye ~3,000 créditos de Make/mes (reinicio día 7) |
| ChatGPT (OpenAI) | Plus | $20.00 USD | Mensual | ⟨? mes⟩ | ✅ Activo | Usado en el proyecto |
| Claude (Anthropic) | Pro | $20.00 USD | Mensual | ⟨? mes⟩ | ✅ Activo | ~$20 (confirmar monto exacto) |
| Supabase | Free | $0.00 | Mensual | — | Free | Subir a Pro solo al escalar |
| Expo / EAS | Free | $0.00 | Mensual | — | Free | Builds limitados en free |
| Higgsfield | ⟨?⟩ | ⟨?⟩ | ⟨?⟩ | — | ⟨?⟩ | Generación de imágenes de marca |
| Dominio (quehayhoy / patio) | — | ⟨?⟩ | Anual | ⟨?⟩ | ⟨?⟩ | Si ya registrado |

**Subtotal recurrente estimado:** **~$68.25 USD/mes**
(Figma $20 + ChatGPT $20 + Claude $20 + Apple $99÷12 ≈ $8.25)

---

## 2) Créditos de consumo (variable, se reinician)

> Bolsas que se gastan según uso. No son activos permanentes — se reinician al
> mes. Aquí se calibra cuánto comprar.

### Figma Make — créditos

| Mes | Origen | Costo extra | Créditos | Consumidos | Sobrantes | Notas |
|---|---|---|---|---|---|---|
| jun 2026 | Incluidos en plan Professional | $0.00 | ~3,000 | ~3,000 | 0 | Rediseño completo de pantallas v01 con Claude. Reinicio: 7 jul |
| jun 2026 | Compra extra 1,000 (puente) ✅ confirmada | $9.20 hoy | +1,000 (0/1000 usados) | 0 | 1,000 | ⚠️ RECURRENTE $12→$24/mes desde 7 ago. Para cerrar diseño. **CANCELAR antes del 7 jul** o se vuelve cobro permanente |

**Dato clave medido:** ~3,000 créditos incluidos alcanzaron para **un rediseño
completo de pantallas** (toda la carpeta `design-source/figma-make/v01/`).

⚠️ **Lección 2026-06-14:** los 1,000 extra comprados se vaciaron "en una sentada"
en ajustes del menú (que ni quedaron bien). Figma Make es bueno para GENERAR de
cero, MALÍSIMO/carísimo para AJUSTAR (reprocesa todo el proyecto por cada cambio).
**Decisión: cerrar el diseño en código, NO comprar más créditos.** El ajuste de
menú se resolvió gratis en código (era problema de modelo de datos, no visual).

**Referencia de compra EXTRA (tarifas introductorias, jun 2026):**
1000 → $12 · 2500 → $30 · 5000 → $60 · 7500 → $90 · 10000 → $120 · 15000 → $175.50 (todos /mes, se reinician)

> **Estrategia:** los 3,000 incluidos se renuevan cada mes (día 7) SIN costo
> extra. No comprar paquetes extra salvo que se acaben los incluidos antes del
> reinicio. Si urge un puente en mitad de ciclo, comprar el más chico (1000/$12),
> no duplicar los 3,000 que ya vienen incluidos.

---

## 3) Gastos únicos (one-time)

> Compras que no se repiten: assets, registro de marca, hardware, etc.

| Fecha | Concepto | Costo | Notas |
|---|---|---|---|
| ⟨?⟩ | Registro de marca "Saaaaaaabes." | ⟨?⟩ | En consideración (ver identidad verbal) |
| | | | |

---

## 4) Registro de tiempo por hito

> Esfuerzo invertido. Para ROI de tiempo, no solo de dinero. Aproximar en horas
> o días; no hace falta precisión de reloj.

| Hito | Periodo | Tiempo aprox. | Notas |
|---|---|---|---|
| Flujo base Foodie/Fondero | hasta 2026-05 | ⟨?⟩ | App funcional, builds 42–45 |
| Rediseño en Figma Make | 2026-06 → en curso | ⟨?⟩ | Iteración de pantallas |
| Identidad verbal | 2026-06-14 | ~1 sesión | `docs/design/foundations/IDENTITY_VERBAL.md` |
| | | | |

---

## 5) Resumen de inversión total

> Actualizar al cerrar cada mes. Es el número que importa para el ROI.

| Concepto | Acumulado |
|---|---|
| Suscripciones recurrentes | ~$68.25 USD/mes (Figma $20 + ChatGPT $20 + Claude $20 + Apple $8.25) |
| Créditos extra comprados | $0.00 (los usados venían incluidos) |
| Gastos únicos | `⟨?⟩` |
| **INVERSIÓN TOTAL EN DINERO** | `⟨? — sumar meses corridos × $68.25 + Apple anual + únicos⟩` |
| Tiempo total estimado | `⟨?⟩` |

> Para cerrar el total: multiplica $48.25 por los meses que llevas pagando, suma
> el Apple Developer anual y los gastos únicos. Anota el mes de inicio de cada
> suscripción arriba (§1) para que el cálculo sea exacto.

**ROI** = (Ingresos de Patio − Inversión total) ÷ Inversión total.
Aún en fase de inversión (ingresos = $0). Empezar a llenar la columna de
ingresos cuando haya primer cobro a un negocio (ver estrategia de monetización).

---

## Notas de método

- Moneda base: **USD**. Si pagas en MXN, anota el monto MXN y el tipo de cambio.
- Una fila por pago real, no por estimación (las estimaciones van en "subtotal").
- Revisar este doc al cerrar cada mes y actualizar §5.
- Relación con monetización: ver estrategia Pro/gated en memorias del proyecto.
