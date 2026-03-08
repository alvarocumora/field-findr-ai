
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
