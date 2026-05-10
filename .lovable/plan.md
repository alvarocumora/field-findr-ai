
# Visualización Industrial — Proyecto Teno

Dos módulos complementarios en la ficha de Teno: **Render conceptual** (galería visual generada con IA) y **Diseñador 3D Industrial** (extensión del ParcelaDesigner3D existente con piezas de packing frutícola).

---

## 1. Sección "Visión del Proyecto" — Render conceptual

Nueva sección visual en `PropertyDetail` (solo cuando el listing es industrial / tiene tag `packing`).

- **4 imágenes generadas con IA** (3:2, calidad standard) guardadas en `src/assets/teno-render/`:
  1. Vista aérea del packing emplazado en el terreno con Ruta 5 al fondo.
  2. Galpón packing + andén de carga con camiones refrigerados.
  3. Cámara de frío + módulo administrativo (vista frontal).
  4. Estacionamiento de camiones y área de maniobras al amanecer.
- Componente `ConceptRenderGallery.tsx`: grid 2×2 con hover zoom, click → lightbox reutilizando `ImageGallery`.
- Badge "Render conceptual — referencial" sobre cada imagen para evitar confusión legal.

## 2. Diseñador 3D Industrial

Extender el sistema existente `ParcelaDesigner3D` (no reescribir).

### Nuevas primitivas en `useParcelaState.ts`
Agregar a `ParcelaObjectType`:
- `galpon_packing` — caja 40×20×8m con techo a dos aguas, color zinc
- `anden_carga` — plataforma elevada 1.2m con barandas
- `camara_frio` — bloque adosado 15×10×6m, panel sandwich blanco
- `oficinas` — módulo 2 pisos 12×8×6m con ventanales
- `estacionamiento_camiones` — pavimento con demarcación amarilla para semirremolques
- `area_maniobras` — círculo asfaltado para radio de giro
- `bascula` — plataforma 18×3m con caseta lateral
- `porteria` — caseta de control de acceso 4×3m con barrera
- `cerco_industrial` — malla acmafor 2.5m con postes

### Nueva categoría "Industrial" en `AssetCatalog.tsx`
- Icono 🏭, separada de "casas" / "infraestructura".
- Solo visible cuando el listing/lote tiene tag `industrial` o `packing`.

### Renderizado en `ParcelaObjects.tsx`
Cada primitiva = composición de meshes Three.js (BoxGeometry + materiales con color/roughness adecuados). Sin cargar GLB externos para mantener performance < 60FPS.

### Habilitar Diseñador en ficha de listing industrial
Hoy `LotDesigner3DDialog` solo se invoca desde lots con polígono. Crear `ListingDesigner3DDialog.tsx` que:
- Reciba `polygon` desde el KMZ del listing (parsear `/listings/teno-poligono.kmz` con el parser KMZ existente).
- Usa `normalizePolygon` de `polygonUtils.ts` (regla del proyecto).
- Botón **"Diseña tu packing aquí →"** en `PropertyDetail` (sección hero stats), solo si listing tiene polígono industrial.
- Guarda diseño en `localStorage` por `listing_id` (sin nueva tabla por ahora).

## 3. Layout en PropertyDetail

```text
[Galería actual]
[Hero stats: Precio · 7 ha · Botón "Diseña tu packing"]
[Sección "Visión del Proyecto" — 4 renders IA]   ← NUEVO
[Descripción]
[Mapa con polígono]
[Resto: contacto, similares, etc.]
```

---

## Detalles técnicos

- **Generación renders**: usar `lovable_ai.py` (skill ai-gateway) con `google/gemini-3-pro-image-preview`, batch de 4 prompts. Output a `src/assets/teno-render/render-{1..4}.jpg`.
- **Trigger condicional**: `listing.tags.includes('packing')` activa ambos módulos.
- **Performance 3D**: las primitivas industriales son meshes simples (sin GLB), shadow casting solo en galpón y oficinas.
- **Accesibilidad**: alt text descriptivo en cada render, labels ARIA en botones del designer.
- **Sin cambios DB**: no se requieren migraciones; el diseño persiste en localStorage.
- **Reutilización**: `ConceptRenderGallery` y `ListingDesigner3DDialog` quedan genéricos para futuros listings industriales (ej. otros packing, bodegas, terrenos logísticos).

## Archivos a crear/modificar

**Crear**
- `src/assets/teno-render/render-{1..4}.jpg`
- `src/components/property/ConceptRenderGallery.tsx`
- `src/components/property/ListingDesigner3DDialog.tsx`

**Modificar**
- `src/components/parcela/useParcelaState.ts` — añadir 9 tipos industriales
- `src/components/parcela/ParcelaObjects.tsx` — renderizado de las 9 piezas
- `src/components/parcela/AssetCatalog.tsx` — categoría "Industrial"
- `src/pages/PropertyDetail.tsx` — integrar render gallery + botón designer
