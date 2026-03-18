

# Plan: Diseñador 3D de Parcelas — "Mi Parcela en 3D"

## Vision

Crear un módulo interactivo de diseño 3D donde el comprador puede tomar el polígono de su lote reservado y diseñar un layout visual con modelos predefinidos: casas, piscinas, cercos, entradas, huertos, arboles, etc. Esto posiciona la plataforma como la primera en LATAM que permite visualizar tu futuro terreno antes de construir.

## Implementacion Tecnica

### Dependencias
- `@react-three/fiber@^8.18` + `three@^0.170` + `@react-three/drei@^9.122.0` (3D rendering en React)
- Los modelos 3D seran primitivas geometricas estilizadas (no archivos .glb externos) para mantener el bundle ligero

### 1. Nuevo componente: `src/components/parcela/ParcelaDesigner3D.tsx`
Componente principal que:
- Recibe el `polygon` (jsonb del lote) y lo convierte en un Shape plano 3D (el terreno)
- Canvas de React Three Fiber con OrbitControls para rotar/zoom
- Terreno verde generado desde las coordenadas del poligono
- Grid helper para referencia visual de metros
- Iluminacion ambiental + direccional con sombras

### 2. Sistema de objetos arrastrables: `src/components/parcela/ParcelaObjects.tsx`
Catalogo de elementos 3D predefinidos usando primitivas Three.js:
- **Casas**: Box geometries con techos (ConeGeometry) en 3 tamaños (50m², 80m², 120m²)
- **Piscina**: Box con material azul semitransparente
- **Cercos**: Thin boxes a lo largo de los bordes del terreno
- **Entrada/Portón**: Arch geometry con pilares
- **Huerto**: Grid de cilindros verdes pequeños
- **Árboles**: Cone + Cylinder (pino) o Sphere + Cylinder (frutal)
- **Quincho/Terraza**: Box plano con techo abierto
- **Estacionamiento**: Plane con textura de gravilla

### 3. Panel lateral de herramientas: `src/components/parcela/ParcelaToolbar.tsx`
- Catalogo visual con iconos de cada elemento
- Drag & drop o click-to-place sobre el terreno
- Controles de: rotación del objeto, escala, eliminar
- Botón "Captura de pantalla" para guardar el diseño como imagen
- Info del lote: numero, area, precio

### 4. Pagina/Tab en MiTerreno: `src/pages/MiTerreno.tsx`
- Nueva tab "Diseñar Mi Parcela" en cada reserva activa (status paid/converted)
- Solo disponible si el lote tiene polygon definido
- Pasa el polygon y datos del lote al ParcelaDesigner3D

### 5. Persistencia (opcional v1 — guardar diseño)
- Guardar el layout como JSON en una nueva columna `parcel_design jsonb` en la tabla `reservations`
- Migración SQL simple: `ALTER TABLE reservations ADD COLUMN parcel_design jsonb DEFAULT NULL`

## Archivos a Crear/Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/ParcelaDesigner3D.tsx` | **Nuevo** — Canvas 3D principal con terreno desde poligono |
| `src/components/parcela/ParcelaObjects.tsx` | **Nuevo** — Modelos 3D (casas, arboles, piscinas, etc.) |
| `src/components/parcela/ParcelaToolbar.tsx` | **Nuevo** — Panel lateral con catalogo y controles |
| `src/components/parcela/useParcelaState.ts` | **Nuevo** — Hook para gestionar objetos colocados, seleccion, transformaciones |
| `src/pages/MiTerreno.tsx` | Agregar tab "Diseñar" con ParcelaDesigner3D |
| **Migración SQL** | Agregar `parcel_design jsonb` a `reservations` |

## Resultado Visual

```text
┌─────────────────────────────────────────────────────────┐
│  Mi Terreno > Lote #12 — Brisas de Caone               │
│  [Resumen] [Cierre] [Docs] [Pagos] [🎨 Diseñar]       │
├──────────┬──────────────────────────────────────────────┤
│ Catalogo │                                              │
│          │         ┌─ Vista 3D ──────────────┐          │
│ 🏠 Casa  │         │    🏠      🌳           │          │
│ 🏊 Pisci │         │  ┌────┐   /|\           │          │
│ 🌳 Árbol │         │  │    │  / | \          │          │
│ 🌿 Huert │         │  └────┘    |            │          │
│ 🚗 Estac │         │         🏊──────        │          │
│ 🏗 Quinch│         │  ═══════════════        │          │
│ 🚪 Entra │         │    [Terreno verde]      │          │
│ 🔲 Cerco │         └────────────────────────┘          │
│          │                                              │
│ [Rotar]  │  [📸 Captura]  [💾 Guardar]  [🔄 Reset]    │
│ [Escala] │                                              │
└──────────┴──────────────────────────────────────────────┘
```

