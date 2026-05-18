# Patio — Screenshot Index

> Inventario de capturas reales de la app.
> Uso: documentar flujo actual, preparar Figma y alimentar prompts de rediseño visual sin cambiar navegación.

Las capturas históricas vigentes viven en `assets/screenshots/`.

> Nota 2026-05-17: `docs/design/screenshots/` no existe actualmente en el worktree. Si se crea un paquete nuevo de capturas, no documentarlo como fuente hasta que las imágenes existan físicamente.

## Regla de uso

- Estas imagenes son **evidencia del flujo actual**, no referencias de estilo final.
- Si ChatGPT/Figma propone cambios, debe respetar lo que estas pantallas hacen funcionalmente.
- No mezclar con `docs/design/references/`, que es para inspiracion visual externa.
- Si una captura muestra grid DEV o rutas auxiliares, marcarlo explícitamente como estado dev.

## Set actual

| Archivo | Pantalla / estado | Rol en el flujo |
|---|---|---|
| `01_inicio_eleccion.png` | Inicio | Entrada principal Foodie-first / acceso Fondero |
| `02_inicio_negocio_login.png` | Login fondero | Acceso por correo para negocio |
| `03_explorar_mapa.png` | Mapa Foodie | Home real del lado Foodie |
| `04_explorar_busqueda.png` | Busqueda en mapa | Buscar platillos dentro de Explorar |
| `05_buscar.png` | Buscar legacy | Ruta fuera del MVP visible; debe redirigir o desaparecer |
| `06_detalle_patio.png` | Detalle fondita | Ficha de negocio/menu para decidir |
| `07_favoritos.png` | Favoritos vacio | Estado de recuperacion hacia mapa |
| `08_cuenta.png` | Cuenta Foodie | Ajustes y accesos secundarios |
| `09_manifiesto.png` | Manifiesto | Contenido secundario/beta |
| `10_onboarding 01.png` | Onboarding 1 | Intro beta |
| `10_onboarding 02.png` | Onboarding 2 | Intro beta |
| `10_onboarding 03.png` | Onboarding 3 | Intro beta |
| `11_perfil_fondero.png` | Perfil negocio | Configuracion publica del negocio |
| `12_menu_editor 01.png` | Editor menu | Menu con secciones y platillos |
| `12_menu_editor 02.png` | Editor menu / estado alterno | Continuidad de edicion |
| `13_foto_menu.png` | Foto menu | Entrada OCR/camara/galeria |
| `14_compartir 02_vacio.png` | Compartir vacio | Guard clause hacia Crear menu |
| `14_compartir 02_lleno leido por ia.png` | Compartir lleno | Preview despues de lectura IA |
| `15_preview lista imagen.jpeg` | Preview imagen | Resultado visual compartible/lista |
| `15 Interación mapa 01.png` | Interaccion mapa 1 | Mapa antes/despues de tocar negocio |
| `15 Interación mapa 02.png` | Interaccion mapa 2 | Negocio seleccionado / bottom sheet |
| `15 Interación mapa 03.png` | Interaccion mapa 3 | Accion Ver / detalle o expansion |
| `16 Más opciones.png` | Mas opciones menu | Sheet de acciones como borrar menu |

## Estados que conviene capturar despues

- Inicio actualizado con `Explorar comida` / `Publicar mi menu`.
- Onboarding actualizado con copy nuevo.
- Menu vacio con CTA unico `Crear menu`.
- Sheet `Crear menu` con foto, imagen, plantilla y manual.
- Compartir vacio con CTA a crear menu.
- Borrar menu confirmado/cancelado si hay modal o sheet especifico.
