# OfertaTerrenos / Field Findr AI

Plataforma PropTech de inteligencia territorial para visualizar, analizar y comercializar terrenos, parcelas, predios industriales y oportunidades inmobiliarias mediante mapas, IA y escenarios visuales montados sobre imágenes reales del terreno.

## Propuesta de valor

OfertaTerrenos no muestra solo un terreno: muestra el potencial de desarrollo sobre el activo.

La plataforma combina marketplace de terrenos, visualización cartográfica, búsqueda conversacional con IA, paneles para corredores, fichas comerciales descargables, gestión de leads, CRM y escenarios visuales como packing industrial, loteo habitacional, subdivisión, bodegaje, proyecto agrícola, turismo o energía.

## Stack técnico

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-ui / Radix UI
- Supabase Auth, Database y Edge Functions
- Mapbox GL
- Turf.js
- React Query
- Zustand
- Framer Motion
- PWA con vite-plugin-pwa
- jsPDF / JSZip para documentos y exportables

## Instalación local

```sh
git clone https://github.com/alvarocumora/field-findr-ai.git
cd field-findr-ai
npm ci
cp .env.example .env.local
npm run dev
```

El servidor local usa Vite en el puerto configurado por `vite.config.ts`.

## Variables de entorno

Crear un archivo `.env.local` a partir de `.env.example`.

Variables principales:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_MAPBOX_TOKEN`

`VITE_MAPBOX_TOKEN` es fallback. La app intenta obtener el token mediante la Edge Function `get-mapbox-token`.

## Edge Functions esperadas

### `get-mapbox-token`

Devuelve un token público válido de Mapbox para inicializar mapas y experiencias cartográficas.

### `ai-natural-search`

Procesa búsquedas en lenguaje natural y devuelve resultados inmobiliarios junto con una explicación generada por IA.

Payload conceptual:

```json
{
  "query": "Terreno industrial cerca de Ruta 5 en Maule"
}
```

Respuesta conceptual:

```json
{
  "explanation": "Resumen generado por IA",
  "results": [
    {
      "id": "property-id",
      "title": "Terreno industrial premium",
      "location": "Maule, Chile",
      "price": 20000,
      "area_m2": 70000,
      "type": "industrial"
    }
  ]
}
```

## Scripts

```sh
npm run dev
npm run build
npm run build:dev
npm run lint
npm run preview
```

## Rutas principales

### Públicas

- `/`
- `/explorar`
- `/propiedad/:id`
- `/proyecto/:id`
- `/pricing`
- `/tools`
- `/search`
- `/oportunidades`
- `/blog`

### Comprador

- `/buyer/home`
- `/favoritos`
- `/mi-terreno`
- `/profile`
- `/subscription`

### Asesor / corredor

- `/asesor/dashboard`
- `/asesor/listings`
- `/asesor/leads`
- `/asesor/projects`
- `/asesor/lots`
- `/asesor/crm`
- `/asesor/sales`
- `/asesor/reservations`
- `/asesor/reports`

### Admin

- `/admin/dashboard`
- `/admin/users`
- `/admin/agents`
- `/admin/approvals`
- `/admin/documents`
- `/admin/audit`

## Seguridad y roles

La autenticación se gestiona con Supabase Auth.

Roles de aplicación:

- `buyer`
- `agent`
- `admin`

Las rutas de dashboard usan validación en frontend, pero la seguridad real debe estar reforzada con RLS policies en Supabase.

## Roadmap inmediato

1. Fortalecer documentación, variables de entorno y QA.
2. Separar rutas por dominio para reducir riesgo de regresión.
3. Crear módulo formal de escenarios visuales:
   - industrial / packing;
   - subdivisión habitacional;
   - parcelación;
   - agrícola;
   - energía solar;
   - turismo / lodge;
   - bodegaje / logística.
4. Agregar generación de ficha PDF por escenario.
5. Integrar IA para análisis de cabida, oportunidad, restricciones y potencial comercial.

## Lovable

Este proyecto está conectado a Lovable. Los cambios hechos desde Lovable se sincronizan automáticamente con este repositorio.

Proyecto Lovable:

https://lovable.dev/projects/95b244b9-9214-47ff-bbb3-35e26af50af7
