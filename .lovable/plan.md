

# Plan: Restaurar Polígonos Originales del KMZ y Mejorar Compactación

## Problema

La compactación con tolerancia de 15m fusionó bordes de lotes con bordes de caminos, eliminando visualmente las vialidades y deformando los polígonos. El resultado no se parece al KMZ original ni al plano.

## Solución en 2 pasos

### Paso 1: Botón "Restaurar KMZ Original"

Agregar un botón que re-descargue el KMZ almacenado del proyecto y restaure los polígonos originales por nombre de placemark, sin ninguna modificación/snap. Esto deshace la compactación.

- Usa la URL del KMZ ya guardada en el proyecto (`kmzFileUrl`)
- Parsea placemarks y asigna por nombre (`Lote:N` → lot_number N)
- Restaura coordenadas originales del archivo KMZ sin alteraciones

### Paso 2: Reemplazar algoritmo de compactación

Reducir la tolerancia de snap drásticamente:
- **Vertex-to-segment**: de 15m → **3m** (solo bordes que realmente se tocan)
- **Vertex-to-vertex**: de 10m → **2m**
- Agregar filtro: NO snapear si el borde está en el perímetro exterior del proyecto (donde están los caminos)

Esto preserva los caminos y solo fusiona los micro-gaps entre lotes verdaderamente adyacentes.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/lots/LotMapView.tsx` | Nuevo botón "Restaurar KMZ", reducir tolerancias de compactación |

## Flujo

```text
1. Admin presiona "Restaurar KMZ" → polígonos vuelven al estado original
2. Verifica visualmente que caminos y lotes se ven como en Google Earth
3. Opcionalmente presiona "Compactar" con tolerancia conservadora (3m)
   → solo cierra micro-gaps sin tocar caminos
```

