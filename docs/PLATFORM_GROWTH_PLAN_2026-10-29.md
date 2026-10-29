# Plan de plataforma y venta de parcelas — 29 de octubre de 2026

Auditoría de experiencia posterior a PR 0 y la limpieza de lint: [benchmark, brechas y próximos PR](./PLATFORM_EXPERIENCE_BENCHMARK_2026-10-29.md). Esa revisión concreta las prioridades de landing, rutas y dashboards con evidencia de navegador y código actual.

Auditoría posterior del área privada: [login, sesión, dashboards y matriz de perfiles](./PLATFORM_ACCESS_AUDIT_2026-10-29.md). Sus hallazgos P0/P1 de identidad y aislamiento preceden a ampliar registro o certificar la operación privada. Las bases y brechas de las revisiones anteriores son fotografías históricas.

## Objetivo

Convertir OfertaTerrenos en una experiencia confiable para descubrir, comparar y comprar parcelas, y en una herramienta diaria para que vendedores y empresas conviertan consultas en visitas y ventas. Priorizar calidad del inventario y continuidad comercial antes de ampliar funciones.

La promesa para el comprador: encontrar una parcela adecuada, comprender precio, ubicación, disponibilidad y antecedentes, y contactar al responsable con el contexto conservado. Para el vendedor: publicar una vez y gestionar todo el recorrido comercial sobre el mismo inventario.

## Base comprobada y límites

- Base revisada: `main` en `80178ab45dcbae5a0fe957858bbabc19df209f1c`. API GitHub operativa; nueve PR abiertos al revisar.
- La última ejecución CI de ese commit figura como fallida. Diagnosticar sus anotaciones antes de atribuirlo al código o al entorno.
- Ya existen rutas públicas y privadas, proyectos unificados, tours, inventario, consultas, CRM, visitas, reservas, cotizaciones y cierres. Consolidar estos módulos.
- La búsqueda ya se aplica en servidor en `useInfiniteListings`; el explorador contempla monedas en resúmenes y ordenamiento. Los hallazgos del 14 de octubre requieren revalidación, no repetición automática.
- `AdminUsers` aún calcula “Activos (7d)” desde `profiles.updated_at`: no representa actividad de sesión.
- `useTrackEvent` ignora visitantes sin sesión. Revisar los demás mecanismos de atribución antes de diseñar medición del embudo público.
- Esta revisión es de repositorio y GitHub. No certifica producción, datos vigentes, permisos efectivos, rendimiento móvil ni flujos autenticados.

## Experiencia objetivo

| Área | Resultado esperado |
|---|---|
| Portada | Propuesta clara, búsqueda directa, proyectos reales y rutas separadas para comprar y vender; mapa enriquecedor con alternativa liviana. |
| Explorar | Inventario completo, filtros persistentes, monedas explícitas, mapa/lista sincronizados, favoritos y comparación útil. |
| Proyecto y parcela | Precio y superficie consistentes, acceso y servicios documentados, estado actualizado, plano y tour opcionales; CTA del lote seleccionado. |
| Confianza | Responsable comercial identificable; distinguir antecedentes documentados, declaraciones y estimaciones; documentos privados protegidos. |
| Comprador | Consultas, visitas, favoritos, cotizaciones y reservas reunidos; avances y próximos pasos comprensibles. |
| Vendedor y empresa | Publicación guiada, control de calidad, inventario único, asignación de consultas, seguimiento y embudo por proyecto. |
| Administración | Accesos por organización y rol, acciones sensibles auditadas, listados paginados y métricas con definiciones verificables. |

## Ejecución priorizada

Las semanas son una secuencia orientativa, no un compromiso de plazo. Reestimar al cerrar el diagnóstico inicial.

