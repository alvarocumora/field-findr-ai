# Plan — Tasación v11 (solo FMV) + Guía .md reutilizable

## Objetivo
Refactor del informe a **v11 "Tasación Comercial"**: eliminar toda referencia al precio de venta (35.000 UF) y a la lógica "Buy/Strong Buy / spread / ROI inversionista". El documento debe leerse como una **Broker's Opinion of Value (BOV) / informe de tasación profesional** que justifica el **Valor Comercial ≈ 89.420 UF** (o el valor que arroje la ponderación). Mantener intacta la estética épica ya lograda en v10.5.

Además, dejar una **guía maestra en Markdown** dentro del repo para que cualquier tasación futura siga el mismo estándar.

---

## 1. Cambios en el informe (v11)

### 1.1 Qué se conserva (no tocar)
- Portada cinematográfica con satélite + branding.
- Glosario / definiciones IVS.
- Página de ubicación con mapa, Ruta 5, contexto Teno.
- Análisis de mercado comparable.
- Datos SII (rol, avalúo fiscal, destino, superficie oficial).
- 5 métodos de valuación con pesos, fórmulas, fuentes (páginas 4–5 de v10.5).
- Imágenes satelitales, polígono KMZ, overlays.
- QR a ficha pública del activo.
- Tabla de propiedades comparables con fuente/link (E&V, Vivax, Portal Inmobiliario, MercadoLibre, etc.).

### 1.2 Qué se elimina
- Bloque "Asking Price 35.000 UF".
- "Spread 155%", "Price/Value 0.39", "Strong Buy".
- ROI 37–73%, "ecuación de negocio Compra + CAPEX".
- Cualquier lenguaje de listing / oportunidad para inversionista.
- Recomendación tipo equity research.

### 1.3 Qué se reemplaza
| Página | Antes (v10.5) | Después (v11) |
|---|---|---|
| Portada | Dual block FMV 89.420 / Ask 35.000 + "Strong Buy" | Bloque único: **Valor Comercial (FMV) 89.420 UF** + rango de confianza (p.ej. 84.900 – 94.100 UF) + sello "Tasación Comercial – IVS 2022" |
| Resumen ejecutivo | Tesis de inversión + recomendación BUY | **Opinión de Valor**: 4 KPIs (FMV, UF/m², superficie, destino), síntesis metodológica, conclusión del tasador |
| Escenarios A/B/C | Valor estabilizado vs CAPEX vs compra 35k | **Escenarios de mayor y mejor uso (Highest & Best Use)**: agroindustrial / logístico / mixto → cada uno con valor desarrollado estimado, sin precio de entrada |
| Supuestos | Anclas (FMV/Ask/Spread) | Anclas solo de FMV + supuestos de cada método |
| Comparativo final | Entry price vs developed value | Tabla solo de **valor por escenario de uso** y sensibilidad ±10% |
| Footer / disclaimer | — | Añadir: "Este informe no constituye oferta de compra ni venta. Precio de transacción se determina entre las partes." |

### 1.4 Tono
Consultor / tasador independiente (Colliers, JLL, Tinsa, Arenas y Cayo). Verbos: *se concluye, se pondera, se estima, se reconcilia*. Nunca: *oportunidad, buy, upside, descuento*.

---

## 2. Guía Markdown reutilizable

Crear `docs/GUIA_TASACION_PROFESIONAL.md` con:

1. **Propósito y alcance** — qué es una tasación comercial v11 estilo Colliers/JLL.
2. **Estructura obligatoria de 9–11 páginas**:
   1. Portada épica (satélite + FMV único + sello IVS)
   2. Glosario / definiciones
   3. Identificación del activo (SII, rol, deslindes, polígono)
   4. Ubicación y contexto de mercado
   5. Comparables (mínimo 4, con link y fuente)
   6. Método 1–2 (Comparables A/B)
   7. Método 3 (Capitalización de rentas)
   8. Método 4 (Costo de reposición)
   9. Método 5 (Residual de desarrollo)
   10. Reconciliación ponderada + FMV final + rango ±5%
   11. Supuestos, limitaciones, disclaimer, firma
3. **Reglas duras**:
   - Nunca incluir precio pedido ni recomendación de compra.
   - Anclas únicas: FMV y rango. Sin spread, sin ROI.
   - Cada comparable: dirección/zona, superficie, precio UF, UF/m², fuente, link, fecha.
   - Cada método: fórmula, inputs (tabla), peso, fuente.
   - Footer numerado N/total en todas las páginas.
4. **Estética**:
   - Paleta dark premium (slate 950 / emerald 500 / amber 400) — coherente con Core memory.
   - Tipografía: títulos display serif, cuerpo sans humanista.
   - Mapas con overlay de polígono normalizado (`normalizePolygon`).
   - QR siempre apuntando a `/tasacion/v/:id` (memoria tasacion-qr-validator-blockchain).
5. **Pipeline técnico**:
   - Generador: `reportlab` (páginas nuevas) + `pypdf` (merge con páginas visuales).
   - QA obligatorio: `pdftoppm -jpeg -r 150` → revisar las N páginas → confirmar que NO aparece "asking", "buy", "spread", "ROI", ni precio de venta.
   - Validador de coherencia: script que busca strings prohibidos antes de publicar.
6. **Lenguaje permitido / prohibido** (tabla).
7. **Checklist final** (10 ítems) que el tasador debe marcar antes de exportar.
8. **Versionado**: convención `Tasacion_<Predio>_<DDMMYYYY>_v<N>.pdf`.

---

## 3. Entregables

- `/mnt/documents/Tasacion_Teno_16052026_v11_comercial.pdf` (9–11 páginas, sin asking price).
- `/mnt/documents/Tasacion_Teno_16052026_v11_QA.txt` (resultado del validador de strings).
- `docs/GUIA_TASACION_PROFESIONAL.md` en el repo.
- Scripts de generación en `/tmp/build_v11.py` y `/tmp/validate_v11.py`.

## 4. Detalles técnicos
- Partir desde v10.5 como base visual; reescribir solo portada, resumen ejecutivo, escenarios y supuestos.
- Recalcular ponderación de los 5 métodos sin tocar pesos → confirmar FMV final (≈89.420 UF) y publicar rango ±5% (84.949 – 93.891 UF).
- Validador grep: `(35\.000|asking|strong buy|spread|ROI|upside|oportunidad de compra)` debe retornar 0 matches.

¿Apruebas para generar v11 + la guía?
