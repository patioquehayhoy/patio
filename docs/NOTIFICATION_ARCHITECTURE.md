# Arquitectura de relaciones y avisos

## Decisión panorámica

Patio tiene una sola relación Foodie → negocio:

```txt
GUARDAR ♥
```

No existe un “follow” público adicional. La tabla técnica `patio_follows` no
representa otra acción: es la proyección de entrega para los guardados cuando la
persona activa `Menús nuevos` en Perfil → Avisos.

```txt
guardar lugar                 = relación persistente
activar Menús nuevos          = consentimiento de una categoría
permiso de iOS                = capacidad del dispositivo
publicación del Fondero       = evento
push                          = canal de entrega
```

Estos cinco estados no deben confundirse ni cambiarse como efecto lateral.

## Estado desplegado — 2026-07-26

- `patio_follows`: suscripciones técnicas derivadas de guardados verificables.
- `notification_preferences`: categorías independientes; marketing apagado por
  defecto.
- `push_devices`: Expo Push Token por dispositivo, con baja de tokens inválidos.
- `publication_events`: evento idempotente por Patio, fecha y tipo.
- `notification_deliveries`: ticket y resultado por dispositivo.
- `send-publication-notifications`: Edge Function que valida al dueño, obtiene
  seguidores, respeta preferencias, envía a Expo y audita.
- Foodie: recordatorio local opcional a las 13:00.
- Negocio: recordatorio local opcional a las 10:00.

## Red objetivo

```txt
cuenta verificada
→ guarda un Patio
→ consentimiento de avisos
→ Patio publica/corrige menú
→ evento de publicación
→ deduplicación y límite de frecuencia
→ entrega push
→ deep link al perfil público
→ registro de apertura/baja
```

## Preferencias

- Avisos de Patios seguidos.
- Recordatorio personal diario.
- Actividad del propio negocio.
- Reseñas y respuestas.
- Producto y cuenta.

Cada categoría tiene consentimiento independiente. Desactivar una no debe
desactivar las demás. Una corrección inmediata del mismo menú no envía otro push
salvo que cambie disponibilidad de forma significativa.

## Decisión de interfaz

- El permiso nativo no se pide en onboarding.
- No hay campana en el perfil público; bookmark significa únicamente guardar.
- Guardar no concede permiso ni activa interrupciones.
- Perfil muestra una fila `Avisos`, no un toggle maestro ambiguo.
- `Avisos` concentra categorías, recordatorios locales y estado de iOS.
- Si iOS ya negó permiso, la única acción correcta es abrir Ajustes del sistema.

## Taxonomía

| Clase | Ejemplo Patio | Default | Interrupción |
|---|---|---:|---|
| Operativa | Seguridad o cambio de cuenta | Esencial | Active |
| Red solicitada | Menú nuevo de un guardado | Off | Active, agrupable |
| Hábito personal | “Revisa qué hay hoy” | Off | Local/programada |
| Reputación | Nueva reseña del negocio | On para Fondero | Active |
| Descubrimiento | Recomendación cercana | Off | Passive/resumen |
| Marketing | Promoción de Pro | Off explícito | Passive |

“Se registró otro usuario” no es relevante para un Foodie y no se notifica.
Promociones de suscripción nunca se mezclan con menús o actividad.

## Bitácora de hipótesis — Alejandro

### Cambios excepcionales del negocio

Casos anotados:

- “Hoy no abrimos por remodelación”.
- “Hoy abrimos hasta las 8”.
- Cambio excepcional sobre un horario semanal ya establecido.
- Cierre temprano, apertura tardía o servicio suspendido por un día.

No todo cambio de horario debe mandar push. La regla candidata es:

```txt
horario habitual editado para el futuro
→ actualizar perfil, sin interrumpir

excepción que afecta hoy o la siguiente apertura
→ ofrecer "Avisar a mis guardados"
→ una sola notificación operativa
```

Audiencia: personas que guardaron ese Patio y activaron avisos operativos.
Nunca “todos los clientes” si no existe consentimiento verificable.

### Anuncios y promociones

Casos anotados:

- “Hoy promo 3×4”.
- Platillo especial.
- Horario extendido por una ocasión.
- Evento futuro.

Esto requiere un dominio distinto a editar el menú o el horario:

```txt
anuncio
├── tipo: promoción | especial | evento | aviso operativo
├── título y detalle breve
├── inicio y caducidad
├── audiencia
├── publicación en el perfil
└── entrega push opcional
```

Un anuncio puede existir en el perfil sin convertirse automáticamente en push.
“Publicar” y “notificar” son decisiones separadas para evitar spam.

### Orden de construcción

1. Menú nuevo de guardados.
2. Excepción de horario para hoy.
3. Estado visible en el perfil aunque no se envíe push.
4. Panel mínimo de anuncios con caducidad.
5. Promociones y eventos cuando exista densidad y demanda verificables.

Por ahora, eventos y campañas quedan registrados, no implementados.

## Frecuencia y contenido

- Una publicación por Patio y día; guardar/corregir otra vez no hace ruido.
- `availability_changed` queda reservado para agotados/reposición y puede emitir
  un evento independiente cuando el producto lo incorpore.
- Título: `{Patio} publicó lo de hoy`.
- Cuerpo: máximo dos platillos; si no hay datos fiables, texto genérico.
- El tap abre `patio://patio/{id}`.

## Ciclo de arranque en frío

```txt
descubrimiento útil
→ guardar Patio
→ primera publicación con valor
→ regreso al perfil
→ guardado/reseña
→ señal de demanda para el Fondero
→ nueva publicación
```

Métricas iniciales:

- porcentaje de perfiles vistos que se guardan;
- guardados cuyos dueños activan `Menús nuevos`;
- publicación que produce al menos una apertura;
- retorno D1/D7 después de un push;
- bajas por Patio y desactivación global;
- Patios que publican de nuevo tras recibir actividad.

No usar volumen bruto de envíos como éxito. La métrica es retorno útil sin
desactivación.
