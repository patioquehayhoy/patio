# Evolución de Patio — memoria de producto

> Captura durable de las notas de Alejandro · 2026-07-18.
> Estado: discovery priorizado. No todo lo listado está autorizado para producción.
>
> La decisión posterior sobre perfil público, red atómica, seguimiento,
> notificaciones y suscripción vive en
> `docs/NETWORK_COLD_START_AND_MONETIZATION.md` y prevalece en esos temas.

## Búsqueda conversacional situada

Necesidad recurrente:

> “Quiero algo estilo focaccia o club sándwich, rico, no tan caro y cerca del
> Metro Xola.”

La persona no debe traducir ese deseo a una colección de filtros. Patio incorpora
un agente de decisión controlado:

```txt
antojo en lenguaje natural
→ intención estructurada
→ ubicación o punto de referencia
→ recuperación sobre menús reales
→ filtros determinísticos
→ ranking explicable
→ 3–5 recomendaciones sobre el mapa
```

La intención separa platillos buscados, similares aceptables, cualidades,
presupuesto, referencia geográfica, radio, horario y restricciones. El modelo
interpreta lenguaje; Patio calcula ubicación, distancia, horario, precio y
disponibilidad con datos y código.

La respuesta siempre muestra evidencia:

- platillo que coincidió;
- precio real o “sin precio publicado”;
- distancia/tiempo aproximado;
- abierto/cerrado y vigencia;
- razón breve de la recomendación;
- pin en el mapa y acceso al perfil.

Si no hay evidencia suficiente, Patio lo dice y ofrece ampliar el radio o relajar
una condición. Nunca inventa negocios, platillos, precios ni horarios.

### Conversación controlada

El agente pregunta únicamente cuando cambia el resultado: presupuesto, distancia,
medio de traslado o “abierto ahora”. Permite refinamientos breves como “más
barato”, “sin mayonesa” o “que cierre después de las nueve”. Cada turno actualiza
un estado de intención visible y reversible; no depende de memoria opaca.

La recuperación combina:

1. texto exacto en nombres, descripciones y secciones;
2. expansión culinaria/sinónimos controlados;
3. embeddings para similitud;
4. filtros duros de horario, radio, precio y disponibilidad;
5. ranking por match, distancia, vigencia, confianza y calidad real.

Los vectores recuperan candidatos; no sustituyen la fuente estructurada.

### Acceso y monetización

La primera consulta natural y sus refinamientos breves permanecen gratis porque
generan descubrimiento para los Patios.

Patio Pro puede incluir:

- voz;
- conversación más larga;
- contexto entre sesiones;
- preferencias persistentes;
- restricciones complejas y comparación;
- alertas “avísame cuando aparezca algo así cerca”;
- mayor frecuencia de consultas avanzadas.

La voz es otra entrada al mismo contrato: transcribe, muestra lo entendido y
permite corregir antes de buscar.

Métricas: consulta→perfil, consulta→Cómo llegar, búsquedas sin evidencia,
refinamientos antes de actuar, tiempo hasta elegir y conversión a Pro atribuible a
voz/contexto, no a bloquear la primera respuesta útil.

Privacidad: ubicación aproximada por defecto, precisión solo cuando haga falta,
preferencias editables/eliminables y conversaciones no persistentes sin
consentimiento.

## Objetivo

Evolucionar Patio desde el MVP “qué hay hoy” hacia una red local inteligente que
ayuda a publicar, descubrir, confiar y volver, sin convertirse en delivery,
marketplace o feed genérico.

## Decisión de secuencia

Primero recurrencia y utilidad. Después crecimiento. Luego inteligencia de red.
Comunidades, mensajería, estatus y gobernanza llegan cuando exista densidad local y
capacidad de moderación.

El bucle aprobado es:

```txt
perfil público → seguir → publicar → avisar → regresar → medir → volver a publicar
```

## Fase 0 — Cerrar el núcleo

- [x] Lectura IA mediante Edge Function.
- [x] Normalizar fotografías grandes antes de visión.
- [x] Cámara nativa directa.
- [x] Entrada directa a cámara y entrada secundaria al selector nativo de Fotos.
- [ ] QA iPhone de cámara/galería: permisos, cancelar, repetir y fallo IA.
- [ ] QA completo de magic link, GPS, share, push y mapas.
- [ ] Consolidar y subir la sesión local actual.

**Criterio de salida:** publicar y encontrar lo de hoy sin callejones en iPhone.

## Fase 1 — Recurrencia y compromiso

### Actividad reciente

- [ ] Definir estados: `hoy`, `hace N días`, `inactivo`.
- [ ] Mostrar “Activo hace 5 días” sin lenguaje punitivo.
- [ ] Registrar `lastPublishedAt` como señal explícita del dominio.
- [ ] Recordatorio al negocio para publicar lo de hoy.
- [ ] Avisar a seguidores cuando un Patio vuelve a publicar.

