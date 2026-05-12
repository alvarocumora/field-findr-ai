# Routes Map — OfertaTerrenos / Field Findr AI

Este documento describe la organización de rutas después del refactor de Sprint 1.

## Objetivo

Reducir el tamaño y riesgo de `src/App.tsx`, separando rutas por dominio funcional sin cambiar comportamiento existente.

## Archivos de rutas

- `src/routes/AppRouter.tsx`: compone todas las rutas dentro de `BrowserRouter` y `Routes`.
- `src/routes/publicRoutes.tsx`: rutas públicas y de resultados públicos.
- `src/routes/buyerRoutes.tsx`: rutas de comprador y perfil.
- `src/routes/agentRoutes.tsx`: rutas de asesor/corredor.
- `src/routes/adminRoutes.tsx`: rutas de administración.
- `src/routes/legacyRedirects.tsx`: redirects de URLs antiguas.
- `src/routes/routeUtils.tsx`: utilidades compartidas para rutas, como loading fallback.

## Rutas públicas

| Ruta | Vista | Protección |
|---|---|---|
| `/` | Landing | Pública |
| `/auth` | Auth | Pública |
| `/explorar` | Explorador | Pública |
| `/propiedad/:id` | Ficha propiedad | Pública |
| `/proyecto/:id` | Ficha proyecto | Pública |
| `/pricing` | Pricing | Pública |
| `/tools` | Herramientas | Pública |
| `/search` | Búsqueda inteligente | Pública |
| `/instalar` | Instalación PWA | Pública |
| `/referidos` | Referidos | Pública |
| `/region/:slug` | Landing región | Pública |
| `/pais/:code` | Landing país | Pública |
| `/ciudad/:slug` | Landing ciudad | Pública |
| `/contacto` | Contacto | Pública |
| `/comparar` | Comparador | Pública |
| `/alertas` | Alertas | Pública |
| `/blog` | Blog | Pública |
| `/oportunidades` | Oportunidades | Pública |
| `/quiz` | Quiz comprador | Pública |
| `/proyecto/:id/experiencia` | Experiencia proyecto | Pública |
| `/reset-password` | Reset password | Pública |
| `/subscription/success` | Resultado suscripción | Pública |
| `/subscription/failure` | Resultado suscripción | Pública |
| `/reserva/exito` | Resultado reserva | Pública |
| `/reserva/error` | Resultado reserva | Pública |
| `/reserva/pendiente` | Resultado reserva | Pública |

## Rutas comprador

| Ruta | Vista | Protección |
|---|---|---|
| `/buyer/home` | Home comprador | `BuyerLayout`, requiere sesión |
| `/favoritos` | Favoritos | `BuyerLayout`, requiere sesión |
| `/mi-terreno` | Mi Terreno | `BuyerLayout`, requiere sesión |
| `/profile` | Perfil | `ProtectedRoute requireAuth` |
| `/subscription` | Suscripción | `ProtectedRoute requireAuth` |

Nota: `BuyerLayout` ya valida sesión y redirige a `/auth` si no hay usuario.

## Rutas asesor / corredor

Todas usan `DashboardLayout requiredRole="agent"`, salvo `/publish`, que usa `ProtectedRoute requireAuth requireRole="agent"`.

| Ruta | Vista |
|---|---|
| `/asesor/dashboard` | Dashboard asesor |
| `/asesor/opportunities` | Oportunidades de suelo |
| `/asesor/opportunity/:id` | Detalle oportunidad |
| `/asesor/contacts` | Contactos |
| `/asesor/listings` | Inventario |
| `/asesor/leads` | Leads |
| `/asesor/projects` | Proyectos |
| `/asesor/lots` | Lotes |
| `/asesor/analytics` | Analytics |
| `/asesor/crm` | CRM |
| `/asesor/sales` | Ventas |
| `/asesor/reservations` | Reservas |
| `/asesor/credits` | Créditos |
| `/asesor/closing` | Cierre |
| `/asesor/messages` | Mensajes |
| `/asesor/enterprise` | Empresa |
| `/asesor/executive` | Dashboard ejecutivo |
| `/asesor/financial` | Dashboard financiero |
| `/asesor/performance` | Performance |
| `/asesor/pipeline` | Pipeline |
| `/asesor/multi-project` | Multi proyecto |
| `/asesor/payments` | Pagos |
| `/asesor/reports` | Reportes |
| `/asesor/notifications` | Notificaciones |
| `/asesor/demand` | Demanda |
| `/asesor/api` | API portal |
| `/asesor/tools` | Herramientas |
| `/asesor/profile` | Perfil asesor |
| `/publish` | Publicar propiedad |

## Rutas admin

Todas usan `DashboardLayout requiredRole="admin"`.

| Ruta | Vista |
|---|---|
| `/admin/dashboard` | Dashboard admin |
| `/admin/users` | Usuarios |
| `/admin/agents` | Agentes |
| `/admin/reservations` | Reservas |
| `/admin/approvals` | Aprobaciones |
| `/admin/credits` | Créditos |
| `/admin/analytics` | Analytics |
| `/admin/financial` | Financiero |
| `/admin/documents` | Documentos |
| `/admin/projects` | Proyectos |
| `/admin/audit` | Auditoría |

## Redirects legacy

| Ruta antigua | Redirige a |
|---|---|
| `/favorites` | `/favoritos` |
| `/dashboard` | `/asesor/dashboard` |
| `/inventory` | `/asesor/listings` |
| `/leads` | `/asesor/leads` |
| `/projects` | `/asesor/projects` |
| `/lots` | `/asesor/lots` |
| `/analytics` | `/asesor/analytics` |
| `/crm` | `/asesor/crm` |
| `/sales` | `/asesor/sales` |
| `/agents` | `/admin/agents` |
| `/compare` | `/comparar` |
| `/calculators` | `/tools` |
| `/price-predictor` | `/tools` |
| `/risk-analysis` | `/tools` |
| `/ai-recommendations` | `/tools` |
| `/urbanization` | `/asesor/projects` |

## Catch-all

Toda ruta no reconocida cae en `NotFound`.

## QA mínimo después de modificar rutas

- Abrir `/`.
- Abrir `/explorar`.
- Abrir `/propiedad/:id`.
- Abrir `/buyer/home` sin sesión.
- Abrir `/asesor/dashboard` sin sesión.
- Abrir `/admin/dashboard` sin sesión.
- Probar `/dashboard` y confirmar redirect a `/asesor/dashboard`.
- Probar `/favorites` y confirmar redirect a `/favoritos`.
