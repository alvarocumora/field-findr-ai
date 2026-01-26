
# Plan de Implementación: Ofertaterrenos.com MVP

## Resumen Ejecutivo
Transformar el proyecto existente en una plataforma proptech premium enfocada en listado, búsqueda y comparación de terrenos en LATAM. El proyecto ya cuenta con una base sólida que incluye autenticación, base de datos (projects, lots, leads, profiles), sistema de IA, y componentes UI con estética dark-mode futurista.

---

## Fase 1: Modelo de Datos y Backend

### 1.1 Nuevas Tablas de Base de Datos

**Tabla `listings`** - Propiedades publicadas
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'parcela_rural', 'sitio_industrial', 'campo_agricola', 'terreno_urbano', 'inversion'
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CLP',
  area_m2 NUMERIC,
  area_ha NUMERIC,
  location TEXT NOT NULL,
  region TEXT,
  city TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  images TEXT[], -- Array de URLs
  tags TEXT[], -- 'agua', 'luz', 'camino', 'subdivision', etc.
  utilities JSONB, -- { water: boolean, electricity: string, road_access: string }
  zoning TEXT,
  rol TEXT, -- Rol de propiedad chileno
  subdivision_eligible BOOLEAN DEFAULT false,
  legal_status TEXT DEFAULT 'pending',
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'reserved', 'sold', 'inactive'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Tabla `documents`** - Documentos de verificación
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'titulo', 'certificado_dominio', 'plano', 'informe_tasacion'
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'verified', 'rejected'
  file_url TEXT,
  notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Tabla `messages`** - Mensajería entre usuarios y agentes
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  listing_id UUID REFERENCES listings(id),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Tabla `favorites`** - Propiedades guardadas
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
```

**Tabla `saved_searches`** - Búsquedas guardadas
```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Tabla `user_roles`** - Roles de usuario (seguridad)
```sql
CREATE TYPE app_role AS ENUM ('buyer', 'agent', 'admin');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
```

### 1.2 Políticas RLS
- Configurar políticas para cada tabla según roles
- Función `has_role()` para verificación segura de roles
- Políticas de lectura pública para listings activos
- Políticas de escritura restringidas a propietarios/agentes

