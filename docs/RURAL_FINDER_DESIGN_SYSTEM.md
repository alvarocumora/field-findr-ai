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

## Modo oscuro institucional
- El modo claro usa los tokens paper/ink/forest definidos arriba.
- La variante oscura está aislada en `src/components/theme/rural-dark.css` con el selector `.dark .theme-rural`.
- La selección la gestiona el `ThemeProvider` existente; utilizar tokens `bg-background`, `text-foreground`, `bg-card`, `border-border` para conservar contraste y la identidad de marca en ambos modos.

## Globo terrestre como identidad permanente
- La portada actual integra `HeroTerrainGlobe` dentro de `CinematicShowcaseHero`.
- Mantener la vista global visible (planeta completo y Sudamérica reconocible), sin transiciones automáticas a zoom de parcela cuando cambia el proyecto destacado. Los detalles del predio permanecen en las fichas individuales.
- Fondo espacial y atmósfera cartográfica adaptados al modo oscuro/claro sin recrear el mapa al cambiar de tema.
- Cuando Mapbox o WebGL no están disponibles se muestra la imagen de marca local `ot-globe-wide.jpg`, no un espacio vacío. Preservar buscador, CTA y filtros.
- Respetar movimiento reducido y la disposición móvil actual (globo primero, buscador accesible y scroll vertical libre).
