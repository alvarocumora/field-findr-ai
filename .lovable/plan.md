
# Plan Estratégico: OfertaTerrenos AI - Nivel SaaS Enterprise

## Visión General

Transformar OfertaTerrenos AI de una plataforma de visualización de proyectos a un **ecosistema SaaS completo para desarrolladores de loteos** que automatice el ciclo de vida completo: desde la prospección de terrenos hasta el cierre de ventas y postventa.

---

## Fase 1: Core Transaction Engine (Semana 1-2)

### 1.1 Sistema de Reservas Vinculantes

Actualmente el sistema captura leads pero no gestiona reservas reales con flujo de dinero.

**Implementar:**
- **Tabla `reservations`**: Estado, monto de reserva, fecha vencimiento, documentos adjuntos
- **Pago de reserva online**: Integración con MercadoPago para cobrar señas (ej: $500.000 CLP)
- **Timer de reserva**: 48-72 horas para completar pago antes de liberar lote
- **Actualización automática de inventario**: Lote pasa a "reserved" al pagar

### 1.2 Gestión de Contratos Digitales

El componente `SalesManagement.tsx` tiene datos mock de contratos.

**Implementar:**
- **Tabla `contracts`**: Tipo (promesa, compraventa), estado, montos, fechas clave
- **Generador de Promesa de Compraventa PDF**: Plantilla legal chilena con campos dinámicos
- **Tabla de amortización vinculada**: Cuotas programadas con fechas de vencimiento
- **Tracking de firma**: Estados (borrador → enviado → firmado → inscrito)

### 1.3 Sistema de Pagos y Cuotas

**Implementar:**
- **Tabla `payment_schedules`**: Cuotas programadas, montos, fechas, estado
- **Tabla `payments`** (ya existe): Vincular a lotes y contratos específicos
- **Dashboard de cobranza**: Vista de cuotas vencidas, por vencer, pagadas
- **Notificaciones automáticas**: Recordatorios de pago por email/WhatsApp

---

## Fase 2: CRM Especializado para Loteos (Semana 2-3)

### 2.1 Pipeline de Ventas Inteligente

Mejorar el `LeadManagement.tsx` con datos reales.

**Implementar:**
- **Kanban Board interactivo**: Drag & drop de leads entre etapas
- **Lead Scoring automático**: Basado en interacciones, capacidad de pago, urgencia
- **Asignación automática**: Round-robin entre asesores del proyecto
- **Timeline de actividades**: Historial completo de interacciones

### 2.2 Automatización de Seguimiento

**Implementar:**
- **Secuencias de email/WhatsApp**: Plantillas por etapa del funnel
- **Triggers automáticos**: "Si no responde en 48h → enviar recordatorio"
- **Integración con WhatsApp Business API**: Mensajes desde la plataforma
- **Calendario de visitas**: Agendar tours al proyecto con confirmaciones

### 2.3 Matching Inteligente Lead-Lote

**Implementar:**
- **Preferencias del comprador**: Presupuesto, tamaño deseado, orientación
- **Algoritmo de matching**: Sugerir lotes compatibles automáticamente
- **Comparador de lotes**: Lado a lado con métricas clave

---

## Fase 3: Portal del Cliente (Semana 3-4)

### 3.1 Área Privada del Comprador

Crear experiencia post-reserva para compradores.

**Implementar:**
- **Ruta `/mi-terreno`**: Dashboard personal del comprador
- **Visualización de su lote**: Mapa con su parcela destacada
- **Estado de pagos**: Cuotas pagadas, pendientes, próximo vencimiento
- **Documentos descargables**: Contrato, boletas, certificados
- **Progreso del proyecto**: Timeline de avances (loteo, urbanización, entrega)

### 3.2 Sistema de Documentos Legales

**Implementar:**
- **Vault de documentos por lote**: Escrituras, planos, certificados
- **Checklist legal automático**: Estado de cada documento requerido
- **Firma electrónica**: Integración con servicio de firma (ej: DocuSign/similar)

---

## Fase 4: Herramientas de Comercialización (Semana 4-5)

### 4.1 Cotizador Público Embebible

Extender el `FinancingCalculator.tsx` para uso externo.

