
# Plan · Refactor UI/UX global de OFERTA TERRENOS

El desorden y las superposiciones vienen de tres fuentes que se acumularon con el tiempo:

1. **Capas descontroladas** — FABs, badges de swipe, sync chip, botones del mapa y CompareFloatingBar comparten espacio sin sistema de z-index ni safe-areas.
2. **Densidad excesiva en Explorar** — el panel izquierdo apila 4 bloques de filtros (FilterBar, Valuation, Territorial, Search) sin agrupación visual ni prioridad.
3. **Falta de un shell consistente** — cada página inventa su header/spacing/tipografía, por eso el conjunto "se ve desordenado" aunque los componentes individuales estén bien.

El plan ataca esas 3 causas en 5 fases entregables, sin cambiar funcionalidades. Cada fase se puede publicar sola.

---

## Fase 1 · Sistema de layering + safe-areas (base)

Objetivo: eliminar TODAS las superposiciones actuales con un contrato de capas.

```text
z-index tokens (index.css)
  --z-base:      0
  --z-map-ui:   10   ← controles de mapa, chips flotantes
  --z-sticky:   20   ← headers pegados, resúmenes
  --z-fab:      30   ← FAB "Modo Swipe", "Comparar"
  --z-overlay:  40   ← CompareFloatingBar, PropertyPreviewSheet
  --z-modal:    50   ← Dialog, Sheet, Swipe Overlay
  --z-toast:    60   ← toasts / errores
```

- Reemplazar `z-40 / z-50 / z-[60]` sueltos en `Explorar.tsx`, `SwipeExplorer.tsx`, `CompareFloatingBar`, `CinematicTransition` por estos tokens.
- Introducir utilidades `safe-bottom` / `safe-fab-stack` que apilen FABs con `gap` y `padding-bottom` según haya `CompareFloatingBar` visible o barra móvil.
- Auditar y anotar cada FAB/chip en un doc rápido (`docs/UI_LAYERING.md`).

**Cambios de archivos:** `src/index.css`, `tailwind.config.ts`, componentes con `z-*` hardcodeado.

---

## Fase 2 · Rediseño del panel Explorar (densidad)

Objetivo: el panel izquierdo debe caber en 1 pantalla sin scroll de filtros y jerarquizar la búsqueda.

```text
┌─────────────────────────────────┐
│  🔍  Buscar   ⌘K       [IA ✨]  │  ← search hero (siempre visible)
├─────────────────────────────────┤
│  [Chips activos · limpiar]      │  ← muestra SOLO filtros aplicados
├─────────────────────────────────┤
│  ⚙ Filtros (N)   Ordenar ▾  ▦ ▤│  ← 1 sola fila de controles
├─────────────────────────────────┤
│  1.284 terrenos · desde UF 300  │  ← resumen
├─────────────────────────────────┤
│  ▓ listado virtualizado          │
└─────────────────────────────────┘
```

- **Colapsar FilterBar + Valuation + Territorial** dentro de un único Sheet lateral "Filtros" con secciones acordeón (Tipo, Ubicación, Precio, Superficie, Topografía, Plusvalía, Aptitud, Servicios). Reutiliza los toggles ya construidos.
- Sobre el listado, mostrar solo **chips de filtros activos** (con "x" para quitar y "Limpiar todo").
- Mover "Destacados / Recientes / Todos" a segmented control (`ToggleGroup`) más chico.
- Eliminar duplicación entre `MobileExploreView` y `ExploreListPanel` reusando el mismo `<FiltersSheet />`.

**Cambios de archivos:** nuevo `src/components/explore/FiltersSheet.tsx`, refactor `ExploreListPanel.tsx`, `MobileExploreView.tsx`.

---

## Fase 3 · App shell + jerarquía tipográfica

Objetivo: cada página comparte header, breadcrumbs, y una escala tipográfica reducida.

- **Tokens tipográficos** en `tailwind.config.ts`: `display / h1 / h2 / h3 / body / caption / micro` — reemplazar `text-xl / text-2xl / text-[11px]` sueltos.
- **`<PageShell>`** con slots `header / breadcrumbs / actions / content`, aplicado a Explorar, Publicar, PropertyDetail, Dashboard, CRM, Tasaciones.
- Espaciado consistente: sección=`space-y-6`, tarjeta=`space-y-3`, chips=`gap-1.5`. Prohibir clases sueltas fuera de esa escala.
- StickyHeader unificado con altura fija (56px) y `--header-h` como var CSS usada por safe-areas.

**Cambios de archivos:** `src/components/layout/PageShell.tsx`, `tailwind.config.ts`, `src/index.css`, refactor cabeceras.

---

## Fase 4 · Diseño mobile-first (PWA)

Objetivo: el flujo móvil (donde más se usa) deja de sentirse apretado.

- **Bottom nav** de 5 slots (Explorar · Swipe · Publicar · Favoritos · Cuenta) con safe-area iOS.
- Sheets bottom-anchored con `snap points` (`peek / half / full`) para filtros y detalle.
- Search siempre pegado arriba con blur `backdrop-blur-xl`; los FABs (Comparar / IA) se ocultan al hacer scroll hacia abajo, reaparecen al subir.
- Cards de swipe con **safe-area** para no quedar tapadas por bottom nav.

**Cambios de archivos:** `src/components/navigation/BottomNav.tsx`, `MobileExploreView`, `SwipeExplorer`.

---

## Fase 5 · Micro-polish y accesibilidad

- **Contraste AA** en todos los chips (`text-muted-foreground` sobre `bg-muted/40` falla en dark en varios lados).
- Estados `focus-visible`, `disabled`, `loading` uniformes en botones y chips.
- Skeletons cohesionados (mismo `rounded-xl`, `bg-muted/60`, animación `pulse`).
- Empty states con ilustración + acción primaria en Explorar, Favoritos, CRM, Notificaciones.
- Animaciones motion consistentes: `fade+slide 200ms ease-out` para entradas de sheet/dialog/tooltip.

---

## Sección técnica (para referencia interna)

- **Nuevos archivos**: `src/components/layout/PageShell.tsx`, `src/components/navigation/BottomNav.tsx`, `src/components/explore/FiltersSheet.tsx`, `src/components/explore/ActiveFiltersChips.tsx`, `docs/UI_LAYERING.md`.
- **Refactor**: `Explorar.tsx`, `ExploreListPanel.tsx`, `MobileExploreView.tsx`, `SwipeExplorer.tsx`, `CompareFloatingBar.tsx`, `StickyHeader.tsx`.
- **Tokens nuevos**: `--z-*`, `--header-h`, escala tipográfica `text-display/h1/…/micro`, `safe-fab-stack` utility.
- **Compat**: no romper rutas ni schemas — todo es capa de presentación. Feature flags no necesarios.
- **Testing visual**: Playwright screenshots antes/después por página clave (Explorar desktop/mobile, PropertyDetail, Swipe overlay, Publicar wizard).

## Entrega sugerida

Puedo arrancar por la **Fase 1 (layering + safe-areas)** — es la que resuelve concretamente lo de "elementos superpuestos" que ves ahora en Explorar, y no bloquea las siguientes. Al terminar, seguimos con la Fase 2 (densidad del panel de filtros), que es la queja de "desordenado".

¿Empiezo por Fase 1, o prefieres que arme primero un mock visual de la Fase 2 con 3 direcciones para elegir?
