

# Plan Disruptivo: Transformar el Portal en Plataforma Inmobiliaria de Clase Mundial

## Estado Actual

Plataforma madura con: landing 3D con globo scroll-driven, explorador con Mapbox, detalle de proyecto con hero glassmorphism + cotizador flotante + social proof, diseñador 3D de parcelas, CRM, sistema de reservas/créditos/cierre, tour 360, y dashboard ejecutivo. La base es sólida pero hay brechas críticas en engagement, automatización y experiencia mobile.

---

## Fase 1: Experiencia de Descubrimiento Inmersiva

### 1.1 Búsqueda Conversacional con IA
- Reemplazar el search bar estándar por un input tipo ChatGPT: "Busco terreno de 5000m² con bosque nativo cerca de Pucón bajo 50 millones"
- El backend (edge function con Lovable AI) parsea la intención y devuelve resultados filtrados con explicación natural
- Integrar en la landing como hero CTA principal

**Archivos:** nuevo `src/components/explore/ConversationalSearch.tsx`, nueva edge function `supabase/functions/ai-natural-search/index.ts`

### 1.2 Explorador con Vista Dividida Inteligente
- Al hacer hover en un listing del panel izquierdo, el mapa hace fly-to animado al punto
- Al dibujar un área en el mapa, el panel filtra solo los dentro del polígono
- Agregar modo "Street View" embebido desde Google cuando se selecciona un listing

**Archivo:** `src/pages/Explorar.tsx`, `src/components/explore/ExploreMapPanel.tsx`

### 1.3 Cards de Proyecto con Video Preview
- En la landing, las cards de proyecto muestran un video loop corto (3s) al hacer hover, similar a Netflix
- Fallback a imagen estática si no hay video
- Agregar campo `video_url` a la tabla `projects`

**Archivos:** `src/components/landing/ScrollytellingSection.tsx`, migración SQL

---

## Fase 2: Motor de Conversión Avanzado

### 2.1 Cotizador Público con Simulación Financiera Completa
- Expandir `PublicLotQuoter` para incluir: pie inicial configurable, tasa de interés variable, tabla de amortización descargable en PDF
- Comparación visual "Arriendo vs Compra" con gráfico de crossover
- Botón "Agendar videollamada con asesor" integrado

**Archivo:** `src/components/projects/PublicLotQuoter.tsx`

### 2.2 Reserva Express en 3 Clicks
- Flujo simplificado: Seleccionar lote → Confirmar datos → Pagar (MercadoPago/transferencia)
- Progress bar tipo checkout e-commerce
- Timer de urgencia: "Este lote se reservará por 15 minutos"

**Archivo:** `src/components/lots/LotReservationDialog.tsx`

### 2.3 Retargeting Inteligente con Alertas Personalizadas
- Cuando un usuario visita un proyecto pero no reserva, guardar evento en BD
- Edge function programada que envía email/push 24h después: "El Lote 15 que viste sigue disponible, pero 3 personas lo están viendo"
- Integrar con `saved_searches` existente

**Archivos:** nueva edge function `supabase/functions/retargeting-alerts/index.ts`, migración para tabla `user_events`

---

## Fase 3: Experiencia Mobile-First Premium

### 3.1 Bottom Navigation Nativa (PWA)
- Reemplazar el header mobile por una barra de navegación inferior estilo app nativa con 5 iconos: Explorar, Favoritos, Buscar, Mi Terreno, Perfil
- Transiciones suaves entre secciones
- Haptic feedback simulado con vibración API

**Archivos:** nuevo `src/components/navigation/MobileBottomNav.tsx`, `src/components/Layout.tsx`

### 3.2 Swipe Cards para Explorar (Tinder de Terrenos)
- Modo alternativo de exploración en mobile: cards con swipe derecha (favorito), izquierda (descartar), arriba (contactar)
- Cada card muestra: imagen satelital, precio, área, score de inversión
- Los swipes se guardan como interacciones para el motor de recomendaciones

