
## Diagnóstico

La portada (y casi todo el informe v10.x) arrastra **UF 7.480** como "Valor comercial". Ese número viene del precio de oferta del listing original cargado en `buildTasacionData()` (UF priceUF = price/UF rate), no de una tasación. La página 3 nueva (Justificación) introdujo **89.420 UF** de valor de mercado y **35.000 UF** de precio de venta, dejando el resto del informe contradictorio.

Tres números viven en el documento y se contradicen entre sí:

```text
Portada / Resumen ejecutivo:   UF 7.480   ← incorrecto, hay que eliminarlo
Justificación (pág. 3):        UF 89.420  ← valor de mercado ponderado
Justificación (pág. 3):        UF 35.000  ← precio de venta directo (oferta)
Comparativo escenarios:        valores propios por escenario A/B/C
Supuestos (pág. 8):            UF 39.500 (tasa UF/CLP), CAPEX en UF/m²
```

Un informe estilo Colliers / RE/MAX Commercial exige **una sola arquitectura de valor**, declarada en portada y repetida con la misma cifra en cada página, con metodología explícita.

## Objetivo v10.4

Reescribir el PDF completo de 9 páginas con tres anclas numéricas únicas, presentes en portada, resumen ejecutivo, justificación, escenarios, comparativo y supuestos:

```text
VALOR DE MERCADO (Fair Market Value):     UF 89.420   (~CLP 3.532 MM)
PRECIO DE VENTA DIRECTO (Asking Price):   UF 35.000   (~CLP 1.383 MM)
SPREAD / MARGEN DE ENTRADA:               +155%       (ratio P/V 0,39)
```

## Cambios página por página

```text
1  PORTADA
   - KPI "Valor comercial UF 7.480" → reemplazar por bloque dual:
       · Valor de mercado:  UF 89.420
       · Precio de venta:   UF 35.000   ·  Descuento −60% vs mercado
   - Sub-bloque: Superficie 7,12 ha · Frente Ruta 5 ~440 m · Uso agroindustrial
   - Folio, QR y "tasación referencial estilo Colliers/RE/MAX" mantenidos

2  RESUMEN EJECUTIVO
   - Cambiar 4 KPIs: Valor mercado, Precio venta, Spread, CAPEX rango
   - Bullet "TESIS DE INVERSIÓN" reescrito en lenguaje de consultor:
       upside 155%, ventana Ruta 5 Sur, exit a 5–7 años a valor mercado
   - "RECOMENDACIÓN" → "BUY / STRONG BUY a precio de oferta"

3  JUSTIFICACIÓN DEL VALOR (la nueva, ya OK)
   - Mantener triangulación de 5 métodos → 89.420 UF
   - Agregar pequeña nota "Metodología alineada a IVS 2022 (International
     Valuation Standards): Sales Comparison, Income Capitalisation, Cost,
     Residual y DCF."

4  PREDIO EN CONTEXTO  (era pág. 2)
   - Sin cambios numéricos. Solo footer renumerado.

5–7  ESCENARIOS A / B / C
   - Encabezado de cada escenario gana fila "Valor estabilizado vs CAPEX":
       A Compacto:    Valor proy. 78.000 UF · CAPEX 22.000 UF · margen
       B Packing+Frío: Valor proy. 110.000 UF · CAPEX 36.000 UF · margen
       C Hub Agroind.: Valor proy. 168.000 UF · CAPEX 62.000 UF · margen
   - Pie de página de cada escenario: "Compra a 35.000 UF → ROI estimado X%"

8  SUPUESTOS Y TRAZABILIDAD
   - Añadir 4ª tabla "Anclas de valor del informe":
       Valor de mercado, Precio de venta, Spread, Método de ponderación
   - Mantener tablas CAPEX, conversión y fechas
   - Ampliar disclaimer: estándar IVS 2022, fuentes Mercado Libre / E&V /
     Vivax, no sustituye tasación bancaria certificada

9  COMPARATIVO + VERIFICACIÓN  (era 7, ahora 9)
   - Tabla resumen final: precio entrada vs valor desarrollado por escenario
   - QR y URL de validación pública intactos
```

## Narrativa "consultor experto" (tono)

Sustituir frases tipo listing ("Predio en venta a UF 7.480") por lenguaje de
*broker's opinion of value* / IVS:

- "Fair Market Value estimado en UF 89.420 según triangulación de 5 métodos."
- "Asking price actual de UF 35.000 implica un descuento del 60% sobre FMV,
  justificado por liquidez del vendedor, venta directa sin corretaje y
  ausencia de habilitación previa."
- "Recomendación del tasador: posición de entrada con margen de seguridad
  suficiente para absorber CAPEX de desarrollo en cualquiera de los tres
  escenarios analizados."

## Cómo lo implemento

1. Regenerar `/tmp/teno_v10/gen.py` (perdido por reset de /tmp) reconstruyendo
   las 9 páginas con un único bloque `ANCHORS = { fmv_uf: 89420, ask_uf: 35000,
   spread_pct: 155, … }` y propagarlo a portada, resumen, escenarios y supuestos.
2. La página 3 "Justificación" se genera en el mismo script (no como insert
   posterior) para que no haya desincronización.
3. Output: `/mnt/documents/Tasacion_Teno_16052026_v10.4_coherente.pdf`.
4. QA obligatorio: renderizar las 9 páginas a JPG, verificar que **el string
   "7.480" no aparece en ninguna página** y que "89.420" y "35.000" aparecen
   en portada + resumen + justificación + supuestos + comparativo.

## Riesgo abierto

El KMZ y el polígono real no cambian. Lo que cambia es la **arquitectura de
valor**, no la geometría. Las imágenes satelitales y overlays de packing se
mantienen idénticos.

¿Apruebas v10.4 con estas 3 anclas (FMV 89.420 / Ask 35.000 / Spread 155 %)
y la regeneración completa de las 9 páginas en lugar de parches?
