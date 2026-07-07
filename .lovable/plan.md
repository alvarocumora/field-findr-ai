
# Auditoría E2E: Flujo de Publicar Propiedad + Fixes críticos

Alcance acotado a lo elegido: **Publicar propiedad (wizard + aprobación → marketplace)**. Los otros módulos (loteos, buscador, CRM/comisiones) quedan para pases siguientes.

## Objetivo

Recorrer el flujo completo `/publish` → creación en `listings` → cola `property_approvals` → activación → visible en `/explorar` y `/propiedad/:id`, detectar los bloqueantes y arreglarlos en este mismo pase.

## Cobertura de auditoría

1. **Autorización de entrada**
   - `/publish` protegido por `ProtectedRoute requireRole="agent"`. Verifico que agentes/inmobiliarias/admin entren y buyers sean redirigidos.
   - Toast de "Inicia sesión" en `handlePublish` cuando no hay sesión.

2. **Wizard (`PublishForm.tsx`, 4 pasos)**
   - Validaciones por paso (`validateStep`): título/tipo/área, ubicación/región, precio.
   - Uploads (`ImageUploader` → bucket `property-images`, público).
   - Selector de ubicación (`LocationPicker` + Mapbox token).
   - Moneda/país (LATAM), UF/CLP, tags, utilities, subdivision.

3. **Enforcement de plan**
   - `usePlanLimits` vs. cuota real de listings activos del usuario.
   - Botón "Publicar" debe bloquearse (o mostrar upgrade) al superar el límite del plan Corredor/Corredora/Inmobiliaria/Grupo. Hoy `PublishForm` **no** consulta `usePlanLimits` — es candidato #1 a fix.

4. **Inserción y triggers**
   - `useCreateListing` inserta con `status='pending_review'` → trigger `enqueue_listing_approval` crea fila en `property_approvals`.
   - Notificación al admin (revisar si existe).
   - Al aprobar: trigger `sync_listing_status_from_approval` pasa `listings.status='active'` y notifica al dueño.

5. **Visibilidad pública**
   - Aparece en `/explorar`, `/propiedad/:id`, city landings.
   - Imágenes cargan desde el bucket público.
   - RLS permite lectura anónima solo para `status='active'`.

6. **Estados de rechazo y edición**
   - Rechazo escribe motivo, notifica y marca listing como `rejected`.
   - Botón "Republicar" tras corregir (verificar si existe).

7. **Errores/UX**
   - Manejo de errores del mutation, toasts.
   - Navegación post-publicación (`/mi-terreno`).
   - Estado "Cargando…" atascado observado en la home (session replay) — investigar si afecta la ruta post-publish.

## Método de verificación

- Playwright headless contra `http://localhost:8080` restaurando sesión del agente inyectada (`LOVABLE_BROWSER_AUTH_STATUS`). Si el usuario logueado no es agente, uso un usuario con rol `agent` real vía SQL de prueba (no cambio credenciales productivas).
- Recorro: login → `/publish` → completo los 4 pasos con datos sintéticos → verifico fila en `listings` + `property_approvals` → apruebo con SQL admin → confirmo aparición en `/explorar`.
- Screenshots por paso, guardados en `/tmp/browser/publish-audit/`.

## Fixes críticos que aplico en este pase

Solo si la auditoría los confirma como bloqueantes (no toco lo que ya funciona):

1. **Enforcement de plan en el wizard**
   - Integrar `usePlanLimits` en `PublishForm`: banner con cuota (`X de Y usados`), bloquear botón "Publicar" y CTA a `/pricing` si `canPublish === false`.

2. **Validación server-side de cuota**
   - Añadir chequeo en `useCreateListing` (o edge function `submit-interest`-style) que rechace la inserción si el usuario excede su plan — evita bypass del cliente.

3. **Feedback tras publicar**
   - Reemplazar `navigate('/mi-terreno')` mudo por toast de éxito con estado "En revisión" + link a la aprobación.

4. **Republicar tras rechazo**
   - Si el listing quedó en `rejected`, permitir reabrir el wizard con datos precargados y setear `status='pending_review'` de nuevo (dispara `enqueue_listing_approval` con `ON CONFLICT DO NOTHING`, hay que revisar el ON CONFLICT — puede impedir reencolar).

5. **Bugs concretos** encontrados durante el recorrido Playwright (imagen que no sube, campo requerido faltante, etc.) — se listan al reportar.

## Detalles técnicos

- Archivos a editar (previsto): `src/components/publish/PublishForm.tsx`, `src/hooks/useListings.ts`, posiblemente `supabase/migrations/*` si `enqueue_listing_approval` necesita permitir reencolar tras rechazo.
- No toco `mercadopago`, `useSubscription`, `AdminUsers` — fuera de alcance.
- Sin cambios en tokens de diseño, RLS de otras tablas ni edge functions no relacionadas.

## Entregable

- Reporte breve en el chat: qué probé, qué pasó, qué arreglé, qué quedó pendiente (con severidad).
- Screenshots como evidencia.
- Los demás módulos (loteos, buscador, comisiones) los abordo en pases separados cuando lo confirmes.
