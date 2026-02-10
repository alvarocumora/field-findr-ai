

# Rediseno del PDF de Promesa de Compraventa

## Problemas actuales
- El header dice "FIELD FINDR" en vez de "Ofertaterrenos"
- No tiene logo de la marca
- Las clausulas son genericas y basicas
- El diseno visual es plano y poco profesional

## Cambios planificados

### 1. Header con logo y branding correcto
- Dibujar el logo hexagonal de Ofertaterrenos directamente con jsPDF (usando las rutas SVG del LogoIcon)
- Cambiar "FIELD FINDR" por "Ofertaterrenos" con subtitulo "Proptech Chile"
- Usar los colores de marca: gradiente Emerald (#22C55E) a Sky Blue (#0EA5E9)
- Agregar una franja decorativa con gradiente simulado

### 2. Diseno visual mejorado
- Header con gradiente verde-azul de la marca
- Tipografia mas refinada con mejor jerarquia
- Tablas con bordes sutiles y alternancia de colores en filas
- Iconos decorativos usando caracteres Unicode para secciones
- Lineas decorativas entre secciones
- Watermark sutil de "Ofertaterrenos" en paginas
- Footer con los colores de marca y datos de contacto

### 3. Clausulas legales mas completas y realistas
Reemplazar las 6 clausulas basicas con un set completo adaptado a la legislacion chilena:
- **Objeto del contrato**: descripcion del inmueble y la promesa
- **Precio y forma de pago**: desglose de sena, saldo, plazos
- **Plazo para escritura definitiva**: 90 dias con posibilidad de prorroga
- **Obligaciones del vendedor**: saneamiento, libre de gravamenes, entrega de documentacion
- **Obligaciones del comprador**: pago oportuno, comparecencia ante notario
- **Clausula penal por incumplimiento**: consecuencias para ambas partes
- **Arras**: naturaleza juridica de la sena (art. 1803-1805 Codigo Civil)
- **Gastos e impuestos**: quien asume notaria, inscripcion, impuestos
- **Domicilio y jurisdiccion**: tribunales competentes
- **Clausula de buena fe**: declaraciones de ambas partes

### 4. Seccion de anexos y notas legales
- Referencia a articulos del Codigo Civil chileno aplicables
- Nota sobre la necesidad de escritura publica para la compraventa de inmuebles
- Espacio para observaciones adicionales

## Detalle tecnico

Se reescribira `src/lib/contractPdfGenerator.ts` con:
- Logo renderizado como formas geometricas jsPDF (hexagono + montana estilizada)
- Paleta de colores actualizada: PRIMARY=#22C55E, ACCENT=#0EA5E9
- Clausulas expandidas de 6 a ~10 clausulas con lenguaje legal chileno
- Mejor manejo de paginacion con header/footer consistente en cada pagina
- Nombre de archivo: `promesa-ofertaterrenos-{lote}-{numero}.pdf`