### Smart Setup con IA

- [x] Alta mínima inicial: nombre, ubicación y días/horarios.
- [ ] Ayuda contextual posterior: giro, ubicación, especialidades y pagos, solo
  cuando la acción actual los necesite.
- [ ] Extraer sugerencias desde foto/texto; el negocio confirma antes de guardar.
- [ ] Medir tiempo a primera publicación y abandono por paso.

**Gate:** actualizar privacidad y consentimiento de comunicación antes de activar
correos, pushes personalizados o enriquecimiento IA.

## Fase 2 — Crecimiento orgánico

- [ ] Enlace/QR “Invita a tus clientes”.
- [ ] Attribution mínima: invitación → registro → guardado → regreso.
- [ ] Probar recompensa no monetaria o suscripción gratuita temporal.
- [ ] Correo de prueba social cuando clientes/conocidos adoptan una función.
- [ ] Límites anti-spam, baja sencilla y consentimiento.

**No decidir aún:** porcentajes económicos. Requieren modelo de monetización,
fraude, contabilidad y términos claros.

## Fase 3 — Descubrimiento inteligente

- [ ] Búsqueda natural: platillo + cercanía + horario + preferencias.
- [ ] Preguntas sobre reseñas con resultados trazables.
- [ ] Resúmenes que indiquen volumen, fecha y señales contradictorias.
- [ ] Patios/videos relacionados con control de diversidad.
- [ ] Explicación corta de por qué aparece un resultado.

### Ranking inicial permitido

- cercanía;
- publicación reciente;
- menú disponible hoy;
- horario;
- coincidencia con la consulta;
- calidad/confianza con mínimo de evidencia;
- diversidad de oferta y negocios.

No vender posición sin etiqueta clara de promoción.

## Fase 4 — Geografía y Voronoi

Explorar Voronoi como herramienta de cobertura, no como ranking único:

- [ ] zonas naturales del Patio más cercano;
- [ ] vacíos de oferta/densidad;
- [ ] alcance de notificaciones sin solapamiento arbitrario;
- [ ] balance territorial de resultados;
- [ ] comparación contra radios, geohash/H3 y tiempo real de traslado.

**Pregunta de investigación:** ¿qué decisión mejora Voronoi que no resolvemos con
distancia, densidad o tiempo de recorrido?

## Fase 5 — Estatus y señales escasas

- [ ] Prototipo “Se me antoja mucho” limitado, inspirado en Super Like.
- [ ] Desbloqueo por constancia/demanda antes que por pago.
- [ ] Distintivos verificables: activo, favorito del barrio, fundador, consistente.
- [ ] Temas visuales/skins discretos para el perfil del negocio.
- [ ] Pruebas contra presión social, manipulación y pay-to-win.

## Fase 6 — Subredes y gobernanza

- [ ] Comunidades por barrio, mercado o corredor.
- [ ] Reglas locales dentro de reglas globales de Patio.
- [ ] Moderación, reportes, apelación, bloqueo y auditoría.
- [ ] Feed comunitario con controles del humano.
- [ ] Mensajería privada solo después de anti-spam y seguridad.
- [ ] Gobernanza gradual inspirada en Reddit, evitando brigading y captura local.

## Políticas y seguridad

- [ ] Actualizar política de privacidad de Patio.
- [ ] Inventario de datos, finalidad, retención y borrado.
- [ ] Consentimiento separado para marketing y notificaciones funcionales.
- [ ] Explicar cuándo la IA resume, recomienda o clasifica.
- [ ] Canal para corregir datos y apelar decisiones algorítmicas.
- [ ] Revisión humana para moderación, reputación y sanciones sensibles.

## Disciplina de ingeniería

Antes de un cambio aparentemente pequeño, revisar si pertenece a una decisión
global: tokens, componente compartido, controller, modelo de datos, navegación o
política. Evitar parches por pantalla.

Checklist obligatorio por feature:

- [ ] JTBD y métrica.
- [ ] Modelo/eventos.
- [ ] Controller propietario.
- [ ] Persistencia y offline.
- [ ] Privacidad/consentimiento.
- [ ] Abuso/moderación.
- [ ] QA y rollback.

## Próximo bloque autorizado recomendado

1. Probar cámara y selector de Fotos en iPhone.
2. Diseñar `lastPublishedAt` y estados de actividad.
3. Instrumentar eventos mínimos de publicación/retorno.
4. Prototipar Smart Setup sin guardar automáticamente sugerencias IA.
5. Actualizar privacidad antes de activar comunicaciones de crecimiento.
