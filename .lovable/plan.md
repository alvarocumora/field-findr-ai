
Plan: Corrección real del visor 3D + consolidación del diseñador

Diagnóstico confirmado

Sí sé dónde está el problema. El fallo ya no parece ser “solo la textura”, sino una combinación de 4 errores estructurales:

1. Normalización geográfica incompleta
- Ya existe `src/lib/polygonUtils.ts`, pero el diseñador no la usa.
- `LotDesigner3DDialog.tsx` y `LotDetailSheet.tsx` siguen casteando `lot.polygon` directo.
- `ParcelaDesigner3D.tsx` y `RealisticTerrain.tsx` duplican centroides/tamaños por separado, así que el visor puede calcular un centro, tamaño y UV distintos según la entrada.

2. Contrato de layout débil del Canvas
- `ParcelaDesigner3D.tsx` tiene altura fija (`h-[600px] sm:h-[700px]`) dentro del propio componente.
- Eso rompe la integración embebida en preview, sheet, dialog y tabs, y hace que el visor no respete el tamaño real del contenedor.

3. Pipeline satelital no está validado visualmente
- El sistema puede “creer” que aplicó la textura, pero el plano seguir viéndose lavado/plano.
- Además, con tiles de `512`, la calibración de escala debe considerar el offset de zoom documentado por Mapbox; hoy esa matemática no está cerrada en el componente.

4. Herramientas duplicadas
- `ParcelaToolbar.tsx` y `AssetCatalog.tsx` repiten catálogo y controles.
- Eso hace más difícil depurar el render y deja una UX fragmentada.

Fase 1 — Unificar la fuente de verdad del lote
- Integrar `normalizePolygon` como base obligatoria dentro de `ParcelaDesigner3D`.
- Aceptar:
  - array de coordenadas
  - anillo GeoJSON
  - polígono cerrado con punto repetido
- Usar el mismo resultado normalizado para:
  - centroide
  - `terrainSize`
  - contorno del lote
  - UV del satélite
  - `ClickPlane`
- Dejar `latitude/longitude` solo como fallback si no hay polígono válido.

Archivos
- `src/components/parcela/ParcelaDesigner3D.tsx`
- `src/components/parcela/RealisticTerrain.tsx`
- `src/components/lots/LotDesigner3DDialog.tsx`
- `src/components/lots/LotDetailSheet.tsx`
- `src/pages/MiTerreno.tsx`
- `src/lib/polygonUtils.ts`

Fase 2 — Arreglar el contrato visual del visor
- Quitar la altura fija interna del diseñador.
- Hacer que `ParcelaDesigner3D` use `h-full min-h-0 w-full`.
- Pasar la altura desde cada contexto:
  - dialog: full height
  - sheet preview: altura compacta controlada
  - `MiTerreno`: altura grande de escritorio
- Asegurar que el `Canvas` siempre herede un contenedor con altura explícita y estable.

Archivos
- `src/components/parcela/ParcelaDesigner3D.tsx`
- `src/components/lots/LotDesigner3DDialog.tsx`
- `src/components/lots/LotDetailSheet.tsx`
- `src/pages/MiTerreno.tsx`

Fase 3 — Debug real del satélite
- Mantener el HUD, pero convertirlo en diagnóstico útil:
  - centroide usado
  - tamaño real del terreno
  - zoom efectivo
  - tiles cargados
  - `repeat/offset`
  - preview 2D del canvas stitched
- Separar estados:
  - tile descargado
  - canvas compuesto
  - textura creada
  - textura visible en escena
- Corregir la matemática de tiles 512 con su equivalencia de zoom.
- Si el preview 2D se ve bien pero el terreno sigue mal, aplicar modo de aislamiento:
  - plano satelital puro sin relieve
  - luego relieve encima como capa secundaria

Archivos
- `src/components/parcela/RealisticTerrain.tsx`
- `src/components/parcela/ParcelaDesigner3D.tsx`

Fase 4 — Render robusto en 2 capas
- Cambiar de “un solo mesh hace todo” a:
  1. base satelital con `meshBasicMaterial`
  2. capa de relieve/sombreado muy suave encima
- Beneficio:
  - la imagen siempre se ve
  - el relieve deja de comerse el color
  - el usuario entiende mejor el lote
- Mantener contorno verde neón y agregar opcionalmente máscara exterior tenue para que el polígono destaque mejor.

Archivos
- `src/components/parcela/RealisticTerrain.tsx`

Fase 5 — Consolidación de herramientas 3D
- Unificar `ParcelaToolbar` + `AssetCatalog` en un solo panel lateral.
- Dejar `OBJECT_CATALOG` como única fuente de verdad.
- Reorganizar módulos:
  - Escena
  - Terreno
  - Modelos
  - Medición
  - Exportar
- Mover ahí:
  - toggle de relieve real
  - debug
  - snap
  - vista orbital/cenital/peatón

Archivos
- `src/components/parcela/ParcelaToolbar.tsx`
- `src/components/parcela/AssetCatalog.tsx`
- `src/components/parcela/useParcelaState.ts`
- `src/components/parcela/ParcelaDesigner3D.tsx`

Fase 6 — Mejora del sistema de modelos 3D
- Alinear el catálogo visual con `OBJECT_CATALOG`.
- Mostrar presets con:
  - nombre
  - categoría
  - escala sugerida
  - footprint aproximado
- Agregar acciones críticas:
  - duplicar
  - bajar al terreno
  - bloquear
  - reset de rotación
  - centrar
- Mantener GLB subidos como grupo separado, no mezclados con primitives base.

Archivos
- `src/components/parcela/AssetCatalog.tsx`
- `src/components/parcela/ObjectPropertiesPanel.tsx`
- `src/components/parcela/useParcelaState.ts`

Fase 7 — Validación por rutas críticas
Probar el mismo lote en 3 entradas:
1. `LotDesigner3DDialog`
2. `LotDetailSheet`
3. `MiTerreno`

Casos a validar
- lote con polígono válido
- polígono cerrado con punto duplicado
- polígono GeoJSON
- sin polígono pero con lat/lng
- con diseño guardado
- con satélite activo
- terreno plano fallback

Resultado esperado
- El visor deja de verse “plomo/blanco”.
- La base satelital se ve realmente en todas las entradas.
- El diseñador respeta el tamaño del contenedor donde se monta.
- El sistema 3D queda más estable, menos duplicado y listo para seguir creciendo con herramientas disruptivas.

Sin migraciones de base de datos
- Todo este ajuste es frontend + integración del backend ya existente.
