# Patio — red, arranque en frío y monetización

> Decisión de producto · 2026-07-24.
> Esta es la fuente de verdad para efectos de red, lanzamiento territorial,
> perfiles públicos, crecimiento y suscripción. Los precios son hipótesis de
> validación; la filosofía y la secuencia sí son decisiones.

## 1. Tesis

Patio conecta negocios locales de comida con personas que quieren saber qué hay
cerca para comer.

La unidad de la red es el **perfil público de cada Patio**. El mapa descubre; el
perfil concentra la relación:

```txt
Mapa / búsqueda
→ perfil público del Patio
  ├── identidad, ubicación, horario y pagos
  ├── menú vigente
  ├── menús visibles anteriores
  ├── reseñas
  ├── seguir / guardar / compartir / cómo llegar
  └── actividad reciente
→ publicación nueva
→ aviso útil a seguidores
→ regreso al perfil
```

La mecánica de referencia es la de un perfil de Instagram: alguien entra a una
identidad estable y desde ahí consume sus publicaciones e interacción. En Patio,
las publicaciones principales son menús; la relación principal es seguir un lugar
para enterarse de lo que ofrece.

En el MVP no existen perfiles sociales públicos de personas. La persona que busca
puede tener cuenta, preferencias, vistos y guardados privados. Abrir esa identidad
al público exige un propósito claro y controles de privacidad que hoy no aportan al
bucle principal.

## 2. El libro como ley de crecimiento

`The Cold Start Problem`, de Andrew Chen, gobierna la secuencia de crecimiento:

1. formar una red atómica pequeña y densa;
2. cuidar primero el lado difícil;
3. entregar el momento mágico pronto;
4. repetir la misma unidad en zonas adyacentes;
5. monetizar cuando la red ya produce valor recurrente.

Patio no se lanza como “toda CDMX”. La primera red atómica es un corredor compacto
alrededor de Polanco y sus bordes inmediatos, sembrado personalmente por Alejandro.
Los primeros diez negocios son el inicio operativo, no una meta de vanidad.

### Lado difícil

El lado difícil son los negocios que mantienen información útil y publican menús.
Ponen más trabajo que quien consulta y crean el contenido que hace valiosa la red.
Durante el arranque reciben ayuda manual, configuración, digitalización y
acompañamiento sin cobro.

### Momento mágico

Para quien busca:

> Abrir Patio y encontrar en menos de un minuto varias opciones reales, cercanas y
> vigentes para comer hoy.

Para quien publica:

> Publicar o actualizar un menú y recibir en poco tiempo una señal real de interés:
> una visita al perfil, un guardado, un seguimiento o una reseña.

La primera recompensa es inmediata y funcional: ver el menú vivo dentro del
perfil. La recompensa de red aparece después con señales reales de interacción.
Patio nunca simula vistas ni convierte la publicación en puntos o rachas.

## 3. Red atómica inicial

### Cohorte fundadora

- 10 negocios dentro de una zona caminable o de recorridos cortos.
- Perfiles completos creados con acompañamiento presencial.
- Menú vigente real, horario, ubicación, pagos y una imagen útil.
- Distintivo “Fundador” ganado por pertenecer a la cohorte, nunca comprado.
- Patio Pro sin costo durante seis meses.
- Canal directo de soporte con Alejandro durante el piloto.

### Demanda inicial

Cada negocio recibe:

- QR y enlace directo a su perfil;
- pieza simple para mostrador o WhatsApp;
- invitación para que sus clientes habituales lo sigan en Patio.

Si cada negocio incorpora diez clientes habituales, la primera red comienza con
aproximadamente cien conexiones relevantes, no cien descargas anónimas.

### Gate inicial de densidad

Son umbrales de validación para las primeras dos a cuatro semanas:

- 10 perfiles completos;
- al menos 8 negocios actualizan o confirman vigencia cada semana;
- al menos 50 personas locales activas;
- la mayoría de las aperturas en la microzona muestra tres opciones útiles;
- al menos 30% de quienes abren un perfil guarda o sigue algún Patio;
- cada negocio activo recibe señales reales de demanda durante la semana.

Los umbrales se ajustan con datos reales. La expansión territorial comienza cuando
la primera unidad se sostiene con menos intervención manual.

## 4. Producto mínimo de red

### Perfil público del Patio

`app/patio/[id].tsx` evoluciona para ser la superficie canónica:

