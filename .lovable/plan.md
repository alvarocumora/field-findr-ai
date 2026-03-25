

# Plan: Activar Terreno Georreferenciado por Defecto en el Diseñador 3D

## Problema

El diseñador 3D de parcelas inicia con `useRealisticTerrain = false` (terreno plano verde), obligando al usuario a hacer clic manualmente en "Terreno Plano" para activar el relieve real. Además, `RealisticTerrain.tsx` intenta leer `VITE_MAPBOX_TOKEN` directamente del env (que no existe en producción), en vez de usar el sistema de token con caché del edge function (`useMapboxToken`). Resultado: terreno negro sin imagen satelital ni relieve.

Adicionalmente, cuando el terreno realista se activa, no se dibuja el contorno del lote sobre la imagen satelital, perdiendo la referencia geoespacial del polígono.

## Cambios

### 1. `RealisticTerrain.tsx` - Recibir token como prop + dibujar contorno del lote

- Agregar prop `mapboxToken: string` en vez de leer `import.meta.env.VITE_MAPBOX_TOKEN`
- Usar el token recibido para cargar tiles de terreno y satélite
- Agregar un `<lineLoop>` con el polígono del lote convertido a coordenadas locales, renderizado sobre el terreno realista (línea verde brillante)
- Calcular el `size` automáticamente basado en el bounding box del polígono para que el tile cubra todo el lote

### 2. `ParcelaDesigner3D.tsx` - Activar terreno real por defecto + pasar token

- Importar `useMapboxToken` hook
- Cambiar `useState(false)` → `useState(true)` para `useRealisticTerrain` cuando hay coordenadas disponibles
- Pasar `mapboxToken` al componente `RealisticTerrain`
- Dibujar el contorno del polígono del lote sobre el terreno (línea visible en ambos modos: plano y realista)

### 3. Contorno del lote visible

- En modo realista: línea 3D verde sobre la malla del terreno usando las coordenadas locales del polígono
- En modo plano: ya existe (`FlatTerrain` tiene el `lineLoop`)

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/RealisticTerrain.tsx` | Prop `mapboxToken`, contorno del polígono, auto-size |
| `src/components/parcela/ParcelaDesigner3D.tsx` | `useMapboxToken`, default realistic, pasar token |

## Resultado Esperado

Al abrir "Mi Parcela en 3D", el usuario ve inmediatamente la imagen satelital real con relieve topográfico y el contorno del lote dibujado, listo para colocar objetos sobre el terreno georreferenciado.

