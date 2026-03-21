

# Plan: Brochure Premium con IA para Brisas de Caone

## Objetivo

Crear un sistema de brochure PDF profesional que use IA para generar contenido de marketing persuasivo y lo renderice en un PDF con diseño editorial premium usando la paleta "Terroir Sereno" (Forest Green #2C5F2D, Sand #E8DCC8, Terracotta #B85042).

## Arquitectura

```text
ProjectBrochureTab → [Botón "Generar con IA"] → ai-assistant (type: generate-brochure)
                                                       ↓
                                              Contenido estructurado
                                                       ↓
                                        brochurePdfGenerator.ts (rediseñado)
                                                       ↓
                                              PDF premium multi-página
```

## Cambios

### 1. Nuevo tipo `generate-brochure` en Edge Function

**Archivo:** `supabase/functions/ai-assistant/index.ts`

Agregar caso `generate-brochure` con el mega-prompt del usuario como system prompt. Recibe datos del proyecto (nombre, precio, ubicación, lotes, condiciones) y devuelve JSON estructurado:

```json
{
  "headline": "...",
  "elevatorPitch": "...",
  "pillars": [{ "title": "Naturaleza", "text": "..." }, ...],
  "investmentProjection": "...",
  "ctaVisit": "...",
  "ctaMasterPlan": "..."
}
```

Usa tool calling para garantizar JSON válido.

### 2. Rediseño de `brochurePdfGenerator.ts`

**Archivo:** `src/lib/brochurePdfGenerator.ts`

PDF de 3 páginas con diseño editorial:

- **Página 1 — Portada**: Header con color Forest Green, nombre del proyecto grande, headline generado por IA, precio destacado en Terracotta, ubicación
- **Página 2 — Contenido**: Elevator pitch, 3 pilares de valor con iconos (Naturaleza, Ubicación, Seguridad Jurídica), proyección de inversión, cuadro técnico (m², tipo, acceso, servicios)
- **Página 3 — Inventario + CTA**: Tabla de lotes disponibles, condiciones comerciales, CTAs de WhatsApp y Master Plan, footer con disclaimer

Paleta: Forest Green (#2C5F2D), Sand (#E8DCC8), Terracotta (#B85042), blanco y dark gray.

### 3. Actualizar `ProjectBrochureTab.tsx`

**Archivo:** `src/components/projects/ProjectBrochureTab.tsx`

- Agregar botón "Generar Brochure con IA" que primero llama a la edge function para obtener el contenido de marketing
- Mostrar preview del contenido generado antes de descargar
- Estado de loading mientras la IA genera
- Botón "Descargar PDF" que combina datos reales del proyecto + contenido IA en el PDF premium
- Mantener opción de descarga rápida sin IA (brochure básico actual)

### 4. Hook `useBrochureGenerator`

**Archivo:** `src/hooks/useAI.ts`

Agregar nuevo hook que invoca `ai-assistant` con `type: 'generate-brochure'` y retorna el contenido estructurado.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/ai-assistant/index.ts` | Nuevo tipo `generate-brochure` con prompt especializado |
| `src/lib/brochurePdfGenerator.ts` | Rediseño completo con paleta Terroir Sereno y layout editorial |
| `src/components/projects/ProjectBrochureTab.tsx` | UI para generar con IA + preview + descarga |
| `src/hooks/useAI.ts` | Hook `useBrochureGenerator` |

