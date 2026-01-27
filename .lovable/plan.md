
# Plan de Mejoras Disruptivas para Ofertaterrenos.com

## Visión Estratégica
Transformar Ofertaterrenos.com de un portal de listados tradicional a un **ecosistema inteligente de inversión inmobiliaria** que combine IA avanzada, automatización y experiencias inmersivas para revolucionar la compra/venta de terrenos en LATAM.

---

## 1. Copiloto de Inversión con IA (AI Investment Copilot)

### Concepto
Asistente de IA contextual que acompaña al usuario en todo el journey de compra, desde la exploración inicial hasta el cierre de la transacción.

### Funcionalidades

**1.1 Modo "Descubrimiento Guiado"**
- Onboarding conversacional: "¿Buscas terreno para vivir, invertir, o desarrollar un proyecto?"
- Recomendaciones personalizadas basadas en perfil financiero y objetivos
- Alertas proactivas: "Encontré 3 terrenos que coinciden con tu búsqueda guardada"

**1.2 Análisis de Inversión en Tiempo Real**
- Score de inversión 0-100 para cada propiedad
- Proyección de plusvalía a 5-10 años con datos históricos
- Análisis de riesgo (legal, ambiental, de mercado)
- Comparación automática con inversiones alternativas (depósito, fondos mutuos)

**1.3 Asistente de Due Diligence**
- Checklist automatizado de documentos requeridos
- Verificación de títulos de dominio (conexión con registros públicos)
- Alertas de red flags legales

### Implementación Técnica
- Nuevo edge function `ai-investment-copilot` con prompts especializados
- Integración con Lovable AI usando `google/gemini-3-pro-preview` para análisis complejos
- Nuevo componente `AIInvestmentCopilot.tsx` con sidebar flotante

---

## 2. Experiencia de Mapa Inmersiva 3D

### Concepto
Transformar el mapa de exploración en una experiencia visual de alto impacto con vista satelital 3D, capas de datos superpuestas y navegación estilo Google Earth.

### Funcionalidades

**2.1 Vista 3D con Terreno Elevado**
- Activar terreno 3D de Mapbox para visualizar topografía real
- Pitch/rotación del mapa para explorar desde diferentes ángulos
- Sombreado por hora del día (orientación solar)

**2.2 Capas de Información Superpuestas**
- Capa de zonificación urbana (colores por tipo de uso de suelo)
- Capa de plusvalía histórica (heatmap de valorización)
- Capa de infraestructura (caminos, tendido eléctrico, agua)
- Capa de riesgos (inundaciones, incendios, pendientes)

**2.3 Clustering Inteligente**
- Agrupación de marcadores por proximidad
- Zoom semántico (al hacer zoom, agrupa por tipo de terreno)
- Preview de propiedades en hover sobre cluster

**2.4 Dibujo de Área de Interés**
- Herramienta para dibujar polígono y buscar solo dentro de esa área
- Cálculo automático de superficie dibujada
- Guardar áreas de interés para alertas

### Implementación Técnica
- Actualizar `ExploreMap.tsx` con Mapbox GL JS terrain 3D
- Nuevo componente `MapLayerControls.tsx` para gestionar capas
- Integrar Mapbox Draw para dibujo de polígonos

---

## 3. Sistema de Matching Inteligente (Smart Matching)

### Concepto
Algoritmo de matchmaking que conecta compradores con propiedades y agentes basado en compatibilidad multifactorial.

### Funcionalidades

**3.1 Perfil de Inversor Enriquecido**
- Cuestionario inicial de 5 preguntas para determinar perfil
- Tracking de comportamiento (propiedades vistas, tiempo en página)
- Historial de búsquedas y filtros preferidos

**3.2 Score de Compatibilidad**
- Cada listing muestra "95% match" basado en perfil
- Ordenamiento por compatibilidad como opción default
- Explicación de por qué es compatible ("Cumple 8 de 10 criterios")

**3.3 Alertas Inteligentes**
- Notificaciones push/email cuando aparece un listing con >90% match
- Alerta de "precio reducido" en favoritos
- Alerta de "alta demanda" (muchas visitas en poco tiempo)

### Implementación Técnica
- Nueva tabla `investor_profiles` con preferencias
- Edge function `calculate-match-score` 
- Componente `MatchScoreBadge.tsx` 

---

## 4. Verificación Blockchain de Documentos

### Concepto
Sistema de verificación documental con timestamping blockchain para garantizar autenticidad y trazabilidad.

### Funcionalidades

**4.1 Sello de Verificación**
- Hash de documentos almacenado on-chain
- Código QR verificable en cada documento
- Historial de verificaciones visible públicamente

