# Prompt para Lovable — consolidación, funciones críticas y validación integral

Trabaja sobre el repositorio GitHub `alvarocumora/field-findr-ai`.

## Objetivo

Consolidar OfertaTerrenos/Rural Finder como un único ecosistema estable, verificar sus funciones críticas de punta a punta y publicar en producción exactamente la versión aprobada en GitHub.

La prioridad no es agregar funciones nuevas. La prioridad es sincronizar, validar, corregir regresiones y dejar evidencia reproducible.

## Estado de partida obligatorio

1. Sincroniza el proyecto con la rama remota `main`.
2. Confirma que el HEAD sea `d7c50caadd6ee8fe8e16dd54d921e98a5a5b4f2f` o un commit posterior que lo contenga.
3. Lee antes de actuar:
   - `docs/ECOSYSTEM_AUDIT_2026-09-20.md`
   - `src/routes/routeManifest.tsx`
   - `.github/workflows/ci.yml`
   - `.github/workflows/deploy-dreamhost.yml`
4. No reemplaces el repositorio por una copia antigua, no reviertas commits y no reescribas funciones ya aprobadas.
5. Crea una rama `lovable/ecosystem-consolidation-2026-09-20` y entrega todo mediante PR.
6. Si falta una credencial o permiso, detente en esa validación, registra el bloqueo exacto y continúa con las demás. Nunca inventes secretos ni los imprimas.

## P0 — Corregir la brecha de despliegue

Producción está sirviendo una versión anterior a `main`.

Debes:

1. Comparar el código local de Lovable, GitHub `main` y el build que se publica.
2. Asegurar que el landing incluya:
   - `OpportunityHubSection`
   - fotografías reales en tarjetas
   - match, tasación, comunidad y referidos
   - textos “$100.000” y “Desde $500.000”
3. Asegurar que `/para-inmobiliarias` incluya:
   - “El panel que recibe tu equipo”
   - `LoteoDashboardPreview`
   - demo “Control de Loteo · Proyecto Mirador”
4. Asegurar que `/tools?tab=price-predictor` abra directamente el predictor.
5. Implementar un `/version.json` portable, generado en cada build independientemente del proveedor, con:
   - `commit`
   - `deployed_at` en UTC
   - `provider`
6. Publicar desde el commit validado y comprobar que el SHA de `/version.json` coincide con el commit desplegado.
7. Definir y documentar una sola ruta principal de despliegue:
   - Lovable como producción principal, o
   - DreamHost como producción principal.
   
   Si DreamHost queda sólo como fallback, indícalo claramente y evita despliegues dobles o contradictorios.

## Validación técnica obligatoria

Ejecuta y registra resultados completos:

```bash
npm install --no-audit --no-fund
npx tsc --noEmit
npm test
npm run build
npm run lint
```

Reglas:

- Typecheck, pruebas y build deben quedar en verde.
- No ocultes fallos con `|| true`.
- Si lint contiene deuda histórica, separa errores preexistentes de errores nuevos; corrige primero todo lo introducido o tocado por esta consolidación.
- Revisa la deriva entre `package.json` y `package-lock.json`. Si puedes corregirla sin actualizar dependencias funcionales, regenera el lockfile y cambia CI a `npm ci`.
- No realices upgrades masivos de paquetes en este PR.

## Smoke test público

Valida en escritorio y móvil que rendericen sin 404, pantalla blanca ni error global:

- `/`
- `/explorar`
- `/search`
- `/quiz`
- `/tools?tab=price-predictor`
- `/comunidad`
- `/referidos`
- `/brokers`
- `/brokers/inscripcion`
- `/planes-loteos`
- `/para-inmobiliarias`
- `/contacto-loteos`
- `/mercado`
- `/comparar`
- `/alertas`
- `/eventos`
- `/version.json`

Además:

- comprueba navegación de todos los CTA principales;
- confirma que no existan enlaces internos muertos;
- revisa consola por errores reales de la aplicación;
- valida carga de imágenes, fuentes, Mapbox y datos Supabase;
- verifica que Mapbox tenga fallback usable si WebGL falla;
- confirma SEO básico: título, descripción, canonical y un `h1` por página;
- comprueba que sitemap y robots incluyan sólo rutas públicas indexables.

## Flujos críticos por perfil

Usa cuentas de prueba existentes. No crees datos ficticios en producción si no existe un entorno de prueba aislado.

### Visitante/comprador

1. Buscar en lenguaje natural.
2. Completar quiz/match.
3. Abrir proyecto y experiencia.
4. Seleccionar parcela.
5. Comparar y guardar favorito/alerta.
6. Solicitar contacto o visita.
7. Iniciar reserva sólo en sandbox.
8. Confirmar estados vacíos, carga y error.

### Referidos y comunidad

