

# Plan: Módulo de Brochure de Proyecto + Revisión UX

## Diagnóstico

### Flujo actual de creación de proyectos
El wizard de 7 pasos (CreateProjectWizard) funciona bien: datos básicos → ubicación → lotes → KMZ → imágenes → planos → resumen. Los datos se guardan en la tabla `projects` con campos como `images`, `plan_images`, `description`, `total_area`, `reservation_deposit`, coordenadas, etc.

### Lo que ve el público (ProjectDetail)
La página `/proyecto/:id` muestra 6 tabs: Mapa, Cotizador, Lotes, Info, Comparar, Reseñas. Tiene header con stats (disponibles/reservados/vendidos), rango de precios y áreas. Las cards de lotes (EnhancedLotCard) muestran precio, área, estado, precio/m² y acciones.

### Problemas detectados
1. **No existe un brochure/ficha descargable del proyecto** — solo hay PDF de cotización individual por lote
2. **No hay sección de condiciones comerciales** visibles para el público (financiamiento, pie mínimo, plazo, etc.)
3. **La tabla `projects` no tiene campos** para condiciones comerciales (pie mínimo %, plazo máximo, tasa, etc.)
4. **Las cards de lote** funcionan pero podrían incluir un mini-mapa o thumbnail del polígono

## Plan de Implementación

### 1. Migración DB: Campos de condiciones comerciales en `projects`
Agregar columnas para almacenar las condiciones de venta del proyecto:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  commercial_conditions jsonb DEFAULT '{}'::jsonb;
```
Estructura del JSON:
```json
{
  "min_down_payment_pct": 20,
  "max_term_months": 120,
  "interest_rate": 0.8,
  "payment_methods": ["transferencia", "cheque", "financiamiento"],
  "currency": "CLP",
  "includes_urbanization": true,
  "delivery_date": "2026-06-01",
  "notes": "Precio incluye IVA..."
}
```

### 2. Paso "Condiciones Comerciales" en CreateProjectWizard
Agregar un nuevo paso al wizard (entre "Lotes" y "KMZ") donde el desarrollador configura:
- Pie mínimo (%)
- Plazo máximo de financiamiento (meses)
- Tasa de interés mensual (%)
- Métodos de pago aceptados
- Si incluye urbanización
- Fecha estimada de entrega
- Notas comerciales libres

### 3. Nuevo componente: `ProjectBrochure.tsx`
Generador de brochure PDF profesional con jsPDF que incluye:
- **Página 1**: Header con nombre del proyecto, logo, ubicación con mapa estático (Mapbox Static API)
- **Página 2**: Descripción del proyecto, galería de imágenes (thumbnails), datos generales (superficie total, total lotes, disponibles)
- **Página 3**: Condiciones comerciales (tabla con pie, plazo, tasa, métodos de pago, fecha entrega)
- **Página 4**: Tabla resumen de lotes disponibles (número, área, precio, precio/m²)
- **Página 5**: Plano del proyecto (plan_images si existe)
- **Footer**: Datos de contacto del asesor, fecha de generación, disclaimer legal

### 4. Tab "Brochure" en ProjectDetail
Nueva tab en la vista pública del proyecto con:
- Preview de las condiciones comerciales (sin descargar PDF)
- Sección de condiciones de venta con iconos
- Botón "Descargar Brochure PDF" prominente
- Datos del proyecto resumidos visualmente

### 5. Mejora de cards: sección condiciones en vista pública
En la tab "Info" de ProjectDetail, agregar una sección visual de condiciones comerciales:
- Pie mínimo, plazo máximo, tasa
- Métodos de pago como badges
- Fecha de entrega estimada

## Archivos a Crear/Modificar

| Archivo | Cambio |
|---------|--------|
| **Migración SQL** | Agregar `commercial_conditions jsonb` a `projects` |
| `src/lib/brochurePdfGenerator.ts` | **Nuevo** — Generador de brochure PDF profesional |
| `src/components/projects/ProjectBrochureTab.tsx` | **Nuevo** — Tab con condiciones comerciales + botón descarga |
| `src/components/projects/CommercialConditionsForm.tsx` | **Nuevo** — Formulario de condiciones para el wizard |
| `src/components/projects/CreateProjectWizard.tsx` | Agregar paso de condiciones comerciales |
| `src/pages/ProjectDetail.tsx` | Agregar tab "Brochure" con condiciones y descarga PDF |
| `src/hooks/useProjects.ts` | Actualizar tipo Project (ya viene automático del schema) |

## Resultado Visual

```text
ProjectDetail — Tab Brochure
┌─────────────────────────────────────────────────┐
│  📋 Condiciones Comerciales                     │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Pie: 20% │ │Plazo:120m│ │Tasa:0.8% │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  Métodos: [Transferencia] [Cheque] [Financ.]    │
│  Entrega: Junio 2026                            │
│  Urbanización incluida: ✅                       │
│                                                 │
│  Notas: "Precios + IVA. Escrituración..."       │
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │  📥 Descargar Brochure PDF          │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Resumen del Proyecto                           │
│  • 45 lotes totales (38 disponibles)            │
│  • Desde $18.500.000 — $32.000.000              │
│  • 350 m² — 1.200 m²                            │
│  • Ubicación: Hualañé, O'Higgins               │
└─────────────────────────────────────────────────┘
```

