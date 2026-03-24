

# Plan: Actualización de Superficies Reales — Brisas de Caone

## Diagnóstico

Al comparar el "Cuadro de Superficies" del plano oficial (Láminas A1 y B2, ROL 168-915) con la base de datos, se detectan **discrepancias significativas en las áreas de los 79 lotes**. Ejemplos críticos:

| Lote | BD actual (m²) | Plano oficial (m²) | Diferencia |
|------|---------------|-------------------|------------|
| 1 | 4,499 | 5,000 | -501 |
| 19 | 5,233 | 9,600 | -4,367 |
| 41 | 7,972 | 11,700 | -3,728 |
| 44 | 3,757 | 21,000 | -17,243 |
| 60 | 18,166 | 6,000 | +12,166 |
| 78 | 3,703 | 9,200 | -5,497 |

Las áreas actuales provienen probablemente del cálculo automático de polígonos KMZ (Shoelace), que no coincide con las superficies oficiales del topógrafo.

## Cambio

### Actualización masiva de áreas vía INSERT tool

Ejecutar 79 sentencias UPDATE sobre la tabla `lots` usando el `project_id = e0d83d66-c7be-4c94-a017-3ad331d74699`, actualizando `area` y recalculando `price_per_sqm` (= price / area) para cada lote con la superficie total oficial del Cuadro de Superficies.

También normalizar los nombres a formato consistente `Lote-N`.

### Datos del Cuadro de Superficies (Superficie Total en m²)

Lotes 1-18: 5000 cada uno | Lote 19: 9600 | Lote 20-21: 5000 | Lote 22: 6300 | Lote 23: 5000 | Lote 24: 8000 | Lote 25: 10500 | Lotes 26-34: 5000 | Lote 35: 5100 | Lotes 36-39: 5000 | Lote 40: 10000 | Lote 41: 11700 | Lote 42-43: 10000 | Lote 44: 21000 | Lotes 45-51: 5000 | Lotes 52-53: 5500 | Lotes 54-55: 5000 | Lote 56: 5200 | Lote 57: 5500 | Lote 58: 6500 | Lote 59: 5300 | Lotes 60-64: 6000 | Lotes 65-66: 6500 | Lote 67: 7000 | Lotes 68-69: 5000 | Lote 70: 6200 | Lote 71: 6800 | Lote 72: 5900 | Lote 73: 4800 | Lote 74: 4200 | Lote 75: 4700 | Lote 76: 5100 | Lote 77: 4600 | Lote 78: 9200 | Lote 79: 8600

## Archivos a Modificar

Ninguno. Este cambio es exclusivamente de datos en la base de datos (79 UPDATEs).

## Impacto

- Las cards de lotes mostrarán las superficies reales del plano topográfico oficial
- El precio/m² se recalculará correctamente
- El brochure PDF generará datos precisos
- La coherencia con el master plan queda garantizada

