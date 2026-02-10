
# Plan de Mejora Integral: Landing, Logo, Mapa, Busqueda y Fichas

Este plan aborda 5 areas clave para lograr una plataforma visualmente consistente, funcional y profesional.

---

## Fase 1: Logo Epico y Limpio

**Problema actual:** El logo tiene demasiados elementos SVG (hexagono, montana, diamante, lineas de parcela, circulos) lo que lo hace visualmente ruidoso a tamanos pequenos.

**Solucion:**
- Redisenar `Logo.tsx` y `LogoIcon.tsx` con un icono minimalista: una "O" estilizada con forma de parcela/terreno (cuadrado redondeado con una diagonal que sugiere topografia)
- Reducir los paths SVG de 7+ a maximo 3, priorizando legibilidad a cualquier tamano
- Mantener el gradiente Emerald-to-Sky pero simplificar la geometria
- Texto "Oferta" en peso bold + "terrenos" en peso medium con color primary
- Eliminar el subtitulo "Proptech Chile" del logo (moverlo solo al footer)
- Asegurar que el icono funcione como favicon tambien

---

## Fase 2: Landing Page Premium

**Cambios en el Hero:**
- Reducir los orbs de fondo (de 3 a 1 sutil) para un look mas limpio
- Simplificar el badge de IA: quitar el pulse constante que distrae, usar un badge estatico mas elegante
- Mejorar el `gradient-text-hero` para que funcione bien en ambos temas (actualmente en light mode el blanco se pierde)
- Hacer la barra de busqueda mas prominente con placeholder mas descriptivo

**HeroStats:**
- Quitar la stat "100% Datos verificados" que parece falsa/marketing y reemplazarla con algo real como "Regiones cubiertas" o "Usuarios activos"

**HowItWorks:**
- Agregar iconografia mas grande y reducir texto
- Conectar los pasos con una linea continua en vez de dashes aislados

**FeaturedProjects:**
- Agregar imagen del proyecto si existe (`master_plan_url` o imagen de portada)
- Mostrar el area total del proyecto si esta disponible

**TrustBadges:**
- Convertir en un banner horizontal tipo marquee con logos de instituciones (SII, Conservador, IDE Chile) en vez de iconos genericos

**Footer:**
- Eliminar links muertos (#) - dejar solo los que funcionan
- Agregar link a la app en App Store/Play Store si aplica

---

## Fase 3: Mapa y Explorar

**Mejoras al mapa (EnhancedMap):**
- Agregar un boton "Mi ubicacion" mas visible con feedback visual al centrar
- Mejorar los popups de marcadores: incluir imagen thumbnail, precio y area en una tarjeta compacta
- Agregar conteo de resultados visible en el mapa ("12 terrenos en esta zona")

**Mejoras al explorador (Explorar.tsx):**
- Agregar ordenamiento (precio asc/desc, area, mas reciente) en el `FloatingResultsPanel`
- Mostrar "Buscar en esta area" como boton flotante cuando el usuario mueve el mapa
- Mejorar la `LocationSearchBar` con sugerencias de regiones populares como chips debajo

**FilterBar:**
- Agregar filtro rapido de "Solo verificados" como toggle
- Mostrar el rango de precio seleccionado de forma legible (ej: "$50M - $200M" en vez de slider abstracto)

---

## Fase 4: Fichas de Propiedad (ListingCard + PropertyDetail)

**ListingCard:**
- Agregar precio por m2 debajo del precio total cuando sea calculable
- Reemplazar "vistas" por la region/comuna que es mas util
- Mejorar la transicion de hover para que sea mas sutil (reducir el scale de 1.05 a 1.02)

**PropertyDetail:**
- Agregar seccion de "Precio por m2" destacada junto al precio total
- Mejorar el grid de "Key Facts" con iconos mas expresivos
- Agregar boton de "Agendar visita" en la sidebar
- Hacer que el mapa de ubicacion sea interactivo (actualmente puede ser estatico)
- Agregar breadcrumb completo con region y comuna

---

## Fase 5: Consistencia Visual Global

- Auditar y unificar border-radius: usar `rounded-xl` (12px) como estandar para cards, `rounded-2xl` para containers principales
- Unificar spacing: `gap-4` para grids, `gap-6` para secciones, `p-4` para cards, `p-6` para containers
- Corregir `glass-strong` que tiene background hardcodeado para dark mode pero usa selector `.light` en vez de `:root` para light mode
- Asegurar que todos los componentes usan variables CSS del tema en vez de colores hardcodeados
- Limpiar `App.css` que tiene estilos legacy de Vite que no se usan

---

## Detalle Tecnico

### Archivos a modificar:
1. `src/components/brand/Logo.tsx` - Logo minimalista
2. `src/components/brand/LogoIcon.tsx` - Icono simplificado
3. `src/pages/Index.tsx` - Landing refinada
4. `src/components/landing/HeroStats.tsx` - Stats reales
5. `src/components/landing/HowItWorks.tsx` - Pasos con linea continua
6. `src/components/landing/FeaturedProjects.tsx` - Con imagenes
7. `src/components/landing/TrustBadges.tsx` - Banner institucional
8. `src/components/landing/FloatingCTA.tsx` - Ajustes menores
9. `src/components/FooterSection.tsx` - Limpiar links muertos
10. `src/components/listings/ListingCard.tsx` - Precio/m2 y region
11. `src/pages/PropertyDetail.tsx` - Seccion precio mejorada y agendar visita
12. `src/pages/Explorar.tsx` - Ordenamiento y filtro verificados
13. `src/components/explore/FloatingResultsPanel.tsx` - Selector de orden
14. `src/index.css` - Corregir glass-strong y limpiar inconsistencias
15. `src/App.css` - Eliminar estilos legacy no usados

### Orden de implementacion sugerido:
Dado el volumen de cambios, se recomienda dividir en 3-4 prompts:
1. **Prompt 1**: Logo + CSS cleanup + consistencia visual base
2. **Prompt 2**: Landing page completa (Hero, Stats, HowItWorks, Projects, Trust, Footer)
3. **Prompt 3**: Explorar + Mapa + Filtros
4. **Prompt 4**: Fichas (ListingCard + PropertyDetail)
