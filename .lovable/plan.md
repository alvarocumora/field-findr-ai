

# Plan: Hacer visible la imagen satelital como base del diseño 3D

## Problema

El terreno carga el tile satelital de Mapbox pero posiblemente el zoom level (14) no está centrado correctamente en el lote, o la textura no se está aplicando visiblemente. El usuario necesita ver claramente el bosque, caminos y terreno real como fondo para diseñar.

## Cambios

### `RealisticTerrain.tsx`

1. **Zoom más alto para mayor detalle**: Subir el zoom de 14 a 15 o 16 para que la imagen satelital tenga más resolución y muestre detalles como bosques y caminos a la escala del lote.

2. **Tile satelital de mayor resolución**: Usar `@2x` en la URL del tile satelital (ya se usa) y asegurar que el tile se centre exactamente en el centroide del polígono del lote.

3. **Material más brillante**: Cambiar `roughness` de 0.85 a 1.0 y usar `meshBasicMaterial` en vez de `meshStandardMaterial` para que la textura satelital se vea con colores reales sin verse oscurecida por la iluminación 3D. Esto es clave: con `meshStandardMaterial`, la luz solar del scene puede oscurecer la textura.

4. **Asegurar que la textura carga**: Agregar un `console.log` temporal o un estado visual que confirme que la textura satelital se cargó exitosamente (fallback a color verde si falla).

5. **Tamaño del plano ajustado al lote**: El plano de terreno debe dimensionarse para cubrir el área del lote con padding suficiente, y la textura satelital debe mapearse correctamente para que los bordes del tile coincidan con el área mostrada.

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/RealisticTerrain.tsx` | `meshBasicMaterial` para textura satelital, zoom 16, verificar carga de textura |