1. Abrir comunidad y ranking.
2. Inscribirse como broker con un registro de prueba controlado.
3. Generar enlace/código de referido.
4. Confirmar atribución desde el enlace hasta el lead.
5. Evitar códigos duplicados y doble recompensa.
6. Validar que los montos comerciales estén sujetos a términos y cierre efectivo.

### Asesor/inmobiliaria

1. Crear o seleccionar proyecto.
2. Importar o cargar lotes.
3. Editar precios individualmente y en masa.
4. Publicar fichas en marketplace.
5. Usar el mapa de inventario.
6. Recibir y gestionar lead.
7. Generar cotización compartible.
8. Crear visita y reserva.
9. Convertir reserva pagada en venta.
10. Revisar comisión y reportes.
11. Validar el nuevo indicador de preparación comercial.
12. Confirmar aislamiento por organización y proyecto.

### Administrador

1. Usuarios y roles.
2. Aprobación de propiedades y proyectos.
3. Brokers y captaciones.
4. Ventas y comisiones.
5. Documentos, auditoría y soporte.
6. Confirmar que un usuario no administrador no pueda acceder por URL directa ni por API.

## Integridad transaccional

Valida con pruebas automatizadas o sandbox:

- transición de lote: disponible → reservado → vendido;
- rechazo de doble reserva concurrente;
- expiración de reservas;
- idempotencia de webhooks de pago;
- idempotencia de conversión reserva → venta;
- consistencia entre venta, inventario y comisión;
- ciclo de comisión: potencial → reservada → devengada → aprobada → pagada;
- cancelación/reverso sin saldos huérfanos;
- trazabilidad con timestamps, usuario y proyecto;
- operaciones sensibles protegidas por RPC/Edge Function y RLS, no sólo por la interfaz.

No ejecutes cobros reales. Usa exclusivamente Mercado Pago sandbox/test.

## Supabase y Edge Functions

Existen 28 Edge Functions y 121 migraciones. Verifica:

1. migraciones aplicadas y ordenadas;
2. funciones desplegadas y alineadas con el código;
3. variables requeridas presentes, informando sólo nombre y estado, nunca valor;
4. CORS limitado correctamente;
5. autenticación/autorización por función;
6. rate limiting en funciones públicas;
7. validación Zod o equivalente de entradas;
8. errores seguros sin filtrar secretos;
9. logs suficientes para reserva, pago, venta, comisión, tasación, búsqueda IA y publicación;
10. RLS para comprador, asesor, organización y administrador.

Prioriza:

- `get-mapbox-token`
- `ai-natural-search`
- `smart-match-notify`
- `create-reservation-payment`
- `mercadopago`
- `mercadopago-webhook`
- `publish-listing`
- `submit-interest`
- `anchor-tasacion`
- `verify-tasacion-ots`
- `manage-team`
- `admin-users`
- `public-api`
- `dispatch-webhooks`

## Pruebas que deben agregarse si faltan

- Smoke tests de rutas públicas.
- Test de `?tab=price-predictor`.
- Test de guardas comprador/asesor/admin.
- Test de enlaces contra `routeManifest`.
- Test de reserva concurrente.
- Test de webhook de pago repetido.
- Test de conversión a venta repetida.
- Test del ciclo de comisión.
- Test de alcance por organización.
- Test de generación de `version.json`.
- Test de fallback sin WebGL.

## Reglas de corrección

- Cambios pequeños, trazables y agrupados por causa.
- No rediseñar nuevamente el landing.
- No cambiar montos, planes ni textos comerciales sin autorización.
- No eliminar datos, migraciones o funciones.
- No tocar credenciales.
- No crear rutas fuera de `routeManifest.tsx`.
- Mantener soporte de movimiento reducido, móvil y accesibilidad.
- Preservar URLs SEO y aliases existentes.
- Si una prueba exige datos reales, usar fixtures o sandbox y limpiar sólo los datos de prueba creados por esta ejecución.

## Criterio final de aprobación

No declares “todo funciona” hasta cumplir simultáneamente:

1. GitHub CI verde.
2. Build Lovable verde.
3. Producción publicada desde el SHA reportado.
4. `/version.json` coincide con ese SHA.
5. Marcadores de PR #131 y #132 visibles en producción.
6. Smoke tests públicos aprobados.
7. Pruebas autenticadas por rol aprobadas o bloqueos documentados.
8. Reserva, pago, venta y comisión validados en sandbox.
9. Sin errores críticos de consola.
10. Sin regresiones en móvil.

## Entrega esperada

Al finalizar, responde con:

1. commit y PR;
2. URL de producción;
3. contenido verificado de `/version.json`;
4. tabla PASS/FAIL/BLOCKED por ruta;
5. tabla PASS/FAIL/BLOCKED por flujo crítico;
6. resultados de typecheck, tests, build y lint;
7. Edge Functions y secretos verificados por nombre/estado;
8. correcciones realizadas;
9. riesgos pendientes;
10. capturas de escritorio y móvil del landing, explorador, proyecto, control de loteo y página para inmobiliarias.
