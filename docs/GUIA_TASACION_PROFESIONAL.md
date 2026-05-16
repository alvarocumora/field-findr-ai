# Guía Maestra · Tasación Profesional Comercial (estándar Field-Findr AI · IVS 2022)

> Documento canónico para la generación de tasaciones comerciales tipo Colliers / JLL / Tinsa.
> Toda tasación publicada por OFERTA TERRENOS o Field-Findr AI **debe seguir esta guía**.
> Última revisión: 16-may-2026 · Versión 1.0

---

## 1. Propósito y alcance

La tasación comercial es una **Broker's Opinion of Value (BOV)** que estima el **Valor Comercial / Fair Market Value (FMV)** de un activo bajo el estándar IVS 2022 e inspirada en RICS Red Book 2024.

**No es** una tasación bancaria certificada, ni una oferta de compra/venta, ni una recomendación de inversión.
**Sí es** un dictamen técnico trazable, defendible ante un comité, que un comprador o vendedor profesional puede usar como referencia.

---

## 2. Regla de oro · Anclas únicas

| Permitido | Prohibido |
|---|---|
| Valor Comercial (FMV) | Asking Price / precio pedido |
| Rango de confianza ±5% | Spread, Upside, Descuento |
| UF/m² unitario | Ratio Precio/Valor |
| Valor desarrollado H&BU | ROI, Compra + CAPEX |
| Conclusión de valor | Recomendación "BUY / Strong Buy" |

El precio de transacción **se determina entre las partes** y queda fuera del informe.

---

## 3. Estructura obligatoria (9–11 páginas)

| Pág | Sección | Contenido mínimo |
|----|---------|------------------|
| 1 | **Portada épica** | Imagen satélite hero · Nombre predio · FMV único (UF) · Rango ±5% · Sello "IVS 2022" · 4 KPIs (superficie, frente, uso, UF/m²) · Opinión del tasador (8 líneas) · Folio · QR |
| 2 | **Resumen ejecutivo** | 4 KPIs hero · 4 KPIs secundarios · Tabla síntesis 5 métodos con peso · Atributos que sostienen el valor (6–8 bullets) · Conclusión de valor (sin recomendación) |
| 3 | **Justificación del valor** | A) Triangulación 5 métodos con parámetro/UF-m²/valor/peso · B) Convergencia y dispersión vs FMV · C) Atributos cualitativos |
| 4–5 | **Desglose de los 5 métodos** | Por método: fórmula, tabla de inputs, fuente, peso. Ponderación final → FMV |
| 6 | **Predio en contexto** | Vista satelital con polígono (Mapbox) · Tabla vértices WGS84 · Contexto regional · Datos SII (rol, avalúo, destino) |
| 7–9 | **Escenarios H&BU** | Por escenario (A/B/C): render polígono con layout · Componentes (m²) · CAPEX referencial · Valor desarrollado estimado · Ocupación. **Recordatorio: el informe no fija precio de transacción.** |
| 10 | **Supuestos y trazabilidad** | A) Anclas de valor · B) CAPEX y costos unitarios · C) Conversión de unidades y fechas · D) Alcance y limitaciones |
| 11 | **Comparativo H&BU + verificación pública** | Tabla escenarios vs suelo as-is · Lectura técnica · QR + URL `/tasacion/validar` · Hash SHA-256 |

---

## 4. Los 5 métodos de valuación (estándar)

| # | Método | Peso típico | Fórmula |
|---|--------|-------------|---------|
| 1 | Sales Comparison A (premium) | 25% | `V = Sup × UF/m²_comp × Factor_ajuste` |
| 2 | Sales Comparison B (secundario) | 20% | `V = Sup × UF/m²_comp × Factor_ajuste` |
| 3 | Income Capitalisation | 20% | `V = NOI_estabilizado / Cap_rate` |
| 4 | Cost Approach | 15% | `V = Sup × Pu_suelo + Habilitación + Accesos` |
| 5 | Residual Method | 20% | `V_suelo = (V_proyecto − CAPEX − Soft − Margen) × Opcionalidad` |

**Reconciliación IVS:** ajuste final ≤±5% para converger a la ancla. Documentar dispersión.

**Cada método requiere:** fórmula visible, tabla de inputs (label / cálculo / resultado), fuente con link cuando exista, fecha de la fuente.

---

## 5. Comparables (mínimo 4)

Por comparable: **dirección o zona · superficie · precio UF · UF/m² · fuente · link · fecha de captura**.

Fuentes válidas: Mercado Libre, Engel & Volkers Commercial, Vivax Corredores, Portal Inmobiliario, Colliers, CBRE, JLL, RE/MAX Commercial, brokers locales registrados.

