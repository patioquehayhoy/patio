# Arquitectura financiera de Patio

> Estado: diseño de dominio. No implementar cobro antes de validar disposición
> de pago con la primera cohorte.

## Principio

La oferta que crea la red permanece gratuita:

- perfil público;
- menú vigente;
- póster canónico;
- publicación y avisos básicos a seguidores.

El cobro debe corresponder a valor adicional medible, no a bloquear la oferta que
Patio necesita para crecer.

## Catálogo inicial

| Producto | Hipótesis | Estado |
|---|---:|---|
| Patio gratis | $0 | Núcleo vigente |
| Patio Pro mensual | $99 MXN | Validar con cohorte |
| Patio Pro anual | $990 MXN | Validar con cohorte |
| IA adicional | Por paquete/consumo | Futuro |
| Promoción local | Campaña etiquetada | Futuro |
| Puesta en marcha | Servicio único | Futuro |
| Comisión | Solo con transacción real | Futuro |

Probar sensibilidad en $49 / $99 / $149 MXN antes de construir StoreKit.

## Componentes de dominio

```txt
oferta comercial
→ producto de tienda
→ compra
→ recibo/validación
→ entitlement
→ acceso a función
→ evento contable
→ soporte/reembolso
```

Nunca inferir acceso desde un botón local. El entitlement validado es la fuente de
verdad.

## Entidades previstas

- `plans`: catálogo interno y beneficios.
- `store_products`: vínculo con App Store/Play por ambiente.
- `subscriptions`: estado externo y fechas.
- `entitlements`: permisos efectivos por cuenta/negocio.
- `usage_ledger`: consumo de IA y créditos.
- `billing_events`: compras, renovaciones, cancelaciones y reembolsos.
- `founder_grants`: seis meses de funciones completas para fundadores.

Todas requieren RLS, auditoría e idempotencia. Los recibos se validan en servidor.

## Ubicación en la experiencia

La suscripción futura vive en Perfil del negocio, dentro de un grupo “Plan”, con:

- plan actual;
- beneficios concretos;
- fecha de renovación;
- administrar suscripción mediante la superficie oficial de la tienda;
- restaurar compras.

No mostrar paywall en onboarding, alta, primera publicación ni corrección de un
menú.

## Orden para aterrizar suscripciones

1. Instrumentar el núcleo gratuito: publicaciones, seguidores, aperturas y
   regreso semanal.
2. Cohorte fundadora con acceso completo y entrevistas de disposición de pago.
3. Definir un solo entitlement `patio_pro`, no permisos sueltos por pantalla.
4. Crear productos espejo mensual/anual en App Store Connect y Google Play.
5. Validar recibos y webhooks en servidor; la app solo consume entitlements.
6. Añadir “Plan” en Perfil del negocio cuando exista al menos un beneficio Pro
   usado semanalmente.
7. Activar paywall únicamente al intentar ese beneficio, con restaurar compras y
   administrar suscripción visibles.

## Qué sí y qué no monetiza el arranque en frío

Gratis para siempre:

- publicar el menú;
- seguir Patios y recibir el aviso básico;
- perfil, mapa, póster y reseñas;
- primera búsqueda útil del agente.

Hipótesis Pro:

- voz y contexto persistente del agente;
- alertas semánticas (“avísame si hay focaccia cerca de Xola”);
- analítica de retorno y demanda para el negocio;
- automatización y reutilización avanzada de menú;
- herramientas de campaña claramente etiquetadas.

### Hipótesis añadida: comunicación del negocio

Posible valor Pro:

- programar anuncios y eventos;
- segmentar audiencia;
- campañas promocionales con vigencia;
- historial y analítica de aperturas;
- plantillas reutilizables;
- calendarización.

No conviene cobrar por corregir información esencial. Una excepción operativa
como “hoy cerramos” puede permanecer en el núcleo gratuito porque mantiene la
red confiable. Pro cobra automatización, programación, alcance promocional y
analítica; no cobra por decir la verdad sobre si el negocio está abierto.

Antes de fijar entitlement o precio hay que validar:

- cuántos negocios necesitan anunciar excepciones;
- frecuencia real;
- cuántas personas guardadas aceptan esos avisos;
- tasa de apertura y de desactivación;
- si el negocio percibe visitas atribuibles.

Cobrar por el aviso básico cortaría el ciclo de comunidad; cobrar por inteligencia,
automatización o profundidad añade valor sin vaciar la red.

## Agente Patio Pro

La búsqueda natural básica permanece gratuita porque genera descubrimiento para
los Patios. Pro cobra por capacidad incremental:

- voz;
- contexto entre sesiones;
- preferencias persistentes;
- alertas semánticas;
- comparaciones y restricciones complejas;
- mayor frecuencia de consultas avanzadas.

No se cobra por mostrar el primer conjunto útil de resultados.
