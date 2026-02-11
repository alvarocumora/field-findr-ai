
# Plan: Mapa Publico sin Login + Generador de Master Plan con IA

## Problema 1: El Mapa Interactivo Pide Login

La causa raiz es que el campo `embed_map_url` del proyecto contiene una URL de otro proyecto Lovable (`https://5c2c49b8-...lovableproject.com/embed/...`) que requiere autenticacion. Cuando un visitante publico abre la pestana "Mapa Interactivo", el iframe carga esa URL y muestra una pantalla de login.

**Solucion**: Para visitantes publicos (no autenticados), mostrar siempre el `LotMapView` interno en lugar del iframe embebido. Ademas, ocultar los controles de administracion (Importar KMZ, Regenerar, Dibujar Lotes, Master Plan overlay) para usuarios no autenticados.

### Cambios en ProjectDetail.tsx:
- Importar `useAuth` para detectar si el usuario esta autenticado
- Solo mostrar el iframe embed cuando el usuario esta autenticado Y es dueno del proyecto
- Para visitantes publicos: siempre usar `LotMapView` en modo lectura (sin controles de edicion)

### Cambios en LotMapView.tsx:
- Agregar una prop `readOnly` (default: false)
- Cuando `readOnly = true`:
  - Ocultar botones de "Importar KMZ", "Regenerar", "Dibujar Lotes", "Master Plan"
  - No ejecutar el auto-import de KMZ (que intenta escribir en la DB)
  - Solo mostrar el mapa con los poligonos existentes y la leyenda
- ProjectDetail pasara `readOnly={true}` cuando el usuario no sea el dueno del proyecto

## Problema 2: Generador de Master Plan con IA

Crear una nueva funcionalidad que permita usar IA para analizar los datos del KMZ y generar sugerencias de mejora del master plan.

### Nueva Edge Function: `ai-masterplan-analyzer`
- Recibe: datos de lotes (poligonos, areas, precios), metadatos del proyecto (ubicacion, nombre)
- Usa Lovable AI (google/gemini-3-flash-preview) para analizar:
  - Optimizacion de la distribucion de lotes
  - Sugerencias de precios basadas en area y ubicacion
  - Identificacion de lotes irregulares que necesitan ajuste
  - Recomendaciones de infraestructura (accesos, areas verdes)
- Devuelve: analisis textual con recomendaciones accionables

### Nuevo componente: Pestana "IA Analisis" en ProjectDetail
- Agregar una nueva pestana "IA" junto a las existentes (Mapa, Lotes, Legal, Galeria)
- Muestra un boton "Analizar con IA" que envia los datos del proyecto
- Renderiza las recomendaciones de la IA en secciones organizadas
- Streaming de la respuesta para feedback inmediato

### Archivos nuevos:
- `supabase/functions/ai-masterplan-analyzer/index.ts` - Edge function con Lovable AI

### Archivos a modificar:
- `src/pages/ProjectDetail.tsx` - Agregar deteccion de auth, modo readOnly para LotMapView, nueva pestana IA
- `src/components/lots/LotMapView.tsx` - Agregar prop `readOnly` para ocultar controles de admin
- `supabase/config.toml` - Registrar la nueva edge function

## Detalle Tecnico

### LotMapView readOnly mode:
```text
readOnly=false (default, owner):     readOnly=true (public visitor):
+----------------------------------+ +----------------------------------+
| [Satelite] [Master Plan] [Dibujar]| | Solo el mapa limpio              |
| [Importar KMZ] [Regenerar]       | |                                  |
|                                  | |                                  |
|     Mapa con poligonos           | |     Mapa con poligonos           |
|                                  | |                                  |
|  [Leyenda]                       | |  [Leyenda]                       |
+----------------------------------+ +----------------------------------+
```

### AI Masterplan Analyzer Flow:
```text
ProjectDetail -> Click "Analizar con IA"
  -> POST /ai-masterplan-analyzer { lots, project }
  -> Lovable AI (gemini-3-flash-preview) analiza datos
  -> Streaming response con recomendaciones
  -> Renderizar en la pestana IA
```

### Edge Function prompt incluira:
- Numero y distribucion de lotes
- Rango de areas y precios
- Coordenadas y formas de poligonos
- Status de cada lote (disponible/reservado/vendido)
- Contexto geografico (ciudad, region)

### Resultado:
1. Visitantes publicos ven el mapa interactivo sin login, con poligonos de lotes clickeables
2. Los duenos del proyecto mantienen acceso completo a herramientas de edicion
3. Nueva capacidad de analisis IA que genera recomendaciones profesionales para optimizar el loteo
