# Guía Maestra · Tasación Profesional Comercial

> **Estándar único OFERTA TERRENOS · Valuation** alineado a IVS 2022.
> Toda tasación emitida por la plataforma **debe seguir esta guía**.
> Versión 2.0 · Revisión: 17-may-2026.

---

## 1. Propósito y alcance

La tasación comercial es una **Broker's Opinion of Value (BOV)** que estima el **Valor Comercial / Fair Market Value (FMV)** de un activo bajo el estándar **IVS 2022** e inspirada en **RICS Red Book 2024**.

- **No es** una tasación bancaria certificada, ni una oferta de compra/venta, ni una recomendación de inversión.
- **Sí es** un dictamen técnico trazable, defendible ante un comité, que un comprador o vendedor profesional puede usar como referencia.

---

## 2. Regla de oro · Anclas únicas

| ✅ Permitido | ❌ Prohibido |
|---|---|
| Valor Comercial (FMV) | Asking Price / precio pedido |
| Rango de confianza ±5% | Spread, Upside, Descuento |
| UF/m² unitario | Ratio Precio/Valor |
| Valor desarrollado H&BU | ROI, Compra + CAPEX |
| Conclusión de valor | Recomendación "BUY / Strong Buy" |

El precio de transacción **se determina entre las partes** y queda fuera del informe.

---

## 3. Marca emisora (única, no negociable)

| Campo | Valor |
|---|---|
| **Emisor** | **OFERTA TERRENOS · Valuation** |
| **Tagline** | "Informe de Valor Comercial · Estándar IVS 2022" |
| **Disclaimer** | "No constituye oferta, tasación bancaria certificada ni recomendación de inversión." |
| **Header (banda superior)** | `OFERTA TERRENOS · VALUATION` (izq) · folio (der) |
| **Footer línea 1** | Fuentes/citas resumidas |
| **Footer línea 2** | `OFERTA TERRENOS · ofertaterrenos.com · Folio <YYYY-MM-DD-PREDIO-Vn>` |
| **Footer línea 3** | `Página N de TOTAL · Vigencia 90 días` |
| **Sello portada** | "IVS 2022 · BOV" — esquina sup. derecha en cápsula verde |
| **QR** | `https://ofertaterrenos.com/tasacion/v/<folio>` |

### Marcas prohibidas como emisor

- ❌ **Adelphos** (otra empresa, jamás debe aparecer)
- ❌ **Field-Findr AI** (marca SaaS interna, no se usa en informes que ven clientes)
- ❌ Cualquier broker o consultora de terceros como emisor

El validador de coherencia (§10) **debe** retornar 0 matches para estas marcas.

---

## 4. Identidad visual (blanco + verdes)

### Paleta única

| Token | HEX | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | Fondo de página |
| `bg-soft` | `#F4F8F5` | Bandas, paneles, filas alternadas |
| `ink` | `#0B1F17` | Texto principal y títulos |
| `ink-soft` | `#3E5B4F` | Texto secundario, captions, footers |
| `line` | `#D6E4DB` | Bordes finos, separadores, rejillas de tabla |
| `green-deep` | `#0E5A3A` | Verde institucional (banda superior, KPIs hero, polígono, wordmark) |
| `green-mid` | `#1F8A5B` | Acento principal, sello IVS, links, badges activos |
| `green-soft` | `#C7E8D5` | Highlights de fila, fondo de badges |
| `accent-warn` | `#B5894A` | **Solo** para "rango de confianza" y vigencia |

> No se introducen colores adicionales. Cualquier estado (riesgo, sensibilidad) se expresa en escala de verdes + `ink-soft`.

### Tipografía

- **Helvetica/Inter Bold** — títulos y FMV hero
- **Helvetica** — cuerpo de texto y tablas
- **Courier** — fórmulas, inputs numéricos y hashes

Tamaños: **24pt** portada FMV · **22pt** título portada · **13pt** H1 sección · **10pt** cuerpo · **8pt** caption · **7pt** footer.

### Elementos visuales obligatorios

- **Banda superior 8pt** sólida en `green-deep` con wordmark blanco a la izquierda y folio a la derecha — en **todas** las páginas.
- **Polígono satelital:** trazo `green-deep` 2.5pt, relleno `green-mid` α0.25, vértices etiquetados P1–P4 en cápsula blanca con borde `green-deep`.
- **Imagen satelital:** Mapbox Satellite a Z18, polígono real superpuesto desde KMZ.
- **QR:** apuntar a `/tasacion/v/<folio>` (ver `mem://features/tasacion-qr-validator-blockchain`).
- **Polígonos:** siempre normalizados vía `src/lib/polygonUtils.ts → normalizePolygon`.

