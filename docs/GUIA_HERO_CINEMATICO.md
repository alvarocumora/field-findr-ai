# Guía Maestra Visual & Hero Cinemático

> **Propósito.** Estandarizar la presentación de cada terreno/proyecto que se publique en Oferta Terrenos / Field-Findr AI, garantizando que **toda ficha** tenga una experiencia visual "wow" coherente, replicable y escalable. Esta guía también dirige las próximas implementaciones del sistema.

Última actualización: 2026-05-12 · Owner: Producto + Diseño

---

## 1. Principio rector

> **Cada terreno merece un hero cinemático.** No más fichas planas con galería de fotos genérica. La primera pantalla debe **emocionar, contextualizar y proyectar** el potencial del suelo en menos de 5 segundos.

Tres capas de información, siempre en este orden:

1. **Realidad** — satélite + polígono real del terreno (Mapbox 3D).
2. **Proyección** — overlay vectorial animado del uso propuesto (packing, conjunto, parcelación, agrícola, logístico…).
3. **Acción** — CTA al diseñador 3D, contacto, o reserva.

---

## 2. Identidad visual obligatoria

| Elemento | Valor |
|---|---|
| Modo | **Dark mode** por defecto (`bg-slate-900` base del hero) |
| Tipografía | Swiss / Inter — pesos 400/500/600/700 |
| Glassmorphism | `bg-background/70 backdrop-blur-md border border-border/60` |
| Color primario | `--primary` (Emerald `#10b981` interno · `#22C55E → #0EA5E9` marketplace) |
| Status colors | Emerald = Disponible · Amber = Reservado · Slate = Vendido |
| Radios | `rounded-2xl` para hero · `rounded-full` para pills |
| Sombras | `shadow-2xl` en hero · `shadow-lg` en pills/CTA |
| Animaciones | `framer-motion` o `tailwindcss-animate` · easings `easeInOutCubic` · duración 250–600 ms |
| Reduced motion | **Obligatorio** respetar `prefers-reduced-motion: reduce` |

**Prohibido:** colores hardcoded en componentes (siempre tokens semánticos), serif, light mode forzado, animaciones >1.5 s sin escape.

---

## 3. Anatomía del Hero Cinemático

```text
┌─────────────────────────────────────────────────────────────┐
│  [Mapbox 3D satellite — pitch 60°, bearing animado ±4°]     │
│                                                             │
│  ╭─Toggle──────────╮              ╭──CTA Diseñador────╮     │
│  │ 📦 Packing │ 🏘 │              │ Diseñar mi versión │     │
│  ╰────────────────╯              ╰────────────────────╯     │
│                                                             │
│        ╔═══════════════════╗                                │
│        ║  Polígono real    ║  ← contorno emerald + glow     │
│        ║  ┌──┐ ┌──┐ ┌──┐   ║  ← edificios fill-extrusion    │
│        ║  └──┘ └──┘ └──┘   ║    rise-up con stagger 80 ms   │
│        ╚═══════════════════╝                                │
│                                                             │
│ ╭─Badge─╮ ╭─ha─╮         ╭─Leyenda · pills────────────╮     │
│ │ Vista │ │7ha │         │ ▪ Galpones ▪ Cámaras ▪ ... │     │
│ ╰───────╯ ╰────╯         ╰────────────────────────────╯     │
│ Título del proyecto                                         │
└─────────────────────────────────────────────────────────────┘
```

### Dimensiones

- Desktop: `h-[60vh]` (min `380px`, max `640px`)
- Mobile: `h-[55vh]` (min `380px`)
- Aspect ratio respeta el viewport, no fuerza ratio fijo.

### Z-index

| Capa | z |
|---|---|
| Mapa | base |
| Overlays bottom (gradient + leyenda) | 10 |
| Loading skeleton | 10 |
| Toggle, CTA, badges esquina | 20 |
| Share/Favorite (sobre el hero) | 30 |

---

## 4. Secuencia de animación canónica

1. `t = 0`: Mapa carga centrado en centroide, `zoom 13.5`, `pitch 0`, `bearing 0`.
2. `t = 0.3 s`: `flyTo` 4.5 s → `zoom 16.2`, `pitch 60°`, `bearing -25°` (`curve: 1.4`, `speed: 0.6`).
3. Durante el vuelo: contorno aparece con glow emerald + línea sólida.
4. `t = 4.6 s`: `fill-extrusion` de edificios sube de altura `0 → real` con **stagger 80 ms** entre elementos, vía expresión Mapbox `let/var`.
5. `t = 5.2 s`: bucle sutil de bearing oscilando ±4° cada 8 s (vida).
6. **`prefers-reduced-motion: reduce`** → `jumpTo` directo al estado final, sin animación.