**4.2 Estados de Verificación**
- Pendiente → En Revisión → Verificado → Certificado
- Workflow de aprobación con múltiples revisores
- Notificaciones en cada cambio de estado

**4.3 Checklist Legal Automatizado**
- Verificación automática de vigencia de documentos
- Alertas de vencimiento próximo
- Conexión con registros públicos (fase futura)

### Implementación Técnica
- Integración con servicio de timestamping (OpenTimestamps o similar)
- Nueva tabla `document_verifications` 
- Componente `DocumentVerificationTimeline.tsx`

---

## 5. Tour Virtual 360° con IA Narradora

### Concepto
Experiencia inmersiva de recorrido virtual por los terrenos con narración generada por IA que describe características en tiempo real.

### Funcionalidades

**5.1 Galería 360°**
- Visor de imágenes panorámicas 360°
- Navegación entre puntos de interés
- Anotaciones clickeables (ej: "Aquí está el pozo de agua")

**5.2 Narración IA**
- Descripción automática generada al explorar cada vista
- Información contextual: "Desde este punto se aprecia la cordillera a 50km"
- Datos técnicos integrados: "Este sector tiene pendiente de 5%"

**5.3 Generación de Recorrido**
- Agentes pueden subir fotos y IA genera tour automático
- Sugerencia de puntos de interés a fotografiar
- Generación de video promocional con narración

### Implementación Técnica
- Biblioteca `pannellum` o `photo-sphere-viewer` para 360°
- Edge function `generate-tour-narration` 
- Componente `VirtualTour360.tsx`

---

## 6. Calculadora de Financiamiento Integrada

### Concepto
Herramienta completa de simulación financiera que conecta con opciones reales de crédito.

### Funcionalidades

**6.1 Simulador de Crédito Hipotecario**
- Cálculo de cuotas con diferentes bancos
- Comparador de tasas en tiempo real
- Pre-aprobación indicativa

**6.2 Análisis de Rentabilidad**
- ROI proyectado vs otras inversiones
- Flujo de caja si se desarrolla proyecto
- Costo de oportunidad calculado

**6.3 Escenarios de Inversión**
- "¿Qué pasa si el precio sube 20%?"
- "¿Cuánto gano si subdivido en 10 lotes?"
- Análisis de sensibilidad automatizado

### Implementación Técnica
- Componente `FinancingCalculator.tsx` 
- Integración con APIs de simulación bancaria (fase futura)
- Gráficos interactivos con Recharts

---

## 7. Panel de Control para Agentes (Agent Dashboard 2.0)

### Concepto
Dashboard completamente rediseñado con métricas en tiempo real, automatización de marketing y CRM integrado.

### Funcionalidades

**7.1 Métricas en Tiempo Real**
- Visitas a listings en vivo
- Leads entrantes con notificación push
- Comparativo con promedios del mercado

**7.2 Automatización de Marketing**
- Generación de posts para redes sociales con IA
- Programación de publicaciones
- A/B testing de descripciones

**7.3 CRM Integrado Mejorado**
- Pipeline visual estilo Kanban
- Automatización de seguimiento
- Scoring predictivo de leads

**7.4 Reportes Automáticos**
- Reporte semanal de rendimiento por email
- Análisis de mercado de la zona
- Sugerencias de pricing basadas en competencia

### Implementación Técnica
- Rediseño de `Dashboard.tsx` con widgets modulares
- Nuevo componente `AgentAnalytics.tsx`
- Sistema de notificaciones push con Service Workers

---

## 8. Marketplace de Servicios Complementarios

### Concepto
Ecosistema de servicios relacionados con la compra de terrenos (topografía, legal, construcción).

### Funcionalidades

**8.1 Directorio de Profesionales**
- Topógrafos verificados por zona
- Abogados especializados en bienes raíces
- Arquitectos y constructoras

**8.2 Cotizador Integrado**
- Solicitar cotización directamente desde la plataforma
- Comparar precios de múltiples proveedores
- Reviews y calificaciones

**8.3 Servicios Premium de la Plataforma**
- Tasación profesional certificada
- Estudio de títulos express
- Gestión de subdivisión

### Implementación Técnica
- Nueva tabla `service_providers`
- Componente `ServiceMarketplace.tsx`
- Sistema de reviews y ratings

---

## 9. Gamificación y Programa de Lealtad

### Concepto
Sistema de incentivos que premia la actividad en la plataforma y fomenta el engagement.

### Funcionalidades

