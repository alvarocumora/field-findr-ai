

# Plan: Eliminar Gaps entre Polígonos de Lotes

## Problema

Los polígonos actuales fueron reconstruidos independientemente desde puntos/lineas del KMZ, resultando en que lotes adyacentes **no comparten bordes**. Hay gaps de ~10m entre lotes vecinos que visualmente parecen caminos falsos. En el plano real, los lotes son contiguos.

## Diagnóstico (datos reales)

- Lote 1 borde sur: (-71.6353042, -34.9820384) → (-71.6344936, -34.9820122)
- Lote 2 borde norte: (-71.6353068, -34.9821285) → (-71.6345039, -34.9821026)
- Gap: ~10m entre bordes que deberían ser el mismo

## Solución: Snap de Bordes Compartidos (post-procesamiento en BD)

Crear una función que recorra todos los polígonos del proyecto y **fusione vértices cercanos** entre lotes adyacentes, eliminando los gaps.

### 1. Nuevo botón "Compactar Lotes" en `LotMapView.tsx`

- Botón en toolbar admin con ícono `Minimize2`
- Al hacer clic, ejecuta el algoritmo de snap en el cliente

### 2. Algoritmo de snap de vértices compartidos

```text
Para cada par de lotes (i, j):
  Para cada vértice V del lote i:
    Para cada arista (A→B) del lote j:
      Si distancia(V, segmento A-B) < TOLERANCIA (15m):
        Proyectar V sobre A-B → punto P
        Insertar P en la arista de lote j
        Mover V a P (ambos lotes comparten el punto)
```

Esto garantiza que lotes adyacentes compartan exactamente los mismos vértices en su borde común, eliminando los gaps visibles.

### 3. Actualización masiva en BD

Después del snap, actualizar los 79 polígonos con un batch de UPDATEs via Supabase.

### 4. Ajuste visual complementario

En el estilo del mapa, reducir `line-width` de 2 a 1 y cambiar `fill-opacity` de 0.7 a 0.8 para que los bordes sean más sutiles y el relleno más sólido.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/lots/LotMapView.tsx` | Botón "Compactar", función de snap de vértices, estilo visual |

## Flujo

```text
Admin → Tab Mapa → Botón "Compactar Lotes"
  → Algoritmo calcula bordes compartidos
  → Fusiona vértices cercanos entre vecinos
  → Actualiza 79 polígonos en BD
  → Mapa se refresca sin gaps
```

