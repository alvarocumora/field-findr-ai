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

## Corte 2b (pendiente)
- `/p/:slug` (ProjectLanding): aún con estética cinematográfica propia; migrar a `.theme-rural` sección por sección.
- Selector de modos Tour/Mapa/Masterplan/3D unificado en la cabecera (hoy son pestañas existentes, ya condicionadas a datos para Tour 360).
- Rango de precio en UF dedicado (hoy solo CLP).
- Ficha proyecto/parcela: header editorial, selector de modo (Tour/2D/3D/Masterplan) solo con modos disponibles, inspector de lote unificado con CTAs Agendar/Consultar/Reservar con contexto de lote.
- Overlays del mapa del explorador con colores hardcodeados (`bg-emerald-600 text-white`) → tokens.
- Revisar `ProfessionalNetworkSection` y CTAs comprador que pudieran ir a `/contacto-loteos`.

## Corte 3 (pendiente)
- Header/nav pública y paneles por rol con patrón header → toolbar → contenido → inspector; piloto en una zona privada (`/panel`).
- Migrar resto de secciones de portada (InsigniaShowcase, StandardAndPartner) a `font-editorial`.