**9.1 Insignias y Logros**
- "Explorador" (visitó 50 propiedades)
- "Inversionista Inteligente" (usó calculadora 10 veces)
- "Primera Compra" (cerró su primera transacción)

**9.2 Puntos Canjeables**
- Puntos por actividad (ver, guardar, compartir)
- Canje por descuentos en servicios premium
- Acceso anticipado a nuevos listings

**9.3 Referidos**
- Programa de referidos con recompensas
- Tracking de invitaciones y conversiones
- Bonos por transacciones cerradas

### Implementación Técnica
- Nueva tabla `user_achievements` y `loyalty_points`
- Componente `AchievementBadge.tsx`
- Sistema de notificaciones de logros

---

## 10. Accesibilidad y Experiencia Móvil Nativa

### Concepto
Optimización completa para móviles con funcionalidades nativas y experiencia de app.

### Funcionalidades

**10.1 PWA Completa**
- Instalable como app nativa
- Funcionamiento offline (listings guardados)
- Notificaciones push

**10.2 Funciones Móviles Nativas**
- Geolocalización para "Terrenos cerca de mí"
- Cámara para escanear documentos
- Compartir ubicación en tiempo real con agente

**10.3 Modo Oscuro Mejorado**
- Optimización para AMOLED
- Transiciones suaves ya implementadas
- Respeto de preferencias del sistema

### Implementación Técnica
- Configuración de manifest.json para PWA
- Service Worker para offline
- Componentes responsive optimizados

---

## Priorización de Implementación

### Fase 1: Alto Impacto + Menor Esfuerzo (2-3 semanas)
1. **Mapa 3D Inmersivo** - Diferenciador visual inmediato
2. **Score de Compatibilidad** - Mejora UX de búsqueda
3. **PWA básica** - Experiencia móvil mejorada

### Fase 2: Core Features (4-6 semanas)
4. **AI Investment Copilot** - Valor agregado único
5. **Calculadora de Financiamiento** - Herramienta práctica
6. **Dashboard Agentes 2.0** - Retención de agentes

### Fase 3: Diferenciadores Premium (6-8 semanas)
7. **Tour Virtual 360°** - Experiencia premium
8. **Verificación Blockchain** - Confianza y seguridad
9. **Marketplace de Servicios** - Monetización adicional

### Fase 4: Engagement y Retención (8-10 semanas)
10. **Sistema de Matching Completo**
11. **Gamificación**
12. **Notificaciones Push Avanzadas**

---

## Archivos a Crear/Modificar

### Nuevos Componentes
```
src/components/
├── ai/
│   ├── AIInvestmentCopilot.tsx
│   ├── InvestmentScoreCard.tsx
│   └── DueDiligenceChecklist.tsx
├── map/
│   ├── Map3DViewer.tsx
│   ├── MapLayerControls.tsx
│   ├── DrawingTools.tsx
│   └── ClusterMarkers.tsx
├── matching/
│   ├── MatchScoreBadge.tsx
│   ├── InvestorProfileForm.tsx
│   └── CompatibilityExplainer.tsx
├── tour/
│   ├── VirtualTour360.tsx
│   └── TourNarration.tsx
├── finance/
│   ├── FinancingCalculator.tsx
│   ├── ROIAnalyzer.tsx
│   └── ScenarioSimulator.tsx
├── dashboard/
│   ├── AgentAnalytics.tsx
│   ├── LeadPipeline.tsx
│   └── MarketingAutomation.tsx
└── marketplace/
    ├── ServiceMarketplace.tsx
    └── ProviderCard.tsx
```

### Edge Functions
```
supabase/functions/
├── ai-investment-copilot/
├── calculate-match-score/
├── generate-tour-narration/
├── document-verification/
└── market-analysis/
```

### Nuevas Tablas
```sql
-- investor_profiles
-- service_providers
-- user_achievements
-- loyalty_points
-- document_verifications
-- notification_preferences
```

---

## Resultado Esperado

### Métricas de Éxito
- **+50% tiempo en plataforma** (experiencias inmersivas)
- **+30% conversión de leads** (matching inteligente)
- **+40% listings verificados** (confianza documental)
- **+25% transacciones cerradas** (herramientas de decisión)

### Diferenciadores Competitivos
1. **Único portal con mapa 3D y capas de datos** en Chile
2. **AI Copilot de inversión** sin equivalente en LATAM
3. **Verificación blockchain** de documentos
4. **Marketplace integrado** de servicios
5. **Gamificación** para engagement

Esta transformación posicionará a Ofertaterrenos.com como el líder indiscutido del mercado proptech de terrenos en LATAM.