---

## 5. Variante A · Standard (10–11 páginas) — default

| Pág | Sección | Contenido mínimo |
|----|---------|------------------|
| 1 | **Portada** | Hero satelital con polígono · FMV único (UF) · Rango ±5% · 4 KPIs (sup., frente, uso, UF/m²) · Opinión del tasador (8 líneas) · Folio · QR · Sello IVS |
| 2 | **Resumen ejecutivo** | 4 KPIs hero · 4 KPIs secundarios · Síntesis 5 métodos con peso · 6–8 atributos de valor · Conclusión |
| 3 | **Justificación del valor** | Triangulación 5 métodos · Convergencia y dispersión vs FMV · Atributos cualitativos |
| 4–5 | **Detalle de 5 métodos** | Por método: fórmula, tabla de inputs, fuente, peso. Ponderación → FMV |
| 6 | **Predio en contexto** | Vista satelital con polígono · Tabla vértices WGS84 · Contexto regional · Datos SII |
| 7–9 | **Escenarios H&BU A/B/C** | Render polígono + layout · Componentes (m²) · CAPEX referencial · Valor desarrollado |
| 10 | **Supuestos y trazabilidad** | Anclas · CAPEX y costos unitarios · Conversión de unidades · Alcance y limitaciones |
| 11 | **Comparativo + verificación pública** | Tabla escenarios vs as-is · QR + URL `/tasacion/validar` · Hash SHA-256 |

---

## 6. Variante B · Standard Extendido (15+ páginas)

Para predios premium, mandatos institucionales o tasaciones con due diligence completa.
Incluye **todo lo de Standard** + los siguientes bloques:

| Pág | Sección | Contenido mínimo |
|----|---------|------------------|
| 12 | **Análisis de mercado regional** | Oferta/demanda, absorción, tendencia UF/m² 24 meses, gráfico de línea |
| 13 | **Comparables ampliados** | Mínimo **8 comparables** con dirección, sup., precio UF, UF/m², fuente con link, fecha, mapa de ubicación, foto miniatura |
| 14 | **Due diligence técnica preliminar** | Uso de suelo, IPT vigente, servidumbres, riesgos SAG/CONAF, factibilidades sanitaria/eléctrica/vial |
| 15 | **Sensibilidad y escenarios financieros** | Tornado chart sobre FMV: ±cap rate, ±UF/m² comp, ±CAPEX |
| 16 | **Anexo cartográfico** | Vista regional, vista comunal, vista predial Z18, plano de vértices con cotas |

Cuándo usar Extendido: predios > 5 ha, valor estimado > 10.000 UF, mandato institucional, o solicitud explícita del cliente.

---

## 7. Los 5 métodos de valuación (estándar)

| # | Método | Peso típico | Fórmula |
|---|--------|-------------|---------|
| 1 | Sales Comparison A (premium) | 25% | `V = Sup × UF/m²_comp × Factor_ajuste` |
| 2 | Sales Comparison B (secundario) | 20% | `V = Sup × UF/m²_comp × Factor_ajuste` |
| 3 | Income Capitalisation | 20% | `V = NOI_estabilizado / Cap_rate` |
| 4 | Cost Approach | 15% | `V = Sup × Pu_suelo + Habilitación + Accesos` |
| 5 | Residual Method | 20% | `V_suelo = (V_proyecto − CAPEX − Soft − Margen) × Opcionalidad` |

**Reconciliación IVS:** ajuste final ≤±5% para converger a la ancla. Documentar dispersión.
Cada método requiere: fórmula visible, tabla de inputs, fuente con link cuando exista, fecha de captura.

---

## 8. Comparables

**Standard:** mínimo 4 · **Extendido:** mínimo 8.

Por comparable: **dirección o zona · superficie · precio UF · UF/m² · fuente · link · fecha**.

Fuentes válidas: Mercado Libre, Portal Inmobiliario, Engel & Völkers Commercial, Vivax Corredores, Colliers, CBRE, JLL, RE/MAX Commercial, brokers locales registrados.

No usar listados de WhatsApp ni rumores. Si no hay link público, archivar screenshot en `/docs/comparables/<folio>/`.

---

## 9. Pipeline técnico

