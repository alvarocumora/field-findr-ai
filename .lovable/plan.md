## Objetivo

Eliminar toda referencia a "Adelphos" (es otra empresa) y dejar **un único estándar de tasación** bajo la marca **OFERTA TERRENOS · Valuation**, alineado a IVS 2022, con dos variantes oficiales (Standard y Extendido). La guía `.md` queda como fuente canónica de estructura + marca.

---

## 1 · Marca emisora (única, no negociable)

| Campo | Valor |
|---|---|
| Emisor | **OFERTA TERRENOS · Valuation** |
| Tagline | "Informe de Valor Comercial · Estándar IVS 2022" |
| Disclaimer | "No constituye oferta, tasación bancaria certificada ni recomendación de inversión." |
| Footer línea 2 | `OFERTA TERRENOS · ofertaterrenos.com · Folio <YYYY-MM-DD-PREDIO-Vn>` |
| Sello | "IVS 2022 · BOV" en portada (esquina sup. derecha) |
| QR | `/tasacion/v/<folio>` (validador público) |

**Prohibido:** cualquier mención a Adelphos, Field-Findr (en informes externos), o marcas de terceros como emisor.

---

## 2 · Identidad visual (blanco + verdes)

| Token | HEX | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | Fondo de página |
| `bg-soft` | `#F4F8F5` | Bandas, paneles, tablas alternadas |
| `ink` | `#0B1F17` | Texto principal y títulos |
| `ink-soft` | `#3E5B4F` | Texto secundario, captions |
| `line` | `#D6E4DB` | Bordes finos, separadores |
| `green-deep` | `#0E5A3A` | Verde institucional (banda superior, KPIs hero, polígono) |
| `green-mid` | `#1F8A5B` | Acento principal, sello IVS, links |
| `green-soft` | `#C7E8D5` | Highlights de fila, badges |
| `accent-warn` | `#B5894A` | Solo para "rango de confianza" y vigencia |

**Tipografía:** Helvetica/Inter (títulos bold), Helvetica (cuerpo), Courier (fórmulas e inputs). 22pt portada · 13pt H1 sección · 10pt cuerpo · 7pt footer.
**Banda superior:** 6pt sólida en `green-deep` con wordmark blanco "OFERTA TERRENOS · VALUATION" a la izquierda y folio a la derecha, en **todas las páginas**.
**Polígono satelital:** trazo `green-deep` 2.5pt, relleno `green-mid` α0.25, vértices etiquetados P1–P4 en cápsula blanca.

---

## 3 · Dos variantes oficiales

### A. Standard (10–11 páginas) — default
1. Portada (hero satelital + FMV + rango + 4 KPIs + opinión 8 líneas + folio + QR + sello IVS)
2. Resumen ejecutivo
3. Justificación del valor (triangulación 5 métodos)
4–5. Detalle de los 5 métodos (fórmula, inputs, fuente, peso)
6. Predio en contexto (polígono real KMZ, vértices WGS84, datos SII)
7–9. Escenarios H&BU A/B/C (render polígono + layout, CAPEX, valor desarrollado)
10. Supuestos y trazabilidad
11. Comparativo H&BU + verificación pública (hash SHA-256 + QR)

### B. Extendido (15+ páginas) — predios premium / mandato institucional
Standard + bloques adicionales:
- **12. Análisis de mercado regional** (oferta/demanda, absorción, tendencia UF/m² 24m, gráfico)
- **13. Comparables ampliados** (mínimo 8 comparables con tabla extendida, mapa de ubicación, foto)
- **14. Due diligence técnica preliminar** (uso de suelo, restricciones, servidumbres, riesgos SAG/conaf, factibilidades)
- **15. Sensibilidad y escenarios financieros** (tornado chart sobre FMV: ±cap rate, ±UF/m², ±CAPEX)
- **16. Anexo cartográfico** (vista regional, vista comunal, vista predial, plano vértices)

Ambas variantes comparten misma portada, misma paleta, mismo footer, mismo validador.

---

## 4 · Actualización del documento guía

Reescribir `docs/GUIA_TASACION_PROFESIONAL.md` (v2.0) con:
- §1 Propósito · §2 Regla de oro (sin cambios)
- **§3 Marca emisora (NUEVO)** — tabla de marca, prohibiciones, ejemplos correctos/incorrectos de header y footer
- **§4 Identidad visual (REEMPLAZA paleta dark)** — tabla de tokens blanco+verdes, tipografía, banda, polígono
- §5 Estructura Standard (10–11 pág)
- **§6 Estructura Extendido (NUEVO)** — qué se agrega, cuándo usar
- §7 Los 5 métodos · §8 Comparables · §9 Pipeline · §10 Validador de coherencia (agregar grep para "adelphos" → debe ser 0) · §11 Lenguaje · §12 Checklist · §13 Versionado · §14 Implementación de referencia (apuntar a nuevo `build_v18.py`)

Actualizar también memoria core: cambiar "Generador canónico: build_v11.py" → `build_v18.py`, y registrar en `mem://design/tasacion-brand-identity` la paleta blanco+verdes.

---

## 5 · Regenerar la tasación de Teno bajo el nuevo estándar

- Clonar `build_v17.py` → `build_v18.py`
- Aplicar paleta blanco+verdes, banda superior `green-deep`, eliminar todo string "Adelphos" / dark premium
- Mantener polígono KMZ real (4 vértices ya extraídos), galería con las 2 capturas Google Earth + Mapbox satelital
- Generar **dos** outputs:
  - `/mnt/documents/Tasacion_Teno_16052026_v18_standard.pdf` (10–11 pág)
  - `/mnt/documents/Tasacion_Teno_16052026_v18_extendido.pdf` (15+ pág)
- QA: `pdftoppm` página a página + grep prohibidos (`adelphos|asking|strong buy|spread|upside|ROI`) = 0

---

## 6 · Entregables

1. `docs/GUIA_TASACION_PROFESIONAL.md` v2.0 (fuente canónica única)
2. `mem://design/tasacion-brand-identity` (nueva memoria)
3. Actualización en `mem://index.md` core (build_v18 + paleta)
4. `Tasacion_Teno_16052026_v18_standard.pdf`
5. `Tasacion_Teno_16052026_v18_extendido.pdf`
6. Eliminar v15, v16, v17 de `/mnt/documents/` para evitar confusión de marca
