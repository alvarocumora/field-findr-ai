# Formato único de informes y tasaciones — Oferta Terrenos

Todos los entregables PDF (tasaciones, peritajes, informes de mercado, dossiers
financieros y fichas ejecutivas) se generan con el shell canónico
`scripts/reports/ot_report_shell.py`. No se crean layouts ad-hoc por documento.

## Identidad

- Paleta: blanco + verde bosque `#164E34`, acento esmeralda `#22C55E`, cian `#0EA5E9`, ámbar `#B45309` sólo para advertencias.
- Wordmark **OFERTA TERRENOS** con marca vectorial de deslinde (portada en blanco, interiores en color).
- Tipografía DejaVu Sans (Unicode completo: tildes, ñ, m², °).
- Sin emojis, sin degradados, sin adornos. Tono editorial y comercial.
- Marca emisora en tasaciones: **OFERTA TERRENOS · Valuation**.

## Estructura obligatoria

1. **Portada**: banda verde con textura de deslindes, tipo de documento, título, subtítulo, folio, confidencialidad, ficha de emisión (fecha / preparado para / emitido por / folio), resumen y hasta 3 destacados; pie con QR de verificación.
2. **Interiores**: cabecera con wordmark + sección actual, regla fina; pie con folio · fecha, dominio centrado y `Página N`.
3. **Cierre**: bloque de firma con QR y banda verde de aviso legal.

## Bloques disponibles

| Método | Uso |
|---|---|
| `cover(summary, highlights)` | Portada |
| `section(title, kicker)` / `subsection(title)` | Jerarquía |
| `p(text)` / `bullets([...])` | Texto corrido y listas |
| `kpis([(label, value, note)], cols)` | Tarjetas de indicadores |
| `table(headers, rows, widths, align)` | Tablas con cabecera verde y zebra |
| `callout(title, text, kind)` | `info` / `ok` / `warn` / `brand` |
| `keyvalues([(k, v)])` | Ficha de datos en dos columnas |
| `image(path, height, caption)` | Mapas, planos, fotos |
| `signature(name, role, extra)` / `closing(text)` | Cierre legal |
| `page_break()` | Salto manual |

Helpers: `clp(1146000000) -> "$ 1.146.000.000"`, `num(6.2, 1) -> "6,2"`.

## Cómo generar un documento

```bash
cd scripts/reports && python3 build_demo_informe.py
```

`build_demo_informe.py` es el documento de referencia (`/mnt/documents/OT_Formato_Informes_Tasaciones.pdf`)
y sirve de plantilla: se copia, se cambia el `DocMeta` y el contenido.

## QA obligatorio

Antes de entregar: `pdftoppm -jpeg -r 110 salida.pdf /tmp/qa/p` y revisar **todas**
las páginas (texto cortado, tablas desalineadas, QR legible, huérfanas).

## Equivalente en la app

El mismo lenguaje visual está implementado en TypeScript para las fichas que se
descargan desde la web: `src/lib/pdf/fichaShell.ts` + `fichaTheme.ts` (branding
editable en `/admin/branding-fichas`). Cualquier cambio de marca debe aplicarse
en ambos lados.
