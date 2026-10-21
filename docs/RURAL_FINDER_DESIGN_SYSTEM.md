# Rural Finder · Rural Institutional design system

Marca propia OfertaTerrenos (naturaleza, paper/ink/forest). Inspirado en principios de visor canónico + inspector, no en ninguna marca de terceros.

## Tokens (scope `.theme-rural`, `src/index.css`)
| Rol | Hex | Token |
|---|---|---|
| Paper (fondo) | #F7F5F0 | `--background` |
| Ink (texto) | #1A2420 | `--foreground` |
| Forest (acción) | #214C3C | `--primary`, `--ring` |
| Moss (acento) | #7A8D74 | `--accent` |
| Sand (hairlines) | #E2E1D8 | `--border` / `--secondary` |
| Estados | — | `--success`, `--warning`, `--destructive`, `--info` (tonos AA sobre paper) |

Radio base 12px (`--radius: .75rem`), sombra `rural-shadow`, datos numéricos `rural-data` (mono tabular).

## Tipografía
- Titulares grandes: `font-editorial` (Fraunces).
- UI: DM Sans (default). Space Grotesk queda para `font-heading` en vistas aún no migradas.
- Mono: solo cifras (`rural-data`).

## Adopción
Envolver la página en `<div className="theme-rural">`. Componentes shadcn heredan los tokens sin cambios. Prohibido hardcodear hex o `text-white`.

Adoptado hoy: portada (`/`), explorador (`/explorar`, desktop y móvil).

## Reglas comerciales en UI
- Precio siempre con moneda explícita (`CLP` o `UF`); nunca comparar $/m² entre monedas distintas.
- Error de consulta ≠ "sin inventario": mostrar alerta con "Reintentar".
- Búsqueda de texto server-side sobre todo el inventario.
- CTA de comprador nunca apunta a `/contacto-loteos` (demo B2B).

## Modo oscuro rural (Remix of Rural Ai Finder)
- La paleta paper/ink/forest anterior se mantiene intacta en modo claro.
- `src/components/theme/rural-dark.css` define la variante dark con selector `.dark .theme-rural`, sin interferir con las superficies PropTech que usan el tema global.
- El `ThemeProvider` controla el modo y recuerda la selección bajo `ofertaterrenos-theme`.
- Todos los contrastes de texto, formularios, bordes y tarjetas deben utilizar tokens semánticos: `text-foreground`, `bg-card`, `border-border`.

## Globo como identidad de portada
- `CinematicShowcaseHero` conserva texto, búsqueda y filtros de la portada Rural Finder.
- `GlobeHeroBackdrop` carga `InteractiveEarth` solo cuando existe WebGL2; `ot-globe-wide.jpg` permanece como respaldo desde el primer render y si Mapbox falla.
- La vista principal conserva un encuadre reconocible de Sudamérica y Chile en lugar de acercarse demasiado a un mapa local.
- En escritorio el globo puede explorarse fuera del contenido interactivo. En móvil no debe impedir el scroll vertical; respetar `prefers-reduced-motion`.
- No remover el globo en futuras iteraciones del hero ni cubrirlo con tarjetas de gran tamaño: es un activo visual identitario de la marca.
