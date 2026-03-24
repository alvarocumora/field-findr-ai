

# Plan: Data Cards Profesionales con Imágenes, Enlace y Ubicación

## Problema Actual

1. **Lotes sin imágenes**: La tabla `lots` no tiene columna de imágenes. Las cards y el LotDetailSheet son 100% texto + 3D
2. **Sin enlace compartible**: No hay botón para copiar link o compartir por WhatsApp un lote específico
3. **Ubicación poco visible**: Solo muestra coordenadas crudas (lat/lng) sin mapa estático ni dirección legible
4. **Brochure PDF sin fotos**: El generador jsPDF no incluye imágenes del lote ni mapa estático

## Cambios

### 1. Migración: Agregar `images` a tabla `lots`

```sql
ALTER TABLE public.lots ADD COLUMN images text[] DEFAULT '{}';
```

Esto permite subir fotos por lote (terreno, vista, acceso).

### 2. Rediseñar `EnhancedLotCard.tsx` — Card Profesional

- **Imagen hero**: Si el lote tiene imágenes, mostrar la primera como fondo con aspect-ratio 16/9. Si no, mostrar el polígono SVG actual sobre fondo con gradiente
- **Overlay de precio**: Precio sobre la imagen con fondo gradient (estilo Airbnb)
- **Mapa estático mini**: Badge con ícono de ubicación que al hover muestra ciudad/región del proyecto (pasado como prop)
- **Botón compartir**: Ícono `Share2` que copia `https://ofertaterrenos.com/proyecto/{projectId}?lote={lotNumber}` al clipboard
- **WhatsApp CTA**: Para lotes disponibles, botón verde de WhatsApp con mensaje pre-formateado

### 3. Rediseñar `LotDetailSheet.tsx` — Ficha Profesional

- **Galería de imágenes**: Carousel horizontal sobre la vista 3D (si tiene imágenes). Si no tiene, mantener 3D como está
- **Mapa estático embed**: Iframe de Mapbox Static Image API o mini mapa Mapbox GL con el pin del lote (debajo de la sección de coordenadas)
- **Sección de compartir**: Botones de WhatsApp, copiar enlace, y descargar ficha PDF individual del lote
- **Ficha PDF individual**: Botón "Descargar Ficha" que genera un PDF de 1 página con foto, datos, mapa y QR del enlace

### 4. Subida de imágenes en `LotForm.tsx`

- Agregar sección de upload de hasta 5 imágenes por lote
- Usar storage bucket `lot-images` (crear via migración)
- Preview de imágenes subidas con opción de eliminar

### 5. Brochure PDF mejorado — `brochurePdfGenerator.ts`

- Para cada lote en la tabla de inventario, si tiene imagen, cargarla como base64 y mostrar thumbnail junto a la fila
- Agregar columna "Imagen" en la tabla de lotes disponibles (mini thumbnail 15x10mm)
- Nuevo generador: `lotDataCardPdf.ts` — PDF de 1 página por lote individual con:
  - Foto principal (si existe)
  - Datos: número, área, precio, precio/m2, servicios, topografía
  - Mapa estático (Mapbox Static Image como base64)
  - QR code del enlace al proyecto
  - Branding ofertaterrenos.com

### 6. Storage bucket para imágenes

Migración SQL:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('lot-images', 'lot-images', true);
-- RLS: authenticated users can upload to their lots
```

## Archivos a Crear
1. `src/lib/lotDataCardPdf.ts` — Generador PDF de ficha individual del lote
2. Migración SQL — columna `images`, bucket `lot-images`

## Archivos a Modificar
1. `src/components/lots/EnhancedLotCard.tsx` — Imagen hero, share, WhatsApp
2. `src/components/lots/LotDetailSheet.tsx` — Galería, mapa estático, compartir, descargar ficha
3. `src/components/lots/LotForm.tsx` — Upload de imágenes
4. `src/lib/brochurePdfGenerator.ts` — Thumbnails en tabla de lotes
5. `src/hooks/useLots.ts` — Incluir `images` en el tipo

## Flujo del Usuario

```text
[Admin sube proyecto]
  → Agrega lotes con fotos (LotForm + ImageUploader)
  → Cada lote tiene hasta 5 fotos

[Comprador ve proyecto]
  → Cards con foto hero, precio, ubicación
  → Click → LotDetailSheet con galería + mapa + 3D
  → Botones: Reservar, Compartir (WhatsApp/Link), Descargar Ficha PDF

[Asesor genera brochure]
  → PDF incluye thumbnails de lotes con foto
  → Ficha individual por lote con QR
```