No usar listados de WhatsApp ni rumores. Si no hay link público, archivar screenshot en `/docs/comparables/<folio>/`.

---

## 6. Estética visual (no negociable)

- **Paleta:** dark premium · BG `#0B0F14` · FG `#F5F1E8` · Gold `#B5894A` · Emerald `#10B981` · Amber `#F59E0B` · Panel `#11161D` · Line `#1F2630`
- **Tipografía:** Helvetica-Bold (títulos), Helvetica (cuerpo), Courier (fórmulas e inputs numéricos). Tamaños: 22pt título, 11pt sección, 8-9pt cuerpo, 7pt footer.
- **Banda dorada superior** de 6pt en todas las páginas.
- **Footer 3 líneas** con: fuentes · OFERTA TERRENOS · folio + paginador `N de TOTAL`.
- **Polígonos:** siempre normalizados vía `src/lib/polygonUtils.ts → normalizePolygon`.
- **Imagen satelital:** Mapbox Satellite a Z18, con polígono dorado de 4 vértices visibles (P1–P4).
- **QR:** apuntar a `/tasacion/v/:id` (ver `mem://features/tasacion-qr-validator-blockchain`).

---

## 7. Pipeline técnico

```
v_base = build_methods_pages(data)      # reportlab → 2 páginas detalle métodos
v_visual = build_scenarios_pages(data)   # mapbox + threebox → páginas 7-9 satelitales
v_final = merge_pages([cover, exec, justif, methods_A, methods_B,
                       context, esc_A, esc_B, esc_C, supuestos, comparativo])
```

**Stack obligatorio:**
- `reportlab` para páginas vectoriales (cover, exec, justif, métodos, supuestos, comparativo)
- `pypdf` para merge/overlay sobre páginas con bitmaps (escenarios con satélite)
- `pdftoppm -jpeg -r 150` para QA

---

## 8. Validador de coherencia (obligatorio antes de publicar)

```bash
pdftotext informe.pdf - | grep -Eic "(asking|strong buy|spread|upside|ROI|oportunidad de compra|recomendacion de compra)"
# Debe ser 0. Si > 0, NO publicar.
```

Adicional: verificar que el **FMV aparece** en portada, resumen, justificación, supuestos y comparativo (consistencia de 5 menciones mínimo).

---

## 9. Lenguaje permitido / prohibido

| ✅ Permitido | ❌ Prohibido |
|--------------|--------------|
| "se concluye", "se estima", "se pondera" | "oportunidad", "ganga", "regalado" |
| "valor comercial", "fair market value" | "asking price", "precio de oferta" |
| "rango de confianza", "dispersión" | "spread", "upside", "descuento" |
| "valor desarrollado H&BU" | "ROI", "rentabilidad esperada" |
| "conclusión de valor" | "BUY", "STRONG BUY", "recomendación de compra" |
| "el informe no determina precio de transacción" | "te conviene comprar a X" |

---

## 10. Checklist final (10 ítems · marcar antes de exportar)

- [ ] Portada tiene 1 sola ancla de valor (FMV + rango), sin asking
- [ ] 5 métodos detallados con fórmula, inputs, fuente y peso visibles
- [ ] Mínimo 4 comparables con link y fecha
- [ ] Polígono real KMZ con vértices WGS84 documentados
- [ ] Imagen satelital nítida con polígono dorado superpuesto
- [ ] QR funcional a `/tasacion/v/:folio`
- [ ] Footer numerado `N de TOTAL` en todas las páginas
- [ ] Validador grep retorna 0 matches en términos prohibidos
- [ ] FMV mencionado consistentemente en ≥5 páginas
- [ ] Disclaimer IVS 2022 + "no constituye oferta" presente en portada y supuestos

---

## 11. Versionado y folio

**Convención de nombre:** `Tasacion_<Predio>_<DDMMYYYY>_v<N>_<descriptor>.pdf`

Ejemplo: `Tasacion_Teno_16052026_v11_comercial.pdf`

**Folio:** `YYYY-MM-DD-<PREDIO>-V<N>` · debe coincidir exactamente entre portada, footer y QR.

**Vigencia:** 90 días (variabilidad UF y mercado).

---

## 12. Implementación de referencia

- Generador canónico: `/tmp/build_v11.py` (Teno, mayo 2026)
- Output canónico: `/mnt/documents/Tasacion_Teno_16052026_v11_comercial.pdf`
- Esta guía: `docs/GUIA_TASACION_PROFESIONAL.md`
- Guía visual hero cinemático complementaria: `docs/GUIA_HERO_CINEMATICO.md`

Cualquier nueva tasación debe partir clonando `build_v11.py`, sustituyendo el bloque `ANCHORS` (FMV, rango, UF/m², superficie, frente) y la lista `METHODS` con los datos del nuevo predio.
