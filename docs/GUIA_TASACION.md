# Guía de Generación de Tasaciones — ofertaterrenos.com

> Documento canónico para construir, mantener y auditar el módulo de **Tasación Comercial de Predios** dentro del ecosistema Field-Findr AI / ofertaterrenos.com.
> Aplica a cualquier propiedad publicada en la plataforma (no solo Teno).

---

## 1. Propósito

Estandarizar la **generación automática de informes de tasación comercial referencial** para predios urbanos, agrícolas, industriales y mixtos, asegurando:

1. **Cumplimiento normativo** con la práctica chilena vigente (SII, CBR, LGUC, OGUC, PRC, Ley 18.046, Circular SBIF/CMF 3.503).
2. **Coherencia de marca** con el sistema de diseño de ofertaterrenos.com (gradiente Emerald → Sky, dark mode, tipografía Swiss).
3. **Reproducibilidad**: misma propiedad + misma tasa UF ⇒ mismo informe.
4. **Trazabilidad**: cada cifra debe ser explicable a partir de la ficha del listado, comparables vivos y supuestos declarados.

---

## 2. Marco normativo de referencia

| Norma / Fuente | Aplicación en el informe |
|---|---|
| **Ley General de Urbanismo y Construcciones (LGUC)** | Validar uso de suelo, zonificación y constructibilidad declarada en sección 8. |
| **Ordenanza General de Urbanismo y Construcciones (OGUC)** | Coeficientes, rasantes, distanciamientos referenciales. |
| **Plan Regulador Comunal (PRC) vigente** | Fuente primaria de zonificación; siempre indicar "verificar PRC vigente" si no hay dato confirmado. |
| **Servicio de Impuestos Internos (SII)** | Rol, avalúo fiscal, valor unitario referencial — sección 9. |
| **Conservador de Bienes Raíces (CBR)** | Inscripción de dominio, deslindes — sección 3. |
| **Banco Central de Chile — Serie UF** | Tasa de conversión UF ↔ CLP del día de tasación (vía `mindicador.cl`). |
| **Circular CMF 3.503 / Norma SBIF** | Estructura mínima del informe para uso bancario / garantía hipotecaria. |
| **NCh 3066 (referencial)** | Buenas prácticas en tasaciones de bienes raíces no urbanos. |

> **Importante:** los informes generados son **referenciales**. Para uso bancario, judicial o tributario formal, deben ser ratificados por un **tasador acreditado** (SBIF/CMF, Colegio de Arquitectos, o registro interno de la entidad).

---

## 3. Arquitectura del módulo

```text
src/
├── components/property/
│   └── TasacionTeno.tsx          ← UI: edición, presets UF, comparables vivos
├── hooks/
│   ├── useUfRate.ts              ← UF hoy + presets históricos (Banco Central)
│   └── useComparables.ts         ← Comparables vivos por región/comuna
├── lib/
│   ├── buildTasacionData.ts      ← Mapeo listing → TasacionData
│   ├── tasacionPdfGenerator.ts   ← Render PDF con jsPDF
│   └── pdfBrandHeader.ts         ← Header gradiente + footer de marca
└── pages/
    └── PropertyDetail.tsx        ← Punto de entrada (botón "Generar tasación")
```

**Flujo de datos:**

```text
listing (Supabase)
   │
   ├─► buildTasacionData(listing, ufRate)  ───► TasacionData (defaults inferidos)
   │
   ├─► useUfRate()                          ───► presets UF (hoy + 1, 2, 3 años)
   │
   ├─► useComparables(listing, ufRate)      ───► comparables vivos ponderados
   │
   ▼
TasacionTeno (form editable)
   │
   ▼
generateTasacionPdf(data)  ───► PDF descargable (Tasacion_<comuna>_<fecha>.pdf)
```

---

## 4. Estructura obligatoria del informe (12 secciones)

Toda tasación generada **debe** contener, en este orden, las 12 secciones definidas en `tasacionPdfGenerator.ts`:

