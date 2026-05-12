# Sprint Plan — OfertaTerrenos / Field Findr AI

## Metodología

Trabajar en ciclos cortos con PRs pequeños, revisables y mergeables. Cada sprint debe cerrar con documentación y QA manual.

Duración sugerida por sprint: 3 a 7 días según complejidad.

## Sprint 0 — Base documental y orden estratégico

### Objetivo

Dejar el proyecto documentado y preparado para desarrollo ordenado con Codex y Lovable.

### Entregables

- README real del producto.
- `.env.example`.
- Documentación maestra en `docs/`.
- Roadmap de escenarios visuales.
- Backlog Codex.

### Criterios de aceptación

- Los documentos existen en `docs/`.
- README explica producto, stack y variables.
- No se modifica UI ni lógica crítica.

### Estado

En ejecución.

## Sprint 1 — Arquitectura de rutas y seguridad frontend

### Objetivo

Reducir riesgo del router centralizado y ordenar permisos por rol.

### Entregables

- Crear `src/routes/`.
- Extraer rutas públicas.
- Extraer rutas comprador.
- Extraer rutas asesor.
- Extraer rutas admin.
- Extraer redirects legacy.
- Mantener comportamiento actual.

### Criterios de aceptación

- `npm run build` pasa.
- Todas las rutas actuales siguen resolviendo.
- `/asesor/*` exige agent o admin.
- `/admin/*` exige admin.
- Buyer mantiene protección de sesión.
- No hay cambios visuales esperados.

### QA manual

- Abrir `/`.
- Abrir `/explorar`.
- Abrir una ficha `/propiedad/:id`.
- Probar `/buyer/home` sin sesión.
- Probar `/asesor/dashboard` sin sesión.
- Probar `/admin/dashboard` sin sesión.

## Sprint 2 — Visual Scenario foundation

### Objetivo

Crear la base técnica del módulo de escenarios visuales sin tocar todavía flujos complejos.

### Entregables

- `src/types/visualScenario.ts`.
- `src/config/visualScenarios.ts`.
- `src/lib/visualScenarios/`.
- Tipos de escenario.
- Estados de escenario.
- Helpers de formato.
- Datos mock controlados para demo.

### Criterios de aceptación

- No rompe build.
- Los tipos están exportados.
- Los estados y tipos son reutilizables.
- No hay dependencia fuerte con Supabase todavía.

### QA manual

- Build.
- Revisión de imports.
- Confirmar que no cambia UI productiva.

## Sprint 3 — Visual Scenario Viewer en ficha de propiedad

### Objetivo

Mostrar escenarios visuales de manera consistente en la ficha de propiedad.

### Entregables

- Componente `VisualScenarioViewer`.
- Selector de escenarios.
- Imagen base + overlay.
- Badges de tipo y estado.
- Disclaimer visual.
- Integración no destructiva en `PropertyDetail`.

### Criterios de aceptación

- Si hay escenarios, se muestran.
- Si no hay escenarios, la ficha sigue funcionando.
- Mobile responsive.
- No se afirma factibilidad si el estado no es aprobado.

### QA manual

- Ficha con escenario.
- Ficha sin escenario.
- Desktop.
- Mobile.
- CTA de WhatsApp sigue funcionando.

## Sprint 4 — Análisis IA de propiedad y escenario

### Objetivo

Crear análisis IA trazable para ficha y escenarios.

### Entregables

- Edge Function `ai-property-analysis` o wrapper equivalente.
- Prompt versionado.
- Separación entre evidencia, supuestos y recomendaciones.
- UI de resultado IA.
- Manejo de error y loading.

### Criterios de aceptación

- Botón `Analizar con IA` funciona.
- No inventa permisos.
- Muestra limitaciones.
- Guarda o muestra prompt versionado si corresponde.

### QA manual

- Ejecutar análisis en propiedad industrial.
- Ejecutar análisis sin datos suficientes.
- Probar error de función.
- Confirmar que el texto distingue supuestos.

## Sprint 5 — Ficha PDF comercial

### Objetivo

Generar PDF descargable para propiedades y escenarios.

### Entregables

- Exportador PDF.
- Portada visual.
- Datos de propiedad.
- Escenario visual si existe.
- Supuestos y disclaimer.
- CTA de contacto.

### Criterios de aceptación

- PDF se descarga.
- No rompe si falta imagen.
- Incluye disclaimer.
- Incluye datos comerciales clave.

### QA manual

- Descargar PDF en desktop.
- Descargar PDF en mobile.
- Revisar texto y visual.
- Probar propiedad sin escenario.

## Sprint 6 — Panel asesor para escenarios

### Objetivo

Permitir que asesores administren escenarios asociados a sus propiedades.

### Entregables

- Vista de escenarios en panel asesor.
- Crear/editar metadata de escenario.
- Subir o asociar imagen base y overlay.
- Cambiar estado.
- Validación básica.

### Criterios de aceptación

- Solo agent/admin accede.
- Cambios quedan persistidos.
- No se puede marcar aprobado sin campos mínimos.

### QA manual

- Crear escenario draft.
- Editar escenario.
- Archivar escenario.
- Probar usuario sin permiso.

## Sprint 7 — Performance y PWA

### Objetivo

Mejorar carga, bundle y comportamiento offline sin comprometer datos privados.

### Entregables

- Lazy loading de módulos pesados.
- Revisión de cache PWA.
- Optimización de imágenes.
- Lighthouse mobile baseline.

### Criterios de aceptación

- No aumenta carga inicial innecesariamente.
- Mapbox no carga en rutas que no lo necesitan.
- No se cachean datos privados de forma riesgosa.

## Sprint 8 — Producto comercial premium

### Objetivo

Preparar monetización para corredores e inmobiliarias.

### Entregables

- Planes por corredor.
- Límites por plan.
- Propiedades destacadas.
- Escenarios premium.
- Reportes básicos.

### Criterios de aceptación

- Pricing claro.
- Diferencia entre usuario gratuito y premium.
- CTA de upgrade consistente.

## Orden recomendado

1. Sprint 0
2. Sprint 1
3. Sprint 2
4. Sprint 3
5. Sprint 5
6. Sprint 4
7. Sprint 6
8. Sprint 7
9. Sprint 8

El análisis IA puede adelantarse si el botón actual necesita activación urgente, pero debe evitar afirmaciones no verificadas.