| Etapa | Entregas separadas en PR | Criterio de salida |
|---|---|---|
| 0. Base confiable | Diagnóstico CI; revisión individual de PR pendientes; matriz de rutas/roles; inventario de errores y medición existente. | Base reproducible con instalación, tipos, pruebas y build; pendientes clasificados como vigentes, sustituidos o conflictivos; flujos críticos documentados. |
| 1. Conversión esencial, semanas 1–2 | Verificación de precios CLP/UF; estados de inventario; recuperación de errores/mapas; consulta con proyecto/lote; medición del embudo. | Buscar → ficha → consulta conserva contexto en móvil y escritorio; fallos no simulan ausencia de oferta; ningún ranking mezcla monedas sin conversión explícita. |
| 2. Sitio público, semanas 3–4 | Portada orientada a compra; ficha de proyecto y parcela; comparación/favoritos; accesibilidad, rendimiento y SEO. | Recorrido completo a 320/390/1440 px y teclado; contenido comercial disponible sin WebGL; enlaces canónicos y metadatos coherentes. |
| 3. Operación comercial, semanas 5–6 | Publicación guiada y checklist documental; bandeja CRM; asignación y próxima acción; visitas/cotizaciones; reservas y conciliación. | Consulta real de prueba llega una sola vez al responsable; avance trazable hasta visita/reserva; pruebas de concurrencia y reintento no duplican reservas ni pagos. |
| 4. Usuarios y empresas, semanas 7–8 | Onboarding por rol; perfiles/contextos; administración paginada; métricas correctas; revisión de permisos y auditoría. | Cuentas sintéticas comprador/broker/empresa/admin cumplen matriz de acceso; una organización no accede a otra; cambios sensibles quedan trazados. |
| 5. Diferenciación, tras estabilizar | Alertas, comparables y ficha descargable; presentación territorial y tours; asistente de búsqueda; herramientas de potencial de uso. | Cada función responde a una necesidad medida; estimaciones y escenarios identifican supuestos y fuentes; no se presentan permisos ni factibilidades no acreditados. |

## Primera tanda propuesta

1. **CI y estado de integración:** identificar causa de CI fallido en `main`, corregirla si corresponde y reproducir controles. Revisar #215 (errores comerciales), #217 (tema/globo), #186 (dashboard); verificar si #180/#181 siguen aplicando tras unificar proyectos. Una validación antigua no certifica compatibilidad con `main` actual.
2. **Contrato comercial de inventario:** pruebas dirigidas para moneda, unidad de precio, disponibilidad y correspondencia proyecto/lote/publicación. Corregir solo discrepancias reproducidas.
3. **Consulta a CRM:** comprobar destino, responsable, proyecto, lote, atribución y confirmación; separar comprador de captación B2B; evitar duplicación por reintento.
4. **Embudo medible:** auditar instrumentos actuales y completar eventos públicos con privacidad y deduplicación. No incluir datos personales en eventos de navegación.
5. **Administración honesta:** renombrar el KPI basado en actualización de perfil o implementar una señal real de actividad; tratar errores y paginar sin falsear conteos/CSV.
6. **Experiencia móvil:** corregir obstáculos concretos en portada, explorar y proyecto, con evidencia antes/después; ampliar a CRM y administración después.

No integrar automáticamente los nueve PR: cada uno requiere revisión de alcance, diferencias actuales, conflictos, seguridad y controles actualizados. No cerrar trabajo ajeno sin justificar que está sustituido.

## Medición y metas

Definir primero una línea base durante 7–14 días o hasta tener muestra útil. Segmentar por dispositivo, proyecto y canal; separar contactos de prueba, bots y duplicados.

- Métrica principal: consultas calificadas que llegan a visita y reserva por proyecto, con definición comercial acordada de “calificada”.
- Embudo: búsqueda → ficha → consulta confirmada → primer contacto → visita agendada/realizada → reserva → venta. Un clic en WhatsApp no acredita conversación ni venta.
- Operación: tiempo hasta primera respuesta, consultas sin responsable, tareas vencidas y conversión por etapa.
- Confianza: publicaciones completas, discrepancias de precio/estado y antigüedad de la actualización de disponibilidad.
- Calidad: errores por recorrido, éxito de consultas y reservas, recuperación de fallos y accesibilidad de tareas principales.
- Objetivos técnicos propuestos: LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1 en percentil 75 móvil con datos de campo cuando exista muestra. Las pruebas de laboratorio son apoyo, no sustituyen esa medición.

No prometer aumentos porcentuales de ventas sin línea base y atribución verificable.

## Forma de entrega

Un PR por resultado, con reproducción, criterio de aceptación y validación proporcional. Cambios de inventario, autorización y reservas requieren pruebas de negocio; cambios visuales requieren verificación móvil y accesibilidad. Cada integración debe dejar `main` validado y una ruta de reversión clara. Distinguir merge, despliegue y verificación posterior en producción.

Usar cuentas y datos sintéticos en staging para operaciones de escritura. El diagnóstico no modifica precios, roles, pagos ni reservas reales. Las migraciones requieren revisión explícita de su efecto y estrategia de despliegue.

La dirección visual reutiliza el tema Rural Institutional y sus tokens. Se mantienen los contratos de `AGENTS.md`, el inventario por IDs y el sistema actual de proyectos, CRM y contextos.
