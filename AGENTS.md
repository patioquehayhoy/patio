# Agentes en Patio

Contrato común para los agentes que trabajan en este repositorio. El producto
y el diseño se rigen por `CLAUDE.md` y los documentos que enlista; aquí solo
está cómo trabajar juntos sin pisarse.

## Antes de tocar algo

1. Leer `docs/HEADS_UP_2026-10-12.md` (estado y avisos entre agentes) y
   `docs/PENDING_LAUNCH_2026-10-12.md` (pendientes vigentes).
2. Revisar `git status`: un archivo con cambios sin commit de otro agente no
   se edita ni se incluye en un commit propio.
3. Hacer commit solo de lo propio y anotar en el heads-up lo que cambió.

## Roles

| Agente | Rol | Puede |
|---|---|---|
| Claude | Implementación principal, auditoría y producción | Código, migraciones ensayadas (`npm run db:rehearse`), documentos |
| Codex | Implementación cuando Parco lo activa | Código y documentos, coordinándose por el heads-up |
| Grok | Revisión e investigación | Leer todo el repositorio y escribir solo en `docs/reviews/GROK_*.md` |

### Grok

- No modifica código, migraciones, configuración ni dependencias, y no corre
  despliegues ni comandos contra producción.
- Cada revisión va en un archivo nuevo `docs/reviews/GROK_<tema>_<fecha>.md`
  con: qué revisó, hallazgos ordenados por gravedad, cómo reproducir cada uno
  y la fuente pública cuando cite una práctica externa.
- Antes de proponer, comprueba en el código; no da por hecho lo que dicen los
  documentos.

## Producción

- Las migraciones se ensayan con `npm run db:rehearse` antes de publicarse.
- Publicar migraciones (`npx supabase db push --yes`) y funciones
  (`npx supabase functions deploy … --use-api`) lo autoriza Parco.