1. nombre, estado de actividad, giro y distancia;
2. seguir/guardado, compartir y cómo llegar;
3. menú vigente como contenido principal;
4. menús anteriores que el negocio decida mantener visibles;
5. reseñas estructuradas y respuesta del negocio;
6. fotografía curada únicamente cuando exista y aporte una señal útil;
7. señal clara de cuándo actualizó.

El perfil funciona con una sola imagen y un solo menú. La profundidad aparece
cuando existe contenido, sin estados vacíos decorativos.

### Relación

- **Seguir:** pide enterarse cuando el Patio publica o cambia algo relevante.
- **Guardar:** conserva el lugar para consultarlo después.
- **Ver:** abre el perfil o un menú y alimenta métricas agregadas.
- **Reseñar:** deja una señal pública estructurada con nota opcional.
- **Comentar:** queda después del MVP; necesita moderación, reporte, bloqueo y
  capacidad operativa de respuesta.

Seguir y guardar pueden coincidir, pero expresan intenciones distintas. Patio puede
ofrecer “seguir” después de guardar sin obligar ni marcar ambas acciones.

### Menús

El dominio admite dos comportamientos:

1. **menú diario:** crear, fotografiar o reutilizar y publicar lo de hoy;
2. **menú estable:** conservar uno vigente y editar platillos, precios o
   disponibilidad.

El perfil muestra un menú vigente y versiones visibles elegidas por el negocio. El
historial de trabajo permanece privado; “visible en el perfil” es una decisión
explícita, no la consecuencia automática de guardar un borrador.

## 5. Navegación objetivo

### Quien busca

```txt
Buscar        Actividad        Perfil
mapa          vistos           preferencias
buscador      guardados        avisos
perfiles      seguidos         cuenta
```

La búsqueda vive arriba del mapa. Actividad saca vistos, guardados y seguidos del
perfil personal.

### Quien publica

```txt
Publicar      Menús            Actividad        Perfil
crear         vigente          vistas           negocio
foto          anteriores       guardados        avisos
editar        borradores       reseñas          cuenta
reutilizar    visibilidad      tendencias
```

“Actividad” da acceso raíz a estadísticas y reseñas. La pestaña de destellos deja
de representar una tarea ambigua; la acción se nombra directamente.

## 6. Notificaciones como bucle de red

### Gratis y esenciales

- Avisar a seguidores cuando un Patio publica o actualiza su menú.
- Máximo un aviso de publicación por Patio cada 24 horas.
- Preferencia independiente por Patio y control global en ambos perfiles.
- Silencio automático cuando la persona deja de interactuar.
- Consentimiento explícito y salida sencilla.

Esta notificación mantiene la red viva y forma parte del producto gratuito.
Cobrarla al inicio frenaría la creación de contenido y el regreso de quienes siguen
un lugar.

### Descubrimiento de un Patio nuevo

Una incorporación nueva puede aparecer en una tarjeta editorial o en un aviso
local solamente para personas:

- dentro de una zona razonable;
- que aceptaron avisos de descubrimiento;
- con frecuencia limitada;
- cuando el perfil y el menú están completos.

La suscripción no compra un envío indiscriminado a toda la base. Un alcance pagado
futuro se presenta como **Promocionado**, usa límites territoriales y de frecuencia
y nunca reemplaza resultados orgánicos.

## 7. Estadísticas y privacidad

### Gratis

- vistas del perfil en los últimos 7 días;
- vistas del menú;
- guardados;
- seguidores;
- reseñas y promedio.

### Pro

- tendencias de 30 y 90 días;
- comparación entre publicaciones;
- horarios y días con más interés;
- fuentes agregadas: mapa, búsqueda, enlace o aviso;
- platillos consultados y búsquedas que llevaron al perfil cuando exista volumen;
- exportación simple.

Patio no revela la identidad de quien visitó un perfil. Puede mostrar cuentas que
decidieron seguir públicamente y actividad agregada. “Quién vio tu perfil” como
lista sería una promesa invasiva, fácil de abusar y distinta al patrón real de
Instagram, que ofrece métricas agregadas a cuentas profesionales.

## 8. Modelo de ingresos

### Principio

La contribución que alimenta la red permanece gratis: crear perfil, mantener un
menú vigente, publicar, seguir, recibir avisos de lugares seguidos y reseñar.

Patio no depende de una sola suscripción. La secuencia de cobro protege el
crecimiento de la red y añade ingresos cuando existe valor medible.

### Patio Gratis

