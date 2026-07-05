# Code Review — Mejoras aplicadas

_Rama: `claude/code-review-improvements-crbn3u`_

Revisión de código transversal (frontend, hooks, edge functions, build y tooling)
con correcciones aplicadas. Este documento resume qué cambió y qué queda pendiente.

## 1. Bugs de frontend (hooks)

| Archivo | Problema | Fix |
|---|---|---|
| `usePolygonDrawing.ts` | `startDrawing` retornaba antes de `initializeDraw()` (que crea `draw.current`), así que el **primer** dibujo nunca arrancaba. | Se ejecuta `initializeDraw()` antes del guard. |
| `useReservations.ts` | `.eq('lots.project_id', id)` sobre un embed no-inner **no filtra las filas padre** → el dashboard de un proyecto mostraba reservas de otros. | Se usa `lots!inner` cuando hay `projectId`. |
| `useMessages.ts` | `useThreadMessages` era un hook definido **dentro** de otro hook (viola Rules of Hooks) y el canal realtime tenía nombre global colisionable. | Se extrajo como hook exportado y el canal ahora incluye `user.id`. |
| `useMapInstance.ts` | `onBoundsChange` / `onPolygonDrawn` quedaban capturados en un closure obsoleto (el efecto init corre una sola vez). | Se guardan en refs actualizadas cada render. |
| `useSEO.ts` | `jsonLd` en el array de deps re-ejecutaba el efecto y reescribía el DOM en cada render si el caller pasaba un objeto inline. | Se serializa a una key estable. |

## 2. Rendimiento del build

- **Antes:** un único chunk `index-*.js` de **~7.3 MB (2 MB gzip)** se cargaba en **todas** las rutas.
- **Cambios:** `manualChunks` en `vite.config.ts` (separa `mapbox-gl`, `three`, `recharts`,
  `jspdf`/`jszip`, `@turf`, `photo-sphere-viewer`) + **lazy-loading de todas las rutas**
  (`React.lazy` + un `<Suspense>` global en `AppRouter`).
- **Resultado:** la landing ya no descarga Mapbox (1.8 MB) ni el resto de libs específicas
  de páginas internas; el JS inicial bajó de ~2 MB → ~1.2 MB gzip y cada ruta trae solo su chunk.
- Se añadió un **`RootErrorBoundary`** para evitar pantallas en blanco ante errores de render.
- `QueryClient` con defaults sensatos (`staleTime`, `refetchOnWindowFocus: false`, `retry: 1`).

## 3. Hardening de seguridad (edge functions)

| Función | Problema | Fix |
|---|---|---|
| `create-reservation-payment` | El monto de la reserva venía del cliente → se podía reservar un lote por cualquier valor. | El monto se deriva **server-side** de `projects.reservation_deposit`; el valor del cliente se ignora. |
| `mercadopago-webhook` | Sin verificación de firma → replays / pagos falsificados. | Verificación HMAC `x-signature` (activa cuando `MERCADOPAGO_WEBHOOK_SECRET` está configurado). |
| `mercadopago-webhook` | Se logueaba el objeto de pago completo (PII del comprador). | Solo se loguean `id` y `status`. |
| `dispatch-webhooks` | Sin auth y confiaba en `user_id` del body (`verify_jwt=false`). | Requiere service-role bearer o `INTERNAL_FUNCTION_SECRET`. |

### ⚙️ Nuevos secretos a configurar en Supabase

- `MERCADOPAGO_WEBHOOK_SECRET` — clave de firma del webhook (panel de MercadoPago).
  Sin ella la verificación se **omite con un warning** (mantiene compatibilidad, pero es inseguro).
- `INTERNAL_FUNCTION_SECRET` — secreto compartido para llamar a `dispatch-webhooks`
  desde otras funciones/triggers (alternativa al service-role key).

## 4. Tooling / higiene

- `.env` **removido del control de versiones** y añadido a `.gitignore` (se mantiene `.env.example`).
- ESLint: corregidos escapes innecesarios en `sii-lookup`. (`mcp/index.ts` es autogenerado — no se edita.)

## 5. Seguridad — ronda 2 (aplicada)

- **Rate limiting** (`_shared/rateLimit.ts`, sliding-window en memoria por IP, best-effort):
  `ai-natural-search` 10/min, `scrape-real-listings` 10/5min, `public-api` 60/min,
  `submit-interest` 5/min.
- **`submit-interest`**: valida que el proyecto pertenezca al `projectOwnerId` y que el lote
  pertenezca al proyecto; valida formato de UUID/email; recorta longitudes; ya no filtra
  `error.message` interno al cliente.
- **`public-api`**: pasa de `service_role` a la **anon key** — RLS aplica (las políticas
  "Anyone can view active ..." cubren los datos públicos servidos), de modo que un cambio
  futuro de columnas/filtros no puede filtrar filas privadas.
- **`scrape-real-listings`**: whitelist de `country` y saneo de `region`/`limit` para impedir
  la explosión de claves de caché que salteaba el caché de 6h.
- **`ai-natural-search`**: saneo del valor derivado del LLM interpolado en `.or()` de PostgREST
  (inyección de filtros); límite de 500 chars en el query.

## Pendientes recomendados (no aplicados)

- **`npm audit`**: 28 vulnerabilidades (1 crítica en `jsPDF`, alta en `react-router`). Requiere
  actualizar dependencias con QA (algunas son major).
- Tipar los `any` restantes (190+ en `src`).
- Cobertura de **tests**: infraestructura vitest + jsdom + RTL montada (`npm test`), con 17 tests
  sobre amortización de créditos, rate limiter, mensajes de WhatsApp y el diálogo de conversión
  a venta. Ampliar hacia hooks de datos y edge functions.
- Diferir libs pesadas aún presentes en el grafo eager de la landing (`three`, `jspdf`, `recharts`).
- Rate limiting duro (persistente en Postgres/KV) si el best-effort en memoria resulta insuficiente.