**Archivo:** nuevo `src/components/explore/SwipeExplorer.tsx`

### 3.3 Compartir Lote como Story
- Botón "Compartir como Story" que genera una imagen vertical (9:16) con la info del lote sobre fondo satelital
- Optimizada para Instagram/WhatsApp Stories
- Canvas API para generar la imagen client-side

**Archivo:** nuevo `src/components/social/StoryGenerator.tsx`

---

## Fase 4: Inteligencia de Datos para Agentes

### 4.1 Scoring Predictivo de Leads
- Modelo de scoring basado en: número de visitas, tiempo en página, lotes vistos, búsquedas similares, interacciones WhatsApp
- Badge visual en CRM: "Hot", "Warm", "Cold" con probabilidad de conversión
- Edge function que recalcula scores diariamente

**Archivos:** `src/components/leads/LeadScoreBadge.tsx`, edge function `supabase/functions/lead-scoring/index.ts`

### 4.2 Mapa de Calor de Demanda Real
- Overlay en el mapa del agente que muestra zonas con más búsquedas/favoritos de compradores reales
- Datos agregados y anonimizados de `user_events`
- Filtrable por período (7d, 30d, 90d)

**Archivo:** `src/pages/dashboard/DemandHeatmapDashboard.tsx`

### 4.3 Auto-Seguimiento por WhatsApp
- Templates predefinidos por etapa del funnel
- Botón "Enviar seguimiento" que abre WhatsApp con mensaje pre-llenado contextual
- Registro automático del contacto en el timeline del lead

**Archivo:** `src/lib/whatsappUtils.ts`, `src/components/tools/EnhancedCRM.tsx`

---

## Fase 5: Diferenciadores Únicos

### 5.1 Comparador de Inversión Multi-Proyecto
- Herramienta que compara retorno esperado entre lotes de diferentes proyectos
- Gráfico de radar: plusvalía, accesibilidad, servicios, liquidez, riesgo
- Basado en datos reales de ventas históricas cuando estén disponibles

**Archivo:** nuevo `src/components/tools/InvestmentComparator.tsx`

### 5.2 Timeline Interactivo del Terreno
- Para cada lote vendido, mostrar su historia: publicación → primera visita → reserva → promesa → escritura
- Visible para el comprador en "Mi Terreno" y para el agente en el CRM
- Animación tipo "journey" con iconos y fechas

**Archivo:** `src/pages/MiTerreno.tsx`, `src/components/buyer/PurchaseTimeline.tsx`

### 5.3 Modo Nocturno del Mapa Satelital
- Toggle para ver el proyecto en modo nocturno (Mapbox dark satellite)
- Simula iluminación artificial para mostrar accesibilidad y conectividad visual
- Diferenciador visual vs competencia

**Archivo:** `src/components/lots/LotMapView.tsx`

---

## Resumen de Archivos y Prioridad

| Prioridad | Componente | Impacto | Esfuerzo |
|-----------|-----------|---------|----------|
| 1 | Búsqueda Conversacional IA | Muy Alto | Alto |
| 2 | Bottom Nav Mobile | Alto | Bajo |
| 3 | Reserva Express 3 clicks | Alto | Medio |
| 4 | Swipe Explorer Mobile | Alto | Medio |
| 5 | Cotizador Financiero Completo | Alto | Medio |
| 6 | Story Generator | Medio | Bajo |
| 7 | Lead Scoring Predictivo | Medio | Alto |
| 8 | Retargeting Alerts | Medio | Alto |
| 9 | Comparador de Inversión | Medio | Medio |
| 10 | Modo Nocturno Mapa | Bajo | Bajo |

## Migraciones de BD Necesarias

```sql
-- Tabla de eventos de usuario para analytics y retargeting
CREATE TABLE user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL, -- 'view_project', 'view_lot', 'search', 'favorite'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Campo video en proyectos
ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url text;
```

