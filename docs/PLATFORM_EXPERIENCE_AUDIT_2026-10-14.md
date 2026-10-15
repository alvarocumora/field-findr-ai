# Auditoría de experiencia y gaps urgentes — OfertaTerrenos

Fecha: 2026-10-14. Base: `d9c653dc1233b3b8fa6c346b4cc84c4d705ffc36` de `main`, después de los PR #172–174.

## Lectura ejecutiva

La plataforma ya conecta una portada territorial, catálogo, proyectos, herramientas y áreas privadas. La prioridad es que el comprador pueda **confiar en el precio, encontrar el inventario completo y contactar por la unidad correcta**, incluso cuando falle el mapa o una consulta.

Los gaps de mayor impacto comercial son:

1. Una propiedad de **35.000 UF** se resume como **«desde $35K»** y como mejor oportunidad a **«$1/m²»**.
2. La búsqueda **«Valle Escondido»** muestra una lista vacía aunque la API pública devuelve **69 publicaciones activas coincidentes**.
3. Sin WebGL, Brisas de Caone y Valle Escondido Licantén caen en **«Algo salió mal»** y desaparece toda la ficha comercial.
4. **«Consultar disponibilidad»** en Valle de Hualañé lleva a una **demo B2B de Growth Inmobiliaria**, sin contexto de proyecto/lote.
5. El carrusel de proyectos consulta una columna inexistente y recibe **HTTP 400**; la landing de Hualañé mantiene inventario estático y su imagen social anuncia otra unidad de precio.
6. Al fallar una lectura, se comunica **«no hay terrenos»** o **«proyecto no encontrado»**, confundiendo indisponibilidad técnica con ausencia de inventario.

No se ha demostrado un incidente P0. Los P1 de este documento deberían resolverse antes de ampliar campañas o tráfico comercial. Los problemas de autenticación y permisos que no se pudieron comprobar con sesiones reales se mantienen explícitamente pendientes.

## Método y límites

- 17 recorridos base: 12 en escritorio (1365 × 900) y 5 en móvil (390 × 844).
- 6 recorridos dirigidos adicionales: búsquedas, landing genérica, ficha de proyecto, contacto y landing especializada.
- 2 recorridos con respuestas 503 simuladas, exclusivamente dentro del navegador de auditoría.
- Comparación de 2 landings con WebGL deshabilitado y habilitado: 4 recorridos adicionales. El error global sin WebGL se contrastó con el contenido comercial visible al habilitarlo.
- Consultas anónimas de lectura al backend real: 5 proyectos activos, inventario público, consulta de esquema y búsqueda de publicaciones. Datos observados en esta fecha; no son un censo permanente.
- 2 sondas aisladas de componentes de perfil con usuario y APIs simulados. Ambas fallan frente al comportamiento deseado; **no son fallos nuevos de la suite base ni correcciones implementadas**.
- Análisis de rutas, consultas, CTA, formularios, caché, navegación por contexto y componentes de perfil/administración.

Se revisó el build local de la base indicada; no se certifica que producción esté sirviendo ese mismo commit. La última validación técnica de esa base, antes de esta auditoría documental, pasó con instalación limpia, typecheck, 347 pruebas y build completo.

El navegador usa Chromium con peticiones HTTP(S) canalizadas mediante Node y el proxy/certificados disponibles, manteniendo verificación TLS. La primera prueba directa tuvo errores de confianza del navegador; se descartó para juzgar datos reales. Google Fonts y una imagen Unsplash no cargaron por restricciones del entorno: **no se declaran rotos en producción**. Un tile de Mapbox devolvió 404; por sí solo no establece un fallo general del mapa. WebSocket/realtime no pudo validarse por la confianza TLS del navegador; la disponibilidad en vivo sigue pendiente.

No se crearon cuentas, leads ni reservas, ni se cambiaron contraseñas, roles, precios o datos remotos. Se bloquearon llamadas de escritura durante la navegación. Las funciones de imágenes satelitales no se ejecutaron, por lo que no se evalúa su resultado. No hubo sesiones reales de comprador, corredor, empresa o administrador; se comprobó la redirección del visitante a login y se revisaron las pantallas privadas por código y sondas locales.

La [presentación interactiva](./audits/2026-10-14/presentacion.html), tres capturas, los [gaps estructurados](./audits/2026-10-14/prioritized-gaps.json), el [resumen público de inventario](./audits/2026-10-14/public-inventory-summary.json) y el [resultado de sondas de perfil](./audits/2026-10-14/profile-probes-summary.txt) se conservan en `docs/audits/2026-10-14/`. La presentación se abre en un navegador desde una copia local; GitHub puede mostrar su código en vez de ejecutarla. No es una publicación del sitio.

