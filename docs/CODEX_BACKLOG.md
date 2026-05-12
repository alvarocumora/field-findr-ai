# Codex Backlog — OfertaTerrenos / Field Findr AI

Este backlog está diseñado para ejecutar trabajo con Codex en PRs pequeños, seguros y revisables.

## Reglas para Codex

1. Crear una rama por tarea.
2. Mantener PRs pequeños.
3. No mezclar refactor, UI, datos y auth en un solo PR.
4. Incluir QA sugerido en cada PR.
5. No afirmar que una función fue probada si no se ejecutó.
6. No modificar archivos generados de Supabase sin justificación.
7. No tocar llaves ni secretos.
8. Mantener compatibilidad con Lovable.

## Épica 1 — Orden de arquitectura

### Tarea 1.1 — Separar rutas por dominio

**Objetivo:** Extraer rutas desde `src/App.tsx` a módulos en `src/routes/`.

**Archivos esperados:**

- `src/routes/publicRoutes.tsx`
- `src/routes/buyerRoutes.tsx`
- `src/routes/agentRoutes.tsx`
- `src/routes/adminRoutes.tsx`
- `src/routes/legacyRedirects.tsx`
- `src/routes/AppRouter.tsx`

**No hacer:**

- Cambiar UI.
- Cambiar rutas existentes.
- Cambiar lógica de roles.

**QA:**

- `npm run build`
- probar rutas públicas;
- probar rutas protegidas sin sesión.

### Tarea 1.2 — Crear mapa de rutas documentado

**Objetivo:** Agregar `docs/ROUTES_MAP.md` con listado de rutas, layout, protección y rol requerido.

## Épica 2 — Visual Scenarios foundation

### Tarea 2.1 — Crear tipos de escenarios

**Objetivo:** Agregar tipos y constantes base.

**Archivos esperados:**

- `src/types/visualScenario.ts`
- `src/config/visualScenarios.ts`
- `src/lib/visualScenarios/index.ts`

**QA:**

- `npm run build`
- revisar exports.

### Tarea 2.2 — Crear mock data de escenarios

**Objetivo:** Agregar escenarios demo controlados para desarrollo.

**Archivos esperados:**

- `src/data/mockVisualScenarios.ts`

**Regla:**

Marcar todo como mock/demo. No confundir con data real.

### Tarea 2.3 — Crear `VisualScenarioViewer`

**Objetivo:** Mostrar imagen base, overlay, badges, tags y disclaimer.

**Archivos esperados:**

- `src/components/visual-scenarios/VisualScenarioViewer.tsx`
- `src/components/visual-scenarios/ScenarioStatusBadge.tsx`
- `src/components/visual-scenarios/ScenarioTypeBadge.tsx`

**QA:**

- desktop;
- mobile;
- sin overlay;
- sin imagen;
- varios escenarios.

### Tarea 2.4 — Integrar viewer en ficha de propiedad

**Objetivo:** Mostrar escenarios en `PropertyDetail` sin romper flujo actual.

**Regla:**

Si no hay escenarios, la ficha debe comportarse igual que antes.

## Épica 3 — IA trazable

### Tarea 3.1 — Definir prompt de análisis de propiedad

**Objetivo:** Crear prompt versionado para análisis IA.

**Archivos esperados:**

- `src/lib/ai/prompts/propertyAnalysisPrompt.ts`
- `docs/AI_ANALYSIS_POLICY.md`

### Tarea 3.2 — Crear UI de resultado IA

**Objetivo:** Mostrar resumen, supuestos, riesgos, evidencia faltante y próximos pasos.

**Archivos esperados:**

- `src/components/ai/PropertyAnalysisResult.tsx`

### Tarea 3.3 — Integrar botón `Analizar con IA`

**Objetivo:** Conectar el botón actual a un flujo seguro.

**Reglas:**

- loading visible;
- error visible;
- no inventar permisos;
- mostrar disclaimer.

## Épica 4 — PDF comercial

### Tarea 4.1 — Definir plantilla PDF

**Objetivo:** Crear estructura de ficha PDF.

**Archivos esperados:**

- `docs/PDF_TEMPLATE_SPEC.md`

### Tarea 4.2 — Implementar exportador PDF base

**Objetivo:** Generar ficha con datos mínimos.

**Regla:**

Debe funcionar aunque falten imágenes.

## Épica 5 — Supabase y persistencia

### Tarea 5.1 — Definir schema de escenarios

**Objetivo:** Documentar SQL/migración sugerida para `visual_scenarios`.

**Archivos esperados:**

- `docs/SUPABASE_VISUAL_SCENARIOS_SCHEMA.md`

### Tarea 5.2 — Crear hooks de escenarios

**Objetivo:** Hooks para listar escenarios por propiedad.

**Archivos esperados:**

- `src/hooks/useVisualScenarios.ts`

**Regla:**

Debe manejar loading, error y fallback.

## Épica 6 — Performance

### Tarea 6.1 — Lazy loading de módulos pesados

**Objetivo:** Revisar Mapbox, Three.js, Photo Sphere y componentes pesados.

**Resultado esperado:**

PR con imports lazy donde corresponda y sin cambiar UI.

### Tarea 6.2 — Revisar PWA cache

**Objetivo:** Evitar cache riesgoso de datos privados.

**Archivo principal:**

- `vite.config.ts`

## Épica 7 — Comercial y monetización

### Tarea 7.1 — Mejorar pricing para corredores

**Objetivo:** Convertir `/pricing` en propuesta comercial clara.

### Tarea 7.2 — Crear plan premium de escenarios

**Objetivo:** Definir límites y beneficios por plan:

- publicaciones;
- escenarios visuales;
- PDFs;
- análisis IA;
- leads;
- destacados.

## Prompts de PR sugeridos

### PR rutas

```md
@codex separar `src/App.tsx` en módulos de rutas dentro de `src/routes/`, manteniendo exactamente las rutas y protecciones actuales. No cambiar UI. Incluir QA manual y asegurar `npm run build`.
```

### PR Visual Scenarios foundation

```md
@codex crear foundation de Visual Scenarios con tipos, constantes y helpers, sin integrar aún en UI productiva. Basarse en `docs/VISUAL_SCENARIOS_SPEC.md`.
```

### PR Viewer

```md
@codex crear `VisualScenarioViewer` responsive para mostrar imagen base, overlay, tipo, estado, tags y disclaimer. Usar mock data controlada y no conectar Supabase todavía.
```
