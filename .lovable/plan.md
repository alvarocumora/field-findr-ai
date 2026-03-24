

# Plan: Herramienta de Renumeración de Lotes en el Mapa

## Problema

Los polígonos importados del KMZ tienen numeración secuencial por orden de importación, no por la numeración real del plano oficial. El polígono geográfico es correcto, pero el `lot_number` asignado no corresponde al master plan. Esto no se puede corregir automáticamente — requiere validación visual contra el plano.

## Solución

Crear una **herramienta de renumeración interactiva** en el mapa admin que permita al usuario:

1. Activar "Modo Renumerar" (botón en toolbar admin)
2. Hacer clic en un polígono → aparece un input para escribir el número correcto
3. Al confirmar, se actualiza `lot_number` y `name` en la BD
4. El mapa se refresca con el número nuevo

Además, superponer la imagen del plano oficial (ya soportado via `MasterPlanOverlay`) para que el admin vea lado a lado el plano real y los polígonos, y corrija los números visualmente.

## Cambios

### 1. Componente `LotRenumberTool.tsx` (nuevo)

**Archivo:** `src/components/lots/LotRenumberTool.tsx`

- Panel flotante que aparece al activar modo renumerar
- Al hacer clic en un polígono, muestra: número actual, input para nuevo número, botón confirmar
- Valida que el nuevo número no esté duplicado en el proyecto
- Ejecuta `UPDATE lots SET lot_number = $new, name = 'Lote-$new' WHERE id = $lotId`
- Mantiene un log visual de cambios realizados en la sesión (ej: "Lote 29 → Lote 1")
- Botón "Finalizar" que recarga todos los lotes

### 2. Integrar en `LotMapView.tsx`

**Archivo:** `src/components/lots/LotMapView.tsx`

- Agregar botón "Renumerar" en la toolbar admin (junto a los existentes: Calles, Plano, Comparar)
- Cuando está activo, el click en polígono abre el panel de renumeración en vez del LotDetailSheet
- Activar automáticamente el `MasterPlanOverlay` al entrar en modo renumerar para referencia visual

### 3. Integrar en `ProjectDetail.tsx`

**Archivo:** `src/pages/ProjectDetail.tsx`

- Pasar callback `onLotsUpdated` al `LotMapView` para refrescar la query de lotes después de renumerar

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/components/lots/LotRenumberTool.tsx` | Crear — UI de renumeración interactiva |
| `src/components/lots/LotMapView.tsx` | Modificar — botón + modo renumerar |
| `src/pages/ProjectDetail.tsx` | Modificar — conectar refresh de lotes |

## Flujo

```text
Admin abre proyecto → Tab Mapa → Activa "Renumerar"
  → Se muestra overlay del plano oficial
  → Click en polígono → Input "Número correcto: ___"
  → Confirmar → BD actualizada → Label del mapa cambia
  → Repetir para cada lote incorrecto
  → "Finalizar" → Refresca todo
```

