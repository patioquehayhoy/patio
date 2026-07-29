# Glosario operativo de Patio

> Fuente viva para nombrar patrones de producto sin depender de memoria o
> nombres inventados durante una sesión.

## Prácticas de experiencia

### Soporte guiado

Flujo que clasifica primero el problema y pide únicamente los datos necesarios
para resolverlo. Evita abrir de inmediato un campo de texto sin contexto.

En Patio:

1. La persona elige acceso, menú, perfil, avisos, reseñas o sugerencia.
2. Patio muestra una instrucción pertinente.
3. Solo entonces permite describir el caso, con máximo de 300 caracteres.
4. El mensaje sale etiquetado para que soporte conozca el contexto.

No usar “Ubershifting” como término formal. La referencia correcta es **soporte
guiado**, **guided issue resolution** o **issue taxonomy**.

### Divulgación progresiva

Mostrar primero la decisión básica y revelar detalle únicamente cuando hace
falta. Ejemplo: nombre del platillo primero; descripción y precio propio después.

### Salida recuperable

Una acción importante deja claro cómo corregirla. Publicar un menú no crea una
segunda publicación confusa: corregir y publicar de nuevo reemplaza la versión
vigente del día y conserva el historial.

### Nombre canónico de platillo

Estructura estable:

```txt
nombre = identidad buscable + variante principal
descripción = proteína + preparación + ingredientes + acompañamientos
```

Ejemplo:

```txt
Enchiladas verdes o rojas
De pollo, con crema, queso y aguacate
```

No repetir palabras entre nombre y descripción.

### Precio general

Precio opcional que aplica a todo un menú o paquete. No es el primer dato de
edición y no debe dominar visualmente el perfil o el póster. Los precios propios
de un platillo viven con ese platillo.

### Menú vigente

Única versión pública que Patio presenta como disponible ahora. Una corrección
reemplaza esta versión; no obliga a borrar y recrear el menú.

### Póster canónico

Representación compartible del menú vigente: nombre, fecha, secciones, platillos,
precio si aplica, firma de Patio y enlace al perfil. Dentro de Patio puede hacer
scroll; fuera de Patio se comparte como enlace con una vista adaptable, no como
una captura ilegible de altura ilimitada.

### Identidad responsable

Una reseña pública pertenece a una cuenta verificada. El nombre público puede ser
breve, pero el sistema conserva identidad interna, correo verificado, historial de
moderación y capacidad de apelación. “Anónimo” no equivale a “sin trazabilidad”.

### Búsqueda conversacional situada

Interfaz donde una persona expresa un antojo con contexto —platillo aproximado,
precio, cercanía, estación, horario o restricciones— y Patio lo traduce a una
consulta estructurada sobre el mapa y menús reales.

No es chat abierto. El agente interpreta intención y permite refinarla; las
recomendaciones están limitadas por evidencia real de Patio.

### Agente controlado

Modelo que solo puede operar dentro de herramientas y datos permitidos. Puede
interpretar “algo estilo focaccia cerca del Metro Xola”, pero no inventar lugares
ni afirmar precios, horarios o disponibilidad que Patio no tenga.

### Estado de intención

Representación visible y reversible de lo entendido por el agente: qué busca,
similares aceptables, presupuesto, ubicación, radio, horario y restricciones.
Cada turno modifica este estado en vez de depender de memoria conversacional
oculta.
