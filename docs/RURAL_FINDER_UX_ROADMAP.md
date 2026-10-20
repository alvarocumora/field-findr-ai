# Rural Finder · UX roadmap

## Corte 1 (hecho)
- Tokens `.theme-rural` + tipografía editorial.
- Portada: hero editorial con buscador destino/comuna/proyecto, filtros rápidos Parcelas/Campos/Industrial (`/explorar?type=`), proyecto real rotativo con disponibilidad y precio "desde" en CLP, CTA secundario de venta.
- Explorador: búsqueda server-side sobre todo el inventario, `?type=` inicial, alerta de error distinta del estado vacío, tema rural en desktop y móvil. Deep link `?listing=` intacto.

## Corte 2 (hecho)
- Moneda: helper `src/lib/priceCurrency.ts` (+tests). Resumen "desde" separado por moneda, mejor precio/m² solo dentro de una moneda, orden por precio agrupa CLP y luego UF, UF/m² con decimales (nunca "$1/m²"), sin conversión por tasa.
- Selector Moneda Todas/CLP/UF en `/explorar` (`?currency=`); el rango de precio es CLP y, si está activo, filtra solo publicaciones en CLP.
- `?q=` prellena el buscador, busca en servidor y la URL se mantiene sincronizada (q/type/currency) sin perder `?listing`.
- Ficha de proyecto `/proyecto/:id` con tema rural, titular editorial, "No informado" cuando falta precio, pestañas legibles.
- Inspector de lote (`LotDetailSheet`) migrado a tokens rural; CTAs reales intactos (Reservar, Agendar visita, Diseñador, Financiamiento); documentos del proyecto heredados como antes.
- `ViewerErrorBoundary`: tour 360, mapas de parcelas y vista 3D aislados; un fallo muestra "Error técnico" + Reintentar sin tumbar la ficha.
- `/contacto-loteos`: no quedan CTA de comprador apuntando ahí; los usos restantes son B2B (planes, inmobiliarias, red profesional).

## Corte 2b — GitHub First (implementado en rama, pendiente de revisión/merge)
- `/explorar`: rangos de precio independientes para CLP y UF, presets y etiquetas correctas en FilterBar compartida por escritorio y móvil. Selección de "Todas" mantiene la regla existente: al activar un rango solo busca CLP. Nunca se aplica un límite CLP a UF.
- `/p/:slug`: tema Rural Institutional y titulares editoriales en la landing genérica; distingue error del proyecto, fallo de inventario y carga inicial de una disponibilidad real de cero. CTA del hero navega al masterplan solo si existe; el acceso al proyecto principal abre un modo mapa existente, sin prometer un tour inexistente.
- `/proyecto/:id`: pestañas desplazables en móvil con el tab activo sincronizado con la URL para compartir navegación.
- `/explorar`: overlay de área dibujada adaptado a tokens de marca en lugar de colores hardcodeados.
- Se mantienen contratos actuales de lots, listings y reservas: sin nuevas migraciones, auth ni despliegue automático.
- Validación pendiente: CI del PR en GitHub y revisión manual del flujo 320/390/1440 y con WebGL deshabilitado.

## Corte 2c — Navegación de modos por proyecto (PR en curso)
- `/proyecto/:id`: banda contextual de Mapa de lotes / Lotes / Tour 360 integrada con las pestañas canónicas y el visor 360 existente. El tour solo aparece si existen escenas; no se ofrece un 3D general ficticio.
- Compartición por `?tab=` y desplazamiento al visor o al panel correcto; sin duplicar TourViewer ni LotMapView, y conservando CTAs de consulta y reserva.
- Pendiente de validación automática CI y visual 320/390/1440 antes de fusionar.

## Pendientes de siguientes PR (no incluidos en este corte)
- Eventual modo 3D global o masterplan independiente solo si existe un visor canónico verificable y geometría real; por ahora mapa/lotes/tour están cubiertos por la banda contextual sin duplicación.
- Migrar landings bespoke y el resto del sistema visual sin cambiar la identidad ni el flujo de conversión de cada proyecto.
- Completar armonización visual del inspector y overlays restantes del mapa, con QA visual en todos los breakpoints.
- Revisar contexto de ventas y roles autenticados (comprador, asesor, inmobiliaria, superadmin) mediante cuentas de prueba, con RLS vigente.
- El fallo de deploy DreamHost es independiente: faltan secretos del entorno de producción en GitHub; no enviar secretos por chat.

## Corte 3 (pendiente)
- Header/nav pública y paneles por rol con patrón header → toolbar → contenido → inspector; piloto en una zona privada (`/panel`).
- Migrar resto de secciones de portada (InsigniaShowcase, StandardAndPartner) a `font-editorial`.