**Implementar:**
- **Widget embebible**: `<iframe>` que otros sitios pueden usar
- **Personalización por proyecto**: Colores, logo, términos
- **Captura de leads**: Formulario integrado al simular
- **Analytics de uso**: Cuántas simulaciones, conversión a leads

### 4.2 Landing Pages por Proyecto

**Implementar:**
- **Generador de micrositios**: URL única por proyecto (ej: `/p/brisas-de-caone`)
- **SEO optimizado**: Meta tags, schema markup para real estate
- **Formulario de contacto integrado**: Directo a CRM
- **Galería mejorada**: Lightbox, videos, tour virtual

### 4.3 Tablero de Disponibilidad en Tiempo Real

**Implementar:**
- **Vista pública de stock**: Mapa con lotes coloreados por estado
- **Actualización en tiempo real**: WebSocket/Realtime cuando cambia estado
- **Modo presentación**: Para mostrar en sala de ventas

---

## Fase 5: Business Intelligence (Semana 5-6)

### 5.1 Dashboard Analítico para Desarrolladores

Expandir el `BusinessIntelligence.tsx` con datos reales.

**Implementar:**
- **Métricas clave**: Velocidad de venta, ticket promedio, tiempo de cierre
- **Proyecciones de flujo**: Ingresos esperados por mes basado en cuotas
- **Comparativa entre proyectos**: Performance relativo
- **Funnel de conversión**: Visita → Lead → Reserva → Venta

### 5.2 Reportes Automáticos

**Implementar:**
- **Reporte semanal por email**: Resumen ejecutivo automático
- **Exportación a Excel/PDF**: Datos de ventas, inventario, cobranza
- **API de datos**: Para integrar con sistemas contables externos

---

## Arquitectura de Base de Datos Propuesta

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                            │
├─────────────────────────────────────────────────────────────────┤
│  projects ──┬── lots ──┬── reservations ──── contracts         │
│             │          │                          │             │
│             │          └── lot_documents          │             │
│             │                                     │             │
│             └── project_team (asesores)           │             │
│                                                   │             │
├─────────────────────────────────────────────────────────────────┤
│                           CRM                                   │
├─────────────────────────────────────────────────────────────────┤
│  leads ──┬── lead_activities (timeline)                        │
│          ├── lead_preferences (matching)                        │
│          └── scheduled_visits                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         BILLING                                 │
├─────────────────────────────────────────────────────────────────┤
│  contracts ──── payment_schedules ──── payments                 │
│                        │                                        │
│                        └── payment_reminders                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        PORTAL                                   │
├─────────────────────────────────────────────────────────────────┤
│  buyers ──┬── buyer_documents                                  │
│           └── buyer_notifications                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Monetización Mejorado

### Tier Gratuito (Actual)
- 1 proyecto activo
- 10 lotes máximo
- Lead capture básico

### Tier Profesional ($99.990/mes)
- 5 proyectos activos
- Lotes ilimitados
- CRM completo + Pipeline
- Pagos online
- Generador de contratos

### Tier Enterprise ($299.990/mes)
- Proyectos ilimitados
- Multi-usuario con roles
- API de integración
- WhatsApp Business
- Reportes personalizados
- Soporte prioritario

---

## Priorización Recomendada

| Prioridad | Feature | Impacto | Esfuerzo |
|-----------|---------|---------|----------|
| 1 | Reservas con pago online | Alto | Medio |
| 2 | Tabla de cuotas y cobranza | Alto | Medio |
| 3 | Pipeline Kanban real | Alto | Bajo |
| 4 | Portal del comprador | Medio | Alto |
| 5 | Generador de contratos PDF | Medio | Medio |
| 6 | Widget cotizador embebible | Medio | Bajo |
| 7 | Dashboard analítico | Medio | Medio |

---

## Próximo Paso Inmediato

**Recomiendo comenzar con la Fase 1.1: Sistema de Reservas Vinculantes**, ya que:
1. Conecta directamente con el flujo actual (formulario de reserva existe pero no cobra)
2. Genera ingresos inmediatos para el desarrollador
3. Reduce fricción en el proceso de compra
4. Utiliza MercadoPago que ya está parcialmente integrado

¿Quieres que implemente el sistema de reservas con pago, o prefieres comenzar por otra fase del plan?
