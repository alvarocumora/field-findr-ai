# Technical Roadmap — OfertaTerrenos / Field Findr AI

## 1. Estado actual

El proyecto usa Vite, React, TypeScript, Tailwind, shadcn-ui, Supabase, Mapbox, React Query, PWA, Framer Motion y múltiples módulos de dashboard.

La base es funcional, pero tiene riesgos típicos de una app generada y expandida progresivamente:

- router centralizado en `src/App.tsx`;
- TypeScript permisivo;
- ESLint todavía liviano;
- potencial bundle pesado por Mapbox, Three.js y Photo Sphere;
- documentación técnica recién iniciada;
- dependencia de Edge Functions para IA y tokens.

## 2. Arquitectura objetivo

### Rutas

Separar rutas por dominio:

- `src/routes/publicRoutes.tsx`
- `src/routes/buyerRoutes.tsx`
- `src/routes/agentRoutes.tsx`
- `src/routes/adminRoutes.tsx`
- `src/routes/legacyRedirects.tsx`
- `src/routes/AppRouter.tsx`

Objetivo: reducir riesgo al modificar navegación y facilitar revisión de permisos.

### Layouts

Mantener layouts separados:

- `PublicLayout`
- `BuyerLayout`
- `DashboardLayout`

Cada layout debe tener responsabilidad clara:

- estructura visual;
- navegación;
- protección de sesión si corresponde;
- carga de roles solo cuando sea necesario.

### Auth y roles

Mantener Supabase Auth como base.

Revisar:

- onboarding post-signup;
- asignación de rol inicial;
- redirect por rol;
- persistencia de sesión;
- RLS en Supabase;
- permisos en Edge Functions.

### Datos

Centralizar tipos y consultas.

Sugerido:

- `src/types/property.ts`
- `src/types/visualScenario.ts`
- `src/types/userRoles.ts`
- `src/lib/properties/`
- `src/lib/scenarios/`
- `src/lib/ai/`

### Visual Scenarios

Separar en módulos:

- tipos;
- constantes;
- viewer;
- builder;
- PDF exporter;
- AI analyzer;
- persistence layer.

## 3. Supabase

### Edge Functions esperadas

- `get-mapbox-token`
- `ai-natural-search`
- futura: `ai-property-analysis`
- futura: `generate-property-pdf`
- futura: `visual-scenario-analysis`

### Reglas

- Nunca exponer service role key en frontend.
- Edge Functions deben validar usuario cuando operan datos privados.
- Las tablas deben tener RLS activado.
- El frontend no debe asumir permisos solo por UI.

### Tablas sugeridas

#### `visual_scenarios`

- `id`
- `property_id`
- `scenario_type`
- `title`
- `description`
- `status`
- `base_image_url`
- `overlay_image_url`
- `geometry_geojson`
- `assumptions`
- `created_by`
- `created_at`
- `updated_at`

#### `scenario_ai_analyses`

- `id`
- `scenario_id`
- `property_id`
- `prompt_version`
- `model`
- `analysis_json`
- `created_by`
- `created_at`

#### `property_documents`

- `id`
- `property_id`
- `document_type`
- `file_url`
- `verified_at`
- `verified_by`

## 4. Performance

### Riesgos

- Mapbox puede elevar carga inicial.
- Three.js y Photo Sphere deben cargarse solo en rutas que los usan.
- PWA cache mal configurado puede servir datos antiguos.
- Imágenes de escenarios pueden ser pesadas.

### Acciones

- Lazy loading de componentes de mapas complejos.
- Code splitting por rutas.
- Optimización de imágenes.
- Revisar caching de Supabase API.
- Medir Lighthouse en mobile.

## 5. TypeScript y lint

### Fase actual

- `no-unused-vars` como warning.
- `strict` aún desactivado.

### Fase futura

1. Activar warnings por módulos.
2. Tipar modelos centrales.
3. Eliminar `any` críticos.
4. Activar `strictNullChecks` en módulos nuevos.
5. Evaluar `strict` solo cuando el proyecto esté más limpio.

## 6. Testing

Inicialmente usar QA manual y build checks.

Posterior:

- tests unitarios para parsers y helpers;
- tests de hooks críticos;
- pruebas de Edge Functions;
- smoke tests de rutas;
- Playwright para flujos principales.

## 7. Seguridad

Checklist mínimo:

- Validar RLS en tablas críticas.
- Revisar que roles no dependan solo del frontend.
- Revisar permisos de `user_roles`.
- Proteger rutas privadas.
- Validar inputs de Edge Functions.
- Evitar cache de respuestas privadas en PWA.

## 8. Roadmap técnico por fases

### Fase 1: Orden base

- Documentación maestra.
- `.env.example`.
- README real.
- Separación de rutas.
- QA checklist.

### Fase 2: Visual Scenarios base

- Tipos y constantes.
- Viewer simple.
- Integración con ficha de propiedad.
- Escenario manual por propiedad.

### Fase 3: IA y PDF

- Edge Function de análisis.
- Prompt versionado.
- Ficha PDF con disclaimer.
- Registro de análisis.

### Fase 4: Builder

- Edición visual.
- Gestión de overlays.
- Guardado de geometría.
- Flujo asesor/admin.

### Fase 5: Producto premium

- Suscripciones por corredor.
- White-label inmobiliaria.
- Reportes avanzados.
- Integraciones GIS.

## 9. Política de PRs

- PRs pequeños.
- Un objetivo por PR.
- No mezclar UI, data y auth en un solo PR.
- Cada PR debe tener QA sugerido.
- Evitar refactors masivos sin necesidad.
