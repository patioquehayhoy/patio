# Arquitectura de relaciones y avisos

## Modelo vigente — 2026-11-21 (manda sobre lo de abajo)

Validado con Jev (`docs/research/jev-avisos-red-2026-11-21.json`,
`jev-publicar-avisos-2026-11-21.json`). Jev orienta, no decide.

### Quien sigue lugares (Foodie): la campana de YouTube, tal cual

Cada lugar que sigues tiene su campana (en «Siguiendo» de la ficha y en
Notificaciones → Elegir lugares), con las palabras y el valor por defecto de
YouTube (Ayuda de YouTube, «Administra las notificaciones de YouTube»,
es-419: «Todas», «Personalizadas» —por defecto al suscribirte— y «Ninguna»):

| Opción | Qué te llega |
|---|---|
| **Todas** | Al momento: su menú, «Hoy no abrimos», sus promociones (máx. 3 menús al día en total). |
| **Personalizadas** (por defecto) | En tu resumen del día, un solo aviso con todos tus lugares: «Fonda Lupita, Tacos El Güero y 5 más · Publicaron su menú de hoy. Postres Ana tiene promoción hoy. Fonda Rosy no abre hoy.» |
| **Ninguna** | Nada; lo ves en la app. |

- El resumen sale a las **8:00** (solo lugares que abren antes de las 10),
  **11:30** (todos) y **17:30** (solo si hubo algo nuevo). YouTube tiene lo
  mismo para toda la app («Resumen programado de notificaciones»).
- Jev, Foodies: resumen + campana por lugar 50 %, solo resumen 41 %, un aviso
  por publicación 4 %. Con 5+ avisos de comida al día apagarían todo (2.9 de
  4). Hora: 11:30 (60 %). Promociones dentro del resumen (61 %).
- Facebook también manda notificaciones push (Ayuda de Facebook,
  «Notificaciones push, por correo electrónico y SMS»); «Favoritos» de
  Facebook ordena el inicio, no es una campana.
- Publicar ya cerrado: el menú queda; no se avisa a nadie (negocios 61 %).
- Servidor: `realtime_followers`, `follower_digest_candidates`,
  `send-follower-digest` (pg_cron 8:00, 11:30 y 17:30), migraciones
  20261121110000 y 20261121120000.

### Quien publica (negocio): ritmos

| Ritmo | Ejemplos | Qué hace en Patio | Su aviso | Qué ven sus seguidores |
|---|---|---|---|---|
| **Menú del día** (lado difícil) | Fondas, cocinas económicas, comida corrida | Publica lo de hoy (o lo deja listo la noche anterior); la carta se queda sola | 1 h antes de abrir, solo si no ha publicado; pausa tras 3 días; «Hoy no abro» | Su nombre en el resumen; «Todas» al momento |
| **Carta fija** | Taquerías, postres, cafés, restaurantes | Nada diario: su carta se ve siempre (Jev 81 %) | No lo necesita | Solo cuando hay algo: aviso del día o promoción (Pro) |
| **Por días** | Comida en casa, por pedido, barbacoa de fin de semana | Publica los días que vende | Solo los días de su horario | Igual que menú del día |
| **Desayunos** | Jugos, tamales, desayunos | Publica temprano | 7 am (1 h antes de abrir) | Resumen de las 8:00 |
| **Noche** | Taquerías de noche, cenadurías | Publica en la tarde | Antes de abrir | Resumen de las 17:30; su turno cruza la medianoche |

- Negocios, Jev: salir en el resumen de todos y al momento con «Todas»
  (69 %) frente a aviso a todos limitado a los 3 primeros (25 %).
- **Dejar listo el menú de otro día** (fonda 3.75 de 4): mantener
  presionado «Publicar» (como «Enviar más tarde» de Mail) o tocarlo ya pasado
  el servicio ofrece «Mañana a las 9 am» (1 h antes de abrir). Hasta su hora
  solo lo ve el dueño; a su hora sale y se anuncia (pg_cron cada 5 min,
  `send-scheduled-publications`). Que la app publique sola el mismo menú cada
  día: descartado (3 %).
- **«Se acabó» por platillo** (fonda 3.2 de 4): en el menú publicado, deslizar
  un platillo de hoy → «Se acabó» (o «Ya hay»). Se ve al instante en la ficha,
  en la columna del precio; no avisa a nadie; no pasa al día siguiente.
- Avisos de operación (gratis, 1 al día): al momento solo a «Todas»; «Hoy no
  abrimos» también va en el resumen. Promociones (Pro): al momento a «Todas»
  con Promociones encendido; los demás, en su resumen.

### Dónde vende (2026-11-21, `lib/puntos.ts`, migración 20261121130000)

Un solo concepto, los **puntos**: dónde se consigue el negocio cada día.

| Modalidad | Para | En el mapa | En la ficha |
|---|---|---|---|
| **En mi local** | Fondas, taquerías, cadenas chicas | Su dirección y un pin por cada **otra sucursal** | «OTRAS SUCURSALES»; tocar una abre indicaciones |
| **En tianguis o sobre ruedas** | Tianguis, mercados sobre ruedas, food trucks | Solo donde está **hoy** (ningún pin el día que no sale) | «Hoy: Tianguis de la Portales» y «DÓNDE ESTÁ CADA DÍA» |
| **Solo a domicilio** | Cocinas sin local (dark kitchens), comida en casa | Su **zona** (el servidor redondea a ~500 m); nunca su calle | Círculo de su zona, «Solo a domicilio», WhatsApp; sin «Cómo llegar» |

- **Pedidos hasta** (opcional): «Pedidos hasta las 11 am» en la ficha.
- **Menú de la semana**: mantener presionado «Publicar» ofrece los
  siguientes 5 días que abre; cada día es su propio menú programado.
- La distancia de las tarjetas usa la sucursal más cercana.
- El negocio lo elige en Editar mi negocio → DÓNDE VENDES (se guarda al
  elegir); cada sucursal o día se edita en su pantalla (`/punto-editar`):
  nombre, dirección, días y «Marcar donde estoy» o «Buscar la dirección».

### Casos que faltan

- **Carta fija: «¿Siguen igual tus precios?»** una vez al mes y «Precios al
  día: noviembre» en la ficha (confianza del Foodie). Falta decidir cómo se ve.
- **Por tandas** («salió el pan de las 6») y **temporada** (chiles en nogada,
  romeritos, rosca): hoy se resuelven publicando lo de hoy o con un aviso.
- **Foodie con dieta** (vegetariano): resumen solo con lo que le sirve.
- **Varias marcas en una cuenta** (dos negocios distintos del mismo dueño):
  hoy es una cuenta por negocio.

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

- Desde 2026-11-08 el onboarding tiene una pantalla de Permisos explicada
  (como Leica): cada fila pide su permiso al tocarla y se puede continuar sin
  darlos. Nunca se pide en frío al abrir la app.
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
- Copy homologado (2026-11-07): título = quién (lugar o persona); cuerpo =
  el hecho en una línea, con punto. Menú: `{Lugar}` / «Publicó su menú de hoy.»
  Aviso: `{Lugar}` / «Hoy abrimos a las 8 pm.» Nunca repetir «Aviso», «Patio»
  ni «notificación» dentro del texto: el sistema ya lo dice.
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
