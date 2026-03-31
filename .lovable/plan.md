
Plan: Debug y consolidación del Diseñador 3D

Hallazgos clave
- El Canvas sí está renderizando; no parece un problema de altura 0.
- La vista “Relieve Real” entra sin error, pero la base sigue viéndose ploma. En el código hay 3 causas probables:
  1. la grilla técnica oscura se dibuja encima del terreno cuando `Snap` está activo;
  2. el satélite usa `meshStandardMaterial`, así que luz/sombra pueden lavar la imagen;
  3. `RealisticTerrain` prioriza `latitude/longitude` del lote sobre el centroide real del polígono.
- Además hay fragmentación: `ParcelaToolbar` y `AssetCatalog` duplican el catálogo 3D con lógicas y categorías distintas.

Fase 1 — Debug visual del pipeline 3D
- Añadir un HUD de depuración dentro del diseñador con: fuente de coordenadas, centroide, tamaño del terreno, tiles cargados, zoom usado, `repeat/offset`, estado de textura y material activo.
- Añadir una mini preview 2D del canvas satelital stitched para separar “la imagen no llegó” de “Three.js no la está mostrando”.
- Añadir toggles de diagnóstico: ocultar grilla, usar material básico sin iluminación, mostrar solo textura, mostrar solo relieve.

Fase 2 — Normalización geográfica
- Crear un helper único para normalizar polígonos desde array o GeoJSON, eliminar punto de cierre duplicado y calcular centroide/bounds.
- Usar ese helper en `LotDesigner3DDialog`, `LotDetailSheet`, `MiTerreno` y `RealisticTerrain`.
- Cambiar la prioridad del centro geográfico: si hay polígono válido, usar su centroide; solo usar `latitude/longitude` como fallback.
- Mostrar aviso claro cuando el lote no tenga polígono válido o sus coordenadas sean inconsistentes.

Fase 3 — Corrección del render satelital
- Desactivar por defecto la grilla técnica sobre terreno real y moverla a un toggle manual.
- Separar el terreno en dos capas:
  - base satelital con `meshBasicMaterial` para color fiel;
  - relieve/sombreado opcional muy suave encima.
- Ajustar cámara top/orbit para priorizar lectura del terreno antes que el cielo.
- Escalar el `ClickPlane` al tamaño real del terreno y limpiar/dispose de texturas al recargar.

Fase 4 — Consolidación de herramientas
- Unificar `ParcelaToolbar` + `AssetCatalog` en un solo panel lateral.
- Dejar `OBJECT_CATALOG` como única fuente de verdad para categorías, labels, iconos, escala y footprint.
- Reorganizar la UI en módulos: Escena, Modelos, Terreno, Medición, Exportar.
- Corregir detalles de estado del diseñador, incluyendo la carga del diseño guardado con `useEffect` en vez de `useMemo`.

Fase 5 — Mejora de modelos 3D
- Mantener primitives existentes, pero exponerlas como presets visuales con miniatura, escala sugerida y huella aproximada.
- Ordenar familias claras: viviendas, vegetación, outdoor, infraestructura.
- Mejorar acciones de objeto: duplicar, bloquear, bajar al terreno, centrar, reset de rotación/escala.
- Dejar “Subidos” solo para GLB/GLTF externos y separar esa lógica del catálogo base.

Fase 6 — Validación de rutas críticas
- Probar el diseñador en 3 entradas: diálogo público del proyecto, preview de `LotDetailSheet` y pestaña `MiTerreno`.
- Verificar un lote con polígono real contra el mapa 2D para confirmar que el centro 3D coincide visualmente.
- Confirmar estados: carga, error, sin polígono, con satélite, con terreno plano.

Archivos a intervenir
- `src/components/parcela/RealisticTerrain.tsx`
- `src/components/parcela/ParcelaDesigner3D.tsx`
- `src/components/parcela/ParcelaToolbar.tsx`
- `src/components/parcela/AssetCatalog.tsx`
- `src/components/parcela/useParcelaState.ts`
- `src/components/lots/LotDesigner3DDialog.tsx`
- `src/components/lots/LotDetailSheet.tsx`
- `src/pages/MiTerreno.tsx`
- nuevo helper compartido para normalización geográfica del lote

Resultado esperado
- La base satelital se ve claramente, sin velo gris.
- El diseñador queda con una sola arquitectura de herramientas y catálogo.
- Los modelos 3D se sienten más consistentes, más útiles y más fáciles de operar en todas las rutas.

Detalle técnico
- No parece un problema de tamaño del `Canvas`; la escena sí está viva.
- El primer ajuste crítico es aislar textura vs grilla vs iluminación para confirmar si el fallo es de carga, georreferencia o presentación.
- No se requieren cambios de base de datos para esta consolidación.
