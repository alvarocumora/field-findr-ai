

# Plan: Re-importar KMZ Respetando Nombres de Placemarks

## Problema

Los polígonos fueron asignados secuencialmente durante la importación KMZ (primer polígono → Lote 1, segundo → Lote 2, etc.), pero el KMZ tiene los placemarks nombrados correctamente ("Lote:1", "Lote:18", "Lote:20"...). El resultado: el polígono geográfico del "Lote:48" en Google Earth está asignado al "Lote 1" en la base de datos, y así sucesivamente.

La segunda captura (Google Earth) muestra los nombres reales del KMZ — eso es lo que necesitamos usar.

## Solución

Agregar una función **"Re-importar KMZ por Nombre"** en `LotMapView.tsx` que:

1. Parsea el KMZ subido (168-915_1-7.kmz)
2. Para cada placemark, extrae el número del nombre (ej: "Lote:1" → 1, "Lote:48" → 48)
3. Busca el lote con `lot_number = "1"` en la BD y le asigna **ese** polígono específico
4. Actualiza `polygon`, `latitude`, `longitude` en cada lote

Esto reemplaza la lógica actual de asignación secuencial por una asignación **por nombre**.

## Cambios

### 1. Nueva función `handleReimportByName` en `LotMapView.tsx`

```text
handleReimportByName(file):
  parsed = parseKMZ(file)
  for each placemark in parsed.placemarks:
    lotNum = extractNumber(placemark.name)  // "Lote:1" → "1"
    matchingLot = lots.find(l => l.lot_number === lotNum)
    if matchingLot:
      UPDATE lots SET polygon = placemark.coordinates,
                      latitude = centroid.lat,
                      longitude = centroid.lng
      WHERE id = matchingLot.id
```

- Nuevo botón en la toolbar admin: "Reimportar KMZ" con ícono `RefreshCw`
- Input file oculto que acepta `.kmz/.kml`
- Regex flexible para extraer número: `/Lote[:\s-]*(\d+)/i` (soporta "Lote:1", "Lote 1", "Lote-1")
- No toca `lot_number`, `area`, ni `price` — solo reasigna los polígonos geográficos

### 2. Modificar el label del mapa

Actualmente en línea 604:
```js
'text-field': ['get', 'lot_number']
```

Cambiar a formato con prefijo para consistencia con el plano:
```js
'text-field': ['concat', 'Lote:', ['get', 'lot_number']]
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/lots/LotMapView.tsx` | Nueva función `handleReimportByName`, botón en toolbar, label format |

## Flujo

```text
Admin → Tab Mapa → Botón "Reimportar KMZ"
  → Selecciona 168-915_1-7.kmz
  → Sistema parsea placemarks por nombre
  → Asigna polígono de "Lote:48" al lote con lot_number="48"
  → Mapa se refresca con polígonos correctos
  → Labels muestran "Lote:1", "Lote:2"... en posiciones correctas
```