- perfil público;
- un menú vigente;
- actualizaciones manuales ilimitadas;
- hasta 5 lecturas de menú con IA al mes;
- hasta 3 plantillas privadas de menú para reutilizar;
- avisos a seguidores con límite de frecuencia;
- estadísticas básicas de 7 días;
- enlace y póster canónico compartible.

Los límites de IA responden a un costo real. Siempre existe captura manual gratuita.

### Suscripción — hipótesis de validación

La cohorte fundadora recibe todas las funciones durante seis meses. Antes de
publicar un precio se prueban tres puntos de disposición de pago:

- **$49 MXN/mes** como entrada;
- **$99 MXN/mes** como hipótesis principal;
- **$149 MXN/mes** como techo inicial.

El plan anual objetivo equivale aproximadamente a diez mensualidades. La primera
hipótesis operativa es **$99 MXN/mes o $990 MXN/año**, sujeta a entrevistas,
uso y conversión real.

Incluye:

- más lecturas IA incluidas;
- plantillas de menú ilimitadas;
- programación y confirmación de vigencia;
- archivo visible y menús fijados;
- estadísticas de 30/90 días;
- comparación entre publicaciones;
- personalización discreta del perfil;
- más de un administrador cuando exista soporte de equipos;
- soporte prioritario.

### Consumo de IA

El plan gratuito conserva captura manual y una cuota útil de lecturas. Cuando
exista consumo verificable, Patio puede vender paquetes adicionales o incluirlos
en Pro. El precio se basa en costo real medido, reintentos y margen, sin cobrar por
errores del sistema ni convertir cada publicación en una microtransacción.

### Promoción local

Cuando una microzona ya tenga demanda suficiente, un negocio puede comprar
descubrimiento adicional:

- segmentación territorial;
- presupuesto y límite diario;
- cobro por clic o acción calificada;
- etiqueta visible de **Promocionado**;
- frecuencia limitada y métricas de resultado.

Los avisos orgánicos a seguidores siguen siendo gratuitos. La promoción nunca
promete notificar indiscriminadamente a toda la base.

### Transacciones futuras

Patio cobra por transacción únicamente cuando Patio facilite una acción económica
real: pedido, anticipo, reservación o pago. Compartir, ver, seguir o pedir cómo
llegar no son transacciones.

La comisión de plataforma se define después de conocer ticket promedio, margen,
contracargos y costo del procesador. Como referencia, Stripe publica en México
3.6% + $3 MXN por una transacción nacional con tarjeta; cualquier comisión de
Patio se suma a esa economía y debe ser transparente.

### Servicios y objetos físicos

Durante el arranque, el ingreso más temprano puede venir de trabajo que no limita
la red:

- digitalización y puesta en marcha asistida;
- limpieza avanzada y digitalización asistida de menú;
- configuración para varias sucursales.

Los primeros diez negocios reciben esta puesta en marcha sin costo. Después se
validan paquetes de una sola vez, con materiales cobrados aparte.

### Patrocinios y datos agregados

Con densidad suficiente pueden existir campañas de marcas o proveedores y
reportes agregados de tendencias. Requieren etiquetado, privacidad, umbrales de
anonimización y prohibición de vender identidades o historiales individuales.

### Lectura del benchmark

Al 24 de julio de 2026:

- Google Business Profile mantiene gratis la presencia básica del negocio;
- Menura ofrece gratis hasta 30 platillos, 15 fotos y un QR, y publica Pro por
  $2,399 MXN/año;
- RestaurantOS parte de $299 MXN/mes, pero incluye pedidos, cocina y operación;
- GloriaFood mantiene gratis el núcleo de pedidos y cobra módulos complejos como
  pagos, POS o marketing avanzado.

Por eso Patio mantiene gratis perfil + menú vigente + póster canónico. Una suscripción
de $199–$299 MXN solo será defendible cuando entregue automatización o resultados
comparables a herramientas operativas, no por existir dentro de la red.

### Compra dentro de iPhone

Las funciones digitales desbloqueadas dentro de la app y los futuros boosts deben
usar In-App Purchase/StoreKit según las reglas vigentes de Apple. La suscripción
debe entregar valor continuo, restaurarse en otros dispositivos y explicar con
claridad precio, periodo y renovación.

## 9. Contradicciones resueltas

