# PR 0 — Base y orden de integración

Fecha: 29 de octubre de 2026. Base: `80178ab45dcbae5a0fe957858bbabc19df209f1c`.

## Resultado

La API GitHub funciona. El fallo remoto actual de CI no demuestra un fallo de código: el job no comenzó por facturación/límite de gasto. Hay nueve PR abiertos, siete con conflictos. No se integraron ni cerraron durante este diagnóstico.

Evidencia: [ejecución CI de main](https://github.com/alvarocumora/field-findr-ai/actions/runs/40907835832), check `123567362519`. La anotación dice: “The job was not started because recent account payments have failed or your spending limit needs to be increased.” El titular de la cuenta debe resolverlo en Billing & plans; ningún cambio de YAML soluciona ese bloqueo.

La consulta de protección de `main` devuelve HTTP 403 “Resource not accessible by integration”. No se pudo verificar su configuración; no significa que no haya protección.

## Validación local

- Instalación congelada: `NODE_USE_ENV_PROXY=1 npm ci --no-audit --no-fund`, correcta con caché temporal escribible. Sin cambios al lockfile. El primer intento sin soporte de proxy falló al descargar paquetes; no se atribuye a integridad del lockfile.
- `npm run typecheck`: correcto.
- `VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=ci-test-publishable-key npm test -- --maxWorkers=2`: 80 archivos, 457 pruebas correctas.
- `npm run lint`: bloqueado antes del análisis por `@typescript-eslint/no-unused-expressions`, lectura de `allowShortCircuit` sobre undefined (ESLint 9.39.4). Tratar compatibilidad/configuración en un PR propio, sin desactivar reglas ni actualizar masivamente dependencias.
- Build completo con Node 20.20.2 y Bun: correcto, incluyendo PWA (`dist/sw.js`). El primer intento compiló pero falló en una consulta externa de `closeBundle`; repetir con Undici 6.21.3 `EnvHttpProxyAgent` mediante `NODE_OPTIONS=--require=/tmp/pr0-tools/proxy.cjs` resolvió el acceso de red del entorno. Herramientas y adaptación de proxy instaladas fuera del repositorio, sin cambios de aplicación. Persisten advertencias de chunks grandes y utilidades Tailwind ambiguas.
- Empaquetado: `dist/.htaccess` y entradas de sitemap para `/planes-loteos` y `/contacto-loteos`, correctos. `git diff --check`, correcto.

Instalación, tipos y pruebas anteriores ejecutados con Node 24.19.0/npm 11.9.0 del entorno. CI declara Node 20. El build usa Node 20 instalado fuera del repositorio y Bun para los prehooks existentes. No se certifica equivalencia completa de runtimes.

## Triage de PR existentes

Estado observado mediante API; las decisiones requieren revisión final del diff contra `main` y pruebas actuales. No equivalen a aprobación de merge.

| PR | Estado actual | Evidencia y siguiente acción |
|---|---|---|
| [#215](https://github.com/alvarocumora/field-findr-ai/pull/215) | Conflictos; objetivo vigente | `ProjectsManagement` todavía usa `soldCount * 25000000` para “Ingresos Est.”. Reaplicar cambios comerciales necesarios en rama actual; validar error, vacío y reintento en CRM, visitas y reservas. Prioridad 1. |
| [#217](https://github.com/alvarocumora/field-findr-ai/pull/217) | Conflictos; tema/globo | Actualizar diff contra hero y tokens actuales. Revisar día/noche y fallback, sin revertir cambios móviles ni recrear mapas. Prioridad posterior al recorrido comercial. |
| [#186](https://github.com/alvarocumora/field-findr-ai/pull/186) | Conflictos; indicios fuertes de sustitución | `Contacts`/`CRMSystem` ausentes, aliases presentes, `LeadFormDialog` conservado en SalesPipeline y etiquetas BI ya específicas. Comparar cinco archivos y permisos antes de proponer cierre por sustitución. |
| [#180](https://github.com/alvarocumora/field-findr-ai/pull/180) | Conflictos; flujo equivalente actual | `ProjectDetail` consume consulta y resuelve lote; rutas Caone renderizan `ProjectLanding → ProjectDetail` o redirigen. Validar extremo a extremo y comparar helper, no restaurar landing retirada. |
| [#181](https://github.com/alvarocumora/field-findr-ai/pull/181) | Conflictos; dirigido a landing antigua | Las rutas actuales ya no renderizan CaoneLanding. Trasladar aceptación de inventario no verificado a ProjectDetail; verificar errores, vacío, parcial y estado desconocido antes de decidir sustitución. |
| [#168](https://github.com/alvarocumora/field-findr-ai/pull/168) | Conflictos; objetivo técnico cubierto parcialmente | Typecheck real presente en package/CI y pasa localmente; revisar los nueve archivos para diferencias aún útiles. No integrar una corrección de base antigua en bloque. |
| [#160](https://github.com/alvarocumora/field-findr-ai/pull/160) | Sin conflicto Git; revisión funcional pendiente | RPC, migración y pagos de overrides. Requiere revisión de autorización, transiciones, idempotencia y compatibilidad con comisiones actuales; no es un merge documental de bajo impacto. |
| [#145](https://github.com/alvarocumora/field-findr-ai/pull/145) | Sin conflicto Git; documental | Revisar convención de assets y acceso al Drive antes de adoptar como fuente maestra. No se comprobó acceso ni contenido del Drive. |
| [#127](https://github.com/alvarocumora/field-findr-ai/pull/127) | Conflictos; landing especializada antigua | Replantear comparación sobre proyecto e inventario unificados, sin restaurar VelLanding. Diferir hasta cerrar consulta, disponibilidad y medición. |

## Matriz de recorridos y autorización

Fuente: `src/routes/routeManifest.tsx`, `src/routes/roleRouteContract.test.ts` y `src/lib/access/routePolicy.ts`. Las pruebas de contrato pasan dentro de la suite; esto valida políticas declaradas, no RLS real.

| Persona | Recorrido | Control pendiente en staging |
|---|---|---|
| Visitante | `/` → `/explorar` → `/p/:slug` o `/proyecto/:id` → consulta | Navegación móvil, recuperación de mapa/API y creación de un único lead con contexto. |
| Comprador | Login → `/comprador/inicio` → favoritos/visitas/reservas | Sesión, contexto, persistencia y acceso exclusivo a sus datos. |
| Broker/empresa | `/panel` → `/asesor/projects` y `/asesor/leads` | Rol agent, capability `crm.read`, feature CRM y aislamiento entre organizaciones. |
| Administrador | `/admin/dashboard` → `/admin/users` | Rol admin, acciones sensibles auditadas, paginación y errores parciales. |

No se usaron cuentas reales ni se crearon leads, pagos, reservas o cambios de roles. Pendiente preparar identidades sintéticas y ejecutar matriz autenticada en staging. El smoke público existente cubre anchos 320/390/1440, pero no se ejecutó localmente en este PR documental.

## Orden de trabajo

1. Resolver bloqueo de facturación de Actions y repetir CI sobre la revisión que se vaya a integrar. No desactivar checks ni protecciones para ocultarlo.
2. Corregir arranque de lint en PR separado y publicar el inventario de errores real resultante, sin mezclar limpieza masiva.
3. Actualizar #215 o reemplazarlo con un PR acotado contra main; separar cambios si los conflictos amplían el alcance.
4. Validar contrato público de precios, inventario y consulta en rutas actuales; resolver únicamente discrepancias reproducidas.
5. Consolidar trabajo sustituido (#186/#180/#181/#168) después de comparar diffs completos; gestionar #145, #217 y #160 según su riesgo específico.

La planificación general está en [PLATFORM_GROWTH_PLAN_2026-10-29.md](./PLATFORM_GROWTH_PLAN_2026-10-29.md). Este PR registra una base reproducible y decisiones propuestas; no declara producción validada ni despliegue realizado.