| # | Sección | Fuente de datos | Editable por usuario |
|---|---|---|---|
| **Portada** | Inmueble, rol, superficie, solicitante, tasador, fecha + **Valor Comercial Estimado** (banda emerald) | `buildTasacionData` | Sí |
| 1 | Antecedentes generales | Fecha, solicitante, tasador, propósito | Sí |
| 2 | Identificación del inmueble | Propietario, dirección, comuna/región, rol SII, CBR, coordenadas | Sí (rol/CBR opcional) |
| 3 | Deslindes (N/S/O/P) | CBR / plano | Sí |
| 4 | Superficies (terreno + construida) | `area_m2` o `area_ha × 10000` | Sí |
| 5 | Descripción del sector + accesos + equipamiento | `description`, `utilities.road_access` | Sí |
| 6 | Características del terreno (topografía, forma, suelo, frente) | `tags`, inferencia | Sí |
| 7 | Servicios básicos (agua, luz, alcantarillado, gas, telecom, pavimento) | `utilities` JSONB | Sí (checkboxes) |
| 8 | Normativa y zonificación (PRC, uso de suelo, constructibilidad) | `zoning` | Sí |
| 9 | Avalúo fiscal SII (terreno, construcción, total, valor unitario) | Inferido o manual | Sí |
| 10 | Análisis comparativo de mercado | `useComparables` (live) + `MARKET_REFS` | Sí |
| 11 | Metodología | Texto fijo (Método Comparativo de Mercado) | No |
| 12 | Conclusión — Valor comercial final (banda emerald) | UF + CLP + UF/m² | Calculado |

---

## 5. Reglas de cálculo

### 5.1 Conversión UF ↔ CLP

- Fuente primaria: `useUfRate()` → `mindicador.cl/api/uf` (cache 1h hoy, 30d histórico).
- Fallback estático en `useUfRate.ts` si la API falla.
- El usuario puede sobrescribir manualmente la tasa antes de generar el PDF.
- **Regla de oro:** la tasa usada en el PDF debe coincidir con el campo `fecha` del informe.

### 5.2 Valor comercial

```text
priceUF        = listing.currency === 'UF'
                   ? listing.price
                   : round(listing.price / ufRate)
valorM2UF      = priceUF / areaM2          (3 decimales)
valorComercialCLP = priceUF × ufRate
valorM2CLP     = round(valorM2UF × ufRate)
```

### 5.3 Avalúo fiscal SII (estimación)

```text
valorUnitarioSII = max(1500, round(valorM2UF × ufRate × 0.18))
avaluoTerreno    = valorUnitarioSII × areaM2
```
> El factor 0.18 representa la relación promedio histórica avalúo fiscal ÷ valor comercial en predios rurales/industriales chilenos. Verificar con SII real cuando esté disponible (`sii-lookup` edge function).

### 5.4 Comparables ponderados (`useComparables.ts`)

| Variable | Peso | Fórmula |
|---|---|---|
| Coincidencia de tipo | 1.00 (igual) / 0.55 (distinto) | discreto |
| Similitud de área | 0.40 – 1.00 | `1 − min(0.6, |Δarea|/areaSubject)` |
| Decaimiento por distancia | (0, 1] | `1 / (1 + km/50)` |
| **Score final** | producto de los tres | filtro outlier UF/m² ∈ [0.05, 50] |

Se devuelven los **top 8** ordenados por score. Los comparables sintéticos (`inferComparables`) y `MARKET_REFS` (Curicó/Ruta 5) se usan solo como fallback cuando no hay listings vivos suficientes.

---

## 6. Sistema de diseño aplicado

### 6.1 Paleta (PDF + UI)

| Token | HSL / Hex | Uso |
|---|---|---|
| Emerald | `#22C55E` (34, 197, 94) | Inicio gradiente, banda valor comercial, status "Available" |
| Sky | `#0EA5E9` (14, 165, 233) | Fin gradiente header |
| Slate-900 | `#0F172A` | Títulos de sección (fondo barra) |
| Slate-100 | `#F1F5F9` | Header tabla comparables |
| Amber | `#F59E0B` | Status "Reserved" / advertencias |
| Slate-500 | `#94A3B8` | Status "Sold" / texto secundario |

