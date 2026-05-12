# Visual Scenarios Demo Route — Sprint 3.1

## Objetivo

Agregar una ruta interna de previsualización para validar visualmente el `VisualScenarioViewer` con mock data antes de integrarlo en fichas reales.

## Ruta agregada

- `/demo/visual-scenarios`

## Archivos modificados

- `src/pages/demo/VisualScenariosDemo.tsx`
- `src/routes/publicRoutes.tsx`

## Alcance

Esta demo permite revisar:

- render con mock scenarios;
- navegación entre escenarios;
- badges de tipo y estado;
- métricas;
- supuestos;
- riesgos;
- disclaimer;
- callbacks simulados para IA y PDF mediante toast.

## Fuera de alcance

Este sprint no integra todavía:

- `PropertyDetail`;
- Supabase;
- PDF real;
- IA real;
- Threebox;
- GLB real.

## QA sugerido

1. Abrir `/demo/visual-scenarios`.
2. Confirmar que la página carga con layout público.
3. Confirmar que se muestran escenarios mock.
4. Cambiar entre escenarios.
5. Probar botones `Analizar con IA` y `Descargar ficha PDF`.
6. Confirmar que muestran toast y no ejecutan integraciones reales.
7. Revisar mobile.

## Próximo paso

Integrar el viewer en `PropertyDetail` de forma condicional: si una propiedad tiene escenarios disponibles, mostrar el módulo; si no, mantener el comportamiento actual sin cambios visuales.
