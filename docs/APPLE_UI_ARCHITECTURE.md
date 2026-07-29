# Arquitectura visual Apple de Patio

## Capas

```txt
contenido
→ superficies sólidas y legibles

navegación / controles flotantes
→ glass, blur y adaptación al fondo
```

Liquid Glass no se usa como decoración dentro de tarjetas, formularios o el
póster. Se reserva para barras, botones flotantes, sheets y navegación.

## Color

- Naranja Patio: acción primaria, selección activa y estado confirmado.
- Tinta principal: contenido y acciones neutrales.
- Rojo de sistema: exclusivamente destructivo/error.
- Gris: estados inactivos y metadatos.

Un mismo concepto nunca aparece activo en negro en una pantalla y naranja en
otra. El color tampoco es la única señal: check, posición o símbolo acompañan el
estado.

## Tipografía

- Display de marca: títulos editoriales.
- Bold/Semibold: jerarquía y controles.
- Regular: cuerpo, metadata y labels.
- No usar Light (`300`) en texto funcional pequeño.

## Entrada de precio

- Un campo vacío no se representa con raya larga.
- `Precio` / `Agregar` es una acción explícita.
- Al tocarla aparece un campo numérico compacto con `$` y placeholder `0`.
- Si se abandona vacío, vuelve al estado discreto.
- Precio único permanece al final porque es metadato ocasional; el menú es el
  contenido principal.

## Publicar

```txt
publicar
→ confirmación mínima
→ ver y compartir póster
→ hoja nativa de iOS con JPG
```

Editar existe como acción de barra, no como explicación alarmista después del
éxito. La pantalla no enseña párrafos sobre errores que todavía no ocurrieron.

## Avisos

- Switch naranja = preferencia persistida.
- Mientras guarda, el switch se bloquea para evitar dobles cambios.
- Sin cuenta, no se muestra un switch falso: se muestra `Verificar cuenta`.
- Permiso del sistema, preferencia remota y recordatorio local se muestran como
  conceptos distintos.