> **Nunca** usar colores hardcoded en componentes React. Usar siempre tokens semánticos de `index.css`. En el PDF (jsPDF) sí se usan los RGB literales declarados arriba.

### 6.2 Tipografía

- PDF: `helvetica` (bundled jsPDF) — bold para etiquetas, normal para valores.
- UI: Inter / system stack vía Tailwind (`font-sans`).
- Tamaños PDF: 20pt portada, 16pt valor final, 11pt títulos sección, 10pt cuerpo, 9pt notas.

### 6.3 Header & Footer

- **Header:** gradiente Emerald → Sky en 20 pasos (`drawPdfHeaderLogo`), logo "OFERTA TERRENOS" en blanco.
- **Footer:** texto `ofertaterrenos.com` gris claro (`drawPdfFooter`), opcional texto a la derecha (página, fecha).
- Aplicar en **cada página** vía `ensureSpace()` que hace `addPage()` + `drawPdfFooter()`.

### 6.4 Bandas de valor

Las dos bandas verdes (portada y conclusión) son el **único elemento visual de alta saturación** del informe. Mantener:

- Color: Emerald `#22C55E` puro.
- Texto en blanco, bold.
- Altura: 22-26mm.
- Centrado en portada, alineado a margen en conclusión.

---

## 7. Edición previa al PDF

El componente `TasacionTeno.tsx` **debe** permitir al usuario:

1. Ajustar la **tasa UF** (preset hoy / 1, 2, 3 años atrás / manual).
2. Editar **cualquier campo** de las 12 secciones (overrides persistidos en estado local).
3. Marcar/desmarcar **servicios básicos** (checkboxes).
4. Ver y aceptar/rechazar **comparables vivos** (con peso visible y supuestos).
5. Previsualizar el **valor comercial** recalculado en tiempo real.

> Si el usuario no edita un campo, se usa el valor inferido por `buildTasacionData`.

---

## 8. Validaciones obligatorias antes de exportar

| Check | Acción si falla |
|---|---|
| `superficieTerreno > 0` | Bloquear exportación, mostrar toast |
| `valorComercialUF > 0` | Bloquear exportación |
| `ufRate ∈ [30000, 60000]` | Warning, permitir continuar |
| `comuna && region` presentes | Warning |
| Rol SII con formato `XXXX-YY` | Warning ("verificar en SII") |
| Coordenadas válidas | Solo informativo |

---

## 9. Naming y entrega

- Nombre archivo: `Tasacion_<Comuna>_<DDMMYYYY>.pdf` (sin acentos, sin espacios).
- Disparo de descarga vía `doc.save()` de jsPDF.
- Registrar evento `tasacion_generated` con `useTrackEvent` (listing_id, ufRate, valorUF).

---

## 10. Roadmap

- [ ] Integración real con `sii-lookup` para avalúo fiscal exacto.
- [ ] Firma digital del tasador (canvas) en sección 12.
- [ ] Versión bilingüe (ES/EN) para inversionistas LATAM.
- [ ] Almacenamiento del PDF en Supabase Storage + link compartible.
- [ ] Comparables enriquecidos con `price_history` (tendencia 12m).
- [ ] Plantilla específica para uso bancario (cumplimiento CMF 3.503 estricto).

---

## 11. Disclaimer obligatorio

Todo informe **debe** incluir, en `observaciones` (sección 12):

> *"Tasación comercial referencial generada automáticamente por Field-Findr AI a partir de antecedentes públicos, ficha del listado y comparables de mercado vigentes. No constituye tasación oficial para fines bancarios, judiciales ni tributarios. Para esos usos se requiere ratificación por tasador acreditado ante CMF / Colegio de Arquitectos de Chile."*

---

**Mantenido por:** equipo Field-Findr AI · ofertaterrenos.com
**Última revisión:** mayo 2026
