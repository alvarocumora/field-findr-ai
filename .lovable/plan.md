
# Plan: Plataforma Integral de Loteos y Administración

## Sprint 1 ✅ COMPLETADO

### 1. Cotizador Público de Lotes
- Widget público en ProjectDetail (pestaña "Cotizador")
- Selector visual de lotes disponibles con precio y área
- Simulador de financiamiento integrado (pie, plazo, tasa, cuota mensual)
- Formulario de interés sin login (crea lead vía Edge Function `submit-interest`)
- Descarga de cotización PDF

### 2. Portal del Comprador Mejorado (MiTerreno)
- Dashboard con KPIs (reservas activas, total depositado, créditos, valor total)
- Tabs por reserva: Resumen, Cierre Legal, Documentos, Pagos
- Timeline visual de 4 hitos (Reserva → Promesa → Escritura → Inscripción CBR)
- Vista de créditos activos con historial de pagos y alertas de mora
- Botón directo de WhatsApp al asesor
- Descarga de Promesa de Compraventa PDF

## Sprint 2 ✅ COMPLETADO
3. Multi-proyecto Dashboard consolidado
4. Gestión de Pagos de Cuotas mejorada
5. Reportes Automáticos PDF/CSV

## Sprint 3 (Pendiente)
6. Contratos Digitales con Firma
7. Comparador de Lotes intra-proyecto
8. Notificaciones Push/Email

## Sprint 4 (Pendiente)
9. Mapa de Calor de Demanda
10. API de Integración con Portales

---

## Archivos Creados/Modificados en Sprint 1

| Archivo | Acción |
|---------|--------|
| `src/components/projects/PublicLotQuoter.tsx` | Nuevo - Cotizador público |
| `src/components/projects/InterestFormDialog.tsx` | Nuevo - Formulario de interés |
| `supabase/functions/submit-interest/index.ts` | Nuevo - Edge Function para leads públicos |
| `src/pages/ProjectDetail.tsx` | Modificado - Tab Cotizador agregado |
| `src/pages/MiTerreno.tsx` | Reescrito - Portal mejorado con tabs, pagos, timeline |

## Archivos Creados/Modificados en Sprint 2

| Archivo | Acción |
|---------|--------|
| `src/pages/dashboard/MultiProjectDashboard.tsx` | Nuevo - Dashboard multi-proyecto |
| `src/hooks/useMultiProjectMetrics.ts` | Nuevo - Hook de métricas consolidadas |
| `src/pages/dashboard/PaymentManagement.tsx` | Nuevo - Gestión centralizada de pagos |
| `src/hooks/useAllCreditPayments.ts` | Nuevo - Hook de pagos enriquecidos |
| `src/pages/dashboard/Reports.tsx` | Nuevo - Centro de reportes |
| `src/lib/financialReportPdfGenerator.ts` | Nuevo - Generador PDF financiero |
| `src/App.tsx` | Modificado - Rutas Sprint 2 |
| `src/components/ModernSidebar.tsx` | Modificado - Navegación Sprint 2 |
