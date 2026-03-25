

# Plan: Mejoras de Herramientas y Rutas Funcionales

## Diagnóstico Actual

### Rutas rotas o faltantes

| Problema | Detalle |
|----------|---------|
| Footer link `/contact` | No existe la ruta. La ruta correcta es `/contacto` |
| Footer link `/blog` | No existe ninguna ruta ni página Blog |
| Sidebar "Herramientas" | No hay enlace en el sidebar al Centro de Herramientas (`/tools`) |
| `/tools` sin protección | La página Tools es pública pero contiene CRM y Analytics que deberían requerir autenticación |

### Herramientas duplicadas o mal ubicadas

| Herramienta | Ubicación actual | Problema |
|-------------|-----------------|----------|
| CRM | `/tools` tab + `/asesor/crm` | Duplicada: existe como tab en Tools y como ruta independiente |
| Analytics | `/tools` tab + `/asesor/analytics` | Duplicada |
| Comparador | `/tools` tab + `/comparar` | Duplicada |
| Calculadoras | `/tools` tab + dispersas en varios componentes | Sin ruta dedicada en sidebar |

### Sidebar: rutas sin acceso directo

Estas herramientas existen pero NO aparecen en el sidebar:
- Herramientas IA (`/tools`) - Centro unificado
- Publicar Propiedad (`/publish`)
- Favoritos (`/favoritos`)
- Mi Terreno (`/mi-terreno`)
- Suscripción (`/subscription`)

---

## Cambios Propuestos

### 1. Corregir rutas rotas en Layout footer

**Archivo:** `src/components/Layout.tsx`
- Cambiar `to="/contact"` por `to="/contacto"`
- Cambiar `to="/blog"` por un enlace externo o eliminarlo (no existe página Blog)

### 2. Agregar enlace "Herramientas" al Sidebar

**Archivo:** `src/components/ModernSidebar.tsx`
- Agregar item `{ name: 'Herramientas', href: '/tools', icon: Sparkles }` al final de `coreItems` (visible para agents) y a `commonNavigation` (visible para todos)

### 3. Separar Tools en herramientas públicas vs protegidas

**Archivo:** `src/pages/Tools.tsx`
- Las tabs de **uso público** (Predictor, Búsqueda IA, Calculadoras, Catastro SII) se mantienen accesibles sin login
- Las tabs de **uso profesional** (CRM, Analytics, Contenido) se muestran solo si el usuario tiene rol agent/admin, con un prompt de login si no está autenticado

### 4. Agregar rutas de acceso rápido al sidebar para buyers

**Archivo:** `src/components/ModernSidebar.tsx`
- Agregar a `commonNavigation`:
  - `{ name: 'Favoritos', href: '/favoritos', icon: Heart }`
  - `{ name: 'Mi Terreno', href: '/mi-terreno', icon: Home }`

### 5. Eliminar duplicación de herramientas

**Archivo:** `src/pages/Tools.tsx`
- Remover tabs "CRM" y "Analytics" ya que tienen sus propias rutas dedicadas (`/asesor/crm`, `/asesor/analytics`)
- En su lugar, mostrar cards con enlaces directos a esas rutas

### 6. Agregar ruta `/asesor/tools` dentro del dashboard

**Archivo:** `src/App.tsx`
- Agregar ruta `/asesor/tools` que renderiza Tools dentro de `DashboardLayout`
- Esto permite a agents acceder a herramientas IA sin salir del contexto del dashboard

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/Layout.tsx` | Fix footer links rotos |
| `src/components/ModernSidebar.tsx` | Agregar Herramientas, Favoritos, Mi Terreno al sidebar |
| `src/pages/Tools.tsx` | Remover tabs duplicadas (CRM/Analytics), agregar links a rutas existentes |
| `src/App.tsx` | Agregar ruta `/asesor/tools` con DashboardLayout |

