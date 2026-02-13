
# Plan: SaaS de Gestion de Loteos - Onboarding y Funcionalidad Real

## Estado Actual del Sistema

La plataforma ya tiene una base solida con datos reales:
- 1 proyecto activo ("Brisas de Caone") con 47 lotes (22 disponibles, 24 vendidos, 1 reservado)
- 20 listings publicados
- 1 usuario con roles admin + agent
- Tablas completas: projects, lots, listings, reservations, credits, credit_payments, closing_steps, leads, documents, etc.
- Sistema de roles (buyer/agent/admin) con RLS

## Problemas Criticos Identificados

### 1. No hay onboarding para nuevos loteadores
Cuando un usuario nuevo se registra, NO se le asigna ningun rol. Queda como "buyer" implicitamente pero sin entrada en `user_roles`. No hay forma de que un loteador se registre y empiece a usar la plataforma sin intervencion manual del admin.

### 2. El registro no asigna rol "buyer" automaticamente
El trigger `handle_new_user` solo crea el perfil, pero no asigna el rol. El usuario queda sin acceso a nada.

### 3. No hay flujo de "Crear mi primer proyecto"
Un loteador nuevo que llega al dashboard ve pantallas vacias sin guia. No hay wizard de configuracion inicial.

### 4. El formulario de crear proyecto es demasiado basico
Solo pide nombre, ubicacion, descripcion y total de lotes. Falta: coordenadas, region/ciudad, precio base, superficie total, contacto comercial.

### 5. No hay demo data ni cuentas de prueba
Solo hay un usuario real. No hay forma de probar el sistema sin datos.

## Plan de Implementacion

### Fase 1: Auto-asignacion de Rol al Registrarse

**Migracion SQL**: Crear trigger que asigne rol "buyer" automaticamente al crear usuario.

Modificar el formulario de registro (`Auth.tsx`) para agregar un selector de tipo de cuenta:
- "Busco terreno" (buyer)
- "Soy loteador / vendedor" (agent)

El trigger asignara el rol correspondiente.

### Fase 2: Onboarding Wizard para Loteadores

**Nuevo archivo: `src/components/onboarding/OnboardingWizard.tsx`**

Wizard de 4 pasos que aparece automaticamente cuando un agent no tiene proyectos:

1. **Bienvenida**: Explicacion de la plataforma, que puede hacer
2. **Perfil Comercial**: Nombre empresa, telefono, region de operacion
3. **Primer Proyecto**: Formulario completo para crear el primer loteo (nombre, ubicacion con mapa, superficie, cantidad de lotes, precio base por lote)
4. **Importar Lotes**: Opciones de importar KMZ o crear lotes manualmente

**Nuevo archivo: `src/components/onboarding/ProjectSetupForm.tsx`**

Formulario mejorado de creacion de proyecto con:
- Mapa interactivo para seleccionar ubicacion (reutilizando LocationPicker)
- Selector de region/comuna de Chile
- Campos para superficie total, precio base por m2
- Upload de master plan (imagen)

### Fase 3: Dashboard Inteligente con Estado Vacio Mejorado

**Modificar: `src/pages/dashboard/DashboardAsesor.tsx`**

Detectar si el usuario tiene 0 proyectos y mostrar el OnboardingWizard en lugar del dashboard vacio. Una vez completado, mostrar el dashboard normal con datos reales.

**Modificar: `src/components/ProjectsManagement.tsx`**

Mejorar el empty state con un CTA visual que guie al usuario a crear su primer proyecto paso a paso, en lugar del dialog simple actual.

### Fase 4: Formulario de Proyecto Mejorado

**Modificar: `src/components/ProjectsManagement.tsx`**

Reemplazar el dialog simple de "Crear Proyecto" con un formulario multi-paso:
- Paso 1: Datos basicos (nombre, descripcion)
- Paso 2: Ubicacion (mapa con marcador draggable, region, comuna, direccion)
- Paso 3: Configuracion de lotes (cantidad, superficie promedio, precio base)
- Paso 4: Documentos (upload master plan, KMZ opcional)

### Fase 5: Seed Data y Demo Mode

**Migracion SQL**: Insertar datos demo en la base de datos:
- 3 proyectos demo con lotes variados (diferentes regiones de Chile)
- Listings demo vinculados
- Leads demo para el CRM

Marcar los datos demo con `is_demo = true` para poder filtrarlos.

**Nuevo archivo: `src/components/onboarding/DemoDataBanner.tsx`**

Banner informativo que aparece cuando hay datos demo, con boton para "Limpiar datos demo y empezar con mi data real".

### Fase 6: Mejoras de Flujo Post-Registro

**Modificar: `src/pages/Auth.tsx`**

Despues del registro exitoso:
- Buyer: redirigir a `/explorar`
- Agent: redirigir a `/asesor/dashboard` donde vera el onboarding wizard
- Mostrar email de verificacion pendiente

**Modificar: `src/hooks/useSmartRedirect.ts`**

Agregar logica para detectar si es la primera vez del usuario (0 proyectos) y redirigir al onboarding.

## Archivos a Crear
- `src/components/onboarding/OnboardingWizard.tsx` - Wizard principal de 4 pasos
- `src/components/onboarding/ProjectSetupForm.tsx` - Formulario mejorado de proyecto
- `src/components/onboarding/WelcomeStep.tsx` - Paso de bienvenida
- `src/components/onboarding/DemoDataBanner.tsx` - Banner de datos demo

## Archivos a Modificar
- `src/pages/Auth.tsx` - Selector de tipo de cuenta en registro
- `src/pages/dashboard/DashboardAsesor.tsx` - Detectar estado vacio y mostrar onboarding
- `src/components/ProjectsManagement.tsx` - Mejorar formulario de creacion
- `src/hooks/useSmartRedirect.ts` - Logica de primera vez

## Migraciones SQL
1. Trigger para auto-asignar rol al registrarse
2. Seed data con proyectos demo (opcional, se puede omitir si el usuario prefiere empezar desde cero)

## Orden de Implementacion
1. Migracion SQL (trigger de rol automatico)
2. Modificar Auth.tsx (selector de tipo de cuenta)
3. Crear componentes de onboarding
4. Integrar onboarding en DashboardAsesor
5. Mejorar formulario de creacion de proyecto
6. Datos demo (opcional)
