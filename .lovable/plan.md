

# Plan Disruptivo y Atípico: Portal Inmobiliario de Nueva Generación

## Filosofía: "No vendemos lotes, vendemos futuros"

La mayoría de portales inmobiliarios son catálogos estáticos. Este plan transforma la plataforma en una **experiencia narrativa e inmersiva** donde el usuario no busca propiedades: las vive antes de comprarlas.

---

## Fase 1: "Modo Cine" — Storytelling Inmersivo por Proyecto

### 1.1 Landing Cinematográfica por Proyecto
Cada proyecto tiene una URL pública `/proyecto/:id/experiencia` que es una página fullscreen tipo documental corto:
- Scroll-driven: imagen satelital → zoom al terreno → renders → datos financieros → CTA de reserva
- Sin chrome del sitio (sin header/footer/sidebar), experiencia 100% inmersiva
- Optimizado para compartir en redes como un "micrositio" del proyecto
- Botón flotante "Volver al portal" para salir

**Archivos:** nuevo `src/pages/ProjectExperience.tsx`, ruta en `App.tsx`

### 1.2 Generador de Micrositios para Agentes
Desde el dashboard del agente, botón "Generar Micrositio" que activa la experiencia inmersiva del proyecto. El agente puede compartir el link directo a compradores por WhatsApp. El link trackea visitas con `user_events`.

**Archivo:** botón en `src/pages/ProjectDetail.tsx`

---

## Fase 2: "Gemelo Digital" — Vivir el Terreno Antes de Comprarlo

### 2.1 Modo "Caminar el Terreno" Mejorado
El diseñador 3D de parcelas ya tiene cámara peatonal. Mejorar con:
- Overlay de información contextual: al caminar, mostrar distancia al borde, pendiente del punto, orientación solar
- Botón "Captura Panorámica" que genera una imagen 360° del punto de vista actual usando Canvas
- Sonido ambiente opcional (viento, pájaros) para inmersión sensorial

**Archivo:** `src/components/parcela/PedestrianCamera.tsx`, `src/components/parcela/ParcelaToolbar.tsx`

### 2.2 Simulador de Estaciones
Toggle en el diseñador 3D que cambia la iluminación solar según la estación del año (verano/invierno). Muestra cómo se ve el terreno en junio vs diciembre. Usa el componente `SolarLight.tsx` existente con presets de ángulo solar por mes.

**Archivo:** `src/components/parcela/SolarLight.tsx`, `src/components/parcela/ParcelaToolbar.tsx`

---

## Fase 3: "Smart Matching" — El Terreno te Encuentra

### 3.1 Quiz de Perfil de Comprador
Página `/quiz` con 5 preguntas tipo "¿Para qué quieres el terreno?" (inversión/casa/campo/negocio), "¿Cuánto quieres invertir?", "¿Qué tan lejos de la ciudad?". Genera un perfil guardado en `profiles.onboarding_data` y redirige a resultados filtrados automáticamente.

**Archivos:** nuevo `src/pages/BuyerQuiz.tsx`, ruta en `App.tsx`

### 3.2 Match Score Visible en Cada Card
Basado en el quiz, cada listing/lot muestra un badge de compatibilidad: "92% match". Usa datos del perfil del comprador vs atributos del terreno (precio, área, ubicación, uso).

**Archivo:** nuevo `src/components/explore/MatchScoreBadge.tsx`, integrar en cards existentes

### 3.3 Notificación "Tu Terreno Ideal Acaba de Publicarse"
Edge function que compara nuevos listings contra perfiles de compradores activos. Envía notificación push/email cuando hay un match >80%.

**Archivo:** nueva edge function `supabase/functions/smart-match-notify/index.ts`

---

## Fase 4: "Transparencia Radical" — Confianza como Diferenciador

### 4.1 Timeline Público del Proyecto
En cada proyecto, sección "Historia del Proyecto" visible públicamente:
- Fecha de publicación, primera reserva, hitos de construcción, porcentaje vendido
- Datos reales de `reservations` y `lots` agregados
- Genera confianza mostrando actividad real

**Archivo:** nuevo `src/components/projects/ProjectTimeline.tsx`, integrar en `ProjectDetail.tsx`

### 4.2 Calculadora de Plusvalía Histórica
Herramienta que muestra: "Los terrenos en esta zona se han valorizado X% en los últimos Y años". Usa datos de `price_history` agregados por región. Gráfico de línea temporal con proyección futura estimada.

**Archivo:** nuevo `src/components/tools/AppreciationCalculator.tsx`, integrar en `Tools.tsx`

### 4.3 Verificador de Documentos Público
Badge de "Proyecto Verificado" que muestra qué documentos legales están cargados (escritura, permiso municipal, etc.) sin revelar el contenido. Genera confianza tipo "esta propiedad tiene 5/6 documentos verificados".