> Esta lógica vive en `TenoCinematicHero.animateBuildings()` y debe reutilizarse para todos los proyectos.

---

## 5. Tipos de overlay (catálogo de uso del suelo)

Cada terreno se publica con uno o más **layouts conceptuales** que el visitante puede alternar con el toggle. Catálogo inicial:

| Layout | Tag | Builder | Edificios típicos | Altura (m) |
|---|---|---|---|---|
| **Packing industrial** | `packing` | `buildPackingLayout` | Galpones, andén, cámaras de frío, oficinas | 6–11 |
| **Conjunto habitacional** | `conjunto` | `buildConjuntoLayout` | Casas, plazas, sede, vialidad | 5–7 |
| **Parcelación rural** | `parcelacion` | `buildParcelacionLayout` *(TODO)* | Lotes 5000 m², casa principal, calles internas | 4–6 |
| **Agrícola/frutícola** | `agricola` | `buildAgricolaLayout` *(TODO)* | Hileras, packing pequeño, riego | 0.5–8 |
| **Logístico** | `logistico` | `buildLogisticoLayout` *(TODO)* | Galpones XXL, zona de camiones, oficinas | 10–14 |
| **Mixto comercial** | `comercial` | `buildComercialLayout` *(TODO)* | Strip center, estacionamientos, locales ancla | 5–9 |

**Cada nuevo layout debe:**
1. Aceptar `bounds: PolygonBounds` (de `normalizePolygon`) — auto-escala al terreno.
2. Devolver `LayoutResult { buildings, legend }`.
3. Usar coordenadas locales en metros (sistema de `polygonUtils`).
4. Incluir leyenda (≤4 categorías de color).
5. Registrarse en `layouts.ts` exportando un `buildLayout(type, bounds)`.

---

## 6. Reglas de geometría (no negociables)

> Reforzar la **regla maestra del proyecto** (ver `mem://architecture/lot-geometry-normalization-standard`).

- **TODO** polígono pasa por `normalizePolygon()` antes de renderizarse.
- **NUNCA** usar coordenadas crudas del KMZ sin normalizar.
- KMZ subidos a `public/listings/<slug>-poligono.kmz` (formato unificado).
- Si el polígono tiene <3 vértices válidos → fallback a marker simple, no se intenta hero.
- Coordenadas verificadas geográficamente contra satélite y Master Plan antes de marcar `is_verified = true`.

---

## 7. Workflow de publicación de un nuevo terreno

Toda publicación nueva (`PublishProperty.tsx` → wizard) debe completar estos pasos para activar el hero cinemático:

| # | Paso | Responsable | Output |
|---|---|---|---|
| 1 | Subir KMZ del polígono real | Vendedor | `public/listings/<slug>.kmz` |
| 2 | Verificar centroide y bounds vs satélite | Admin/Asesor | flag `is_verified` |
| 3 | Asignar `tags` con uso(s) propuesto(s) | Vendedor | `tags: ['packing', 'conjunto']` |
| 4 | Generar / aprobar layouts conceptuales | Sistema (auto) | `layouts.ts` builder |
| 5 | Subir 4–6 imágenes hero (16:9, ≥1920px) | Vendedor | `listing.images[]` |
| 6 | (Opcional) 4 renders conceptuales AI | Sistema | bucket `listing-renders/` |
| 7 | Aprobación final (`property_approvals`) | Admin | `status = 'active'` |

**Gating del hero:**

```ts
const showCinematicHero =
  !!polygon && polygon.length >= 3 &&
  listing.tags?.some(t => HERO_LAYOUT_TAGS.includes(t)) &&
  (listing.status === 'active' || isListingOwner);
```

---

## 8. Componentes y arquitectura

```text
src/components/property/teno-hero/        ← renombrar a /cinematic-hero/ en próxima iteración
├── TenoCinematicHero.tsx                 ← orquestador (Mapbox + overlays + toggle)
├── HeroLayoutToggle.tsx                  ← pill toggle Packing/Conjunto/...
├── layouts.ts                            ← builders de overlays + LayoutType
└── (futuro) overlays/
    ├── packing.ts
    ├── conjunto.ts
    ├── parcelacion.ts
    ├── agricola.ts
    └── logistico.ts
```

