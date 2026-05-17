# Screenshots — TestFlight build 1.0.0 (45) — 2026-05-17

Capturadas en simulador iOS (Expo Go) para sesión de Claude Design.

## Convención de nombres

`NN-nombre-pantalla[-estado].png` — número de orden lógico del flujo + nombre de la pantalla + estado opcional.

## Inventario

### Foodie
| # | Archivo | Pantalla |
|---|---|---|
| 00 | `00-index-rolepicker-dev.png` | Inicio — role picker (con grid DEV visible) |
| 01 | `01-explorar-idle.png` | Explorar — estado idle (mapa + buscador glass) |
| 02 | `02-explorar-buscando.png` | Explorar — búsqueda "mole" con resultados |
| 03 | `03-explorar-resultado-seleccionado.png` | Explorar — card de fondita sobre sheet de resultados |
| 04 | `04-patio-id-ficha.png` | Ficha pública de fondita (Don Bonachón) |
| 05 | `05-favoritos-vacio.png` | Favoritos — estado vacío |
| 06 | `06-cuenta.png` | Cuenta / settings |
| 07 | `07-manifiesto.png` | Manifiesto — "¿Qué hay hoy? Saaaaaaabes." |

### Fondero
| # | Archivo | Pantalla |
|---|---|---|
| 08 | `08-perfil-fondero.png` | Perfil — datos del negocio |
| 09 | `09-foto-menu-idle.png` | Capturar — "Toma foto de tu menú" |
| 10 | `10-foto-menu-procesando.png` | Capturar — loading IA "Patio está leyendo tu contenido" |
| 11 | `11-menu-editor.png` | Menú — editor "Revisa y ajusta" por tiempos |
| 12 | `12-preview-compartir.png` | Preview — cartel exportable con CTA Compartir |

### Onboarding
| # | Archivo | Pantalla |
|---|---|---|
| 13 | `13-onboarding-1.png` | Onboarding paso 1 — "Encuentra comida local hoy" |
| 14 | `14-onboarding-2.png` | Onboarding paso 2 — "Publica tu menú rápido" |
| 15 | `15-onboarding-3.png` | Onboarding paso 3 — "Elige menos. Come mejor." + Entrar |

## Pendiente capturar

- `share` — el cartel/Story final post-preview (versión rendereada para WhatsApp/Instagram)

## Notas

- El screenshot `00` muestra el grid de botones DEV (Explorar / Favoritos / Cuenta / Ficha / Capturar / Menú / Preview / Compartir / Perfil / Manifiesto / Onboarding / Reset rol). Este grid **NO sale en producción** — es atajo del modo dev.
- Para Claude Design, considerar pedir mockup de `index` SIN el grid DEV (versión limpia que ven los usuarios reales).
