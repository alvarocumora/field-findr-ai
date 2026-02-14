

# Plan Completo para Terminar la Plataforma Funcional

## Estado Actual

La plataforma tiene una estructura solida con +50 componentes, base de datos con 13 tablas, autenticacion, roles, y un sistema de rutas por rol. Sin embargo, varias funcionalidades clave estan simuladas o incompletas.

### Lo que YA funciona con datos reales:
- Autenticacion (signup/login con roles buyer/agent)
- CRUD de Listings, Projects, Lots, Leads
- Explorador publico con filtros
- Reservas con MercadoPago
- Portal del comprador (Mi Terreno)
- Dashboard del agente con stats reales
- Onboarding wizard para nuevos agentes
- Generacion de PDF de contrato
- Sistema de creditos/pagos a cuotas
- Cierre legal con timeline

### Lo que esta SIMULADO o INCOMPLETO:
1. **Formulario de contacto** - solo hace console.log, no guarda en DB ni notifica
2. **Boton "Agendar visita"** - no hace nada
3. **Boton "Descargar ficha PDF"** en PropertyDetail - no implementado
4. **Panel de datos de terreno (LandDataPanel)** - usa datos demo
5. **Notificaciones** - no hay sistema de notificaciones real
6. **Galeria de proyectos** - sin funcionalidad de subida de imagenes
7. **Busqueda AI** - depende de edge function que puede no tener API key configurada
8. **Mensajeria interna** - tabla `messages` existe pero no hay UI funcional

---

## Fase 1: Funcionalidades Criticas de Contacto (Prioridad Alta)

### 1.1 Conectar Formulario de Contacto a la DB
- Reemplazar el `console.log` en `ContactForm.tsx` por un INSERT real a la tabla `messages`
- Enviar el mensaje al `user_id` del listing (propietario)
- Mostrar confirmacion real al usuario

### 1.2 Implementar "Agendar Visita"
- Crear tabla `visit_requests` (listing_id, requester info, preferred_date, status, notes)
- Agregar formulario modal al hacer click en "Agendar visita"
- El agente ve las solicitudes en su dashboard

### 1.3 Generar Ficha PDF de Propiedad
- Usar `jsPDF` (ya instalado) para generar una ficha con: titulo, precio, area, ubicacion, descripcion, servicios, imagen principal
- Conectar el boton "Descargar ficha PDF" en `PropertyDetail.tsx`

---

## Fase 2: Sistema de Notificaciones y Mensajeria

### 2.1 Bandeja de Mensajes
- Crear pagina `/asesor/messages` con lista de conversaciones
- Usar tabla `messages` existente con queries agrupadas por `thread_id`
- Agregar enlace en sidebar del agente
- Habilitar Realtime para mensajes nuevos

### 2.2 Notificaciones In-App
- Crear tabla `notifications` (user_id, type, title, message, read, link, created_at)
- Trigger: nueva reserva, nuevo mensaje, nuevo lead, pago recibido
- Campanita en el header con badge de no leidos
- Panel dropdown con lista de notificaciones

---

## Fase 3: Galeria de Proyectos

### 3.1 Subida de Imagenes para Proyectos
- Agregar columna `images` (text[]) a tabla `projects`
- Reutilizar componente `ImageUploader` existente
- En la tab "Info" de ProjectDetail, mostrar galeria real si hay imagenes
- En el wizard de creacion de proyecto, agregar paso de imagenes

---

## Fase 4: Mejoras del Dashboard y Operaciones

### 4.1 Filtro por Proyecto en Analytics
- Agregar selector de proyecto en `AnalyticsDashboard.tsx`
- Filtrar metricas (revenue, lotes, leads) por proyecto seleccionado

### 4.2 Exportar Reportes
- Boton "Exportar PDF" en Analytics que genere un resumen ejecutivo
- Incluir graficos principales, KPIs, y tabla de lotes

### 4.3 Vincular Calculadoras a Datos Reales
- En `FinancialCalculators.tsx`, agregar selector de lote existente
- Pre-cargar precio, area y proyecto automaticamente

---

## Fase 5: Pulido y Produccion

### 5.1 Validaciones y Edge Cases
- Manejar estado vacio en todas las paginas (empty states consistentes)
- Agregar loading states faltantes
- Validar que el flujo de reserva funcione end-to-end con MercadoPago

### 5.2 SEO y Meta Tags
- Agregar meta tags dinamicos en PropertyDetail y ProjectDetail
- Open Graph tags para compartir en redes sociales

### 5.3 Revisar Seguridad
- Auditar RLS policies en todas las tablas
- Verificar que las edge functions validen tokens correctamente
- Asegurar que datos sensibles no se expongan en queries publicas

---

## Detalle Tecnico por Fase

### Fase 1 - Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| `src/components/property/ContactForm.tsx` | Reemplazar simulacion por INSERT a `messages` |
| Migracion SQL | Crear tabla `visit_requests` |
| `src/components/property/VisitRequestDialog.tsx` | NUEVO - Modal para agendar visita |
| `src/pages/PropertyDetail.tsx` | Conectar botones "Agendar visita" y "Descargar PDF" |
| `src/lib/propertyPdfGenerator.ts` | NUEVO - Generador de ficha PDF de propiedad |

### Fase 2 - Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Crear tabla `notifications` con RLS |
| `src/hooks/useNotifications.ts` | NUEVO - Hook para CRUD de notificaciones |
| `src/hooks/useMessages.ts` | NUEVO - Hook para mensajeria |
| `src/components/notifications/NotificationBell.tsx` | NUEVO - Campanita en header |
| `src/components/notifications/NotificationPanel.tsx` | NUEVO - Panel de notificaciones |
| `src/pages/dashboard/Messages.tsx` | NUEVO - Pagina de mensajes |
| `src/components/navigation/StickyHeader.tsx` | Agregar NotificationBell |
| `src/components/ModernSidebar.tsx` | Agregar enlace a Mensajes |
| `src/App.tsx` | Agregar ruta `/asesor/messages` |

### Fase 3 - Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Agregar columna `images text[]` a `projects` |
| `src/components/projects/CreateProjectWizard.tsx` | Agregar paso de imagenes |
| `src/pages/ProjectDetail.tsx` | Mostrar galeria real en tab Info |

### Fase 4 - Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| `src/components/tools/AnalyticsDashboard.tsx` | Agregar filtro por proyecto y boton exportar |
| `src/components/tools/FinancialCalculators.tsx` | Agregar selector de lote real |
| `src/lib/reportPdfGenerator.ts` | NUEVO - Generador de reporte PDF |

### Fase 5 - Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| `index.html` | Meta tags base |
| `src/pages/PropertyDetail.tsx` | useEffect para document.title y meta OG |
| `src/pages/ProjectDetail.tsx` | useEffect para document.title y meta OG |
| Revision de seguridad | Auditoria de RLS y edge functions |

---

## Orden de Implementacion Recomendado

1. **Fase 1** (contacto + PDF) - impacto inmediato en conversion de usuarios
2. **Fase 3** (galeria) - mejora visual rapida
3. **Fase 2** (notificaciones) - engagement de agentes
4. **Fase 4** (analytics mejorado) - valor para usuarios premium
5. **Fase 5** (pulido) - preparacion para produccion

Cada fase puede implementarse de forma independiente sin romper funcionalidad existente.