Los reportes detallados de navegador y capturas adicionales quedan como artefactos locales en `/workspace/audit-evidence-2026-10-14/`. Los diagnósticos de consola están saneados para excluir parámetros de autenticación.

## Qué funciona y conviene conservar

- La portada tiene una dirección visual consistente, CTA de explorar visible también en móvil y navegación pública diferenciada entre explorar, vender, comunidad y profesionales.
- El catálogo sí carga proyectos y publicaciones reales. La tarjeta individual de la propiedad citada muestra correctamente `UF 35.000`; el fallo está en resúmenes, métricas y comparaciones que omiten moneda.
- La RPC `get_public_lots` respondió 200 para los 5 proyectos activos. Sus conteos de disponibles coincidieron con `projects.available_lots` en esta muestra.
- La landing genérica de Brisas de Caone y la especializada de Valle Escondido renderizan contenido cuando WebGL está disponible.
- Los visitantes que abren `/perfil`, `/asesor/projects` y `/admin/users` llegan a login con el destino conservado en el parámetro `redirect`.
- `/panel` ya resuelve contextos comprador/broker/empresa/plataforma. No hace falta crear otro sistema de roles o un segundo panel.
- La función `admin-users` contiene validación de sesión, rol administrador, esquema de acciones y llamadas de auditoría. No se ha probado su operación autenticada ni la cobertura de RLS.

## Matriz de gaps

Evidencia: **B** = navegador; **D** = API pública de lectura; **C** = código; **S** = simulación o sonda aislada. P1 = flujo comercial o persistencia afectado; P2 = coherencia, accesibilidad o capacidad operativa; P3 = optimización posterior.

| ID | Prioridad | Área | Gap y evidencia | Efecto |
|---|---|---|---|---|
| G01 | P1 | Explorar / precios | Resumen `$35K` frente a tarjeta `UF 35.000`; selección de «mejor oportunidad» compara precio/m² sin moneda. B+C | Precio y ranking engañosos; posible mala decisión comercial |
| G02 | P1 | Explorar / búsqueda | `q` se filtra en cliente sobre páginas de 30; «Valle Escondido» da 0 y la API devuelve 69 coincidencias. El contador conserva 274. B+D+C | Inventario existente parece ausente y el usuario no puede llegar a él por búsqueda |
| G03 | P1 | Landings / ficha | Inicializar Mapbox sin WebGL lanza un error que alcanza el boundary de toda la ruta. B+C, prueba A/B de capacidad | Se pierden precio, documentación y contacto cuando falla una dependencia visual |
| G04 | P1 | Conversión | CTA de disponibilidad de Hualañé apunta a `/contacto-loteos`; destino dice «Agenda una demo para Growth Inmobiliaria», con origen por defecto `planes-loteos`. B+C | Un comprador entra al embudo de venta de software; pierde contexto y atribución de unidad |
| G05 | P1 | Proyectos / datos | `ProjectsRail` consulta `lots.area_m2`; la API devuelve 400, código `42703`, columna inexistente. Ignora el error y pierde precio/superficie. B+D+C | Tarjetas incompletas y ocultación de una rotura real del contrato |
| G06 | P1 | Landing / inventario | Hualañé define 40 lotes y promociones en código. RPC: 38 disponibles y lotes 36/37 reservados. La landing no refleja esos estados. B+D+C | La presentación comercial no sigue el inventario operativo |
| G07 | P1 | Landing / precio publicado | Landing/tour muestran `$12.990.000 por parcela`; el generador de imagen social escribe `$12.990.000 / ha`. C, imagen enlazada en B | La promesa cambia entre página, tarjeta compartida y descarga social |
| G08 | P1 | Resiliencia | 503 simulado en lecturas produce «No encontramos terrenos» o «Proyecto no encontrado», sin recuperación específica. B+S+C | La caída del servicio se interpreta como falta o retirada de oferta |
| G09 | P1 | Perfil / preferencias | `setHasChanges(false)` se ejecuta inmediatamente después de `mutate`; desaparece Guardar antes de conocer éxito. S+C | Un fallo deja al usuario sin acción directa para reintentar y con estado no persistido |
| G10 | P1 | Reservas / disponibilidad | `LotReserveDialog` invalida `vel-public-lots` y `reservations`; la landing genérica lee `landing-lots`. C | Riesgo de mostrar disponibilidad anterior tras una reserva. El efecto E2E y la concurrencia de reservas no se probaron |
| G11 | P2 | Cuenta / seguridad UX | Se exige «Contraseña Actual» pero solo se envía la nueva a `updateUser`; sonda confirma que no se verifica la introducida. Labels apuntan al contenedor, no al input. S+C | Promesa de reautenticación incoherente, fricción OAuth y formularios poco accesibles. No demuestra un bypass de Supabase |
| G12 | P2 | Usuarios / contextos | El menú global lleva a `/perfil` dentro de BuyerLayout, que muestra «Comprador», incluso cuando la cuenta trabaja como asesor; existe además `/asesor/profile`. C | Pérdida de contexto y duplicación de la experiencia de perfil; validar con sesiones por rol |
| G13 | P2 | Administración | «Activos (7d)» usa `profiles.updated_at`, no actividad/login; carga usuarios/roles/suscripciones sin paginación y solo comprueba error de perfiles. C | KPI semánticamente incorrecto y riesgo de listas parciales o roles/planes falsamente vacíos |
| G14 | P2 | Presentación / promesa | El hero ofrece ejemplos como «Terreno hasta $30 millones» y envía texto literal a `q`; ese ejemplo da lista vacía en la prueba. B+C | La interfaz sugiere comprensión de presupuesto/distancia que ese camino no aplica |
| G15 | P2 | SEO / continuidad | En la prueba móvil de Hualañé el título quedó «Proyecto de lotes»; padre genérico y landing especializada ejecutan SEO. La landing tampoco ofrece una vuelta visible al catálogo en su cabecera. B+C | Metadatos inconsistentes y salto de identidad/navegación. Corroborar caché/navegación antes del arreglo SEO |
| G16 | P2 | Preferencias / confianza | La moneda preferida se guarda en el perfil pero no se consume en la presentación de precios encontrada por búsqueda de referencias. C | Configuración aparentemente efectiva que no cambia el catálogo; definir alcance antes de ofrecer conversión |