```python
# Generador canónico v2.0
build_cover(data)              # P1
build_executive_summary(data)  # P2
build_justification(data)      # P3
build_methods_detail(data)     # P4-5
build_context_satellite(data)  # P6 (Mapbox Static API)
build_hbu_scenarios(data)      # P7-9
build_assumptions(data)        # P10
build_validation(data)         # P11
# Si variant == "extendido":
build_market_analysis(data)    # P12
build_comparables_extended()   # P13
build_due_diligence(data)      # P14
build_sensitivity(data)        # P15
build_cartographic_annex()     # P16
merge_with_pypdf(pages)
```

**Stack obligatorio:**

- `reportlab` para páginas vectoriales
- `pypdf` para merge
- `Pillow` para composición satelital
- `qrcode` para QR del validador público
- `requests` para Mapbox Static API
- `pdftoppm -jpeg -r 150` para QA visual

---

## 10. Validador de coherencia (obligatorio antes de publicar)

```bash
pdftotext informe.pdf - | grep -Eic \
  "(adelphos|field-?findr|asking|strong buy|spread|upside|ROI|oportunidad de compra|recomendacion de compra)"
# Debe ser 0. Si > 0, NO publicar.
```

Verificaciones adicionales:

- FMV aparece en portada, resumen, justificación, supuestos y comparativo (**≥5 menciones**)
- Banda superior `green-deep` presente en todas las páginas
- Footer con folio y paginador en todas las páginas
- Wordmark **OFERTA TERRENOS · VALUATION** visible en cada página
- QR funcional con folio correcto

---

## 11. Lenguaje permitido / prohibido

| ✅ Permitido | ❌ Prohibido |
|--------------|--------------|
| "se concluye", "se estima", "se pondera" | "oportunidad", "ganga", "regalado" |
| "valor comercial", "fair market value" | "asking price", "precio de oferta" |
| "rango de confianza", "dispersión" | "spread", "upside", "descuento" |
| "valor desarrollado H&BU" | "ROI", "rentabilidad esperada" |
| "conclusión de valor" | "BUY", "STRONG BUY", "recomendación de compra" |
| "el informe no determina precio de transacción" | "te conviene comprar a X" |

---

## 12. Checklist final (12 ítems · marcar antes de exportar)

- [ ] Variante declarada (Standard o Extendido)
- [ ] Marca **OFERTA TERRENOS · Valuation** en banda superior de todas las páginas
- [ ] Sello "IVS 2022 · BOV" en portada
- [ ] Portada con 1 sola ancla de valor (FMV + rango), sin asking
- [ ] 5 métodos con fórmula, inputs, fuente y peso visibles
- [ ] Mínimo 4 comparables (Standard) o 8 (Extendido) con link y fecha
- [ ] Polígono real KMZ con vértices WGS84 documentados
- [ ] Imagen satelital nítida con polígono `green-deep` superpuesto
- [ ] QR funcional a `/tasacion/v/<folio>`
- [ ] Footer numerado `Página N de TOTAL` en todas las páginas
- [ ] Validador grep retorna **0** matches en términos prohibidos (incluye "adelphos" y "field-findr")
- [ ] Disclaimer IVS 2022 + "no constituye oferta" presente en portada y supuestos

---

## 13. Versionado y folio

**Convención de nombre:**
`Tasacion_<Predio>_<DDMMYYYY>_v<N>_<variante>.pdf`

Ejemplos:
- `Tasacion_Teno_16052026_v18_standard.pdf`
- `Tasacion_Teno_16052026_v18_extendido.pdf`

**Folio:** `YYYY-MM-DD-<PREDIO>-V<N>` — debe coincidir exactamente entre portada, footer, header y QR.

**Vigencia:** 90 días (variabilidad UF y mercado).

---

## 14. Implementación de referencia

- **Generador canónico:** `/tmp/build_v18.py` (Teno, mayo 2026, ambas variantes)
- **Outputs canónicos:**
  - `/mnt/documents/Tasacion_Teno_16052026_v18_standard.pdf`
  - `/mnt/documents/Tasacion_Teno_16052026_v18_extendido.pdf`
- **Esta guía:** `docs/GUIA_TASACION_PROFESIONAL.md`
- **Guía visual hero cinemático complementaria:** `docs/GUIA_HERO_CINEMATICO.md`

Cualquier nueva tasación debe partir clonando `build_v18.py`, sustituyendo el bloque `DATA` (predio, FMV, rango, UF/m², superficie, frente, polígono KMZ) y la lista `METHODS` con los datos del nuevo predio. La paleta, banda, marca y estructura son fijas.
