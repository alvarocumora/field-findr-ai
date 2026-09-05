# Documentación Maestra — OfertaTerrenos / Field Findr AI

Esta carpeta organiza la estrategia, producto, arquitectura, sprints y criterios de ejecución del proyecto.

## Documentos principales

0. [`GUIA_CORREDORA_DISRUPTIVA.md`](./GUIA_CORREDORA_DISRUPTIVA.md)
   - **Guía maestra.** Tesis, actores, modelo de negocio, manual operativo, estándares de publicación, playbooks, métricas, reglas de ingeniería y plan por fases. Si otro documento la contradice, manda esta.

1. [`MASTER_PLAN.md`](./MASTER_PLAN.md)
   - Visión general, posicionamiento, objetivos, líneas de producto y prioridades ejecutivas.

2. [`PRODUCT_REQUIREMENTS.md`](./PRODUCT_REQUIREMENTS.md)
   - Requisitos funcionales, usuarios, módulos, flujos y criterios de aceptación de producto.

3. [`TECHNICAL_ROADMAP.md`](./TECHNICAL_ROADMAP.md)
   - Arquitectura objetivo, refactors, seguridad, performance, Supabase, Mapbox, IA y PWA.

4. [`SPRINTS.md`](./SPRINTS.md)
   - Plan de sprints incremental con entregables, criterios de aceptación y QA sugerido.

5. [`VISUAL_SCENARIOS_SPEC.md`](./VISUAL_SCENARIOS_SPEC.md)
   - Especificación funcional y técnica del módulo de escenarios visuales sobre terrenos.

6. [`CODEX_BACKLOG.md`](./CODEX_BACKLOG.md)
   - Backlog de tareas preparadas para ejecutar con Codex mediante PRs pequeños y revisables.

7. [`QA_RELEASE_CHECKLIST.md`](./QA_RELEASE_CHECKLIST.md)
   - Checklist de calidad, seguridad, build, rutas, performance y release.

## Principio de trabajo

Cada cambio relevante debe hacerse mediante PR pequeño, con resumen, alcance, riesgo y QA manual sugerido.

Evitar PRs masivos sobre archivos críticos como `src/App.tsx`, rutas, autenticación, Supabase o visualización Mapbox sin separar el cambio en fases.

## Objetivo estratégico

Convertir OfertaTerrenos en una plataforma PropTech de inteligencia territorial capaz de transformar terrenos planos en oportunidades visuales de inversión mediante IA, mapas, escenarios de desarrollo y fichas comerciales accionables.