### 1.3 Datos Seed
Crear 12 listings de demostración con ubicaciones realistas de Chile:
- 3 parcelas rurales (Maule, Los Lagos, Araucanía)
- 2 sitios industriales (RM, Antofagasta)
- 3 campos/fundos agrícolas (O'Higgins, Biobío, Coquimbo)
- 2 terrenos costeros (Valparaíso, Atacama)
- 2 terrenos de montaña (Aysén, Magallanes)

---

## Fase 2: Navegación y Layout Principal

### 2.1 Header Sticky Global (Nueva)
```text
┌────────────────────────────────────────────────────────────────────┐
│ [Logo] Ofertaterrenos.com                                          │
│                                                                    │
│ Explorar | Comparar | Proyectos | Agentes | Empresas | Blog       │
│                                                      [Publicar] [Login] │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Rutas Nuevas
```typescript
// Páginas públicas
/                    → Landing (Home)
/explorar            → Explore/Search con mapa
/propiedad/:id       → Property Detail
/comparar            → Compare (hasta 4 propiedades)
/agentes             → Agent Directory
/empresas            → Companies Directory
/blog                → Blog (placeholder)

// Páginas autenticadas - Compradores
/favoritos           → Saved Listings
/busquedas-guardadas → Saved Searches
/mensajes            → Messages Inbox

// Páginas autenticadas - Agentes
/dashboard           → Agent Dashboard (existente, mejorado)
/mis-publicaciones   → My Listings CRUD
/mis-leads           → Lead Management
/mis-documentos      → Document Management

// Admin (rol admin)
/admin               → Admin Panel
```

### 2.3 Nuevo Layout Principal
- Eliminar sidebar para páginas públicas
- Header sticky con glassmorphism
- Footer completo con navegación legal
- Sidebar solo para dashboard de agentes

---

## Fase 3: Páginas Core

### 3.1 Landing Page (Mejorar existente)
**Componentes a agregar:**
- Navigation header sticky con blur
- Hero section mejorada con la barra de búsqueda AI existente
- Quick categories (6 cards de tipo de terreno)
- Featured listings grid (12 propiedades demo)
- AI Assistant preview panel flotante
- Trust section con badges de verificación
- Stats animados (propiedades, usuarios, transacciones)

### 3.2 Página Explorar/Search (Nueva)
```text
┌──────────────────────────────────────────────────────────────┐
│ [Filtros Panel]                    │ [Mapa Interactivo]       │
│ ┌─────────────────────────────┐    │                          │
│ │ Ubicación: [Select región]  │    │   ┌──────────────────┐  │
│ │ Tipo: [Multi-select]        │    │   │    Mapbox Map    │  │
│ │ Precio: [Range slider]      │    │   │    con markers   │  │
│ │ Superficie: [Range slider]  │    │   │                  │  │
│ │ ☐ Agua  ☐ Luz  ☐ Camino    │    │   └──────────────────┘  │
│ │ ☐ Subdivisión  ☐ Rol       │    │                          │
│ └─────────────────────────────┘    │                          │
│                                     │                          │
│ [Listing Card] [Listing Card]       │                          │
│ [Listing Card] [Listing Card]       │                          │
│ [Listing Card] [Listing Card]       │                          │
└──────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Vista split: lista a la izquierda, mapa a la derecha
- Filtros multi-select con chips
- Range sliders para precio y superficie
- Ordenamiento: Relevancia, Precio, Superficie, Recientes
- Paginación infinita
- Hover en card → highlight en mapa

### 3.3 Página Property Detail (Nueva)
**Secciones:**
1. **Gallery**: Carrusel de imágenes + placeholders para video/drone
2. **Key Facts Panel**: Precio, superficie, rol, comuna, tags
3. **Mapa Individual**: Ubicación con capas (satélite, calles)
4. **Checklist Documental**: Lista de documentos con estados
5. **CTA Section**: Agendar visita + Solicitar carpeta
6. **Comparación**: 3 propiedades similares
7. **Botón PDF**: Generar reporte (mock)

### 3.4 Página Compare (Mejorar existente)
- Selector para agregar hasta 4 propiedades
- Tabla de comparación mejorada con más métricas
- AI Summary panel: pros/cons y recomendación
- Export to PDF button (mock)

### 3.5 Agent Dashboard (Mejorar existente)
**Tabs:**
1. **Overview**: KPIs, gráficos, actividad reciente
2. **Publicaciones**: CRUD de listings con formulario completo
3. **Leads**: Pipeline visual (Nuevo → Contactado → Visita → Reserva → Cierre)
4. **Mensajes**: Inbox de conversaciones
5. **Documentos**: Upload y tracking de verificación
6. **Reportes**: Analytics exportables

### 3.6 Admin Panel (Nueva)
- Gestión de usuarios y roles
- Gestión de listings (aprobar/rechazar)
- Gestión de documentos (verificar/rechazar)
- Dashboard de métricas globales

---

## Fase 4: Componentes Reutilizables

### 4.1 Nuevos Componentes UI
```text
src/components/
├── navigation/
│   └── StickyHeader.tsx       # Header principal con blur
├── listings/
│   ├── ListingCard.tsx        # Card mejorada con más info
│   ├── ListingGrid.tsx        # Grid responsive
│   ├── ListingFilters.tsx     # Panel de filtros
│   ├── ListingForm.tsx        # Formulario CRUD
│   └── ListingGallery.tsx     # Carrusel de imágenes
├── common/
│   ├── FilterChips.tsx        # Chips de filtro activos
│   ├── RangeSlider.tsx        # Slider dual para rangos
│   ├── DocStatusBadge.tsx     # Badge de estado de documento
│   └── CompareTable.tsx       # Tabla de comparación
├── map/
│   └── ExploreMap.tsx         # Mapa con markers de listings
└── ai/
    └── AIChatDrawer.tsx       # Drawer flotante del asistente
```

### 4.2 Estados del Sistema
- Loading states con skeletons
- Empty states con ilustraciones
- Error states con retry buttons
- Success states con toasts

---

## Fase 5: Sistema de IA

### 5.1 AI Chat Assistant (Mejorar existente)
**Prompts sugeridos:**
- "¿Este terreno es apto para subdivisión?"
- "¿Qué permisos típicos necesito?"
- "Resume pros y contras para inversión"
- "Compara estas dos propiedades"
- "¿Cuál es el potencial de valorización?"

### 5.2 Respuestas Mock
Implementar respuestas predefinidas para el MVP que simulen análisis de terrenos, sin conectar a la API real hasta que se apruebe.

---

## Fase 6: Página Design System

### 6.1 Documentación Visual
Nueva ruta `/design-system` mostrando:
- Paleta de colores (primary lime, accent cyan, dark backgrounds)
- Tipografía (Inter, tamaños, pesos)
- Botones (variantes, estados, tamaños)
- Badges y chips
- Cards y panels
- Inputs y formularios
- Iconografía (Lucide icons)

---

## Orden de Implementación

```text
1. Base de Datos (migraciones)
   └── Crear tablas listings, documents, messages, favorites, saved_searches, user_roles
   └── Configurar RLS policies
   └── Insertar seed data (12 listings demo)

2. Navegación Global
   └── StickyHeader component
   └── Actualizar App.tsx con nuevas rutas
   └── Nuevo layout para páginas públicas

3. Landing Page Mejorada
   └── Integrar header sticky
   └── Categories section
   └── Trust/verification section

4. Página Explorar
   └── Split view layout
   └── Filter panel component
   └── Map integration con markers
   └── Listing cards con datos reales

5. Property Detail Page
   └── Gallery component
   └── Document checklist
   └── Similar properties
   └── CTAs

6. Compare Page Mejorada
   └── Property selector
   └── Extended comparison table
   └── AI summary panel

7. Agent Dashboard
   └── Listings CRUD
   └── Lead pipeline
   └── Messages inbox
   └── Document management

8. Admin Panel
   └── Users/roles management
   └── Listings moderation
   └── Document verification

9. Design System Page
   └── Component showcase
```

---

## Detalles Técnicos

### Hooks Nuevos
```typescript
// src/hooks/useListings.ts - CRUD de listings
// src/hooks/useFavorites.ts - Gestión de favoritos
// src/hooks/useMessages.ts - Mensajería
// src/hooks/useDocuments.ts - Documentos
// src/hooks/useSavedSearches.ts - Búsquedas guardadas
// src/hooks/useUserRole.ts - Verificación de rol
```

### Integración con Mapbox
Reutilizar el token existente (MAPBOX_PUBLIC_TOKEN) y el hook `useMapboxToken` para:
- Mapa de exploración con markers de listings
- Mapa individual en property detail
- Clustering para áreas con muchos listings

### Estilos
Mantener y extender el sistema visual existente:
- Dark mode por defecto
- Glassmorphism (`.glass`, `.glass-strong`)
- Gradientes neón (lime + cyan)
- Animaciones (`fade-in`, `pulse-glow`, `shimmer`)

---

## Notas de Seguridad
- Roles almacenados en tabla separada `user_roles` (nunca en profiles)
- Función `has_role()` con SECURITY DEFINER para evitar recursión RLS
- Verificación de roles en backend para operaciones sensibles
- RLS policies estrictas para cada tabla
