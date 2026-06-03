## Objetivo

Reemplazar el actual bloque "Due Diligence" (7 items legales chilenos) en la landing de Forestal Valle Escondido con el **checklist LUC Financing completo** del Excel adjunto (42 items en 9 categorías), y entregar **un PDF descargable pre-generado por cada item del checklist**, accesible públicamente desde la landing.

## Entregables

1. **Nuevo data set tipado** `src/pages/forestal/data/dueDiligenceLUC.ts` con los 42 items extraídos del Excel: `id`, `numero`, `nivel` (1 / 2 / sección), `categoria`, `titulo`, `descripcion`, `estado`, `pdfUrl`.
2. **42 PDFs pre-generados** subidos al storage público, uno por item. Cada PDF tendrá:
   - Marca **OFERTA TERRENOS · LUC Financing Due Diligence**
   - Header: número + categoría + nivel
   - Cuerpo: descripción completa del requerimiento (texto íntegro del Excel)
   - Footer: cliente (Forestal Valle Escondida SpA), fecha, clasificación confidencial, contacto IR
   - Paleta blanco + verdes (consistente con tasaciones y la landing FVE)
3. **Sección rediseñada** `FveDueDiligence.tsx`:
   - Header navega "06 · Due Diligence Package · LUC Financing"
   - Resumen ejecutivo (9 categorías como pills, % de completitud, contador 42 documentos)
   - **Acordeón por categoría** (Corporativa, Histórico Financiero, Uso de Fondos, Cronograma, Viabilidad, Modelo Financiero, Tracción Comercial, Estructura Financiación, Holding)
   - Cada item como fila con: número, badge de nivel (1 principal / 2 sub), título, descripción truncada, **botón "Descargar PDF"** + botón "Solicitar documento real" (mantiene `DocRequestModal` existente para el archivo confidencial real).
4. **Mantener** los 7 antecedentes legales chilenos (SAG, MINVU, CBR, SII, servidumbre, CGE, DGA) como **bloque complementario** "Antecedentes Legales Chile" dentro de la sección Viabilidad (item #25 Licencias y Permisos), no se pierden.

## Arquitectura técnica

```text
src/pages/forestal/
├── data/
│   ├── dueDiligence.ts          (legacy, se mantiene para subset chileno)
│   └── dueDiligenceLUC.ts       (NEW — 42 items + categorías)
└── sections/
    ├── FveDueDiligence.tsx      (rewrite — acordeón + descargas)
    └── DocRequestModal.tsx      (sin cambios)

scripts/
└── generateLucDDPdfs.ts          (NEW — script Node/Python para emitir 42 PDFs)

public/dd-luc/                    (NEW — 42 PDFs estáticos servidos por Vite)
├── 01-business-plan.pdf
├── 02-web.pdf
├── ...
└── 42-balance-matriz.pdf
```

### Generación de PDFs
- Script standalone (`/tmp/gen_luc_dd.py` con reportlab) que lee `dueDiligenceLUC.ts` (o el Excel original) y emite 42 PDFs con la misma identidad visual que las tasaciones (blanco + verdes #1F3D2B / #C9A84C).
- Cada PDF: 2 páginas máx — portada + descripción + checklist de subitems si aplica.
- Salida copiada a `public/dd-luc/` para servir estáticamente (no requiere edge function ni storage privado).
- QA visual obligatorio: convertir cada PDF a imagen y revisar muestras antes de entregar.

### UI/UX
- Acordeón con `@/components/ui/accordion` (shadcn ya disponible).
- Badges: Nivel 1 = `bg-[hsl(var(--fve-forest))] text-white`, Nivel 2 = `border-[hsl(var(--fve-gold))]/40`.
- Indicador de completitud por categoría (X de Y documentos disponibles).
- Print-friendly: `fve-no-print` en botones.

## Fuera de alcance
- No tocar `FveHero`, `FveInversion`, ni el resto de la landing.
- No persistir en Supabase (PDFs estáticos en `public/`).
- No proteger acceso (es público según decisión).
- No traducir al inglés (mantener español del Excel).

## Próximos pasos
Tras aprobar este plan, en build mode:
1. Extraer los 42 items del Excel a TS tipado.
2. Generar los 42 PDFs con script reportlab y colocarlos en `public/dd-luc/`.
3. Reescribir `FveDueDiligence.tsx` con el acordeón.
4. QA visual de muestras de PDFs + revisión de la sección en preview.