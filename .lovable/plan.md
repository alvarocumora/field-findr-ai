

# Plan: Ofertaterrenos Chile - MVP Completo

## Analisis del Estado Actual

La plataforma ya cuenta con una base solida. Este plan se enfoca en las piezas faltantes para completar el MVP.

### Ya Implementado (no requiere cambios)
- Marketplace con listings, filtros, mapa Mapbox
- Sistema de reservas con MercadoPago
- Simulador de financiamiento (amortizacion francesa)
- CRM con Kanban y pipeline de leads
- Panel de admin (usuarios, agentes)
- Roles (buyer/agent/admin)
- Due diligence basica (legal tab)
- Portal del comprador (/mi-terreno)
- Generacion de contrato PDF
- Business Intelligence

### Faltante - Se implementara en esta iteracion

## Fase 1: Nuevas Tablas de Base de Datos

### Tabla `credits` - Gestion de Creditos Internos
Permite a los loteadores ofrecer financiamiento directo a compradores, rastreando contratos, cuotas y morosidad.

Columnas: id, reservation_id, lot_id, user_id (seller), buyer_user_id, total_amount, down_payment, financed_amount, interest_rate, term_months, monthly_payment, status (active/completed/defaulted/cancelled), contract_url, started_at, next_payment_date, created_at, updated_at.

### Tabla `credit_payments` - Registro de Pagos de Cuotas
Cada pago individual de un credito.

Columnas: id, credit_id, payment_number, amount, due_date, paid_date, status (pending/paid/overdue/partial), payment_method, receipt_url, notes, created_at.

### Tabla `closing_steps` - Timeline de Cierre Legal
Rastrea el progreso legal de cada transaccion: Reserva, Promesa, Escritura, Inscripcion CBR.

Columnas: id, reservation_id, credit_id, step_type (enum: reserva/promesa/escritura/inscripcion_cbr), status (pending/in_progress/completed/blocked), completed_at, document_url, notes, assigned_to, created_at.

### Tabla `audit_logs` - Registro de Auditoria
Registra acciones criticas del sistema para seguridad y compliance.

Columnas: id, user_id, action, entity_type, entity_id, details (jsonb), ip_address, created_at.

### Tabla `property_approvals` - Aprobacion de Propiedades
Workflow de aprobacion para que admin valide listings antes de publicar.

Columnas: id, listing_id, reviewer_id, status (pending/approved/rejected), rejection_reason, reviewed_at, created_at.

Todas las tablas tendran RLS policies apropiadas usando la funcion `has_role()` existente.

## Fase 2: Modulo de Gestion de Creditos

### Nuevo archivo: `src/components/credits/CreditManager.tsx`
Panel principal para que el loteador gestione creditos activos:
- Lista de creditos con filtros por estado
- KPIs: monto total financiado, cuotas al dia, morosidad
- Alertas de pagos vencidos (destacados en rojo)

### Nuevo archivo: `src/components/credits/CreditDetail.tsx`
Vista detallada de un credito individual:
- Calendario de pagos con estado visual (verde=pagado, amarillo=pendiente, rojo=vencido)
- Boton para registrar pago manual
- Upload de comprobantes
- Historial de pagos

### Nuevo archivo: `src/components/credits/CreateCreditDialog.tsx`
Formulario para crear un credito desde una reserva pagada:
- Seleccionar reservacion
- Configurar pie, tasa, plazo
- Generar calendario automatico
- Vista previa de cuotas

### Nuevo hook: `src/hooks/useCredits.ts`
CRUD para creditos y pagos, con queries para estadisticas de morosidad.

## Fase 3: Timeline de Cierre Legal

### Nuevo archivo: `src/components/closing/ClosingTimeline.tsx`
Componente visual con 4 pasos horizontales conectados:

```text
[Reserva] --> [Promesa] --> [Escritura] --> [Inscripcion CBR]
  (done)      (active)       (pending)        (pending)
```

Cada paso muestra: estado, fecha, documento adjunto, responsable asignado.

### Nuevo archivo: `src/components/closing/ClosingManager.tsx`
Panel para gestionar todos los cierres en curso:
- Lista filtrable por estado
- Acciones: avanzar paso, subir documento, asignar responsable
- Notificaciones de pasos bloqueados

### Integracion con portal del comprador
Agregar el timeline de cierre en `/mi-terreno` para que el comprador vea su progreso.

## Fase 4: Aprobacion de Propiedades (Admin)

### Modificar: `src/components/PropertyInventory.tsx`
Agregar badge de "Pendiente de aprobacion" y filtro por estado de aprobacion.

### Nuevo archivo: `src/components/admin/PropertyApprovalQueue.tsx`
Cola de aprobacion para admin:
- Lista de listings pendientes con preview
- Botones de aprobar/rechazar con motivo
- Estadisticas de aprobacion

### Nueva ruta: `/admin/approvals`
Accesible desde el sidebar del admin.

## Fase 5: Mejoras al CRM

### WhatsApp links
Agregar botones de "Contactar por WhatsApp" en:
- Cards de leads (usando `https://wa.me/{phone}`)
- Detalle de propiedad
- Portal del comprador

No requiere WhatsApp Business API (seria una fase futura), solo deep links.

## Fase 6: Nuevas Rutas

Agregar a `App.tsx`:
- `/asesor/credits` - Gestion de creditos
- `/asesor/closing` - Timeline de cierres
- `/admin/approvals` - Cola de aprobacion
- `/admin/credits` - Vista admin de todos los creditos

Agregar items al sidebar (`ModernSidebar.tsx`).

## Archivos a Crear (nuevos)
- `src/components/credits/CreditManager.tsx`
- `src/components/credits/CreditDetail.tsx`
- `src/components/credits/CreateCreditDialog.tsx`
- `src/components/credits/PaymentCalendar.tsx`
- `src/components/closing/ClosingTimeline.tsx`
- `src/components/closing/ClosingManager.tsx`
- `src/components/admin/PropertyApprovalQueue.tsx`
- `src/hooks/useCredits.ts`
- `src/hooks/useClosingSteps.ts`

## Archivos a Modificar
- `src/App.tsx` - Nuevas rutas
- `src/components/ModernSidebar.tsx` - Nuevos items de menu
- `src/pages/MiTerreno.tsx` - Agregar timeline de cierre
- `src/components/CRMSystem.tsx` - WhatsApp links en leads
- `src/components/leads/LeadFormDialog.tsx` - Boton WhatsApp

## Migraciones SQL
1. Crear enum `closing_step_type` y `closing_step_status`
2. Crear tablas: `credits`, `credit_payments`, `closing_steps`, `audit_logs`, `property_approvals`
3. RLS policies para cada tabla
4. Trigger para actualizar `credits.next_payment_date` cuando se registra un pago
5. Trigger para crear `closing_steps` automaticamente al crear una reserva

## Orden de Implementacion
1. Migraciones SQL (tablas + RLS + triggers)
2. Hooks (useCredits, useClosingSteps)
3. Componentes de creditos
4. Componentes de cierre legal
5. Cola de aprobacion admin
6. WhatsApp links
7. Rutas y sidebar
8. Integracion en MiTerreno

