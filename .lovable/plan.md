

# Plan: Revisión y Corrección de la Plataforma

## Problema Principal Detectado

El error visible en las network requests es que la URL `/proyecto/:id` se carga con el literal `:id` en vez de un UUID real. Esto causa errores 400 en todas las queries a la base de datos:
```
"invalid input syntax for type uuid: \":id\""
```

Esto ocurre porque `useParams()` devuelve la cadena literal `:id` y las queries tienen `enabled: !!id` que pasa como `true` para cualquier string no vacío. Sin embargo, este no es un bug de código sino una navegación directa a la URL literal. La corrección debe ser defensiva: validar que `id` sea un UUID válido antes de ejecutar queries.

## Cambios

### 1. Validar UUID en ProjectDetail.tsx

En `src/pages/ProjectDetail.tsx`, agregar validación del parámetro `id` antes de las queries:

```typescript
const isValidUUID = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
```

- Cambiar `enabled: !!id` a `enabled: !!isValidUUID` en ambas queries (project y lots)
- Mostrar un mensaje de error amigable si `id` no es válido (redirigir a explorar o mostrar "Proyecto no encontrado")

### 2. Aplicar la misma protección en PropertyDetail.tsx

Mismo patrón defensivo para evitar queries con IDs inválidos.

### 3. Revisar Leads (LeadManagement.tsx)

El componente y hook `useLeads` se ven correctos. Las queries están protegidas con `enabled: !!user?.id` y filtran por `user_id`. Sin problemas detectados.

### 4. Revisar Executive Dashboard

El `ExecutiveDashboard.tsx` funciona correctamente. Usa `useProjects`, `useLots`, `useLeads`, `useCredits` -- todos protegidos con `enabled: !!user?.id`. Sin problemas detectados.

### 5. Revisar flujo de carga de proyecto (CreateProjectWizard)

El wizard se ve bien estructurado con 8 pasos. Sin errores detectados en el código.

## Resumen de Archivos a Modificar

1. `src/pages/ProjectDetail.tsx` -- Agregar validación UUID y fallback UI
2. `src/pages/PropertyDetail.tsx` -- Misma protección UUID

## Alcance

Corrección defensiva menor. Los demás flujos (leads, ejecutivo, creación de proyecto) funcionan correctamente.