## Evidencia reproducible por área

### Explorar: búsqueda y precios

- Abrir `/explorar` con preferencia inicial de incluir parcelas de loteo. En la muestra se ve «274 terrenos desde $35K» y la tarjeta industrial «UF 35.000».
- Abrir `/explorar?q=Valle%20Escondido&view=list`. Se ve «274 terrenos», pestaña Todos = 0 y mensaje sin resultados. La consulta pública `listings`, con `status=active`, `is_demo=false` y título que contiene Valle Escondido, devuelve 69 filas.
- `useInfiniteListings` pagina a 30 y no recibe texto de búsqueda. `Explorar` filtra `title/location/region/city` sobre lo cargado. Cuando el resultado local queda vacío, no se monta la lista que contiene el mecanismo para seguir cargando.
- La ordenación, los filtros numéricos y los resúmenes deben respetar moneda/unidad; no basta con añadir una etiqueta UF a un valor ordenado como CLP.

Referencias: [consulta paginada](../src/hooks/useInfiniteListings.ts#L16), [filtro local](../src/pages/Explorar.tsx#L112), [resumen y ranking](../src/components/explore/ExploreListPanel.tsx#L429), [estado vacío](../src/components/explore/ExploreListPanel.tsx#L638), [promesa del hero](../src/components/landing/CartographicHero.tsx#L37).

### Proyectos: una ficha comercial utilizable

- Carrusel: GET a `lots` con `select=project_id,price,area_m2,status` devuelve `column lots.area_m2 does not exist`. La RPC pública de lotes expone `area`, no `area_m2`.
- Hualañé: lote 36 y 37 tienen estado público `reserved` y superficie 7.500 m²; el array estático los incluye en `eligible` al comprobar solo `area > 0`.
- La cabecera comercial, el tour y los materiales compartidos deben expresar la misma base de precio y los mismos estados. La auditoría no cambia el precio válido ni decide condiciones comerciales.
- En navegadores sin WebGL, el error capturado es `Failed to initialize WebGL` en `LotMapView` y en el mapa de la landing especializada. La ficha debe seguir disponible con plano/imagen, listado de lotes y contacto.
- El camino genérico ya dispone de `LandingLeadForm` con proyecto y lote. La landing especializada de Hualañé no usa ese camino para su CTA principal y deriva a venta B2B.

Referencias: [consulta del carrusel](../src/components/explore/ProjectsRail.tsx#L58), [inventario estático](../src/pages/caone/CaoneLanding.tsx#L11), [CTA comprador](../src/pages/caone/CaoneLanding.tsx#L69), [destino B2B](../src/pages/ContactLoteos.tsx#L22), [unidad en imagen social](../scripts/generate-project-social-assets.ts#L39), [inicialización de mapa](../src/components/lots/LotMapView.tsx#L983), [invalidación de reserva](../src/components/sales/LotReserveDialog.tsx#L55), [lectura genérica](../src/pages/landing/ProjectLanding.tsx#L68).

### Perfiles y usuarios

- Sonda de preferencias: modificar una opción y pulsar Guardar, sin proporcionar respuesta exitosa de servidor; el botón ya no existe. La prueba de comportamiento deseado falla.
- Sonda de contraseña: introducir una contraseña actual sintética incorrecta; el componente llama a la actualización de contraseña nueva sin verificar la introducida. APIs totalmente simuladas. La prueba de verificación previa falla. El primer intento de localizar el input por su label detectó además la asociación incorrecta del formulario.
- `Profile` no consume `error` de `useProfile`; `ProfileStatsCards` no comprueba los errores de sus consultas y transforma ausencia de datos en 0 o plan free. Deben distinguirse perfiles inexistentes, fallo de lectura y valor real.
- Separar identidad, permisos y suscripción en el lenguaje de producto: no presentar como comprador a cualquier usuario que abra configuración; no tratar un error de roles como «sin rol».

Referencias: [guardado prematuro](../src/components/profile/PreferencesTab.tsx#L39), [contraseña](../src/components/profile/SecurityTab.tsx#L49), [consulta de perfil](../src/hooks/useProfile.ts#L45), [estadísticas](../src/components/profile/ProfileStatsCards.tsx#L19), [layout comprador](../src/components/layouts/BuyerLayout.tsx#L69), [perfil por ruta](../src/routes/routeManifest.tsx#L451), [datos de administración](../src/pages/AdminUsers.tsx#L71), [KPI actividad](../src/pages/AdminUsers.tsx#L110).

## Presentación objetivo de la plataforma

Mantener la identidad territorial y las marcas de proyecto, con un recorrido verificable:

**Portada → búsqueda o región → proyecto → parcela → consulta/visita/reserva → seguimiento según perfil.**

| Superficie | Qué debe entender o hacer la persona | Criterio de presentación |
|---|---|---|
| Portada | Qué ofrece OfertaTerrenos y cómo empezar | Promesa concreta, inventario real y puertas claras: comprar, vender, operar proyectos |
| Explorar | Encontrar oferta pertinente y compararla | Resultados completos, moneda explícita, filtros recuperables y contador coherente |
| Proyecto | Saber dónde está, qué se vende y si está disponible | Precio/unidad, estado, superficies, material, responsable y CTA con contexto |
| Parcela | Evaluar la unidad y dar el siguiente paso | Mismo ID, precio y disponibilidad en tarjeta, ficha, mapa y formulario |
| Comprador | Retomar interés, contacto y seguimiento | Favoritos y consultas/visitas/reservas diferenciados; errores recuperables |
| Corredor / empresa | Operar el inventario y la demanda | Contexto/organización visibles y acciones acordes al rol y plan |
| Administración | Tomar decisiones y realizar acciones sensibles | KPIs con significado correcto, listas completas y errores parciales visibles |

La propuesta de mejora visual es editorial: reducir ambigüedad del hero, dar continuidad entre plataforma y marcas de proyecto y simplificar la jerarquía de CTA. No se ha demostrado que un rediseño general mejore conversión; medirlo después de corregir los bloqueos funcionales.

## Plan de PR acotados

Complejidad orientativa: S = un flujo/componente; M = varios consumidores de un contrato; L = búsqueda/datos con posible trabajo backend. No representa plazos comprometidos.

| Orden | PR propuesto | Gaps | Tamaño | Criterio de aceptación |
|---|---|---|---|---|
| A1 | Respetar moneda y unidad en resúmenes y comparaciones | G01 | M | 35.000 UF nunca aparece como $35K; CLP/UF no se ordenan ni filtran como números equivalentes; casos mixtos cubiertos |
| A2 | Reparar estadísticas públicas del carrusel | G05 | S/M | Usar contrato público de lotes y `area`; cero 400; precio/superficie coherentes con la ficha; error visible y recuperable |
| A3 | Mantener ficha comercial sin WebGL | G03 | M | Brisas y Valle Escondido conservan nombre, precio, lotes y contacto sin GPU, con token fallido o mapa caído; 3D sigue funcionando cuando está disponible |
| A4 | Llevar al comprador al formulario de su proyecto/lote | G04 | S/M | Consulta de Hualañé conserva proyecto, lote y atribución; no llega a demo B2B; éxito/error comprobados contra API simulada antes de prueba controlada en staging |
| A5 | Buscar sobre todo el catálogo y paginar el resultado | G02 | L | «Valle Escondido» encuentra sus coincidencias aunque no estén en la primera página; total y tarjetas coinciden; búsqueda vacía no bloquea recuperación; URL conserva búsqueda y filtros |
| B1 | Alinear inventario de Hualañé con la fuente pública | G06 | M | Lotes 36/37 muestran reservado según datos; cambios de estado se reflejan en landing/ficha; fallos no se presentan como disponibilidad confirmada |
| B2 | Unificar unidad del precio en materiales sociales | G07 | S | Página, tour, imagen OG y material descargable expresan el mismo precio por parcela o por ha, confirmado por negocio; regeneración revisada |
| B3 | Distinguir error, vacío y no encontrado | G08 | M | 503 conserva contexto y ofrece reintentar; solo una respuesta válida vacía muestra ausencia real; cobertura de portada, explorar y landing |
| B4 | Refrescar las consultas correctas tras una reserva | G10 | S/M | Reserva simulada invalida/refresca `landing-lots`, ficha, tarjetas y landings que corresponden; reserva real/concurrencia se valida en staging, nunca creando reservas de auditoría en producción |
| B5 | Conservar cambios de preferencias hasta confirmar guardado | G09 | S | Error mantiene datos y acción reintentar; éxito limpia dirty; doble clic y refetch no borran cambios; perfil no disponible tiene estado propio |
| C1 | Corregir el contrato del formulario de contraseña | G11 | M | Contraseña actual se verifica mediante un mecanismo soportado o se reemplaza por flujo explícito de reautenticación; OAuth tiene recorrido válido; inputs y botones con nombres accesibles |
| C2 | Mantener contexto del perfil y alcance de preferencias | G12, G16 | M | Comprador/corredor/empresa/admin llegan a configuración sin cambiar identidad visual; moneda preferida explica su alcance real y no implica conversión ficticia |
| C3 | Dar significado correcto a actividad de usuarios | G13 | S | «Activos» usa una señal de actividad definida o se renombra «perfiles actualizados»; no se confunde modificación con login |
| C4 | Paginar administración y tratar errores parciales | G13 | M | Filtros/CSV/conteos no dependen de la primera respuesta del backend; fallo de roles/planes no muestra falsos vacíos; fixtures grandes sin datos personales reales |
| C5 | Alinear ejemplos de portada con búsqueda estructurada/IA | G14 | M, después de A1/A5 | Ejemplo «hasta $30 millones» aplica presupuesto CLP o explica y solicita confirmación de filtros; no se manda como búsqueda textual literal incompatible |
| C6 | Consolidar SEO y navegación de las landings | G15 | S/M | Un dueño de metadatos por página; Hualañé mantiene título específico tras carga y navegación; acceso visible al catálogo sin perder identidad de proyecto |

Primera tanda recomendada: **A1–A4**, seguida de **A5 y B1–B5**. Presentación y configuración de perfiles se ajustan en C, con pruebas por persona. Corregir cada gap en su PR; no agrupar consultas, pricing, auth y rediseño en una sola entrega.

## Condiciones para ejecutar y medir

- Preparar cuentas sintéticas de staging para comprador, corredor, miembro/administrador de empresa y administrador de plataforma. Verificar matriz de acceso, multi-contexto, onboarding y errores de roles. No pedir contraseñas ni secretos en chat.
- Distinguir CI local de remoto: Actions sigue sin poder iniciar por pagos/límite de gasto según las últimas corridas. El despliegue histórico también carecía de secretos DreamHost. Revalidar ambos antes de declarar un release operativo.
- Mantener contratos de `AGENTS.md`: IDs de proyecto/lote/listing como fuente de identidad; enlaces compartidos mediante `publicUrls`; auth/pagos usan origen de ejecución.
- Cada PR debe indicar reproducción, alcance, evidencia antes/después, pruebas relevantes, build y revisión de sitemap/rutas cuando corresponda. No publicar cambios de negocio ni migraciones remotas durante una auditoría.
- Medir búsqueda → ficha → consulta/visita → reserva; errores por consulta; abandono por móvil; y fallos de mapa con recuperación. No hay analítica de producción suficiente en esta revisión para atribuir porcentajes de pérdida o prometer mejoras numéricas.

Esta entrega es una auditoría y propuesta de ejecución. Los gaps descritos permanecen sin corregir; no se mezclan cambios de producto con el documento de planificación.