**Reglas de implementación:**

- Componente hero siempre **lazy-loaded** (`React.lazy`) → no penalizar LCP de fichas sin polígono.
- Mapa Mapbox **directo** (no wrapper `EnhancedMap`) → control fino de pitch/bearing/flyTo.
- Token vía `useMapboxToken` (cache 1 h, ya existente).
- Cleanup obligatorio: `cancelAnimationFrame` + `map.remove()` en unmount.
- Layouts puros (sin side effects), reciben `bounds`, devuelven coords locales.
- Conversión local↔lng/lat: usar centroide + `metersPerDegLng/Lat` de `normalizePolygon`.

---

## 9. Accesibilidad y performance

- `prefers-reduced-motion: reduce` → sin animaciones, estado final inmediato.
- Loading skeleton ocupa el alto final (no shift).
- Mapa no bloquea LCP: hero usa skeleton mientras el token carga.
- Lazy-load de overlays JSON (ninguno >10 KB).
- Touch targets ≥40 px en pills/CTA.
- Texto siempre con contraste AA sobre el mapa (badges con `bg-background/70 backdrop-blur`).
- ARIA labels en toggle (`role="tablist"` futuro).

---

## 10. SEO obligatorio por ficha

Cada ficha de proyecto/terreno debe declarar:

- `<title>` ≤60 chars con palabra clave + ubicación.
- `<meta name="description">` ≤160 chars.
- Single `<h1>` con título del proyecto.
- JSON-LD `RealEstateListing` (helper `buildPropertyJsonLd` ya existente).
- Imagen OG 1200×630 (primer hero o screenshot del flyover).
- `alt` en todas las imágenes.
- Canonical tag.

---

## 11. Roadmap de evolución

### V1 (actual)
- [x] Hero cinemático Teno con packing + conjunto.
- [x] Mapbox 3D + flyover + overlay animado.
- [x] Diseñador 3D acoplado.

### V2 (próxima iteración)
- [ ] Renombrar `teno-hero/` → `cinematic-hero/` (componente genérico).
- [ ] Builders restantes: parcelación, agrícola, logístico, comercial.
- [ ] Parser KMZ runtime (no más polígonos hardcoded).
- [ ] Tabla `listing_layouts` (jsonb) para overlays por listing.
- [ ] UI admin "Generar layout sugerido por IA" basado en tags + área.

### V3
- [ ] Fly-through con waypoints scrollytelling (`/proyecto/:id/experiencia`).
- [ ] Time-of-day (amanecer / mediodía / atardecer) con `sky-atmosphere-sun`.
- [ ] Capas WMS (Master Plan municipal) superpuestas opcional.
- [ ] Export del hero a video MP4 (server-side puppeteer) para WhatsApp/Stories.

---

## 12. Checklist de QA antes de publicar una ficha

- [ ] Polígono real cargado y verificado vs satélite.
- [ ] Tags de uso definidos (≥1 del catálogo de layouts).
- [ ] Hero cinemático carga sin errores en consola.
- [ ] Flyover completa en <5 s y se asienta limpio.
- [ ] Toggle alterna sin parpadeos.
- [ ] CTA "Diseñar mi versión" abre el dialog (si aplica gating).
- [ ] Mobile (<640 px) muestra controles compactos sin overflow.
- [ ] `prefers-reduced-motion` testeado.
- [ ] Galería secundaria con fotos reales presente.
- [ ] SEO meta + JSON-LD validados.
- [ ] Lighthouse Performance ≥80 en mobile.

---

## 13. Referencias internas

- `mem://architecture/lot-geometry-normalization-standard` — geometría unificada.
- `mem://features/cinematic-geospatial-navigation` — cross-fade Mapbox↔R3F.
- `mem://features/3d-parcel-visualization-system-v2` — diseñador 3D R3F.
- `mem://features/map-and-gis-architecture-v2` — WMS proxies.
- `mem://style/estetica-premium-loteos-chile` — estética premium.
- `src/lib/polygonUtils.ts` — `normalizePolygon`.
- `src/components/property/teno-hero/` — implementación de referencia.

---

> **Regla de oro:** Si una ficha nueva no cumple esta guía, no se publica. Si una funcionalidad nueva la contradice, se ajusta la funcionalidad — no la guía.
