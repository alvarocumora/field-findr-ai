# Rural Finder · UX roadmap

## Corte 1 (hecho)
- Tokens `.theme-rural` + tipografía editorial.
- Portada: hero editorial con buscador destino/comuna/proyecto, filtros rápidos Parcelas/Campos/Industrial (`/explorar?type=`), proyecto real rotativo con disponibilidad y precio "desde" en CLP, CTA secundario de venta.
- Explorador: búsqueda server-side sobre todo el inventario, `?type=` inicial, alerta de error distinta del estado vacío, tema rural en desktop y móvil. Deep link `?listing=` intacto.

## Corte 2 (pendiente)
- Ficha proyecto/parcela: header editorial, selector de modo (Tour/2D/3D/Masterplan) solo con modos disponibles, inspector de lote unificado con CTAs Agendar/Consultar/Reservar con contexto de lote.
- Filtro de precio por moneda explícita (hoy el rango compara `price` crudo sin distinguir CLP/UF).
- Overlays del mapa del explorador con colores hardcodeados (`bg-emerald-600 text-white`) → tokens.
- Revisar `ProfessionalNetworkSection` y CTAs comprador que pudieran ir a `/contacto-loteos`.

## Corte 3 (pendiente)
- Header/nav pública y paneles por rol con patrón header → toolbar → contenido → inspector; piloto en una zona privada (`/panel`).
- Migrar resto de secciones de portada (InsigniaShowcase, StandardAndPartner) a `font-editorial`.
