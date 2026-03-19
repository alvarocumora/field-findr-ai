

# Plan: Cartographic Luxury Landing — Scrollytelling 3D Globe-to-Chile Experience

## Overview

Replace the current hero section and landing page with an immersive "Awwwards-style" experience featuring a 3D Earth globe that zooms into Chile's topography as the user scrolls, revealing project pins that expand into full 3D lot designers. Swiss-style typography, dark-mode-first design, and micro-interactions throughout.

## Architecture

```text
┌──────────────────────────────────────────────┐
│  Index.tsx (new scroll-driven layout)        │
│  ├─ CartographicHero (Globe → Chile zoom)    │
│  ├─ ScrollytellingSection (project reveals)  │
│  │   └─ ProjectScene3D (per-project WebGL)   │
│  ├─ FeaturedProjects (existing, restyled)    │
│  └─ Existing sections (HowItWorks, etc.)     │
└──────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: CartographicHero component
**New file:** `src/components/landing/CartographicHero.tsx`

- Full-viewport R3F Canvas with a textured Earth sphere (using Three.js SphereGeometry + equirectangular Earth texture from a free NASA source embedded as a static asset)
- `useScroll` from framer-motion drives camera interpolation: starts at orbital view → zooms to Chile's lat/lng (-33.4, -70.6) → transitions to a flat topographic plane
- Swiss-style overlay typography: massive mono-weight headline "OFERTA TERRENOS" with tracking-[0.3em], positioned absolutely over the canvas
- Dark gradient vignette edges
- Scroll progress indicator (thin line at bottom)
- On scroll completion, scene fades to reveal the project cards below

### Step 2: ScrollytellingSection component  
**New file:** `src/components/landing/ScrollytellingSection.tsx`

- Uses framer-motion `useScroll` + `useTransform` tied to a tall scrollable container (300vh)
- As user scrolls, project cards "fly in" from map pin positions with parallax depth
- Each project card shows: name, location, lot count, progress bar, price — data from existing `projects` query
- Cards have a glassmorphism dark style with 1px borders and subtle glow on hover
- Clicking a card navigates to `/proyecto/:id`

### Step 3: ProjectScene3D — inline 3D lot preview
**New file:** `src/components/landing/ProjectScene3D.tsx`

- Lightweight R3F scene embedded in each project card (small viewport, ~300px)
- Shows the project's terrain polygon extruded as a 3D topographic tile
- Real-time sun simulation (reuses existing `SolarLight` component)
- Auto-rotating orbit camera
- Renders only when card is in viewport (IntersectionObserver)

### Step 4: Restyle Index.tsx
**Modified file:** `src/pages/Index.tsx`

- Replace current hero section with `<CartographicHero />`
- Add `<ScrollytellingSection />` between hero and existing sections
- Keep existing FeaturedProjects, HowItWorks, etc. but wrap in dark theme override
- Add Swiss-style section dividers (thin rules with coordinates)

### Step 5: Dark cartographic CSS system
**Modified file:** `src/index.css`

- Add `.cartographic` utility classes:
  - `.font-swiss` — monospaced uppercase tracking-widest
  - `.grid-topo` — subtle topographic contour line background pattern (CSS-only)
  - `.glow-pin` — animated radial glow for map pins
  - `.border-cartographic` — 0.5px borders with low opacity
- Micro-interaction keyframes: `pin-pulse`, `contour-draw`, `coordinate-fade`

### Step 6: Earth texture asset
**New file:** `src/assets/earth-blue-marble.jpg`

- Use a lightweight (200KB) equirectangular Earth texture
- Fetched once and cached; the globe renders with MeshStandardMaterial + roughness map

## Technical Details

**3D Globe rendering:** Uses `@react-three/fiber` (already installed v8.18) + `@react-three/drei` (v9.122). The globe is a simple SphereGeometry(2, 64, 64) with a jpg texture. Camera animation driven by scroll progress via `useFrame` interpolation — no physics needed. Chile highlight rendered as a LineLoop from simplified country border coordinates (hardcoded ~20 points).

**Performance:** 
- Globe Canvas uses `frameloop="demand"` — only renders on scroll events
- ProjectScene3D uses `frameloop="demand"` + IntersectionObserver to pause when off-screen
- All 3D components lazy-loaded with `React.lazy`
- Earth texture: single 1024x512 jpg (~150KB)

**Typography:** Swiss/International style achieved with:
- `font-family: 'Plus Jakarta Sans'` (already loaded) at weight 800 for headlines
- `letter-spacing: 0.15em` + `text-transform: uppercase` for section labels
- Monospace coordinates displayed next to project names (e.g., `-34.97° S, 71.78° W`)

**No new dependencies required** — everything uses existing Three.js, R3F, drei, and framer-motion.

## Files Summary

| File | Action |
|------|--------|
| `src/components/landing/CartographicHero.tsx` | **New** — 3D globe with scroll-driven zoom |
| `src/components/landing/ScrollytellingSection.tsx` | **New** — Parallax project reveal |
| `src/components/landing/ProjectScene3D.tsx` | **New** — Inline 3D lot preview per project |
| `src/pages/Index.tsx` | **Modified** — New section order + dark cartographic wrapper |
| `src/index.css` | **Modified** — Cartographic utility classes + micro-interactions |
| `src/assets/earth-blue-marble.jpg` | **New** — Lightweight Earth texture |

