# Airbnb 2026 → Patio

> Traducción de principios de producto, no copia de interfaz · 2026-07-18.
> Fuente primaria: Airbnb 2026 Summer Release y documentación oficial relacionada.

> **Estado:** documento de evolución y backlog. El flujo de alta descrito el
> 2026-07-18 quedó reemplazado. La única especificación vigente del onboarding
> vive en `docs/PATIO_SYSTEM_MAP.md` → “Decisión de onboarding — 2026-07-19”.

## Sistema conectado

```txt
Patio Smart (alta y soporte contextual)
        ↓ crea datos confirmados
Perfil + preferencias
        ↓ alimentan
Descubrimiento + guardados + comparación
        ↓ producen visitas
Reseñas estructuradas
        ↓ alimentan
Síntesis + “por qué aparece” + confianza
```

## Matriz de adaptación

| Airbnb | Patio | Gate |
|---|---|---|
| Setup simplificado | `Patio Smart`: contar el negocio, extraer y confirmar | Nunca publicar inferencias sin confirmación |
| Soporte IA con contexto y acciones | Asistente que conoce perfil, publicación y estado; abre acciones concretas | Auth, privacidad, logs y escape humano |
| AI review highlights | Temas verificables de reseñas: sabor, porción, servicio, precio, ambiente, accesibilidad | Volumen mínimo, citas/fuentes y contradicciones |
| Comparación con IA | Comparar guardados por lo que hay hoy, cercanía, horario y preferencias | Explicar señales; no inventar superioridad |
| Homepage personalizada | Explorar según intención actual y preferencias explícitas | Controles del humano y diversidad |
| Wishlists | Guardados con filtros dinámicos, colecciones y comparación | Funcionar bien desde 1 hasta ~70 elementos |
| Connections/mapa social | Recomendaciones de personas conocidas | Consentimiento y visibilidad granular |
| Itinerario compartido | Lista/ruta local compartida de lugares para comer | Posterior al núcleo, sin convertirlo en agenda de viaje |
| Mensajería contextual | Preguntar a un Patio o a una conexión | Moderación, bloqueo y anti-spam antes de abrir |

## Bloques ejecutables

### A. Patio Smart — en curso

- [x] Alta inicial reducida a nombre + ubicación + días/horarios + pagos.
- [x] Selección binaria L–D, presets y selector horario compacto del sistema en
  intervalos de 15 minutos.
- [x] Persistencia parcial: nunca borrar datos que el flujo no pidió.
- [x] Guardar antes de celebrar y permitir corregir el primer nombre sin candado.
- [x] IA, relato, dictado, categoría y descripción retirados del onboarding
  bloqueante; ubicación y pagos permanecen como datos operativos esenciales.
- [x] Retirar “Patio Smart” del copy visible; la inteligencia se siente cuando ayuda.
- [ ] Reintroducir IA como ayuda contextual opcional después de la primera
  publicación, nunca como formulario obligatorio.
- [ ] Agregar voz usando el mismo contrato de texto.
- [ ] Asistente de soporte con acciones interactivas.

### B. Perfil de quien busca

- [ ] Preferencias explícitas y opcionales: antojos, restricciones y zonas.
- [ ] Controles para borrar, pausar o editar personalización.
- [ ] Conservar búsqueda útil sin crear perfil.
- [ ] No inferir atributos sensibles.

### C. Guardados y comparación

- [x] Filtros dinámicos por categoría y con menú hoy.
- [ ] Abierto ahora y cercanía.
- [ ] Colecciones personales.
- [ ] Comparar 2–4 guardados con hechos, no adjetivos vacíos.
- [ ] Explicar por qué cada opción coincide con la intención actual.

### D. Reseñas inteligentes

- [x] Estrellas, etiquetas, nota y foto local.
- [ ] Taxonomía estable: comida, porción, servicio, precio, ambiente y accesibilidad.
- [ ] Persistencia remota con moderación y privacidad.
- [ ] Síntesis solamente al superar un mínimo de evidencia.
- [ ] Mostrar desacuerdo y recencia; no ocultar señales negativas.
- [ ] Pregunta IA: “¿por qué se recomienda?” con evidencia trazable.

### E. Recomendación explicable

- [ ] Separar hechos, preferencias y popularidad.
- [ ] Respuesta tipo: “Aparece porque tiene menú hoy, está abierto y guardaste lugares de comida corrida”.
- [ ] No usar una única puntuación opaca.
- [ ] Control de diversidad para evitar monopolio del feed.
- [ ] Etiquetar promoción pagada; nunca disfrazarla de recomendación orgánica.

## Orden de implementación

1. QA en iPhone del alta completa: acceso → Patio Smart → guardar → Hoy.
2. Persistencia final confirmada + perfil opcional de preferencias.
3. Guardados: abierto ahora, cercanía y colecciones.
4. Reseñas remotas y taxonomía estable.
5. Highlights y preguntas con evidencia.
6. Comparación de guardados.
7. Soporte contextual con acciones.
8. Conexiones, mapas sociales y mensajería cuando exista moderación.
