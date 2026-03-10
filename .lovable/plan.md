

# Mejora del Sistema de Administración: Proyectos, Usuarios, Roles y Documentos

## Diagnóstico

El sistema actual tiene varias limitaciones:
1. **DashboardAdmin**: Tabs de "Analíticas" y "Seguridad" son placeholders vacíos. La tabla de usuarios es básica sin acciones inline.
2. **AdminUsers**: Funcional pero sin filtros por rol, sin bulk actions, sin vista de actividad reciente.
3. **ProjectsManagement**: Usa datos reales de DB pero no tiene vista de documentos legales ni estado de cumplimiento integrado.
4. **TransactionDocuments**: Funciona bien pero está aislado solo en el flujo de cierre.
5. **Sidebar Admin**: Solo 7 items, falta acceso a documentos y proyectos globales.

## Plan de Implementación

### 1. Rediseño del Panel Admin Principal (`DashboardAdmin.tsx`)
- Agregar stats de proyectos activos, documentos pendientes de revisión, roles asignados
- Tab "Seguridad" → mostrar `audit_logs` reales con filtros por acción/usuario/fecha
- Tab "Analíticas" → gráficos con Recharts: registros por semana, distribución de roles, propiedades por estado
- Tab "Documentos" → nueva tab que muestra todos los `transaction_documents` y `documents` del sistema con filtros por estado/tipo

### 2. Mejora de Gestión de Usuarios (`AdminUsers.tsx`)
- Agregar filtros por rol (buyer/agent/admin) y por plan (free/pro/enterprise)
- Columna de "último acceso" (usar `updated_at` de profiles)
- Acciones en bulk: asignar rol a múltiples usuarios
- Indicador visual de usuarios sin rol asignado
- Dialog de detalle de usuario con: roles, suscripción, propiedades, documentos, actividad reciente
- Botón de exportar lista a CSV

### 3. Gestión de Proyectos con Documentos Integrados (`ProjectsManagement.tsx`)
- Agregar columna/badge de "Documentos" que muestra conteo de docs pendientes vs aprobados por proyecto
- Vista expandible por proyecto que muestra sus documentos legales inline
- Indicador de cumplimiento legal (% documentos aprobados)
- Filtros por estado de cumplimiento: completo, parcial, sin documentos

### 4. Centro de Documentos Global (nuevo componente)
**Archivo:** `src/components/admin/DocumentCenter.tsx`
- Vista unificada de todos los documentos del sistema (transaction_documents + documents)
- Filtros por: tipo de documento, estado, proyecto, fecha límite
- Bulk review: aprobar/rechazar múltiples documentos
- Alertas de documentos vencidos o próximos a vencer
- Estadísticas: docs por estado, tiempo promedio de revisión

### 5. Nuevas rutas y sidebar
- Agregar `/admin/documents` → DocumentCenter
- Agregar `/admin/projects` → vista admin de todos los proyectos
- Actualizar `ModernSidebar.tsx` con nuevos items: "Documentos" y "Proyectos" en sección admin

## Archivos a Modificar/Crear

| Archivo | Cambio |
|---------|--------|
| `src/pages/dashboard/DashboardAdmin.tsx` | Tabs funcionales: Analíticas con Recharts, Seguridad con audit_logs, nueva tab Documentos |
| `src/pages/AdminUsers.tsx` | Filtros por rol/plan, bulk actions, dialog detalle, export CSV |
| `src/components/admin/DocumentCenter.tsx` | **Nuevo** — Centro global de documentos |
| `src/components/ModernSidebar.tsx` | Agregar items Documentos y Proyectos en admin nav |
| `src/App.tsx` | Agregar rutas `/admin/documents` y `/admin/projects` |
| `src/hooks/useDashboardStats.ts` | Agregar queries para audit_logs y document stats |

## Resultado Visual

```text
Admin Dashboard
┌─────────────────────────────────────────────────┐
│  Stats: Usuarios │ Proyectos │ Docs Pend │ Roles│
├─────────────────────────────────────────────────┤
│ [Usuarios] [Propiedades] [Reservas] [Docs]      │
│ [Analíticas] [Seguridad]                        │
│                                                 │
│ Tab Usuarios:                                   │
│  [Filter: Rol ▼] [Plan ▼] [Buscar...]          │
│  ┌─ User ─── Roles ─── Plan ─── Acciones ────┐ │
│  │ Juan P.   [admin]    Pro      [⋮ Editar]   │ │
│  │ María S.  [agent]    Free     [⋮ Editar]   │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│ Tab Documentos:                                 │
│  [Tipo ▼] [Estado ▼] [Proyecto ▼]              │
│  ┌─ Doc ──── Estado ── Proyecto ── Vence ─────┐│
│  │ Cédula    ⏳Pend    Las Palmas  15/03/26   ││
│  │ Escritura ✅Aprob   El Roble    -          ││
│  └────────────────────────────────────────────┘│
│                                                 │
│ Tab Seguridad:                                  │
│  Audit logs reales con filtros                  │
│                                                 │
│ Tab Analíticas:                                 │
│  Charts: Registros/sem, Roles pie, Props bar    │
└─────────────────────────────────────────────────┘
```