| Tensión | Decisión |
|---|---|
| Cobrar pronto vs. formar la red | La primera cohorte recibe Pro gratis; se cobra después de demostrar retorno. |
| Limitar publicaciones vs. necesitar oferta | Publicar y editar el menú vigente permanece gratis. |
| Cobrar por avisar vs. necesitar recurrencia | Avisos a seguidores son gratis y limitados; alcance pagado a no seguidores llega después. |
| “Quién me vio” vs. privacidad | Métricas agregadas y lista de seguidores; nunca lista de visitantes. |
| Comentarios abiertos vs. operación simple | Reseñas estructuradas primero; comentarios después de moderación. |
| Menú diario vs. menú estable | Un modelo de menú vigente con versiones cubre ambos casos. |
| Muchas features vs. una app terminable | Primero perfil → seguir → publicar → avisar → volver → medir. |
| Crecimiento brutal vs. confianza | Tácticas intensas y manuales, con consentimiento; cero spam o pay-to-win encubierto. |
| Suscripción única vs. negocio resistente | Suscripción, consumo IA, promoción, transacción real y servicios se activan por etapas. |
| Cobrar el póster vs. usarlo para crecer | La vista canónica y el enlace son gratuitos; impresión/exportación no entran al MVP. |

## 10. Bucle mínimo

```txt
Alejandro incorpora un Patio
→ publica un menú real
→ clientes abren QR/enlace
→ siguen o guardan
→ el Patio actualiza
→ seguidores reciben un aviso
→ regresan al perfil
→ dejan vistas/guardados/reseñas
→ el negocio ve valor
→ vuelve a publicar
```

Éste es el bucle que debe funcionar antes de feed, mensajería, pauta compleja o
comunidades. La arquitectura del menú y el papel de los vectores viven en
`docs/MENU_INTELLIGENCE_AND_POSTER.md`.

## 11. Orden de implementación

1. Cerrar arquitectura de navegación de ambos lados.
2. Convertir la ficha pública en perfil canónico con menú vigente y versiones
   visibles.
3. Crear persistencia real de `follows`, vistas, reseñas, visibilidad de menús y
   preferencias de avisos.
4. Construir Actividad para quien busca y quien publica.
5. Activar avisos a seguidores con consentimiento, deduplicación y límites.
6. Instrumentar eventos y medir la primera red atómica.
7. Operar la cohorte fundadora y ajustar el producto semanalmente.
8. Validar suscripción y servicios con la cohorte antes de implementar cobro.
9. Implementar entitlements y consumo IA después de comprobar recurrencia.
10. Añadir promoción pagada solo con demanda suficiente y etiquetado visible.
11. Añadir comisión únicamente cuando exista una transacción real.

## 12. Métricas que mandan

### Lado difícil

- tiempo a primera publicación;
- negocios activos por semana;
- porcentaje que confirma o actualiza vigencia;
- publicaciones por negocio;
- retención semanal y mensual.

### Quien busca

- tiempo hasta abrir un perfil útil;
- perfiles abiertos por sesión;
- seguimiento/guardado después de abrir perfil;
- regreso después de un aviso;
- retención a 7 y 30 días.

### Red

- opciones vigentes por microzona;
- conexiones seguidor↔Patio;
- porcentaje de publicaciones que genera interacción real;
- tiempo de publicación a primera interacción;
- redes atómicas que operan con intervención decreciente.

Descargas, perfiles vacíos y notificaciones enviadas no cuentan como éxito si no
producen una relación o una decisión útil.

## 13. Referencias

- Andrew Chen, [The Cold Start Problem](https://andrewchen.com/wp-content/uploads/2022/01/ColdStartProb_9780062969743_AS0928_cc20_Final.pdf).
- Apple, [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), secciones 3.1.1 y 3.1.2.
- [Menura — precios](https://www.menura.mx/).
- [RestaurantOS — precios](https://restaurantos.com.mx/).
- [Google Business Profile](https://business.google.com/es/business-profile/).
- [GloriaFood — precios](https://www.gloriafood.com/pricing).
- [Stripe México — tarifas](https://stripe.com/mx/pricing).
# Motor de distribución

La frase operativa de Patio es: **Ven por la herramienta, quédate por la red.**

La herramienta resuelve algo aun sin comunidad: mapa, búsqueda, guardados y
colecciones compartibles. La red aparece cuando una colección pública trae a una
audiencia existente. El creador obtiene una forma más útil de publicar su
criterio; el seguidor obtiene un mapa accionable; el negocio recibe descubrimiento.

Este patrón se tratará como adquisición por distribución del artefacto, no como
una campaña separada ni como una segunda red atómica.
