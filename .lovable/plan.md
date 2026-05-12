## Objetivo

Reemplazar el bloque genérico de la galería al abrir la ficha de Teno por un **hero cinemático full-bleed** que:

1. Vuela sobre el polígono real de Teno en Mapbox 3D satélite (pitch + bearing animado).
2. Al terminar el flyover, dibuja sobre el terreno un **overlay vectorial animado** con la disposición de **packing industrial** o **conjunto habitacional** (toggle entre los dos modos).
3. Mantiene el resto de la ficha intacto (descripción, servicios, diseñador 3D, etc.).

## UX del hero

```text
┌─────────────────────────────────────────────────────────────┐
│  [Mapbox 3D satellite — pitch 60°, bearing animado]         │
│                                                             │
│      ╔═══════════════════╗                                  │
│      ║  Polígono Teno    ║   ← contorno emerald pulsante    │
│      ║  ┌──┐ ┌──┐ ┌──┐   ║   ← galpones SVG fade-in stagger │
│      ║  │  │ │  │ │  │   ║                                  │
│      ║  └──┘ └──┘ └──┘   ║                                  │
│      ║  [andén · maniob] ║                                  │
│      ╚═══════════════════╝                                  │
│                                                             │
│  ┌─────────────────────────┐         ┌──────────────────┐   │
│  │ 📦 Packing │ 🏘 Conjunto│         │ Abrir 3D ↗       │   │
│  └─────────────────────────┘         └──────────────────┘   │
│  Teno · 7 ha · Industrial / Residencial                     │
└─────────────────────────────────────────────────────────────┘
```

- Altura: `60vh` desktop, `45vh` mobile.
- Toggle pill `Packing | Conjunto Habitacional` arriba-izquierda. Cambiar de modo hace **fade-out** del overlay actual y **fade-in** del nuevo (stagger por edificio, ~80 ms entre cada uno).
- CTA `Abrir diseñador 3D` arriba-derecha (reusa lógica existente de gating).
- Badge inferior con título + área + tags.

## Secuencia de animación al abrir la ficha

1. `t=0`: Mapbox carga centrado en Teno, zoom 14, pitch 0, bearing 0.
2. `t=0.3s`: `flyTo` cinemático 4.5 s → zoom 17, pitch 60°, bearing -25° (curve 1.4, speed 0.6, easing easeInOutCubic).
3. `t=2s` (durante el vuelo): contorno del polígono se dibuja con `line-dasharray` animado (efecto "trazo").
4. `t=4.8s` (tras flyover): overlay de edificios aparece con stagger; cada polígono interpola `fill-opacity 0 → 0.85` en 250 ms.
5. Loop sutil: bearing oscila ±3° cada 8 s para mantener vida.

## Datos a preparar

### A) KMZ Teno → polígono real
- El usuario lo subirá a `public/listings/teno-poligono.kmz`.
- Edge no necesario: en runtime hacemos `fetch('/listings/teno-poligono.kmz')` y parseamos con el módulo existente `src/lib/kmz` (ya tiene parser KML + zip).
- Si el parsing devuelve un polígono válido **y difiere** del `TENO_POLYGON` hardcodeado, usar el parseado; si no, fallback al hardcodeado. Siempre pasar por `normalizePolygon` (regla del proyecto).

### B) Layouts conceptuales
Dos archivos JSON estáticos en `src/assets/teno-render/`:

- `packing-layout.json` — array de `{ id, type: 'galpon'|'anden'|'camara'|'maniobras'|'oficina', coordsLocal: [[x,z], ...], color, label }` en metros locales (sistema de `polygonUtils`).
- `conjunto-layout.json` — array de `{ id, type: 'casa'|'parque'|'calle'|'plaza', coordsLocal: [...], color, label }`.

Generamos manualmente ~12 galpones rectangulares en grilla 3×4 + andén perimetral + 2 cámaras de frío + zona de maniobras central, **escalados al bounding box real del polígono Teno** (calculado desde `normalizePolygon`).

Para conjunto: ~30 lotes residenciales en grilla, calle central en U, 2 plazas, retorno.

## Componentes nuevos

```text
src/components/property/teno-hero/
├── TenoCinematicHero.tsx          ← orquestador (Mapbox + overlays + toggle)
├── useTenoFlyover.ts              ← hook con secuencia flyTo + estado animation phase
├── PackingOverlay.tsx             ← convierte packing-layout.json → GeoJSON + addLayer fill
├── ConjuntoOverlay.tsx            ← idem para conjunto
├── HeroLayoutToggle.tsx           ← pill toggle Packing/Conjunto
└── layouts/
    ├── packing-layout.json
    └── conjunto-layout.json
```

`TenoCinematicHero` es **lazy-loaded** (`React.lazy`) y solo se monta cuando `isTeno === true`, para no penalizar otras fichas.

## Wiring en `PropertyDetail.tsx`

- Reemplazar el bloque `ImageGallery` solo cuando `isTeno`. Se mantiene la `ImageGallery` debajo del hero como "Galería de fotos" en sección secundaria.
- El bloque actual `Visión del Proyecto` (renders) se queda como segunda sección, ya que los renders 2D complementan el hero 3D.
- El `ConceptRenderGallery` se mueve dentro de un tab `Renders conceptuales` dentro del hero (opcional, futuro).

## Detalles técnicos

- Usar `mapboxgl.Map` directo (no `EnhancedMap`) para tener control fino del flyover y evitar el chrome de markers/popup.
- Token vía `useMapboxToken` ya existente.
- Overlays como `addSource({type:'geojson'}) + addLayer({type:'fill-extrusion', ...})` para que tengan **altura real 3D** (galpones a 8 m, casas a 4 m, etc.) → matchea con el pitch de la cámara.
- Conversión coords locales → lng/lat: inverso de `normalizePolygon`, ya tenemos centroide y `metersPerDegLng/Lat`.
- Animación del contorno: `setPaintProperty('teno-outline', 'line-dasharray', [...])` interpolado con `requestAnimationFrame`.
- Animación del fill-extrusion: interpolar `fill-extrusion-opacity` y `fill-extrusion-height` (0 → real) con stagger.
- Respetar `prefers-reduced-motion`: si está activo, saltar el flyover, mostrar todo en estado final inmediato.

## Performance

- Hero solo se monta para Teno (`isTeno`).
- Mapa se destruye en cleanup.
- Overlays JSON < 10 KB combinados.
- No bloquea LCP: hero usa skeleton mientras el token de Mapbox carga.

## Fuera de alcance (esta iteración)

- Generalizar el hero a otros listings (queda preparado por estructura, pero solo se activa para Teno).
- Editor visual de los layouts JSON (se generan manualmente ahora).
- Persistir el modo elegido (Packing vs Conjunto) por usuario.

## Archivos a tocar

- **Nuevos**: 6 archivos en `src/components/property/teno-hero/`.
- **Modificados**: `src/pages/PropertyDetail.tsx` (insertar `<TenoCinematicHero>` arriba cuando `isTeno`).
- **Subido por el usuario**: `public/listings/teno-poligono.kmz`.

## Validación final

1. Abrir `/listing/<id-teno>` → ver flyover Mapbox, contorno trazado, overlay packing animado.
2. Toggle a Conjunto → cross-fade suave, casas aparecen.
3. Click `Abrir diseñador 3D` → abre `ListingDesigner3DDialog` (no se rompe).
4. Otras fichas (no Teno) → galería normal sin cambios.
5. `prefers-reduced-motion: reduce` → sin animaciones, hero estático con overlay final.