**Archivo:** componente en `src/components/projects/VerificationBadge.tsx`, integrar en `ProjectHero.tsx`

---

## Fase 5: "Gamificación Sutil" — Engagement sin Fricciones

### 5.1 Sistema de Logros para Compradores
Badges desbloqueables: "Explorador" (visitó 10 proyectos), "Analista" (usó el comparador), "Decidido" (reservó un lote). Visible en perfil. Basado en `user_events`.

**Archivo:** nuevo `src/components/profile/AchievementsBadges.tsx`

### 5.2 Contador de Interés en Tiempo Real
En cada lote: "7 personas vieron este lote esta semana". Query a `user_events` filtrado por `event_type = 'view_lot'`. Crea urgencia real basada en datos reales.

**Archivo:** integrar en `EnhancedLotCard.tsx`

### 5.3 "Watchlist" con Countdown
Botón "Seguir este lote" que activa un mini-dashboard personal: cambios de precio, nuevas fotos, cambio de estado. Si un lote pasa a "reservado", notificación inmediata a todos los watchers.

**Archivo:** nuevo `src/hooks/useWatchlist.ts`, integrar en `LotDetailSheet.tsx`

---

## Fase 6: "Agente Aumentado" — IA como Co-piloto de Ventas

### 6.1 Briefing Matutino Automático
Al abrir el dashboard del agente por la mañana, panel con resumen IA: "Hoy tienes 3 leads calientes, 1 reserva por vencer, y el proyecto X alcanzó el 80% de ventas". Generado por edge function con Lovable AI.

**Archivo:** nuevo `src/components/dashboard/MorningBriefing.tsx`, edge function `supabase/functions/agent-briefing/index.ts`

### 6.2 Auto-Generador de Descripción de Lote
Botón "Generar descripción con IA" al crear/editar un lote. Toma: área, ubicación, pendiente, servicios → genera texto de venta optimizado. Usa Lovable AI.

**Archivo:** integrar en `src/components/lots/LotForm.tsx`

---

## Resumen de Prioridad

| # | Componente | Tipo | Impacto |
|---|-----------|------|---------|
| 1 | Quiz de Perfil + Match Score | Conversión | Muy Alto |
| 2 | Landing Cinematográfica por Proyecto | Diferenciación | Muy Alto |
| 3 | Timeline Público del Proyecto | Confianza | Alto |
| 4 | Briefing Matutino del Agente | Productividad | Alto |
| 5 | Contador de Interés Real | Urgencia | Alto |
| 6 | Verificador de Documentos | Confianza | Alto |
| 7 | Simulador de Estaciones | Diferenciación | Medio |
| 8 | Sistema de Logros | Engagement | Medio |
| 9 | Watchlist con Countdown | Retención | Medio |
| 10 | Auto-Descripción IA | Productividad | Medio |

## Archivos Nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/ProjectExperience.tsx` | Micrositio inmersivo por proyecto |
| `src/pages/BuyerQuiz.tsx` | Quiz de perfil de comprador |
| `src/components/explore/MatchScoreBadge.tsx` | Badge de compatibilidad |
| `src/components/projects/ProjectTimeline.tsx` | Historia pública del proyecto |
| `src/components/projects/VerificationBadge.tsx` | Badge de documentos verificados |
| `src/components/tools/AppreciationCalculator.tsx` | Calculadora de plusvalía |
| `src/components/profile/AchievementsBadges.tsx` | Logros del comprador |
| `src/hooks/useWatchlist.ts` | Hook de seguimiento de lotes |
| `src/components/dashboard/MorningBriefing.tsx` | Briefing IA del agente |
| `supabase/functions/smart-match-notify/index.ts` | Notificación de match automático |
| `supabase/functions/agent-briefing/index.ts` | Generador de briefing matutino |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Rutas `/proyecto/:id/experiencia`, `/quiz` |
| `src/pages/ProjectDetail.tsx` | Timeline, VerificationBadge, link a experiencia |
| `src/components/parcela/ParcelaToolbar.tsx` | Toggle estaciones, captura 360 |
| `src/components/parcela/SolarLight.tsx` | Presets estacionales |
| `src/components/lots/EnhancedLotCard.tsx` | Contador de interés, match score |
| `src/components/lots/LotDetailSheet.tsx` | Watchlist button |
| `src/components/lots/LotForm.tsx` | Auto-descripción IA |
| `src/pages/Tools.tsx` | AppreciationCalculator |
| `src/pages/dashboard/DashboardAsesor.tsx` | MorningBriefing |

## Sin Migraciones de BD

Todo se basa en tablas existentes: `user_events`, `profiles.onboarding_data`, `reservations`, `lots`, `price_history`, `documents`. No se requieren cambios de esquema.

